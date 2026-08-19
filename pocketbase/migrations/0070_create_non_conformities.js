migrate(
  (app) => {
    // 1. Create non_conformities collection (FSGQ 8.7-1 & 8.7-2)
    if (!app.hasTable('non_conformities')) {
      const collection = new Collection({
        name: 'non_conformities',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'number', type: 'text', required: true },
          { name: 'date', type: 'date', required: true },
          { name: 'process', type: 'text', required: true },
          {
            name: 'severity',
            type: 'select',
            required: true,
            values: ['Leve', 'Médio', 'Grave', 'Crítico'],
            maxSelect: 1,
          },
          { name: 'description', type: 'text', required: true },
          { name: 'immediate_action', type: 'text' },
          { name: 'root_cause_analysis', type: 'text' }, // Ishikawa / 5 Whys analysis
          { name: 'corrective_action', type: 'text' },
          { name: 'deadline', type: 'date' },
          { name: 'responsible', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Em Andamento', 'Fechada', 'Cancelada'],
            maxSelect: 1,
          },
          { name: 'effectiveness_verification', type: 'text' },
          { name: 'verification_date', type: 'date' },
          { name: 'verifier', type: 'text' },
          {
            name: 'company_id',
            type: 'relation',
            required: false,
            collectionId: app.findCollectionByNameOrId('companies').id,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nc_company ON non_conformities (company_id)',
          'CREATE INDEX idx_nc_number ON non_conformities (number)',
          'CREATE INDEX idx_nc_status ON non_conformities (status)',
        ],
      })
      app.save(collection)
    }

    // 2. Seed initial RNC records based on FSGQ 8.7-1/2 spreadsheets for testing/demo
    const ncCol = app.findCollectionByNameOrId('non_conformities')
    const pscCol = app.findCollectionByNameOrId('companies')
    let pscId = 'a631bv695rr4gef'
    try {
      const rec = app.findFirstRecordByData('companies', 'name', 'PSC')
      if (rec) pscId = rec.id
    } catch (_) {}

    const seedNCs = [
      {
        number: 'RNC-001/2024',
        date: '2024-02-15 00:00:00.000Z',
        process: 'Soldagem',
        severity: 'Médio',
        description: 'Porosidade identificada na junta J-02 da OS-2024-001 após ensaio de US.',
        immediate_action: 'Efetuar gubagem e ressoldagem do trecho afetado.',
        root_cause_analysis:
          '5 Porquês: Umidade no eletrodo -> Estufa desligada durante a noite -> Falha na verificação do checklist diário de infraestrutura.',
        corrective_action:
          'Implementar trava elétrica na estufa e revisar instrução de trabalho IT-CQ-02.',
        deadline: '2024-03-01 00:00:00.000Z',
        responsible: 'Carlos Solda',
        status: 'Fechada',
        effectiveness_verification:
          'Verificada inspeção visual e liquida penetrante após reparo. Nenhuma descontinuidade encontrada.',
        verification_date: '2024-03-05 00:00:00.000Z',
        verifier: 'Gestor da Qualidade',
        company_id: pscId,
      },
      {
        number: 'RNC-002/2024',
        date: '2024-03-10 00:00:00.000Z',
        process: 'Usinagem',
        severity: 'Grave',
        description: 'Dimensional fora do tolerado no chanfro do flange da OS-2024-002.',
        immediate_action: 'Segregar a peça e identificar com etiqueta vermelha de Não Conforme.',
        root_cause_analysis:
          'Ishikawa: Desgaste excessivo da ferramenta CNC e falta de calibração do paquímetro.',
        corrective_action:
          'Troca de insertos a cada 50 horas de operação e recalibração de instrumentos.',
        deadline: '2024-04-10 00:00:00.000Z',
        responsible: 'Roberto Usinagem',
        status: 'Em Andamento',
        effectiveness_verification: '',
        verification_date: '',
        verifier: '',
        company_id: pscId,
      },
      {
        number: 'RNC-003/2024',
        date: '2024-04-02 00:00:00.000Z',
        process: 'Caldeiraria',
        severity: 'Leve',
        description: 'Falta de rastreabilidade de corrida em chapa de reforço.',
        immediate_action: 'Localizar certificado de corrida com o fornecedor.',
        root_cause_analysis: 'Certificado retido no recebimento por falha de comunicação.',
        corrective_action: 'Digitalização obrigatória do certificado no ato da entrega.',
        deadline: '2024-04-15 00:00:00.000Z',
        responsible: 'Almoxarifado',
        status: 'Fechada',
        effectiveness_verification: 'Certificado anexado à pasta técnica da OS.',
        verification_date: '2024-04-12 00:00:00.000Z',
        verifier: 'Inspetor CQ',
        company_id: pscId,
      },
      {
        number: 'RNC-004/2024',
        date: '2024-05-18 00:00:00.000Z',
        process: 'Pintura',
        severity: 'Médio',
        description: 'Espessura de película seca abaixo da especificação ASME na OS-2024-003.',
        immediate_action: 'Aplicação de demão adicional de acabamento.',
        root_cause_analysis: 'Diluição incorreta da tinta Primer.',
        corrective_action: 'Treinamento dos pintores sobre ficha técnica do fabricante.',
        deadline: '2024-06-01 00:00:00.000Z',
        responsible: 'Pintura CQ',
        status: 'Em Andamento',
        effectiveness_verification: '',
        verification_date: '',
        verifier: '',
        company_id: pscId,
      },
    ]

    for (let i = 0; i < seedNCs.length; i++) {
      const nc = seedNCs[i]
      try {
        app.findFirstRecordByData('non_conformities', 'number', nc.number)
      } catch (_) {
        const record = new Record(ncCol)
        record.set('number', nc.number)
        record.set('date', nc.date)
        record.set('process', nc.process)
        record.set('severity', nc.severity)
        record.set('description', nc.description)
        record.set('immediate_action', nc.immediate_action)
        record.set('root_cause_analysis', nc.root_cause_analysis)
        record.set('corrective_action', nc.corrective_action)
        record.set('deadline', nc.deadline)
        record.set('responsible', nc.responsible)
        record.set('status', nc.status)
        record.set('effectiveness_verification', nc.effectiveness_verification)
        record.set('verification_date', nc.verification_date)
        record.set('verifier', nc.verifier)
        record.set('company_id', nc.company_id)
        app.save(record)
      }
    }
  },
  (app) => {
    if (app.hasTable('non_conformities')) {
      app.delete(app.findCollectionByNameOrId('non_conformities'))
    }
  },
)
