migrate(
  (app) => {
    // 1. Expand module_permissions select field to allow 'RNC' and 'PCP'
    if (app.hasTable('module_permissions')) {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const modField = mpCol.fields.getByName('module')
      if (modField) {
        const existingValues = modField.values || []
        const newValues = Array.from(new Set([...existingValues, 'RNC', 'PCP']))
        modField.values = newValues
        modField.maxSelect = newValues.length
        app.save(mpCol)
      }
    }

    // 2. Expand non_conformities collection to support full FSGQ 8.7-1 and FSGQ 8.7-2 specifications
    if (app.hasTable('non_conformities')) {
      const col = app.findCollectionByNameOrId('non_conformities')

      // Helper to safely add fields if they don't exist
      const addFieldIfNotExists = (field) => {
        if (!col.fields.getByName(field.name)) {
          col.fields.add(field)
        }
      }

      // Add Relation fields
      const soColId = app.findCollectionByNameOrId('service_orders').id
      addFieldIfNotExists(
        new RelationField({
          name: 'service_order_id',
          collectionId: soColId,
          required: false,
          maxSelect: 1,
        }),
      )

      addFieldIfNotExists(
        new RelationField({
          name: 'parent_rnc_id',
          collectionId: col.id,
          required: false,
          maxSelect: 1,
        }),
      )

      // Add Text fields
      addFieldIfNotExists(new TextField({ name: 'issuer', required: false }))
      addFieldIfNotExists(new TextField({ name: 'summary', required: false }))
      addFieldIfNotExists(new TextField({ name: 'involved_parties', required: false }))
      addFieldIfNotExists(new TextField({ name: 'supplier_name', required: false }))
      addFieldIfNotExists(new TextField({ name: 'immediate_correction_type', required: false }))
      addFieldIfNotExists(new TextField({ name: 'immediate_correction_other', required: false }))
      addFieldIfNotExists(new TextField({ name: 'reinspection_result', required: false }))
      addFieldIfNotExists(new TextField({ name: 'reinspection_inspector', required: false }))
      addFieldIfNotExists(new TextField({ name: 'reinspection_notes', required: false }))
      addFieldIfNotExists(new TextField({ name: 'root_cause_category', required: false }))
      addFieldIfNotExists(new TextField({ name: 'root_cause_details', required: false }))
      addFieldIfNotExists(new TextField({ name: 'risk_assessment', required: false }))
      addFieldIfNotExists(new TextField({ name: 'action_plan', required: false }))

      // Add Select fields
      addFieldIfNotExists(
        new SelectField({
          name: 'origin',
          required: false,
          values: [
            'R.O.',
            'Reclamação de Cliente',
            'Auditoria Interna',
            'Auditoria Externa',
            'Fornecedor',
            'SMS',
            'Análise Crítica',
            'Outro',
          ],
          maxSelect: 1,
        }),
      )

      addFieldIfNotExists(
        new SelectField({
          name: 'action_type',
          required: false,
          values: ['Corretiva', 'Preventiva', 'N/A'],
          maxSelect: 1,
        }),
      )

      // Add Number fields for cost of non-quality and action
      addFieldIfNotExists(new NumberField({ name: 'cost_raw_material', required: false }))
      addFieldIfNotExists(new NumberField({ name: 'cost_supplies', required: false }))
      addFieldIfNotExists(new NumberField({ name: 'cost_services', required: false }))
      addFieldIfNotExists(new NumberField({ name: 'cost_total', required: false }))
      addFieldIfNotExists(new NumberField({ name: 'action_cost', required: false }))

      // Add Date fields
      addFieldIfNotExists(new DateField({ name: 'reinspection_date', required: false }))
      addFieldIfNotExists(new DateField({ name: 'effectiveness_target_date', required: false }))

      // Add JSON fields for 5 Whys and Ishikawa diagrams
      addFieldIfNotExists(new JSONField({ name: 'five_whys', maxSize: 500000 }))
      addFieldIfNotExists(new JSONField({ name: 'ishikawa_data', maxSize: 500000 }))

      // Add Select field for effectiveness (Sim, Não, Pendente)
      addFieldIfNotExists(
        new SelectField({
          name: 'is_effective',
          required: false,
          values: ['SIM', 'NÃO', 'Pendente'],
          maxSelect: 1,
        }),
      )

      // Add File field for multiple evidence files/photos
      addFieldIfNotExists(
        new FileField({
          name: 'evidences',
          maxSelect: 10,
          maxSize: 20971520, // 20 MB
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
          ],
        }),
      )

      app.save(col)
    }

    // 3. Ensure module permissions for RNC are seeded across standard roles
    if (app.hasTable('module_permissions')) {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const companies = app.findRecordsByFilter('companies', '', 'name', 50, 0)
      const targetRoles = [
        { role: 'Manager', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'QCC', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Consultor', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Supervisor', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Apontador', can_view: true, can_create: true, can_edit: false, can_delete: false },
        { role: 'Director', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'Inspector', can_view: true, can_create: true, can_edit: true, can_delete: false },
      ]

      for (let c = 0; c < companies.length; c++) {
        const compId = companies[c].id
        for (let r = 0; r < targetRoles.length; r++) {
          const item = targetRoles[r]
          try {
            const existing = app.findRecordsByFilter(
              'module_permissions',
              `company_id = '${compId}' && role = '${item.role}' && module ~ 'RNC'`,
              '',
              1,
              0,
            )
            if (existing.length === 0) {
              const rec = new Record(mpCol)
              rec.set('company_id', compId)
              rec.set('role', item.role)
              rec.set('module', ['RNC'])
              rec.set('can_view', item.can_view)
              rec.set('can_create', item.can_create)
              rec.set('can_edit', item.can_edit)
              rec.set('can_delete', item.can_delete)
              app.save(rec)
            }
          } catch (_) {}
        }
      }
    }

    // 4. Update sample RNC records with realistic company data including RNC 015-26
    if (app.hasTable('non_conformities')) {
      const ncCol = app.findCollectionByNameOrId('non_conformities')
      let pscId = ''
      try {
        const pscRec = app.findFirstRecordByData('companies', 'name', 'PSC')
        if (pscRec) pscId = pscRec.id
      } catch (_) {}

      // Seed "RNC 015-26" referenced in Training module
      try {
        app.findFirstRecordByData('non_conformities', 'number', 'RNC 015-26')
      } catch (_) {
        const sampleRnc = new Record(ncCol)
        sampleRnc.set('number', 'RNC 015-26')
        sampleRnc.set('date', '2026-03-10 00:00:00.000Z')
        sampleRnc.set('process', 'CQ')
        sampleRnc.set('severity', 'Médio')
        sampleRnc.set('origin', 'Auditoria Interna')
        sampleRnc.set('action_type', 'Corretiva')
        sampleRnc.set('issuer', 'Carlos Inspetor CQ')
        sampleRnc.set(
          'summary',
          'Instrumentos com calibração vencida identificados na bancada de ensaios.',
        )
        sampleRnc.set(
          'description',
          'Durante auditoria de processo na área de CQ, foram localizados 2 paquímetros e 1 micrômetro com certificado de calibração expirado em 28/02/2026.',
        )
        sampleRnc.set('involved_parties', 'Equipe de Inspeção Dimensional e Almoxarifado Técnico')
        sampleRnc.set('immediate_correction_type', 'Retrabalhar')
        sampleRnc.set(
          'immediate_action',
          'Segregação imediata dos instrumentos, identificação com etiqueta vermelha e envio para laboratório acreditado RBC.',
        )
        sampleRnc.set('cost_raw_material', 0)
        sampleRnc.set('cost_supplies', 150)
        sampleRnc.set('cost_services', 850)
        sampleRnc.set('cost_total', 1000)
        sampleRnc.set('reinspection_result', 'Aprovado')
        sampleRnc.set('reinspection_inspector', 'Gestor da Qualidade')
        sampleRnc.set('reinspection_date', '2026-03-18 00:00:00.000Z')
        sampleRnc.set('root_cause_category', 'Método')
        sampleRnc.set(
          'root_cause_details',
          'Falta de alerta antecipado no mapa de calibração de instrumentos.',
        )
        sampleRnc.set(
          'five_whys',
          JSON.stringify([
            {
              why: 'Por que o paquímetro estava vencido?',
              answer: 'Porque não foi enviado para calibração na data limite.',
            },
            {
              why: 'Por que não foi enviado a tempo?',
              answer: 'Porque o responsável não consultou a planilha de controle no início do mês.',
            },
            {
              why: 'Por que o controle é manual?',
              answer: 'Porque o módulo automatizado ainda não alertava no sino do sistema.',
            },
            {
              why: 'Por que a equipe não identificou no uso diário?',
              answer: 'A etiqueta estava desgastada e pouco visível.',
            },
            {
              why: 'Causa raiz',
              answer:
                'Ausência de procedimento padronizado de verificação pré-uso e treinamento operacional.',
            },
          ]),
        )
        sampleRnc.set(
          'ishikawa_data',
          JSON.stringify({
            metodo: ['Procedimento de calibração não exigia verificação pré-uso'],
            maquina: ['Instrumentos sem proteção de etiqueta'],
            mao_de_obra: ['Falta de treinamento de aferição e leitura de certificados'],
            material: ['Etiquetas adesivas não resistentes a óleo'],
            meio_ambiente: ['Bancada com excesso de itens simultâneos'],
            medicao: ['Tolerância do processo não estava afixada na bancada'],
          }),
        )
        sampleRnc.set(
          'corrective_action',
          'Treinamento da equipe de CQ e implementação de bloqueio preventivo 30 dias antes do vencimento.',
        )
        sampleRnc.set('action_plan', 'Revisar IT-CQ-005 e treinar 100% dos inspetores')
        sampleRnc.set('responsible', 'Gestor da Qualidade')
        sampleRnc.set('deadline', '2026-04-10 00:00:00.000Z')
        sampleRnc.set('action_cost', 450)
        sampleRnc.set(
          'risk_assessment',
          'Risco de liberação de peças com dimensão fora do tolerado pelo projeto ASME.',
        )
        sampleRnc.set('status', 'Fechada')
        sampleRnc.set('effectiveness_target_date', '2026-05-10 00:00:00.000Z')
        sampleRnc.set('is_effective', 'SIM')
        sampleRnc.set(
          'effectiveness_verification',
          'Auditoria de acompanhamento realizada em 12/05/2026: 100% dos instrumentos calibrados e vigentes.',
        )
        sampleRnc.set('verification_date', '2026-05-12 00:00:00.000Z')
        sampleRnc.set('verifier', 'Consultor SGQ')
        if (pscId) sampleRnc.set('company_id', pscId)
        app.save(sampleRnc)
      }
    }
  },
  (app) => {
    // Revert steps if needed
  },
)
