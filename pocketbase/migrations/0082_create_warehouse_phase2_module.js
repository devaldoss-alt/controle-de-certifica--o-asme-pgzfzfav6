migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const serviceOrdersCol = app.findCollectionByNameOrId('service_orders')
    const inventoryItemsCol = app.findCollectionByNameOrId('inventory_items')
    const teamCol = app.findCollectionByNameOrId('team')

    // 1. Create material_requisitions collection
    if (!app.hasTable('material_requisitions')) {
      const requisitionsCollection = new Collection({
        name: 'material_requisitions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'item_id',
            type: 'relation',
            required: true,
            collectionId: inventoryItemsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'quantity', type: 'number', required: true, min: 0.001 },
          {
            name: 'os_id',
            type: 'relation',
            required: false,
            collectionId: serviceOrdersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'requester_id',
            type: 'relation',
            required: false,
            collectionId: teamCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'requester_name', type: 'text', required: true },
          { name: 'requester_role', type: 'text' },
          { name: 'requester_company', type: 'text' },
          { name: 'tool_equipment', type: 'text' },
          { name: 'requisition_date', type: 'date' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'em_separacao', 'retirado', 'cancelado'],
            maxSelect: 1,
          },
          {
            name: 'separated_by',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'separated_by_name', type: 'text' },
          { name: 'confirmation_date', type: 'date' },
          { name: 'cancel_reason', type: 'text' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_matreq_company ON material_requisitions (company_id)',
          'CREATE INDEX idx_matreq_item ON material_requisitions (item_id)',
          'CREATE INDEX idx_matreq_status ON material_requisitions (status)',
          'CREATE INDEX idx_matreq_os ON material_requisitions (os_id)',
          'CREATE INDEX idx_matreq_created ON material_requisitions (created)',
        ],
      })
      app.save(requisitionsCollection)
    }

    // 2. Create purchase_requests collection
    if (!app.hasTable('purchase_requests')) {
      const purchasesCollection = new Collection({
        name: 'purchase_requests',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'item_description', type: 'text', required: true },
          {
            name: 'item_id',
            type: 'relation',
            required: false,
            collectionId: inventoryItemsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'quantity', type: 'number', required: true, min: 0.001 },
          { name: 'unit', type: 'text' },
          {
            name: 'os_id',
            type: 'relation',
            required: false,
            collectionId: serviceOrdersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'requester_id',
            type: 'relation',
            required: false,
            collectionId: teamCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'requester_name', type: 'text', required: true },
          { name: 'requester_role', type: 'text' },
          { name: 'requester_company', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'cotado', 'comprado', 'recebido', 'cancelado'],
            maxSelect: 1,
          },
          { name: 'supplier', type: 'text' },
          { name: 'estimated_unit_price', type: 'number', min: 0 },
          { name: 'received_date', type: 'date' },
          {
            name: 'received_by',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'received_by_name', type: 'text' },
          { name: 'cancel_reason', type: 'text' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_purreq_company ON purchase_requests (company_id)',
          'CREATE INDEX idx_purreq_status ON purchase_requests (status)',
          'CREATE INDEX idx_purreq_os ON purchase_requests (os_id)',
          'CREATE INDEX idx_purreq_created ON purchase_requests (created)',
        ],
      })
      app.save(purchasesCollection)
    }

    // 3. Seed Indicators for the 3 companies (PSC, KOALA, GENTI)
    try {
      const indCol = app.findCollectionByNameOrId('indicators')
      const PSC_ID = 'a631bv695rr4gef'
      const KOALA_ID = 'i7kjauu378swxg6'
      const GENTI_ID = 'zt57khfow39nwa1'
      const compIds = [PSC_ID, KOALA_ID, GENTI_ID]

      let defaultUserId = 'uvq0hmn01q0faro'
      try {
        const u = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
        defaultUserId = u.id
      } catch (_) {}

      const warehouseIndicators = [
        {
          title: 'Taxa de Atendimento do Almoxarifado',
          objective: 'Mapear e assegurar a eficiência de atendimento das requisições de materiais',
          formula_description: '(Pedidos atendidos ÷ Pedidos totais) × 100',
          target_value: 90,
          current_value: 100,
          unit: '%',
          period: 'Monthly',
          result_type: 'Percentual',
          verification_method:
            'Relatório mensal de requisições de retirada atendidas x pendentes/canceladas',
          target_operator: '≥',
        },
        {
          title: 'Itens em Ruptura',
          objective:
            'Monitorar a ocorrência de itens em falta física (saldo zero ou abaixo do estoque mínimo)',
          formula_description: 'Contagem de itens com saldo zero ou abaixo do mínimo',
          target_value: 0,
          current_value: 0,
          unit: 'Itens',
          period: 'Monthly',
          result_type: 'Numérico',
          verification_method:
            'Varredura automática diária/mensal do catálogo de estoque por empresa',
          target_operator: '=',
        },
        {
          title: 'Valor Consumido por OS/Mês',
          objective:
            'Acompanhar o custo total de materiais retirados e alocados por OS mensalmente',
          formula_description: 'Soma dos valores monetários das retiradas por OS/mês',
          target_value: 0,
          current_value: 0,
          unit: 'R$',
          period: 'Monthly',
          result_type: 'Numérico',
          verification_method:
            'Soma das retiradas confirmadas vinculadas às Ordens de Serviço no mês',
          target_operator: '≥',
        },
      ]

      compIds.forEach((cId) => {
        warehouseIndicators.forEach((ind) => {
          let exists = false
          try {
            const found = app.findRecordsByFilter(
              'indicators',
              'company_id = {:companyId} && title = {:title}',
              'created',
              1,
              0,
              { companyId: cId, title: ind.title },
            )
            if (found && found.length > 0) exists = true
          } catch (_) {}

          if (!exists) {
            const rec = new Record(indCol)
            rec.set('title', ind.title)
            rec.set('objective', ind.objective)
            rec.set('formula_description', ind.formula_description)
            rec.set('target_value', ind.target_value)
            rec.set('current_value', ind.current_value)
            rec.set('unit', ind.unit)
            rec.set('period', ind.period)
            rec.set('result_type', ind.result_type)
            rec.set('verification_method', ind.verification_method)
            rec.set('target_operator', ind.target_operator)
            rec.set('responsible', defaultUserId)
            rec.set('company_id', cId)
            app.save(rec)
          }
        })
      })
    } catch (e) {
      console.log('Error seeding warehouse indicators:', e)
    }
  },
  (app) => {
    if (app.hasTable('purchase_requests')) {
      app.delete(app.findCollectionByNameOrId('purchase_requests'))
    }
    if (app.hasTable('material_requisitions')) {
      app.delete(app.findCollectionByNameOrId('material_requisitions'))
    }
  },
)
