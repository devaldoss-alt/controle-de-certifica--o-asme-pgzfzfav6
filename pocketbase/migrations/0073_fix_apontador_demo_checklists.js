// Migration 0073 — Fix the demo checklists + notifications that migration 0072
// failed to create.
//
// Root cause
// ----------
// The `role_assigned` field on the `checklists` collection is a multi-select
// (stored as a JSON array, e.g. `["Welder"]`). Migration 0072 tried to set it
// as a plain string (`'Welder'`), which PocketBase silently rejected, so:
//   - the 4 demo checklists were never created (0 rows)
//   - the 2 "submission" notifications were never created (their checklist_id
//     relations pointed at nothing)
//
// What this migration does (all idempotent — safe to re-run):
//   1. Looks up `apontador@psc.com` (the Apontador user created by 0072).
//   2. Upserts 4 demo checklists in PSC, ALWAYS setting `role_assigned` as
//      an ARRAY: `["Welder"]`, and `apontador_id` to the apontador user id.
//   3. Looks up the PSC Manager (`devaldoss@gmail.com`) and upserts 2
//      "submission" notifications in the 🔔 bell, one per pending checklist
//      (Checklist 3 and Checklist 4).
//
// Down migration: removes only the 4 checklists (by title, in PSC) and the 2
// notifications (type "submission" in PSC). It does NOT touch the apontador
// user, the team Apontador designations or the module_permissions rows —
// those are owned by migration 0072.

migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var AUGUST_2026 = '2026-08-31 00:00:00.000Z'

    // ---------- Resolve the apontador@psc.com user ----------
    var apontadorUser = null
    var apontadorUserId = null
    try {
      var apontadorRows = app.findRecordsByFilter(
        'users',
        "email = 'apontador@psc.com'",
        'created',
        10,
        0,
      )
      if (apontadorRows.length > 0) {
        apontadorUser = apontadorRows[0]
        apontadorUserId = apontadorUser.id
      }
    } catch (_) {}

    if (!apontadorUserId) {
      // Nothing we can do without the apontador user — 0072 owns it, so if it
      // is missing there is nothing to fix here. Bail out safely.
      console.log('[0073] apontador@psc.com not found — skipping checklist seed')
      return
    }

    // ---------- Resolve the PSC Manager (devaldoss@gmail.com) ----------
    var managerUserId = null
    try {
      var managerRows = app.findRecordsByFilter(
        'users',
        "email = 'devaldoss@gmail.com'",
        'created',
        10,
        0,
      )
      if (managerRows.length > 0) managerUserId = managerRows[0].id
    } catch (_) {}
    // Fallback: first PSC user whose role array includes "Manager".
    if (!managerUserId) {
      try {
        var pscUsers = app.findRecordsByFilter(
          'users',
          "primary_company_id = '" + PSC_ID + "'",
          'created',
          500,
          0,
        )
        for (var ui = 0; ui < pscUsers.length; ui++) {
          var roleVal = pscUsers[ui].get('role')
          var roleList = []
          if (Array.isArray(roleVal)) roleList = roleVal
          else if (typeof roleVal === 'string') roleList = [roleVal]
          for (var ri = 0; ri < roleList.length; ri++) {
            if (roleList[ri] === 'Manager') {
              managerUserId = pscUsers[ui].id
              break
            }
          }
          if (managerUserId) break
        }
      } catch (_) {}
    }

    // ---------- Upsert checklists ----------
    var checkCol = app.findCollectionByNameOrId('checklists')

    // Idempotent lookup by (title, companyId). Uses findRecordsByFilter and
    // iterates (more reliable in the goja VM than findFirstRecordByData).
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
      var isNew = !rec
      if (isNew) {
        rec = new Record(checkCol)
        rec.set('title', cfg.title)
        rec.set('company_id', PSC_ID)
      }
      // ⚠ role_assigned is a multi-select ARRAY. Always set as `["Welder"]`,
      // never as a bare string — a bare string is what broke 0072.
      rec.set('role_assigned', ['Welder'])
      rec.set('category', cfg.category || 'Departmental')
      rec.set('status', cfg.status)
      rec.set('approval_status', cfg.approval_status)
      rec.set('due_date', cfg.due_date)
      rec.set('is_critical', !!cfg.is_critical)
      rec.set('locked', !!cfg.locked)
      rec.set('apontador_id', apontadorUserId)
      if (typeof cfg.description !== 'undefined') rec.set('description', cfg.description)
      if (typeof cfg.mcq_ref !== 'undefined') rec.set('mcq_ref', cfg.mcq_ref)
      if (typeof cfg.rejection_comment !== 'undefined')
        rec.set('rejection_comment', cfg.rejection_comment)
      if (typeof cfg.approval_comment !== 'undefined')
        rec.set('approval_comment', cfg.approval_comment)
      app.save(rec)
      return rec
    }

    // Checklist 1 — approved.
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

    // Checklist 2 — rejected.
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

    // Checklist 3 — pending (no answers filled).
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

    // Checklist 4 — pending, Caldeiraria (no answers filled).
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

    // ---------- Upsert notifications in the 🔔 bell ----------
    if (!managerUserId) {
      console.log('[0073] PSC Manager not found — skipping notification seed')
      return
    }
    var notifCol = app.findCollectionByNameOrId('notifications')

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

    var upsertNotif = function (checklistRec, message) {
      if (!checklistRec) return
      var existing = findNotif(managerUserId, checklistRec.id, 'submission')
      if (existing) {
        existing.set('message', message)
        existing.set('read', false)
        app.save(existing)
        return
      }
      var rec = new Record(notifCol)
      rec.set('user_id', managerUserId)
      rec.set('checklist_id', checklistRec.id)
      rec.set('message', message)
      rec.set('type', 'submission')
      rec.set('read', false)
      rec.set('company_id', PSC_ID)
      app.save(rec)
    }

    // Re-fetch the pending checklists by title to use fresh, persisted ids
    // for the notification relation.
    var cl3Fresh = findChecklist('Checklist de Soldagem - Controle de Temperatura', PSC_ID)
    var cl4Fresh = findChecklist('Checklist de Caldeiraria - Dimensional', PSC_ID)

    if (cl3Fresh) {
      upsertNotif(
        cl3Fresh,
        "Checklist '" + cl3Fresh.getString('title') + "' foi submetido para aprovação.",
      )
    }
    if (cl4Fresh) {
      upsertNotif(
        cl4Fresh,
        "Checklist '" + cl4Fresh.getString('title') + "' foi submetido para aprovação.",
      )
    }
  },
  (app) => {
    // Down — best-effort cleanup of ONLY the records this migration owns.
    var PSC_ID = 'a631bv695rr4gef'

    // Notifications: type "submission" in PSC.
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

    // Demo checklists (by title, in PSC).
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
  },
)
