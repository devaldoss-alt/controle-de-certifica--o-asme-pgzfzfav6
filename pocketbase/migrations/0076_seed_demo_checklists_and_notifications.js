migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var APONTADOR_ID = 'fsdtxxynm1nh50b'

    var checkCol = app.findCollectionByNameOrId('checklists')

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
      rec.set('role_assigned', 'Welder')
      rec.set('category', 'ISO 9001')
      rec.set('status', data.status)
      rec.set('approval_status', data.approval_status)
      rec.set('due_date', data.due_date)
      rec.set('apontador_id', APONTADOR_ID)
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

    // 1. "Inspeção Visual de Solda - WPS-001" (approved)
    upsertChecklist({
      title: 'Inspeção Visual de Solda - WPS-001',
      description: 'Inspeção visual de soldagem conforme procedimento WPS-001.',
      status: 'completed',
      approval_status: 'approved',
      due_date: '2026-08-19 00:00:00.000Z',
      approved_at: '2026-08-19 00:00:00.000Z',
      locked: true,
      is_critical: true,
      approval_comment: 'Parâmetros de solda conformes e inspeção visual aprovada.',
      evidence_notes: 'Relatório de inspeção visual e registros conformes.',
    })

    // 2. "Ensaio Visual - Juntas Estruturais" (rejected com rejection_comment)
    upsertChecklist({
      title: 'Ensaio Visual - Juntas Estruturais',
      description: 'Ensaio visual de juntas estruturais soldadas.',
      status: 'completed',
      approval_status: 'rejected',
      due_date: '2026-08-19 00:00:00.000Z',
      approved_at: '2026-08-19 00:00:00.000Z',
      locked: false,
      is_critical: true,
      rejection_comment: 'Descontinuidade detectada na raiz da junta. Necessário retrabalho.',
      evidence_notes: 'Evidências apontam descontinuidades na raiz da junta.',
    })

    // 3. "Checklist de Soldagem - Tanque TK-103" (pending)
    upsertChecklist({
      title: 'Checklist de Soldagem - Tanque TK-103',
      description: 'Acompanhamento e checklist de soldagem para montagem do Tanque TK-103.',
      status: 'pending',
      approval_status: 'pending',
      due_date: '2026-08-20 00:00:00.000Z',
      locked: false,
      is_critical: false,
    })

    // 4. "Checklist de Soldagem - Spool P-208" (pending)
    upsertChecklist({
      title: 'Checklist de Soldagem - Spool P-208',
      description: 'Acompanhamento de parâmetros de solda e pré-aquecimento para Spool P-208.',
      status: 'pending',
      approval_status: 'pending',
      due_date: '2026-08-22 00:00:00.000Z',
      locked: false,
      is_critical: false,
    })
  },
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var titles = [
      'Inspeção Visual de Solda - WPS-001',
      'Ensaio Visual - Juntas Estruturais',
      'Checklist de Soldagem - Tanque TK-103',
      'Checklist de Soldagem - Spool P-208',
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
  },
)
