// Migration 0072 — Seed demo data for the Apontador → GQ (Manager/QCC) flow.
//
// What this migration does (all idempotent):
//   1. Creates the login user `apontador@psc.com` (role "Apontador", PSC).
//   2. Marks 2 existing PSC team collaborators as Apontadores (is_indicator = true)
//      and links them to the welders / boilermakers already registered in PSC:
//        - Roberta Carvalho Baião Junqueira  → linked to the SOLDA operators
//        - Agnaldo Silva Santos             → linked to the CALDEIRARIA operators
//      (Dainara was requested but only exists in Empresa B / GENTI, not PSC, so the
//       next available PSC collaborator is used per the task's fallback rule.)
//   3. Guarantees module_permissions rows so:
//        - Apontador (PSC): V+E on Checklists, Agenda  (Dashboard has no module row
//          and its nav link is always visible, so no row is needed)
//        - Welder (PSC):    V   on Checklists, Agenda
//        - Manager & QCC (PSC + Koala): V/E/D on every module  (already exist for
//          the most part; this upserts any missing module into full access without
//          downgrading rows that already grant it)
//   4. Creates 4 demo checklists assigned to the "Welder" role in PSC, each
//      linked to the apontador@psc.com user via `apontador_id`, covering the
//      approved / rejected / pending(×2) states described in the task.
//   5. Creates 2 "submission" notifications in the 🔔 bell for the PSC Manager so
//      the GQ/Manager sees the demo "Checklist submetido para aprovação" entries.

migrate(
  (app) => {
    // ---------- Stable IDs ----------
    var PSC_ID = 'a631bv695rr4gef'
    var KOALA_ID = 'i7kjauu378swxg6'

    // ---------- 1. Create the apontador@psc.com login user ----------
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var apontadorUser = null
    try {
      apontadorUser = app.findAuthRecordByEmail('_pb_users_auth_', 'apontador@psc.com')
    } catch (_) {
      apontadorUser = new Record(usersCol)
      apontadorUser.setEmail('apontador@psc.com')
      // PocketBase requires passwords of at least 8 characters.
      apontadorUser.setPassword('12345678')
      apontadorUser.setVerified(true)
      apontadorUser.set('name', 'Apontador PSC')
      apontadorUser.set('role', 'Apontador')
      apontadorUser.set('plan', 'Pro')
      apontadorUser.set('primary_company_id', PSC_ID)
      app.save(apontadorUser)
    }
    var apontadorUserId = apontadorUser.id

    // Make sure the user is allocated to PSC as well (user_allocations).
    var allocCol = app.findCollectionByNameOrId('user_allocations')
    var alreadyAllocated = false
    try {
      var allocs = app.findRecordsByFilter(
        'user_allocations',
        "user_id = '" + apontadorUserId + "'",
        'created',
        200,
        0,
      )
      for (var ai = 0; ai < allocs.length; ai++) {
        if (allocs[ai].getString('company_id') === PSC_ID) {
          alreadyAllocated = true
          break
        }
      }
    } catch (_) {}
    if (!alreadyAllocated) {
      var allocRec = new Record(allocCol)
      allocRec.set('user_id', apontadorUserId)
      allocRec.set('company_id', PSC_ID)
      app.save(allocRec)
    }

    // ---------- 2. Designate Apontadores in the `team` collection ----------
    var teamCol = app.findCollectionByNameOrId('team')

    // Collect the SOLDA operator ids and CALDEIRARIA operator ids in PSC.
    var soldaOperators = []
    var caldeirariaOperators = []
    try {
      var pscTeam = app.findRecordsByFilter('team', "company_id = '" + PSC_ID + "'", 'name', 500, 0)
      for (var ti = 0; ti < pscTeam.length; ti++) {
        var dept = (pscTeam[ti].getString('department') || '').toUpperCase()
        if (dept === 'SOLDA') soldaOperators.push(pscTeam[ti].id)
        else if (dept === 'CALDEIRARIA') caldeirariaOperators.push(pscTeam[ti].id)
      }
    } catch (_) {}

    // Roberta Carvalho Baião Junqueira (SGQ) → linked to welders.
    var roberta = null
    try {
      roberta = app.findFirstRecordByData('team', 'name', 'ROBERTA CARVALHO BAIÃO JUNQUEIRA')
    } catch (_) {}
    if (!roberta) {
      // Fallback: first PSC collaborator by name.
      try {
        var pscOrdered = app.findRecordsByFilter(
          'team',
          "company_id = '" + PSC_ID + "'",
          'name',
          500,
          0,
        )
        if (pscOrdered.length > 0) roberta = pscOrdered[0]
      } catch (_) {}
    }
    if (roberta) {
      roberta.set('is_indicator', true)
      roberta.set('linked_operators', soldaOperators)
      app.save(roberta)
    }

    // Second Apontador: Dainara was requested but is NOT in PSC. Use the first
    // available PSC collaborator (by name) that is not Roberta, per the fallback
    // rule in the task.
    var dainara = null
    try {
      var allPsc = app.findRecordsByFilter('team', "company_id = '" + PSC_ID + "'", 'name', 500, 0)
      for (var di = 0; di < allPsc.length; di++) {
        if (roberta && allPsc[di].id === roberta.id) continue
        dainara = allPsc[di]
        break
      }
    } catch (_) {}
    if (dainara) {
      dainara.set('is_indicator', true)
      dainara.set('linked_operators', caldeirariaOperators)
      app.save(dainara)
    }

    // ---------- 3. module_permissions ----------
    var mpCol = app.findCollectionByNameOrId('module_permissions')

    // Find an existing permission row by (role, module, companyId); returns null if none.
    var findPerm = function (role, module, companyId) {
      try {
        var rows = app.findRecordsByFilter(
          'module_permissions',
          "role = '" + role + "' && module = '" + module + "'",
          'created',
          500,
          0,
        )
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].getString('company_id') === companyId) return rows[i]
        }
      } catch (_) {}
      return null
    }

    // Upsert a permission row. If it exists, upgrade to at least the requested
    // flags (never downgrades an already-granted permission).
    var upsertPerm = function (role, module, companyId, view, create, edit, del) {
      var existing = findPerm(role, module, companyId)
      if (existing) {
        existing.set('can_view', !!existing.get('can_view') || view)
        existing.set('can_create', !!existing.get('can_create') || create)
        existing.set('can_edit', !!existing.get('can_edit') || edit)
        existing.set('can_delete', !!existing.get('can_delete') || del)
        app.save(existing)
        return
      }
      var rec = new Record(mpCol)
      rec.set('role', role)
      rec.set('module', module)
      rec.set('company_id', companyId)
      rec.set('can_view', view)
      rec.set('can_create', create)
      rec.set('can_edit', edit)
      rec.set('can_delete', del)
      app.save(rec)
    }

    var ALL_MODULES = [
      'Documentos',
      'Romaneios',
      'Checklists',
      'Indicadores',
      'Ordens de Serviço',
      'Agenda',
    ]

    // Apontador (PSC): V+E on Checklists and Agenda.
    upsertPerm('Apontador', 'Checklists', PSC_ID, true, false, true, false)
    upsertPerm('Apontador', 'Agenda', PSC_ID, true, false, true, false)

    // Welder (PSC): V on Checklists and Agenda.
    upsertPerm('Welder', 'Checklists', PSC_ID, true, false, false, false)
    upsertPerm('Welder', 'Agenda', PSC_ID, true, false, false, false)

    // Manager & QCC (PSC + Koala): full V/E/D on every module.
    var fullAccessRoles = ['Manager', 'QCC']
    var fullAccessCompanies = [PSC_ID, KOALA_ID]
    for (var ri = 0; ri < fullAccessRoles.length; ri++) {
      for (var ci = 0; ci < fullAccessCompanies.length; ci++) {
        for (var mi = 0; mi < ALL_MODULES.length; mi++) {
          upsertPerm(
            fullAccessRoles[ri],
            ALL_MODULES[mi],
            fullAccessCompanies[ci],
            true,
            true,
            true,
            true,
          )
        }
      }
    }

    // ---------- 4. Demo checklists (assigned to "Welder" role in PSC) ----------
    var checkCol = app.findCollectionByNameOrId('checklists')
    var AUGUST_2026 = '2026-08-31 00:00:00.000Z'

    // Helper to find an existing checklist by (title, companyId) — idempotent.
    var findChecklist = function (title, companyId) {
      try {
        var rows = app.findRecordsByFilter(
          'checklists',
          "title = '" + title.replace(/'/g, "''") + "'",
          'created',
          500,
          0,
        )
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].getString('company_id') === companyId) return rows[i]
        }
      } catch (_) {}
      return null
    }

    var upsertChecklist = function (cfg) {
      var rec = findChecklist(cfg.title, PSC_ID)
      if (!rec) {
        rec = new Record(checkCol)
        rec.set('title', cfg.title)
        rec.set('company_id', PSC_ID)
      }
      rec.set('role_assigned', 'Welder')
      rec.set('category', cfg.category || 'Departmental')
      rec.set('status', cfg.status)
      rec.set('approval_status', cfg.approval_status)
      rec.set('due_date', cfg.due_date)
      rec.set('is_critical', !!cfg.is_critical)
      rec.set('locked', !!cfg.locked)
      rec.set('apontador_id', apontadorUserId)
      if (typeof cfg.rejection_comment !== 'undefined')
        rec.set('rejection_comment', cfg.rejection_comment)
      if (typeof cfg.approval_comment !== 'undefined')
        rec.set('approval_comment', cfg.approval_comment)
      if (typeof cfg.description !== 'undefined') rec.set('description', cfg.description)
      if (typeof cfg.mcq_ref !== 'undefined') rec.set('mcq_ref', cfg.mcq_ref)
      app.save(rec)
      return rec
    }

    // Checklist 1 — approved (submitted by Apontador, approved by GQ).
    var cl1 = upsertChecklist({
      title: 'Checklist de Soldagem - Procedimento WPS-001',
      description: 'Verificação do procedimento de soldagem WPS-001 conforme ASME Seção IX.',
      category: 'Departmental',
      status: 'completed',
      approval_status: 'approved',
      locked: true,
      is_critical: true,
      mcq_ref: 'ASME IX - WPS-001',
      due_date: AUGUST_2026,
      approval_comment:
        'Procedimento conforme. Registros de qualificação (PQR) e parâmetros de soldagem verificados e aprovados.',
    })

    // Checklist 2 — rejected (submitted and rejected by GQ with a comment).
    var cl2 = upsertChecklist({
      title: 'Checklist de Soldagem - Ensaio Visual',
      description:
        'Ensaio visual de soldagem conforme ASME Seção V Artigo 9 e critérios de aceitação da Seção VIII.',
      category: 'Departmental',
      status: 'pending',
      approval_status: 'rejected',
      locked: false,
      is_critical: true,
      mcq_ref: 'ASME V Art. 9',
      due_date: AUGUST_2026,
      rejection_comment: 'Evidência fotográfica insuficiente. Refazer o ensaio visual.',
    })

    // Checklist 3 — pending, NOT submitted (no answers filled).
    var cl3 = upsertChecklist({
      title: 'Checklist de Soldagem - Controle de Temperatura',
      description:
        'Controle de temperatura de interpasse e pré-aquecimento conforme WPS aplicável.',
      category: 'Departmental',
      status: 'pending',
      approval_status: 'pending',
      locked: false,
      is_critical: false,
      mcq_ref: 'ASME IX - Temp. Interpasse',
      due_date: AUGUST_2026,
    })

    // Checklist 4 — pending, NOT submitted (no answers filled) — Caldeiraria.
    var cl4 = upsertChecklist({
      title: 'Checklist de Caldeiraria - Dimensional',
      description:
        'Inspeção dimensional de componente de caldeiraria conforme desenho e tolerâncias aplicáveis.',
      category: 'Departmental',
      status: 'pending',
      approval_status: 'pending',
      locked: false,
      is_critical: false,
      mcq_ref: 'ASME VIII Div. 1 - Dimensional',
      due_date: AUGUST_2026,
    })

    // ---------- 5. Notifications in the 🔔 bell for the GQ/Manager ----------
    var notifCol = app.findCollectionByNameOrId('notifications')

    // The PSC Manager (Quality Manager) user is the GQ who approves.
    var managerUser = null
    try {
      managerUser = app.findFirstRecordByData('users', 'email', 'devaldoss@gmail.com')
    } catch (_) {}
    // Fallback: any Manager user in PSC.
    if (!managerUser) {
      try {
        var pscUsers = app.findRecordsByFilter(
          'users',
          "primary_company_id = '" + PSC_ID + "'",
          'created',
          500,
          0,
        )
        for (var ui = 0; ui < pscUsers.length; ui++) {
          if ((pscUsers[ui].get('role') || '').includes('Manager')) {
            managerUser = pscUsers[ui]
            break
          }
        }
      } catch (_) {}
    }

    var findNotif = function (userId, checklistId, type) {
      try {
        var rows = app.findRecordsByFilter(
          'notifications',
          "user_id = '" + userId + "' && checklist_id = '" + checklistId + "'",
          'created',
          500,
          0,
        )
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].getString('type') === type) return rows[i]
        }
      } catch (_) {}
      return null
    }

    var upsertNotif = function (userId, checklistId, title, type, message) {
      if (!userId || !checklistId) return
      var existing = findNotif(userId, checklistId, type)
      if (existing) {
        existing.set('message', message)
        existing.set('read', false)
        app.save(existing)
        return
      }
      var rec = new Record(notifCol)
      rec.set('user_id', userId)
      rec.set('checklist_id', checklistId)
      rec.set('message', message)
      rec.set('type', type)
      rec.set('read', false)
      rec.set('company_id', PSC_ID)
      app.save(rec)
    }

    if (managerUser) {
      // Re-fetch the checklists by title to guarantee fresh, valid record ids
      // (the in-memory Record's `.id` is not always populated right after save
      // in the goja VM, so we look them up again before wiring relations).
      var cl3Fresh = null
      var cl4Fresh = null
      try {
        cl3Fresh = app.findFirstRecordByData('checklists', 'title', cl3.getString('title'))
      } catch (_) {}
      try {
        cl4Fresh = app.findFirstRecordByData('checklists', 'title', cl4.getString('title'))
      } catch (_) {}

      if (cl3Fresh) {
        upsertNotif(
          managerUser.id,
          cl3Fresh.id,
          cl3Fresh.getString('title'),
          'submission',
          "Checklist '" + cl3Fresh.getString('title') + "' foi submetido para aprovação.",
        )
      }
      if (cl4Fresh) {
        upsertNotif(
          managerUser.id,
          cl4Fresh.id,
          cl4Fresh.getString('title'),
          'submission',
          "Checklist '" + cl4Fresh.getString('title') + "' foi submetido para aprovação.",
        )
      }
    }
  },
  (app) => {
    // Down — best-effort cleanup of the records this migration creates.
    var PSC_ID = 'a631bv695rr4gef'

    // Notifications
    try {
      var notifs = app.findRecordsByFilter(
        'notifications',
        "company_id = '" + PSC_ID + "' && type = 'submission'",
        'created',
        500,
        0,
      )
      for (var i = 0; i < notifs.length; i++) {
        try {
          app.delete(notifs[i])
        } catch (_) {}
      }
    } catch (_) {}

    // Demo checklists (by title)
    var titles = [
      'Checklist de Soldagem - Procedimento WPS-001',
      'Checklist de Soldagem - Ensaio Visual',
      'Checklist de Soldagem - Controle de Temperatura',
      'Checklist de Caldeiraria - Dimensional',
    ]
    for (var t = 0; t < titles.length; t++) {
      try {
        var rows = app.findRecordsByFilter(
          'checklists',
          "title = '" + titles[t].replace(/'/g, "''") + "'",
          'created',
          500,
          0,
        )
        for (var j = 0; j < rows.length; j++) {
          if (rows[j].getString('company_id') === PSC_ID) {
            try {
              app.delete(rows[j])
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    // module_permissions rows for Apontador / Welder (created by this migration)
    try {
      var perms = app.findRecordsByFilter(
        'module_permissions',
        "role = 'Apontador' || role = 'Welder'",
        'created',
        500,
        0,
      )
      for (var p = 0; p < perms.length; p++) {
        if (perms[p].getString('company_id') === PSC_ID) {
          try {
            app.delete(perms[p])
          } catch (_) {}
        }
      }
    } catch (_) {}

    // Revert team Apontador designations
    var names = ['ROBERTA CARVALHO BAIÃO JUNQUEIRA']
    try {
      var pscOrdered = app.findRecordsByFilter(
        'team',
        "company_id = '" + PSC_ID + "'",
        'name',
        500,
        0,
      )
      for (var k = 0; k < pscOrdered.length; k++) {
        var nm = pscOrdered[k].getString('name')
        var isTarget = false
        for (var n = 0; n < names.length; n++) {
          if (nm === names[n]) isTarget = true
        }
        // Revert any collaborator this migration flagged (first two PSC by name
        // that are flagged) — safest is to clear is_indicator/linked_operators
        // for the ones we touched. We only flagged Roberta + the first non-Roberta
        // PSC collaborator, so clear both if flagged.
        if (isTarget || (pscOrdered[k].getBool('is_indicator') && k <= 1)) {
          pscOrdered[k].set('is_indicator', false)
          pscOrdered[k].set('linked_operators', [])
          try {
            app.save(pscOrdered[k])
          } catch (_) {}
        }
      }
    } catch (_) {}

    // Delete the apontador@psc.com user and its allocation
    try {
      var apontadorUser = app.findAuthRecordByEmail('_pb_users_auth_', 'apontador@psc.com')
      try {
        var allocs = app.findRecordsByFilter(
          'user_allocations',
          "user_id = '" + apontadorUser.id + "'",
          'created',
          200,
          0,
        )
        for (var a = 0; a < allocs.length; a++) {
          try {
            app.delete(allocs[a])
          } catch (_) {}
        }
      } catch (_) {}
      app.delete(apontadorUser)
    } catch (_) {}
  },
)
