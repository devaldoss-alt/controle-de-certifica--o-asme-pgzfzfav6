// Migration 0075 — Seed the 4 demo checklists for the Apontador → GQ (Manager/QCC) flow in PSC.
//
// Context & specs:
// - Company PSC: company_id = "a631bv695rr4gef"
// - Apontador User: apuntador@psc.com (role Apontador)
// - Team Apontadores: Roberta Carvalho Baião Junqueira / Agnaldo Silva Santos
//
// 4 Checklists to create (all category: "ISO 9001", company_id: "a631bv695rr4gef",
// role_assigned: ["Welder"], apontador_id: apontadorUser.id):
//   1. "WPS-001 - Qualificação de Procedimento de Solda"
//      status: "completed", approval_status: "approved",
//      due_date: "2026-08-19 00:00:00.000Z", approved_at: "2026-08-19 00:00:00.000Z",
//      approval_comment: "WPQ do soldador anexada. Parâmetros dentro do range qualificado. Ensaio visual ok.",
//      evidence_notes: "WPQ do soldador anexada. Parâmetros dentro do range qualificado. Ensaio visual ok."
//
//   2. "Ensaio Visual de Solda - Junta 45B"
//      status: "completed", approval_status: "rejected",
//      due_date: "2026-08-19 00:00:00.000Z", approved_at: "2026-08-19 00:00:00.000Z",
//      rejection_comment: "Porosidade visível na foto. Refazer ensaio após lixamento e escovação.",
//      evidence_notes: "Foto da junta mostra pequenas porosidades superficiais."
//
//   3. "Pré-aquecimento - Tubulação Schedule 80"
//      status: "pending", approval_status: "pending",
//      due_date: "2026-08-20 00:00:00.000Z"
//
//   4. "Verificação dimensional - Estrutura Base"
//      status: "pending", approval_status: "pending",
//      due_date: "2026-08-22 00:00:00.000Z"
//
// Notifications:
//   - Manager/GQ: "Checklist 'WPS-001' submetido pelo Apontador para aprovação"
//   - Apontador: "Checklist 'Ensaio Visual de Solda - Junta 45B' foi rejeitado pela GQ"

migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'

    // 1. Look up Apontador user (apontador@psc.com)
    var apontadorUser = null
    try {
      apontadorUser = app.findAuthRecordByEmail('_pb_users_auth_', 'apontador@psc.com')
    } catch (_) {}

    if (!apontadorUser) {
      try {
        var uRows = app.findRecordsByFilter('users', "email = 'apontador@psc.com'", 'created', 1, 0)
        if (uRows.length > 0) apontadorUser = uRows[0]
      } catch (_) {}
    }

    if (!apontadorUser) {
      console.log('[0075] apontador@psc.com not found — aborting checklist seed')
      return
    }
    var apontadorUserId = apontadorUser.id

    // Look up Manager / GQ user for PSC
    var managerUser = null
    try {
      managerUser = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
    } catch (_) {}
    if (!managerUser) {
      try {
        var mRows = app.findRecordsByFilter(
          'users',
          "primary_company_id = '" + PSC_ID + "'",
          'created',
          50,
          0,
        )
        for (var i = 0; i < mRows.length; i++) {
          var rVal = mRows[i].get('role')
          var rList = Array.isArray(rVal) ? rVal : [rVal]
          if (rList.indexOf('Manager') !== -1) {
            managerUser = mRows[i]
            break
          }
        }
      } catch (_) {}
    }
    var managerUserId = managerUser ? managerUser.id : null

    // Look up Roberta or Agnaldo from team collection for reference / ensuring is_indicator
    var apontadorTeamMember = null
    try {
      var teamRows = app.findRecordsByFilter(
        'team',
        "company_id = '" + PSC_ID + "' && is_indicator = true",
        'name',
        10,
        0,
      )
      if (teamRows.length > 0) {
        apontadorTeamMember = teamRows[0]
      }
    } catch (_) {}

    // Ensure checklists collection fields exist
    var checkCol = app.findCollectionByNameOrId('checklists')
    var notifCol = app.findCollectionByNameOrId('notifications')

    // Helper to find checklist by title and company_id
    var findChecklist = function (title, companyId) {
      try {
        var rows = app.findRecordsByFilter(
          'checklists',
          "company_id = '" + companyId + "' && title = '" + title.replace(/'/g, "''") + "'",
          'created',
          10,
          0,
        )
        if (rows.length > 0) return rows[0]
      } catch (_) {}
      return null
    }

    var upsertChecklist = function (data) {
      var rec = findChecklist(data.title, PSC_ID)
      if (!rec) {
        rec = new Record(checkCol)
        rec.set('title', data.title)
        rec.set('company_id', PSC_ID)
      }
      rec.set('role_assigned', ['Welder'])
      rec.set('category', 'ISO 9001')
      rec.set('status', data.status)
      rec.set('approval_status', data.approval_status)
      rec.set('due_date', data.due_date)
      rec.set('apontador_id', apontadorUserId)
      rec.set('is_critical', !!data.is_critical)
      rec.set('locked', !!data.locked)

      if (data.rejection_comment) rec.set('rejection_comment', data.rejection_comment)
      if (data.approval_comment) rec.set('approval_comment', data.approval_comment)
      if (data.evidence_notes) rec.set('evidence_notes', data.evidence_notes)
      if (data.approved_at) rec.set('approved_at', data.approved_at)
      if (data.approved_by) rec.set('approved_by', data.approved_by)
      if (data.description) rec.set('description', data.description)

      app.save(rec)
      return rec
    }

    // Checklist 1 — Aprovado
    var cl1 = upsertChecklist({
      title: 'WPS-001 - Qualificação de Procedimento de Solda',
      description: 'Qualificação de Procedimento de Soldagem conforme ASME Seção IX / ISO 9001.',
      status: 'completed',
      approval_status: 'approved',
      due_date: '2026-08-19 00:00:00.000Z',
      approved_at: '2026-08-19 00:00:00.000Z',
      approved_by: managerUserId,
      locked: true,
      is_critical: true,
      approval_comment:
        'WPQ do soldador anexada. Parâmetros dentro do range qualificado. Ensaio visual ok.',
      evidence_notes:
        'WPQ do soldador anexada. Parâmetros dentro do range qualificado. Ensaio visual ok.',
    })

    // Checklist 2 — Rejeitado
    var cl2 = upsertChecklist({
      title: 'Ensaio Visual de Solda - Junta 45B',
      description: 'Ensaio visual de solda na junta 45B conforme procedimentos de inspeção.',
      status: 'completed',
      approval_status: 'rejected',
      due_date: '2026-08-19 00:00:00.000Z',
      approved_at: '2026-08-19 00:00:00.000Z',
      approved_by: managerUserId,
      locked: false,
      is_critical: true,
      rejection_comment: 'Porosidade visível na foto. Refazer ensaio após lixamento e escovação.',
      evidence_notes: 'Foto da junta mostra pequenas porosidades superficiais.',
    })

    // Checklist 3 — Pendente
    var cl3 = upsertChecklist({
      title: 'Pré-aquecimento - Tubulação Schedule 80',
      description: 'Verificação de pré-aquecimento para soldagem de tubulação Schedule 80.',
      status: 'pending',
      approval_status: 'pending',
      due_date: '2026-08-20 00:00:00.000Z',
      locked: false,
      is_critical: false,
    })

    // Checklist 4 — Pendente
    var cl4 = upsertChecklist({
      title: 'Verificação dimensional - Estrutura Base',
      description: 'Controle e verificação dimensional da estrutura base conforme projeto.',
      status: 'pending',
      approval_status: 'pending',
      due_date: '2026-08-22 00:00:00.000Z',
      locked: false,
      is_critical: false,
    })

    // Re-fetch persisted IDs
    var cl1Fresh = findChecklist('WPS-001 - Qualificação de Procedimento de Solda', PSC_ID)
    var cl2Fresh = findChecklist('Ensaio Visual de Solda - Junta 45B', PSC_ID)

    var findNotif = function (userId, checklistId, type) {
      try {
        var rows = app.findRecordsByFilter(
          'notifications',
          "user_id = '" +
            userId +
            "' && checklist_id = '" +
            checklistId +
            "' && type = '" +
            type +
            "'",
          'created',
          5,
          0,
        )
        if (rows.length > 0) return rows[0]
      } catch (_) {}
      return null
    }

    var upsertNotif = function (userId, checklistId, type, message) {
      if (!userId) return
      var existing = findNotif(userId, checklistId, type)
      if (existing) {
        existing.set('message', message)
        existing.set('read', false)
        app.save(existing)
        return
      }
      var rec = new Record(notifCol)
      rec.set('user_id', userId)
      if (checklistId) rec.set('checklist_id', checklistId)
      rec.set('message', message)
      rec.set('type', type)
      rec.set('read', false)
      rec.set('company_id', PSC_ID)
      app.save(rec)
    }

    // 1 notificação para o Manager/GQ
    if (managerUserId && cl1Fresh) {
      upsertNotif(
        managerUserId,
        cl1Fresh.id,
        'submission',
        "Checklist 'WPS-001' submetido pelo Apontador para aprovação",
      )
    }

    // 1 notificação para o Apontador
    if (apontadorUserId && cl2Fresh) {
      upsertNotif(
        apontadorUserId,
        cl2Fresh.id,
        'rejected',
        "Checklist 'Ensaio Visual de Solda - Junta 45B' foi rejeitado pela GQ",
      )
    }
  },
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var titles = [
      'WPS-001 - Qualificação de Procedimento de Solda',
      'Ensaio Visual de Solda - Junta 45B',
      'Pré-aquecimento - Tubulação Schedule 80',
      'Verificação dimensional - Estrutura Base',
    ]

    for (var i = 0; i < titles.length; i++) {
      try {
        var rows = app.findRecordsByFilter(
          'checklists',
          "company_id = '" + PSC_ID + "' && title = '" + titles[i].replace(/'/g, "''") + "'",
          'created',
          10,
          0,
        )
        for (var j = 0; j < rows.length; j++) {
          try {
            app.delete(rows[j])
          } catch (_) {}
        }
      } catch (_) {}
    }

    try {
      var notifs = app.findRecordsByFilter(
        'notifications',
        "company_id = '" +
          PSC_ID +
          "' && (message ~ 'WPS-001' || message ~ 'Ensaio Visual de Solda - Junta 45B')",
        'created',
        50,
        0,
      )
      for (var k = 0; k < notifs.length; k++) {
        try {
          app.delete(notifs[k])
        } catch (_) {}
      }
    } catch (_) {}
  },
)
