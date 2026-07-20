migrate(
  (app) => {
    var companyId = ''
    try {
      companyId = app.findFirstRecordByData('companies', 'name', 'PSC Industria').id
    } catch (_) {}

    var checkCol = app.findCollectionByNameOrId('checklists')
    var items = [
      {
        t: 'Analisar o ambiente interno e externo da organizacao',
        te: 'Analyze internal and external organizational environment',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 4.1',
        c: true,
        days: 30,
      },
      {
        t: 'Determinar o escopo do Sistema de Gestao da Qualidade',
        te: 'Determine the scope of the Quality Management System',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 4.3',
        c: true,
        days: 30,
      },
      {
        t: 'Demonstrar lideranca e comprometimento com o SGQ',
        te: 'Demonstrate leadership and commitment to QMS',
        r: 'Director',
        ref: 'ISO 9001 Cl. 5.1',
        c: true,
        days: 45,
      },
      {
        t: 'Estabelecer e comunicar a Politica da Qualidade',
        te: 'Establish and communicate the Quality Policy',
        r: 'Director',
        ref: 'ISO 9001 Cl. 5.2',
        c: true,
        days: 45,
      },
      {
        t: 'Identificar riscos e oportunidades do SGQ',
        te: 'Identify risks and opportunities of QMS',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 6.1',
        c: true,
        days: 30,
      },
      {
        t: 'Estabelecer objetivos da qualidade mensuraveis',
        te: 'Establish measurable quality objectives',
        r: 'Director',
        ref: 'ISO 9001 Cl. 6.2',
        c: true,
        days: 45,
      },
      {
        t: 'Garantir recursos adequados para o SGQ',
        te: 'Ensure adequate resources for QMS',
        r: 'Director',
        ref: 'ISO 9001 Cl. 7.1',
        c: false,
        days: 60,
      },
      {
        t: 'Verificar competencia e treinamento da equipe',
        te: 'Verify team competence and training',
        r: 'Manager',
        ref: 'ISO 9001 Cl. 7.2',
        c: true,
        days: 30,
      },
      {
        t: 'Controlar informacoes documentadas do SGQ',
        te: 'Control documented information of QMS',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 7.5',
        c: true,
        days: 30,
      },
      {
        t: 'Planejar e controlar processos operacionais',
        te: 'Plan and control operational processes',
        r: 'Inspector',
        ref: 'ISO 9001 Cl. 8.1',
        c: false,
        days: 45,
      },
      {
        t: 'Controlar saidas nao conformes',
        te: 'Control non-conforming outputs',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 8.7',
        c: true,
        days: 30,
      },
      {
        t: 'Monitorar e medir desempenho do SGQ',
        te: 'Monitor and measure QMS performance',
        r: 'Manager',
        ref: 'ISO 9001 Cl. 9.1',
        c: true,
        days: 45,
      },
      {
        t: 'Conduzir auditorias internas do SGQ',
        te: 'Conduct internal QMS audits',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 9.2',
        c: true,
        days: 30,
      },
      {
        t: 'Realizar analise critica pela direcao',
        te: 'Conduct management review',
        r: 'Director',
        ref: 'ISO 9001 Cl. 9.3',
        c: true,
        days: 60,
      },
      {
        t: 'Tratar nao conformidades e acoes corretivas',
        te: 'Address non-conformities and corrective actions',
        r: 'QCC',
        ref: 'ISO 9001 Cl. 10.2',
        c: true,
        days: 30,
      },
    ]

    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      try {
        app.findFirstRecordByData('checklists', 'title', item.t)
      } catch (_) {
        var due = new Date(Date.now() + item.days * 24 * 60 * 60 * 1000)
        var rec = new Record(checkCol)
        rec.set('title', item.t)
        rec.set('title_en', item.te)
        rec.set('role_assigned', item.r)
        rec.set('mcq_ref', item.ref)
        rec.set('status', 'pending')
        rec.set('is_critical', item.c)
        rec.set('due_date', due.toISOString().replace('T', ' '))
        rec.set('category', 'ISO 9001')
        rec.set('approval_status', 'pending')
        if (companyId) rec.set('company_id', companyId)
        app.save(rec)
      }
    }
  },
  (app) => {},
)
