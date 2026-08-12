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
        title: 'IET - Eficiência no Cumprimento de Tarefas',
        objective:
          'Medir a porcentagem de tarefas e checklists concluídos rigorosamente dentro do prazo',
        formula_description: '(Tarefas Concluídas no Prazo ÷ Total de Tarefas Concluídas) × 100',
        target_value: 90,
        current_value: 94.2,
        unit: '%',
        period: 'Monthly',
        result_type: 'Percentual',
        verification_method: 'Cálculo dinâmico de checklists e O.S. finalizados sem atraso',
        target_operator: '≥',
      },
      {
        title: 'Lead Time - Tempo Médio de Conclusão',
        objective: 'Acompanhar o tempo de ciclo médio desde a criação até a homologação da tarefa',
        formula_description: 'Soma de (Data de Conclusão - Data de Emissão) ÷ Total de Tarefas',
        target_value: 3,
        current_value: 2.1,
        unit: 'dias',
        period: 'Monthly',
        result_type: 'Numérico',
        verification_method: 'Medição de tempo do ciclo operacional de qualidade',
        target_operator: '≤',
      },
    ]

    const compIds = [PSC_ID, KOALA_ID, GENTI_ID]

    compIds.forEach((compId) => {
      newIndicators.forEach((item) => {
        try {
          app.findFirstRecordByData('indicators', 'title', item.title)
        } catch (_) {
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
  (app) => {},
)
