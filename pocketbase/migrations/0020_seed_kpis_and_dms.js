migrate(
  (app) => {
    var indCol = app.findCollectionByNameOrId('indicators')
    app.truncateCollection(indCol)

    var defaultManagerId = ''
    try {
      defaultManagerId = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com').id
    } catch (_) {}

    var companies = app.findRecordsByFilter('companies', "id != ''", 'created', 200, 0)

    var kpis = [
      {
        title: 'ISC - Índice de Satisfação do Cliente',
        objective: 'Satisfazer expectativas dos clientes',
        formula_description: '(Somatório pontos ÷ total avaliados) × 100',
        target_value: 80,
        target_operator: '≥',
        result_type: 'Percentual',
        verification_method: 'Pesquisa de satisfação com clientes - Responsável: Comercial',
        unit: '%',
        period: 'Annual',
      },
      {
        title: 'HHT - Horas de Treinamento',
        objective: 'Investir em capacitação dos colaboradores',
        formula_description: '(Horas treinamento ÷ (Colaboradores × Horas período)) × 100',
        target_value: 0.4,
        target_operator: '≥',
        result_type: 'Percentual',
        verification_method: 'Registros de treinamento de RH - Responsável: RH',
        unit: '%',
        period: 'Monthly',
      },
      {
        title: 'ADC - Avaliação de Desempenho do Colaborador',
        objective: 'Aumentar desempenho dos colaboradores',
        formula_description: 'Soma notas ÷ Número avaliações',
        target_value: 80,
        target_operator: '>',
        result_type: 'Percentual',
        verification_method: 'Avaliações de desempenho - Responsável: RH',
        unit: '%',
        period: 'Annual',
      },
      {
        title: 'IRPI - Índice de Reclamações de Produtos e Inspeções',
        objective: 'Reduzir reclamações',
        formula_description: 'Soma de reclamações',
        target_value: 10,
        target_operator: '<',
        result_type: 'Numérico',
        verification_method: 'Registro de reclamações - Responsável: GQ',
        unit: 'pts',
        period: 'Annual',
      },
      {
        title: 'INCF - Índice de Não Conformidade de Fornecedores',
        objective: 'Fornecedores aceitáveis',
        formula_description: '(Recebimentos NC ÷ Pedidos totais) × 100',
        target_value: 30,
        target_operator: '<',
        result_type: 'Percentual',
        verification_method: 'Avaliação de fornecedores - Responsável: Suprimentos',
        unit: '%',
        period: 'Annual',
      },
      {
        title: 'RAE - Recuperação e Aproveitamento de Entregas',
        objective: 'Reduzir atrasos',
        formula_description: '(Pedidos atrasados ÷ Pedidos totais) × 100',
        target_value: 30,
        target_operator: '≤',
        result_type: 'Percentual',
        verification_method: 'Controle de produção - Responsável: Produção/PCP',
        unit: '%',
        period: 'Monthly',
      },
    ]

    for (var ci = 0; ci < companies.length; ci++) {
      var companyId = companies[ci].id
      for (var ii = 0; ii < kpis.length; ii++) {
        var kpi = kpis[ii]
        var rec = new Record(indCol)
        rec.set('title', kpi.title)
        rec.set('objective', kpi.objective)
        rec.set('formula_description', kpi.formula_description)
        rec.set('target_value', kpi.target_value)
        rec.set('target_operator', kpi.target_operator)
        rec.set('result_type', kpi.result_type)
        rec.set('verification_method', kpi.verification_method)
        rec.set('unit', kpi.unit)
        rec.set('period', kpi.period)
        rec.set('current_value', 0)
        rec.set('company_id', companyId)
        if (defaultManagerId) rec.set('responsible', defaultManagerId)
        app.save(rec)
      }
    }

    var daCol = app.findCollectionByNameOrId('document_access')
    app.truncateCollection(daCol)

    var newPrefixes = [
      'ASME PSC',
      'CDE-PS',
      'CQS-PSC',
      'EVS-PSC',
      'FSGQ',
      'ISSGQ',
      'IT-CQ',
      'ITSGQ',
      'LP-KS',
      'MCQ',
      'MSGQ',
      'PR-CQ',
      'PSGQ',
    ]
    var roles = [
      'Director',
      'QCC',
      'Inspector',
      'AI',
      'Designer',
      'Engineer',
      'CertifyingEngineer',
      'Welder',
      'NDE',
      'Manager',
    ]

    for (var ri = 0; ri < roles.length; ri++) {
      for (var pi = 0; pi < newPrefixes.length; pi++) {
        var daRec = new Record(daCol)
        daRec.set('role', roles[ri])
        daRec.set('document_prefix', newPrefixes[pi])
        daRec.set('can_view', true)
        daRec.set(
          'can_edit',
          roles[ri] === 'Manager' || roles[ri] === 'Director' || roles[ri] === 'QCC',
        )
        app.save(daRec)
      }
    }

    var oldToNew = {
      PSGQ: 'PSGQ',
      'MN-AD': 'MSGQ',
      'PR-CQ': 'PR-CQ',
      'PR-EN': 'PSGQ',
      'IT-CQ': 'IT-CQ',
      'IT-EN': 'ITSGQ',
      'RG-CQ': 'FSGQ',
      'RG-EN': 'FSGQ',
    }

    var docs = app.findRecordsByFilter('documents', "id != ''", 'created', 500, 0)
    for (var di = 0; di < docs.length; di++) {
      var d = docs[di]
      var oldPrefix = d.getString('prefix')
      if (oldPrefix && oldToNew[oldPrefix]) {
        d.set('prefix', oldToNew[oldPrefix])
        app.save(d)
      }
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('indicators'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('document_access'))
    } catch (_) {}
  },
)
