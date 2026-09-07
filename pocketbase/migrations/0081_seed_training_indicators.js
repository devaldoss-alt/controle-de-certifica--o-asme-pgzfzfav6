migrate(
  (app) => {
    const indCol = app.findCollectionByNameOrId('indicators')
    const PSC_ID = 'a631bv695rr4gef'
    const KOALA_ID = 'i7kjauu378swxg6'
    const GENTI_ID = 'zt57khfow39nwa1'

    let defaultUserId = 'uvq0hmn01q0faro'
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
      defaultUserId = u.id
    } catch (_) {}

    const newIndicators = [
      {
        title: '% Eficácia de Treinamento',
        objective: 'Garantir a eficácia dos treinamentos realizados pela organização',
        formula_description:
          '(Avaliações de eficácia com resposta SIM ÷ Total de avaliações concluídas) × 100',
        target_value: 90,
        current_value: 0,
        unit: '%',
        period: 'Monthly',
        result_type: 'Percentual',
        verification_method:
          'Avaliações formais de eficácia pós-treinamento (+60 dias) - Fonte: FSGQ 7.2-3',
        target_operator: '≥',
      },
      {
        title: '% do Plano de Treinamento Concluído',
        objective: 'Acompanhar o cumprimento das ações planejadas no FSGQ 7.2-1',
        formula_description: '(Ações realizadas ÷ Ações previstas no ano) × 100',
        target_value: 90,
        current_value: 0,
        unit: '%',
        period: 'Annual',
        result_type: 'Percentual',
        verification_method:
          'Acompanhamento do status de realização do Plano Anual - Fonte: FSGQ 7.2-1',
        target_operator: '≥',
      },
    ]

    const compIds = [PSC_ID, KOALA_ID, GENTI_ID]

    compIds.forEach((compId) => {
      newIndicators.forEach((item) => {
        // Query to check if this indicator already exists for this company
        const existing = app.findRecordsByFilter(
          'indicators',
          'company_id = {:companyId} && title = {:title}',
          'created',
          1,
          0,
          { companyId: compId, title: item.title },
        )

        if (!existing || existing.length === 0) {
          const rec = new Record(indCol)
          rec.set('title', item.title)
          rec.set('objective', item.objective)
          rec.set('formula_description', item.formula_description)
          rec.set('target_value', item.target_value)
          rec.set('current_value', item.current_value)
          rec.set('unit', item.unit)
          rec.set('period', item.period)
          rec.set('result_type', item.result_type)
          rec.set('verification_method', item.verification_method)
          rec.set('target_operator', item.target_operator)
          rec.set('responsible', defaultUserId)
          rec.set('company_id', compId)
          app.save(rec)
        }
      })
    })
  },
  (app) => {
    // Revert logic
    const titles = ['% Eficácia de Treinamento', '% do Plano de Treinamento Concluído']
    titles.forEach((t) => {
      const records = app.findRecordsByFilter('indicators', 'title = {:title}', 'created', 100, 0, {
        title: t,
      })
      records.forEach((r) => {
        try {
          app.delete(r)
        } catch (_) {}
      })
    })
  },
)
