migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const serviceOrdersCol = app.findCollectionByNameOrId('service_orders')

    // 1. Create suppliers collection
    if (!app.hasTable('suppliers')) {
      const suppliersCol = new Collection({
        name: 'suppliers',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'trade_name', type: 'text' },
          { name: 'cnpj', type: 'text' },
          { name: 'contact_person', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'address', type: 'text' },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'classification',
            type: 'select',
            required: true,
            values: ['Crítico', 'Não Crítico'],
            maxSelect: 1,
          },
          {
            name: 'critical_categories',
            type: 'select',
            required: false,
            values: [
              'Aços e materiais de aportar',
              'Tratamentos térmicos',
              'Revestimentos e banhos',
              'Ensaios Não Destrutivos (END)',
              'Calibração de instrumentos',
              'Soldagem',
              'Transporte de produto acabado',
              'Tintas e revestimentos especiais',
              'Componentes críticos de engenharia',
              'Outros materiais e serviços gerais',
            ],
            maxSelect: 10,
          },
          { name: 'materials_services_description', type: 'text' },
          {
            name: 'qualification_status',
            type: 'select',
            required: true,
            values: ['Em avaliação', 'Qualificado', 'Em requalificação', 'Desqualificado'],
            maxSelect: 1,
          },
          {
            name: 'qualification_criteria',
            type: 'select',
            required: false,
            values: [
              'ISO 9001 válida',
              'Certificados do serviço/material (RBC/ASME)',
              'Histórico satisfatório de fornecimento',
              'Questionário FSGQ 8.4-2 (Nota ≥ 6,0)',
              'Dispensa / Não Crítico',
            ],
            maxSelect: 5,
          },
          { name: 'iso9001_certified', type: 'bool' },
          { name: 'iso9001_cert_number', type: 'text' },
          { name: 'iso9001_valid_until', type: 'date' },
          { name: 'technical_certificates_info', type: 'text' },
          { name: 'evaluation_score', type: 'number', min: 0, max: 10 },
          { name: 'last_evaluation_date', type: 'date' },
          { name: 'next_reevaluation_date', type: 'date' },
          { name: 'reevaluation_exempt', type: 'bool' },
          { name: 'reevaluation_exempt_reason', type: 'text' },
          { name: 'disqualification_reason', type: 'text' },
          { name: 'qualification_notes', type: 'text' },
          {
            name: 'qualified_by',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_suppliers_company ON suppliers (company_id)',
          'CREATE INDEX idx_suppliers_status ON suppliers (qualification_status)',
          'CREATE INDEX idx_suppliers_class ON suppliers (classification)',
          'CREATE INDEX idx_suppliers_name ON suppliers (name)',
        ],
      })
      app.save(suppliersCol)
    }

    const suppliersRef = app.findCollectionByNameOrId('suppliers')

    // 2. Create supplier_evaluations collection (FSGQ 8.4-2 and FSGQ 8.4-2.1)
    if (!app.hasTable('supplier_evaluations')) {
      const evaluationsCol = new Collection({
        name: 'supplier_evaluations',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'supplier_id',
            type: 'relation',
            required: true,
            collectionId: suppliersRef.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'evaluation_type',
            type: 'select',
            required: true,
            values: ['Inicial (FSGQ 8.4-2)', 'Reavaliação (FSGQ 8.4-2.1)'],
            maxSelect: 1,
          },
          { name: 'evaluation_date', type: 'date', required: true },
          { name: 'evaluator_name', type: 'text', required: true },
          {
            name: 'evaluator_id',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'answers_json', type: 'json' },
          { name: 'total_score', type: 'number', required: true, min: 0, max: 10 },
          {
            name: 'result',
            type: 'select',
            required: true,
            values: ['Aprovado (≥ 6,0)', 'Reprovado (< 6,0)', 'Dispensado por ISO 9001'],
            maxSelect: 1,
          },
          { name: 'incf_recorded', type: 'number', min: 0 },
          { name: 'observations', type: 'text' },
          { name: 'action_plan', type: 'text' },
          { name: 'next_reevaluation_date', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_supeval_supplier ON supplier_evaluations (supplier_id)',
          'CREATE INDEX idx_supeval_company ON supplier_evaluations (company_id)',
          'CREATE INDEX idx_supeval_date ON supplier_evaluations (evaluation_date)',
        ],
      })
      app.save(evaluationsCol)
    }

    // 3. Create purchase_quotes collection (FSGQ 8.4-7 Resumo Coleta de Preço + 3 cotações)
    if (!app.hasTable('purchase_quotes')) {
      const quotesCol = new Collection({
        name: 'purchase_quotes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'quote_number', type: 'text', required: true },
          { name: 'title', type: 'text', required: true },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'os_id',
            type: 'relation',
            required: false,
            collectionId: serviceOrdersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'items_summary', type: 'text' },
          { name: 'proposals_json', type: 'json' },
          { name: 'quote_count', type: 'number', min: 0 },
          { name: 'has_min_three_quotes', type: 'bool' },
          {
            name: 'selected_supplier_id',
            type: 'relation',
            required: false,
            collectionId: suppliersRef.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'selected_supplier_name', type: 'text' },
          { name: 'selected_supplier_is_critical', type: 'bool' },
          { name: 'selected_supplier_is_qualified', type: 'bool' },
          { name: 'exception_justification', type: 'text' },
          { name: 'total_amount', type: 'number', min: 0 },
          { name: 'delivery_expected_date', type: 'date' },
          { name: 'delivery_actual_date', type: 'date' },
          {
            name: 'delivery_status',
            type: 'select',
            values: ['No Prazo', 'Atrasado', 'Pendente'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Em cotação', 'Resumo Aprovado', 'Pedido Emitido', 'Entregue', 'Cancelado'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_pquotes_company ON purchase_quotes (company_id)',
          'CREATE INDEX idx_pquotes_status ON purchase_quotes (status)',
          'CREATE INDEX idx_pquotes_supplier ON purchase_quotes (selected_supplier_id)',
        ],
      })
      app.save(quotesCol)
    }

    // 4. Add 'Suprimentos' to module_permissions select field if needed
    try {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const modField = mpCol.fields.getByName('module')
      if (modField && !modField.values.includes('Suprimentos')) {
        modField.values = [...modField.values, 'Suprimentos']
        app.save(mpCol)
      }
    } catch (e) {
      console.log('Error updating module_permissions field:', e)
    }
  },
  (app) => {
    if (app.hasTable('purchase_quotes')) {
      app.delete(app.findCollectionByNameOrId('purchase_quotes'))
    }
    if (app.hasTable('supplier_evaluations')) {
      app.delete(app.findCollectionByNameOrId('supplier_evaluations'))
    }
    if (app.hasTable('suppliers')) {
      app.delete(app.findCollectionByNameOrId('suppliers'))
    }
  },
)
