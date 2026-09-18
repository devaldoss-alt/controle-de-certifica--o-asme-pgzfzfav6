migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Create quality_objectives collection (ISO 9001 §6.2)
    if (!app.hasTable('quality_objectives')) {
      const qualityObjectivesCol = new Collection({
        name: 'quality_objectives',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'year', type: 'number', required: true, onlyInt: true },
          { name: 'objective', type: 'text', required: true },
          { name: 'process', type: 'text', required: true },
          { name: 'indicator', type: 'text', required: true },
          {
            name: 'metric_type',
            type: 'select',
            required: true,
            values: ['percentual', 'número', 'dias', 'custo'],
            maxSelect: 1,
          },
          { name: 'target_value', type: 'number', required: true },
          { name: 'baseline', type: 'number', required: false },
          { name: 'current_value', type: 'number', required: false },
          {
            name: 'responsible_id',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'deadline', type: 'date', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Planejado', 'Em andamento', 'Atingido', 'Não atingido', 'Cancelado'],
            maxSelect: 1,
          },
          { name: 'action_plan', type: 'json' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_qobj_company ON quality_objectives (company_id)',
          'CREATE INDEX idx_qobj_year ON quality_objectives (year)',
          'CREATE INDEX idx_qobj_process ON quality_objectives (process)',
          'CREATE INDEX idx_qobj_status ON quality_objectives (status)',
        ],
      })
      app.save(qualityObjectivesCol)
    }

    // 2. Create management_review collection (ISO 9001 §9.3)
    if (!app.hasTable('management_review')) {
      const managementReviewCol = new Collection({
        name: 'management_review',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'year', type: 'number', required: true, onlyInt: true },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'meeting_date', type: 'date', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Em preparação', 'Realizada', 'Cancelada'],
            maxSelect: 1,
          },
          { name: 'participants', type: 'json' },

          // Entradas do §9.3
          { name: 'input_previous_actions', type: 'text' },
          { name: 'input_context_changes', type: 'text' },
          { name: 'input_customer_satisfaction', type: 'text' },
          { name: 'input_quality_objectives', type: 'text' },
          { name: 'input_process_performance', type: 'text' },
          { name: 'input_nonconformities_corrective', type: 'text' },
          { name: 'input_monitoring_measurement', type: 'text' },
          { name: 'input_audit_results', type: 'text' },
          { name: 'input_supplier_performance', type: 'text' },
          { name: 'input_resources_adequacy', type: 'text' },
          { name: 'input_risks_opportunities', type: 'text' },
          { name: 'input_improvement_opportunities', type: 'text' },

          // Consolidação snapshot dos dados reais
          { name: 'consolidated_data_snapshot', type: 'json' },

          // Saídas do §9.3
          { name: 'output_improvement_decisions', type: 'text' },
          { name: 'output_qms_changes', type: 'text' },
          { name: 'output_resource_needs', type: 'text' },

          // Ata estruturada e anexo assinado
          { name: 'minutes', type: 'text' },
          {
            name: 'attachment',
            type: 'file',
            maxSelect: 1,
            maxSize: 31457280, // 30MB
            mimeTypes: [
              'application/pdf',
              'image/jpeg',
              'image/png',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          },

          // Ações decorrentes estruturadas
          { name: 'actions', type: 'json' },

          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_mgt_review_year ON management_review (year)',
          'CREATE INDEX idx_mgt_review_company ON management_review (company_id)',
          'CREATE INDEX idx_mgt_review_status ON management_review (status)',
          'CREATE INDEX idx_mgt_review_date ON management_review (meeting_date)',
        ],
      })
      app.save(managementReviewCol)
    }

    // 3. Expand module_permissions select field to allow 'Revisão pela Direção' and 'Objetivos da Qualidade'
    if (app.hasTable('module_permissions')) {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const modField = mpCol.fields.getByName('module')
      if (modField) {
        const existingValues = modField.values || []
        const newValues = Array.from(
          new Set([...existingValues, 'Revisão pela Direção', 'Objetivos da Qualidade']),
        )
        modField.values = newValues
        modField.maxSelect = newValues.length
        app.save(mpCol)
      }

      // Seed standard permissions for Revisão pela Direção and Objetivos da Qualidade
      const companies = app.findRecordsByFilter('companies', '', 'name', 50, 0)
      const targetRoles = [
        { role: 'Manager', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'Director', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'Diretoria', can_view: true, can_create: true, can_edit: true, can_delete: true },
        {
          role: 'Gestor da Qualidade',
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true,
        },
        { role: 'QCC', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Consultor', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Supervisor', can_view: true, can_create: true, can_edit: true, can_delete: false },
        {
          role: 'Inspector',
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
        },
      ]

      const newModules = ['Revisão pela Direção', 'Objetivos da Qualidade']

      for (let c = 0; c < companies.length; c++) {
        const compId = companies[c].id
        for (let m = 0; m < newModules.length; m++) {
          const mod = newModules[m]
          for (let r = 0; r < targetRoles.length; r++) {
            const item = targetRoles[r]
            try {
              const existing = app.findRecordsByFilter(
                'module_permissions',
                `company_id = '${compId}' && role = '${item.role}' && module ~ '${mod}'`,
                '',
                1,
                0,
              )
              if (existing.length === 0) {
                const rec = new Record(mpCol)
                rec.set('company_id', compId)
                rec.set('role', item.role)
                rec.set('module', [mod])
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
    }
  },
  (app) => {
    if (app.hasTable('management_review')) {
      app.delete(app.findCollectionByNameOrId('management_review'))
    }
    if (app.hasTable('quality_objectives')) {
      app.delete(app.findCollectionByNameOrId('quality_objectives'))
    }
  },
)
