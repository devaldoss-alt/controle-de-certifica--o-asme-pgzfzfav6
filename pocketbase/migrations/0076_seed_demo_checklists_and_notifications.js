// Migration 0076 — Seed 4 demo checklists for customer demo (Apontador -> GQ flow).

migrate(
  (app) => {
    throw new Error('TESTING_0076_REACHED')
  },
  (app) => {}
)

    // Find the apontador user at PSC
    let apontadorId = 'fsdtxxynm1nh50b'
    try {
      const apontadorRows = app.findRecordsByFilter(
        'users',
        "email = 'apontador@psc.com'",
        'created',
        1,
        0,
      )
      if (apontadorRows && apontadorRows.length > 0) {
        apontadorId = apontadorRows[0].id
      }
    } catch (_) {}

    const companyId = 'a631bv695rr4gef'

    const mockChecklists = [
      {
        title: 'Inspeção Visual de Solda - WPS-001',
        description: 'Inspeção visual preliminar de solda conforme WPS-001.',
        role_assigned: 'Welder',
        category: 'Departmental',
        status: 'completed',
        approval_status: 'approved',
        approval_comment: 'Aprovado pelo GQ conforme critérios da norma.',
        rejection_comment: '',
        due_date: '2026-08-20 12:00:00.000Z',
      },
      {
        title: 'Ensaio Visual - Juntas Estruturais',
        description: 'Verificação visual de juntas estruturais antes da liberação.',
        role_assigned: 'Welder',
        category: 'Departmental',
        status: 'completed',
        approval_status: 'rejected',
        approval_comment: '',
        rejection_comment: 'Evidências insuficientes — refazer fotos da junta',
        due_date: '2026-08-22 12:00:00.000Z',
      },
      {
        title: 'Checklist de Soldagem - Tanque TK-103',
        description: 'Acompanhamento de parâmetros de soldagem do costado do Tanque TK-103.',
        role_assigned: 'Welder',
        category: 'Departmental',
        status: 'pending',
        approval_status: 'pending',
        approval_comment: '',
        rejection_comment: '',
        due_date: '2026-08-27 12:00:00.000Z',
      },
      {
        title: 'Checklist de Soldagem - Spool P-208',
        description: 'Verificação de montagem e soldagem de spool tubulação P-208.',
        role_assigned: 'Welder',
        category: 'Departmental',
        status: 'pending',
        approval_status: 'pending',
        approval_comment: '',
        rejection_comment: '',
        due_date: '2026-09-03 12:00:00.000Z',
      },
    ]

    for (const item of mockChecklists) {
      // Idempotency: skip if already exists for this title and company
      const escapedTitle = item.title.replace(/'/g, "\\'")
      const existing = app.findRecordsByFilter(
        'checklists',
        "company_id = '" + companyId + "' && title = '" + escapedTitle + "'",
        'created',
        1,
        0,
      )
      if (existing && existing.length > 0) {
        continue
      }

      const rec = new Record(checkCol)
      rec.set('company_id', companyId)
      rec.set('title', item.title)
      rec.set('description', item.description)
      rec.set('role_assigned', item.role_assigned)
      rec.set('category', item.category)
      rec.set('status', item.status)
      rec.set('approval_status', item.approval_status)
      if (item.approval_comment) rec.set('approval_comment', item.approval_comment)
      if (item.rejection_comment) rec.set('rejection_comment', item.rejection_comment)
      rec.set('due_date', item.due_date)
      rec.set('apontador_id', apontadorId)
      app.save(rec)
    }
  },
  (app) => {
    const companyId = 'a631bv695rr4gef'
    const titles = [
      'Inspeção Visual de Solda - WPS-001',
      'Ensaio Visual - Juntas Estruturais',
      'Checklist de Soldagem - Tanque TK-103',
      'Checklist de Soldagem - Spool P-208',
    ]
    for (const title of titles) {
      const escapedTitle = title.replace(/'/g, "\\'")
      const recs = app.findRecordsByFilter(
        'checklists',
        "company_id = '" + companyId + "' && title = '" + escapedTitle + "'",
        'created',
        10,
        0,
      )
      for (const r of recs) {
        try {
          app.delete(r)
        } catch (_) {}
      }
    }
  },
)
