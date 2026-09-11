migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const indCol = app.findCollectionByNameOrId('indicators')

    // 1. Create user_feedback collection
    if (!app.hasTable('user_feedback')) {
      const feedbackCol = new Collection({
        name: 'user_feedback',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'user_name', type: 'text', required: true },
          { name: 'user_email', type: 'text', required: false },
          { name: 'screen_path', type: 'text', required: true },
          { name: 'screen_name', type: 'text', required: true },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['sugestao', 'problema', 'duvida', 'elogio'],
            maxSelect: 1,
          },
          { name: 'comment', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['novo', 'lido', 'resolvido'],
            maxSelect: 1,
          },
          { name: 'resolved_at', type: 'date', required: false },
          { name: 'resolved_by_name', type: 'text', required: false },
          {
            name: 'company_id',
            type: 'relation',
            required: false,
            collectionId: companiesCol.id,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_feedback_screen ON user_feedback (screen_path)',
          'CREATE INDEX idx_feedback_status ON user_feedback (status)',
          'CREATE INDEX idx_feedback_created ON user_feedback (created)',
        ],
      })
      app.save(feedbackCol)
    }

    // 2. Resolve default user ID for indicator responsible
    let defaultUserId = 'uvq0hmn01q0faro'
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
      defaultUserId = u.id
    } catch (_) {}

    // 3. Define the 3 new automatic Lead Time indicators
    const PSC_ID = 'a631bv695rr4gef'
    const KOALA_ID = 'i7kjauu378swxg6'
    const GENTI_ID = 'zt57khfow39nwa1'
    const compIds = [PSC_ID, KOALA_ID, GENTI_ID]

    const newIndicators = [
      {
        title: 'Lead Time Médio de Fechamento de RNC',
        objective:
          'Monitorar o tempo médio (em dias) decorrido entre a emissão da Não Conformidade e a sua verificação de eficácia / fechamento formal',
        formula_description:
          'Média de (Data de Verificação/Fechamento - Data de Emissão) das RNCs concluídas no período',
        target_value: 15,
        current_value: 12.5,
        unit: 'dias',
        period: 'Monthly',
        result_type: 'Numérico',
        verification_method:
          'Cálculo automático integrado a partir dos registros de RNC e verificações de eficácia do SGQ',
        target_operator: '≤',
      },
      {
        title: 'Lead Time de Serviços Especiais Externos',
        objective:
          'Controlar o tempo médio de permanência dos materiais e componentes fora da fábrica em serviços especiais terceirizados (Galvanização, Pintura, Usinagem, Tratamento Térmico)',
        formula_description:
          'Média do campo Dias Fora dos Romaneios de Remessa/Retorno de Serviço Especial no período',
        target_value: 7,
        current_value: 4.8,
        unit: 'dias',
        period: 'Monthly',
        result_type: 'Numérico',
        verification_method:
          'Cálculo automático integrado a partir dos Romaneios de Saída/Retorno de Serviço Especial',
        target_operator: '≤',
      },
      {
        title: 'Lead Time de Atendimento e Compras (Suprimentos)',
        objective:
          'Acompanhar a agilidade do ciclo de compras e atendimento de requisições de suprimentos (desde a requisição/solicitação até a entrega/recebimento no almoxarifado)',
        formula_description:
          'Média de dias entre a data do pedido/requisição e a data de entrega física confirmada',
        target_value: 10,
        current_value: 6.2,
        unit: 'dias',
        period: 'Monthly',
        result_type: 'Numérico',
        verification_method:
          'Cálculo automático integrado da esteira de Compras/Almoxarifado e Coletas de Preço',
        target_operator: '≤',
      },
    ]

    compIds.forEach((compId) => {
      newIndicators.forEach((item) => {
        try {
          const records = app.findRecordsByFilter(
            'indicators',
            'title = {:t} && company_id = {:c}',
            'created',
            1,
            0,
            { t: item.title, c: compId },
          )
          if (!records || records.length === 0) {
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
        } catch (_) {
          try {
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
          } catch (e2) {
            console.log('Error inserting indicator ' + item.title + ': ' + e2)
          }
        }
      })
    })

    // 4. Seed realistic sample user feedback for PSC
    try {
      const fbCol = app.findCollectionByNameOrId('user_feedback')
      const existingFb = app.findRecordsByFilter('user_feedback', "id != ''", 'created', 1, 0)
      if (!existingFb || existingFb.length === 0) {
        const sampleFeedbacks = [
          {
            user_id: defaultUserId,
            user_name: 'Quality Manager',
            user_email: 'devaldoss@gmail.com',
            screen_path: '/indicators',
            screen_name: 'Indicadores',
            type: 'sugestao',
            comment:
              'Excelente inclusão do relatório de lead time! Seria ótimo termos também um export em Excel dos prazos médios por cargo.',
            status: 'novo',
            company_id: PSC_ID,
          },
          {
            user_id: defaultUserId,
            user_name: 'Carlos Inspetor CQ',
            user_email: 'inspetor@psc.com',
            screen_path: '/rnc',
            screen_name: 'RNC',
            type: 'elogio',
            comment:
              'O diagrama de Ishikawa e 5 Porquês facilitaram muito a aprovação dos relatórios pelo cliente.',
            status: 'lido',
            company_id: PSC_ID,
          },
          {
            user_id: defaultUserId,
            user_name: 'João Soldador',
            user_email: 'welder@psc.com',
            screen_path: '/documents',
            screen_name: 'Documentos',
            type: 'duvida',
            comment: 'Como posso rever a nota obtida na prova de leitura após a aprovação?',
            status: 'resolvido',
            resolved_at: new Date().toISOString(),
            resolved_by_name: 'Quality Manager',
            company_id: PSC_ID,
          },
        ]

        sampleFeedbacks.forEach((fb) => {
          const rec = new Record(fbCol)
          rec.set('user_id', fb.user_id)
          rec.set('user_name', fb.user_name)
          rec.set('user_email', fb.user_email || '')
          rec.set('screen_path', fb.screen_path)
          rec.set('screen_name', fb.screen_name)
          rec.set('type', fb.type)
          rec.set('comment', fb.comment)
          rec.set('status', fb.status)
          if (fb.resolved_at) rec.set('resolved_at', fb.resolved_at)
          if (fb.resolved_by_name) rec.set('resolved_by_name', fb.resolved_by_name)
          rec.set('company_id', fb.company_id)
          app.save(rec)
        })
      }
    } catch (errFb) {
      console.log('Error seeding user feedback: ' + errFb)
    }
  },
  (app) => {
    try {
      if (app.hasTable('user_feedback')) {
        app.delete(app.findCollectionByNameOrId('user_feedback'))
      }
    } catch (_) {}
  },
)
