// Migration 0074 — Seed the 4 demo "mock" checklists + 2 submission
// notifications for the Apontador → Manager approval flow in PSC.
//
// Why 0074 (and not 0073)?
//   Migration 0073 (`0073_fix_apontador_demo_checklists.js`) already exists
//   and is applied, so its ordinal cannot be reused (convention: never collide
//   ordinals; next available is 0074). 0073 attempted the same general goal but
//   with different checklist titles/dates/states, and those records never
//   landed in the DB: 0073 bails early when `apontador@psc.com` is not found,
//   and at the time 0073 was applied that user did not exist yet. A
//   `title ~ "WPS-001"` query against `checklists` returns 0 rows today.
//
// What this migration does (all idempotent — safe to re-run):
//   1. Adds `approved_by` (relation → users) and `approved_at` (date) columns
//      to the `checklists` collection if they are missing, so an approver +
//      approval timestamp can be recorded (these fields did not exist before).
//   2. Resolves `apontador@psc.com` (the Apontador) and the PSC Manager
//      ("Consultor Teste", role Manager) by lookup, with safe fallbacks.
//   3. Upserts 4 checklists in PSC, ALWAYS setting `role_assigned` as the
//      ARRAY `["Welder"]` (never a bare string — the bug that sank 0072) and
//      `apontador_id` to the apontador user id.
//   4. Upserts 2 "submission" notifications (read=false) in the bell for the
//      PSC Manager, one per pending checklist.
//
// Down: removes only the records this migration owns (the 4 checklists by
// exact title in PSC, and the 2 submission notifications in PSC). It does NOT
// drop the added columns (forward-only schema) nor touch the apontador user,
// team designations or module_permissions (owned by 0072).

migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'

    // ---------- 1. Add approved_by / approved_at to checklists if missing ----------
    var checkCol = app.findCollectionByNameOrId('checklists')
    var usersColId = '_pb_users_auth_'

    if (!checkCol.fields.getByName('approved_by')) {
      checkCol.fields.add(
        new RelationField({
          name: 'approved_by',
          collectionId: usersColId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    if (!checkCol.fields.getByName('approved_at')) {
      checkCol.fields.add(new DateField({ name: 'approved_at' }))
    }
    app.save(checkCol)

    // ---------- 2. Resolve apontador@psc.com ----------
    var apontadorUserId = null
    try {
      var apontadorRows = app.findRecordsByFilter(
        'users',
        "email = 'apontador@psc.com'",
        'created',
        10,
        0,
      )
      if (apontadorRows.length > 0) apontadorUserId = apontadorRows[0].id
    } catch (_) {}

    if (!apontadorUserId) {
      // Nothing to link to without the apontador user (owned by 0072). Bail safely.
      console.log('[0074] apontador@psc.com not found — skipping seed')
      return
    }

    // ---------- Resolve the PSC Manager (approver) ----------
    // Prefer "Consultor Teste" (role Manager in PSC); fallback to the PSC
    // user with role Manager (e.g. devaldoss@gmail.com), then any PSC Manager.
    var managerUserId = null
    try {
      var mgrByName = app.findFirstRecordByData('users', 'name', 'Consultor Teste')
      if (mgrByName && mgrByName.getString('primary_company_id') === PSC_ID) {
        managerUserId = mgrByName.id
      }
    } catch (_) {}
    if (!managerUserId) {
      try {
        var mgrByEmail = app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'consultor.teste@qualihub.com',
        )
        if (mgrByEmail && mgrByEmail.getString('primary_company_id') === PSC_ID) {
          managerUserId = mgrByEmail.id
        }
      } catch (_) {}
    }
    if (!managerUserId) {
      try {
        var mgrDevaldoss = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
        if (mgrDevaldoss && mgrDevaldoss.getString('primary_company_id') === PSC_ID) {
          managerUserId = mgrDevaldoss.id
        }
      } catch (_) {}
    }
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

    // ---------- 3. Upsert the 4 demo checklists ----------
    // Re-fetch the collection (fields changed after the save above).
    checkCol = app.findCollectionByNameOrId('checklists')

    var nowIso = ''
    try {
      nowIso = new Date().toISOString().replace('T', ' ')
    } catch (_) {
      nowIso = '2026-08-19 00:00:00.000Z'
    }

    // Idempotent lookup by (title, companyId). Iterates findRecordsByFilter
    // results (more reliable in the goja VM than findFirstRecordByData).
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
      // ⚠ role_assigned is a multi-select ARRAY. Always ["Welder"], never a
      // bare string — a bare string is what broke 0072.
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
      // Approver + approval timestamp (only for decided checklists).
      if (typeof cfg.approved_by !== 'undefined' && cfg.approved_by) {
        rec.set('approved_by', cfg.approved_by)
      }
      if (typeof cfg.approved_at !== 'undefined' && cfg.approved_at) {
        rec.set('approved_at', cfg.approved_at)
      }
      app.save(rec)
      return rec
    }

    // Checklist 1 — submitted, awaiting approval (pending).
    var CL1_TITLE = 'WPS-001 – Qualificação de Procedimento de Solda'
    upsertChecklist({
      title: CL1_TITLE,
      description: 'Verificação do procedimento de soldagem WPS-001 conforme ASME Seção IX.',
      category: 'Departmental',
      status: 'completed',
      approval_status: 'pending',
      locked: false,
      is_critical: true,
      mcq_ref: 'ASME IX – WPS',
      due_date: '2026-08-19 00:00:00.000Z',
    })

    // Checklist 2 — submitted, awaiting approval (pending).
    var CL2_TITLE = 'Ensaio Visual – Juntas soldadas (VT)'
    upsertChecklist({
      title: CL2_TITLE,
      description:
        'Ensaio visual de juntas soldadas conforme ASME Seção V Artigo 9 e critérios de aceitação da Seção VIII.',
      category: 'Departmental',
      status: 'completed',
      approval_status: 'pending',
      locked: false,
      is_critical: true,
      mcq_ref: 'ASME V Art. 9',
      due_date: '2026-08-19 00:00:00.000Z',
    })

    // Checklist 3 — approved by the Manager.
    var CL3_TITLE = 'Calibração de manômetros – Setor Caldeiraria'
    upsertChecklist({
      title: CL3_TITLE,
      description:
        'Verificação da calibração vigente dos manômetros do Setor de Caldeiraria conforme NR-13.',
      category: 'Departmental',
      status: 'completed',
      approval_status: 'approved',
      locked: true,
      is_critical: false,
      mcq_ref: 'NR-13',
      due_date: '2026-08-20 00:00:00.000Z',
      approved_by: managerUserId,
      approved_at: nowIso,
      approval_comment: 'Calibrações conferem com os certificados. Aprovado.',
    })

    // Checklist 4 — rejected by the Manager (evidence illegible).
    var CL4_TITLE = 'Inspeção de EPIs – Solda'
    upsertChecklist({
      title: CL4_TITLE,
      description:
        'Inspeção dos Equipamentos de Proteção Individual da equipe de solda conforme NR-06.',
      category: 'Departmental',
      status: 'pending',
      approval_status: 'rejected',
      locked: false,
      is_critical: false,
      mcq_ref: 'NR-06',
      due_date: '2026-08-20 00:00:00.000Z',
      rejection_comment: 'Foto da válvula está ilegível. Reenviar evidência.',
      approved_by: managerUserId,
      approved_at: nowIso,
    })

    // ---------- 4. Upsert the 2 submission notifications ----------
    if (!managerUserId) {
      console.log('[0074] PSC Manager not found — skipping notification seed')
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
    // for the notification relation (the in-memory Record's .id is not always
    // populated right after save in the goja VM).
    var cl1Fresh = findChecklist(CL1_TITLE, PSC_ID)
    var cl2Fresh = findChecklist(CL2_TITLE, PSC_ID)

    if (cl1Fresh) {
      upsertNotif(
        cl1Fresh,
        "Checklist '" + CL1_TITLE + "' submetido pelo Apontador Roberta. Aguardando aprovação.",
      )
    }
    if (cl2Fresh) {
      upsertNotif(
        cl2Fresh,
        "Checklist '" + CL2_TITLE + "' submetido pelo Apontador Roberta. Aguardando aprovação.",
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

    // The 4 demo checklists (by exact title, in PSC).
    var titles = [
      'WPS-001 – Qualificação de Procedimento de Solda',
      'Ensaio Visual – Juntas soldadas (VT)',
      'Calibração de manômetros – Setor Caldeiraria',
      'Inspeção de EPIs – Solda',
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
    // NOTE: the approved_by / approved_at columns are intentionally NOT dropped
    // (forward-only schema; other records may use them in future).
  },
)
