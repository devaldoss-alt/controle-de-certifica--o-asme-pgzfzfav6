migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const nonConformitiesCol = app.findCollectionByNameOrId('non_conformities')
    const documentsCol = app.findCollectionByNameOrId('documents')

    // 1. Create audit_program collection
    if (!app.hasTable('audit_program')) {
      const auditProgramCol = new Collection({
        name: 'audit_program',
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
          {
            name: 'audit_scope',
            type: 'text',
            required: true,
          },
          {
            name: 'audit_type',
            type: 'select',
            required: true,
            values: ['Interna', 'Fornecedor', 'Preparatória de certificação'],
            maxSelect: 1,
          },
          {
            name: 'standard_ref',
            type: 'select',
            required: true,
            values: [
              'ISO 9001 §4 Contexto da Organização',
              'ISO 9001 §5 Liderança',
              'ISO 9001 §6 Planejamento',
              'ISO 9001 §7 Apoio e Recursos',
              'ISO 9001 §8 Operação',
              'ISO 9001 §9 Avaliação de Desempenho',
              'ISO 9001 §10 Melhoria',
              'ASME Sec. I',
              'ASME Sec. VIII Div 1',
              'ASME Sec. IX Soldagem',
              'ASME B31.3 Tubulações',
              'NBIC Part 1 / Part 2 / Part 3',
              'ISO 14001',
              'ISO 45001',
            ],
            maxSelect: 14,
          },
          { name: 'planned_date', type: 'date', required: true },
          { name: 'realized_date', type: 'date' },
          {
            name: 'auditor_ids',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 10,
            cascadeDelete: false,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Planejada', 'Em andamento', 'Realizada', 'Cancelada'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_audit_program_year ON audit_program (year)',
          'CREATE INDEX idx_audit_program_company ON audit_program (company_id)',
          'CREATE INDEX idx_audit_program_status ON audit_program (status)',
          'CREATE INDEX idx_audit_program_planned ON audit_program (planned_date)',
        ],
      })
      app.save(auditProgramCol)
    }

    const auditProgramRef = app.findCollectionByNameOrId('audit_program')

    // 2. Create audit_checklists collection
    if (!app.hasTable('audit_checklists')) {
      const auditChecklistsCol = new Collection({
        name: 'audit_checklists',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'audit_id',
            type: 'relation',
            required: true,
            collectionId: auditProgramRef.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'section', type: 'text', required: true },
          { name: 'items', type: 'json' },
          {
            name: 'evidence_file',
            type: 'file',
            maxSelect: 5,
            maxSize: 20971520,
            mimeTypes: [
              'image/jpeg',
              'image/png',
              'image/webp',
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
          },
          {
            name: 'cross_doc_id',
            type: 'relation',
            required: false,
            collectionId: documentsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_audit_chk_audit ON audit_checklists (audit_id)',
          'CREATE INDEX idx_audit_chk_section ON audit_checklists (section)',
        ],
      })
      app.save(auditChecklistsCol)
    }

    // 3. Create audit_findings collection
    if (!app.hasTable('audit_findings')) {
      const auditFindingsCol = new Collection({
        name: 'audit_findings',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'audit_id',
            type: 'relation',
            required: true,
            collectionId: auditProgramRef.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['Não Conformidade', 'Observação', 'Oportunidade de Melhoria', 'Ponto Forte'],
            maxSelect: 1,
          },
          { name: 'description', type: 'text', required: true },
          {
            name: 'evidence_file',
            type: 'file',
            maxSelect: 5,
            maxSize: 20971520,
            mimeTypes: [
              'image/jpeg',
              'image/png',
              'image/webp',
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
          },
          {
            name: 'responsible',
            type: 'text',
          },
          { name: 'deadline', type: 'date' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Aberto', 'Em tratamento', 'Fechado'],
            maxSelect: 1,
          },
          {
            name: 'linked_rnc_id',
            type: 'relation',
            required: false,
            collectionId: nonConformitiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_findings_audit ON audit_findings (audit_id)',
          'CREATE INDEX idx_findings_type ON audit_findings (type)',
          'CREATE INDEX idx_findings_status ON audit_findings (status)',
          'CREATE INDEX idx_findings_rnc ON audit_findings (linked_rnc_id)',
        ],
      })
      app.save(auditFindingsCol)
    }

    // 4. Create risk_register collection
    if (!app.hasTable('risk_register')) {
      const riskRegisterCol = new Collection({
        name: 'risk_register',
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
          {
            name: 'process',
            type: 'text',
            required: true,
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['Risco', 'Oportunidade'],
            maxSelect: 1,
          },
          { name: 'description', type: 'text', required: true },
          { name: 'cause_category', type: 'text' },
          { name: 'probability', type: 'number', required: true, min: 1, max: 5 },
          { name: 'impact', type: 'number', required: true, min: 1, max: 5 },
          { name: 'risk_level', type: 'number', min: 1, max: 25 },
          { name: 'risk_grade', type: 'text' },
          { name: 'treatment_plan', type: 'text' },
          { name: 'treatment_responsible', type: 'text' },
          { name: 'treatment_deadline', type: 'date' },
          {
            name: 'treatment_status',
            type: 'select',
            required: true,
            values: ['Planejado', 'Em andamento', 'Implementado'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Ativo', 'Encerrado'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_risk_company ON risk_register (company_id)',
          'CREATE INDEX idx_risk_process ON risk_register (process)',
          'CREATE INDEX idx_risk_type ON risk_register (type)',
          'CREATE INDEX idx_risk_status ON risk_register (status)',
        ],
      })
      app.save(riskRegisterCol)
    }

    // 5. Expand module_permissions select field to allow 'Auditorias' and 'Riscos'
    if (app.hasTable('module_permissions')) {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const modField = mpCol.fields.getByName('module')
      if (modField) {
        const existingValues = modField.values || []
        const newValues = Array.from(new Set([...existingValues, 'Auditorias', 'Riscos']))
        modField.values = newValues
        modField.maxSelect = newValues.length
        app.save(mpCol)
      }

      // Seed standard permissions for Auditorias and Riscos for standard roles
      const companies = app.findRecordsByFilter('companies', '', 'name', 50, 0)
      const targetRoles = [
        { role: 'Manager', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'Director', can_view: true, can_create: true, can_edit: true, can_delete: true },
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

      const newModules = ['Auditorias', 'Riscos']

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
    if (app.hasTable('risk_register')) {
      app.delete(app.findCollectionByNameOrId('risk_register'))
    }
    if (app.hasTable('audit_findings')) {
      app.delete(app.findCollectionByNameOrId('audit_findings'))
    }
    if (app.hasTable('audit_checklists')) {
      app.delete(app.findCollectionByNameOrId('audit_checklists'))
    }
    if (app.hasTable('audit_program')) {
      app.delete(app.findCollectionByNameOrId('audit_program'))
    }
  },
)
