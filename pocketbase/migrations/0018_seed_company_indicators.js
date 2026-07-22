migrate(
  (app) => {
    var indCol = app.findCollectionByNameOrId('indicators')

    var companies = app.findRecordsByFilter('companies', "id != ''", 'created', 200, 0)
    if (companies.length === 0) return

    var defaultManagerId = ''
    try {
      defaultManagerId = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com').id
    } catch (_) {}

    var indicators = [
      {
        title: 'Índice de Satisfação do Cliente (ISC)',
        formula: 'Média das avaliações recebidas dos clientes pós-serviço',
        unit: '%',
        target: 85,
        period: 'Monthly',
      },
      {
        title: 'Homem-Hora Trabalhada (HHT)',
        formula: 'Soma das horas trabalhadas por todos os colaboradores no período',
        unit: 'Horas',
        period: 'Monthly',
      },
      {
        title: 'Avaliação de Desempenho do Colaborador (ADC)',
        formula: 'Média das notas de competência e técnica',
        unit: '%',
        target: 80,
        period: 'Semestral',
      },
      {
        title: 'Índice de Não Conformidades (NC)',
        formula: 'Número de NCs abertas vs NCs fechadas no prazo',
        unit: 'Qtd',
        target: 0,
        period: 'Monthly',
      },
    ]

    for (var ci = 0; ci < companies.length; ci++) {
      var company = companies[ci]
      var companyId = company.id

      for (var ii = 0; ii < indicators.length; ii++) {
        var ind = indicators[ii]

        var existing = app.findRecordsByFilter(
          'indicators',
          'title = {:title} && company_id = {:companyId}',
          'created',
          1,
          0,
          { title: ind.title, companyId: companyId },
        )

        if (existing.length > 0) continue

        var rec = new Record(indCol)
        rec.set('title', ind.title)
        rec.set('formula_description', ind.formula)
        rec.set('unit', ind.unit)
        rec.set('period', ind.period)
        if (ind.target !== undefined) {
          rec.set('target_value', ind.target)
        }
        rec.set('company_id', companyId)
        if (defaultManagerId) {
          rec.set('responsible', defaultManagerId)
        }
        app.save(rec)
      }
    }
  },
  (app) => {
    var titles = [
      'Índice de Satisfação do Cliente (ISC)',
      'Homem-Hora Trabalhada (HHT)',
      'Avaliação de Desempenho do Colaborador (ADC)',
      'Índice de Não Conformidades (NC)',
    ]
    for (var i = 0; i < titles.length; i++) {
      var records = app.findRecordsByFilter('indicators', 'title = {:title}', 'created', 500, 0, {
        title: titles[i],
      })
      for (var j = 0; j < records.length; j++) {
        app.delete(records[j])
      }
    }
  },
)
