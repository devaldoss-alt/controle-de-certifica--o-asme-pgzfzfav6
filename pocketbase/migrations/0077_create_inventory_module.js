migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const serviceOrdersCol = app.findCollectionByNameOrId('service_orders')

    // 1. Create inventory_items collection
    if (!app.hasTable('inventory_items')) {
      const itemsCollection = new Collection({
        name: 'inventory_items',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'description', type: 'text', required: true },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'category',
            type: 'select',
            required: true,
            values: ['Insumo', 'Consumível', 'Gás-Cilindro', 'Ferramenta', 'Equipamento', 'Outro'],
            maxSelect: 1,
          },
          { name: 'unit', type: 'text', required: true },
          { name: 'unit_price', type: 'number', required: false, min: 0 },
          { name: 'current_stock', type: 'number', required: false },
          { name: 'minimum_stock', type: 'number', required: false, min: 0 },
          {
            name: 'location',
            type: 'select',
            required: false,
            values: ['Almoxarifado', 'Área Externa', 'Oficina', 'Outro'],
            maxSelect: 1,
          },
          {
            name: 'os_id',
            type: 'relation',
            required: false,
            collectionId: serviceOrdersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'requires_cq_inspection', type: 'bool' },
          {
            name: 'inspection_status',
            type: 'select',
            required: false,
            values: ['Aguardando inspeção', 'Liberado', 'Rejeitado', 'Não aplicável'],
            maxSelect: 1,
          },
          { name: 'is_consigned', type: 'bool' },
          { name: 'supplier', type: 'text' },
          { name: 'is_controlled', type: 'bool' },
          { name: 'tracking_code', type: 'text' },
          { name: 'inspected_by', type: 'relation', collectionId: usersCol.id, maxSelect: 1 },
          { name: 'inspected_at', type: 'date' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_inv_company ON inventory_items (company_id)',
          'CREATE INDEX idx_inv_tracking ON inventory_items (tracking_code)',
          'CREATE INDEX idx_inv_inspection ON inventory_items (inspection_status)',
          'CREATE INDEX idx_inv_category ON inventory_items (category)',
        ],
      })
      app.save(itemsCollection)
    }

    // 2. Create stock_movements collection
    const invItemsCol = app.findCollectionByNameOrId('inventory_items')

    if (!app.hasTable('stock_movements')) {
      const movementsCollection = new Collection({
        name: 'stock_movements',
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
            collectionId: invItemsCol.id,
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
            name: 'movement_type',
            type: 'select',
            required: true,
            values: ['Saldo Inicial', 'Entrada', 'Saída', 'Ajuste'],
            maxSelect: 1,
          },
          { name: 'quantity', type: 'number', required: true },
          { name: 'unit_price', type: 'number', required: false, min: 0 },
          {
            name: 'responsible_id',
            type: 'relation',
            collectionId: usersCol.id,
            maxSelect: 1,
          },
          { name: 'responsible_name', type: 'text' },
          {
            name: 'os_id',
            type: 'relation',
            collectionId: serviceOrdersCol.id,
            maxSelect: 1,
          },
          { name: 'movement_date', type: 'date' },
          { name: 'notes', type: 'text' },
          { name: 'balance_after', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_sm_item ON stock_movements (item_id)',
          'CREATE INDEX idx_sm_company ON stock_movements (company_id)',
          'CREATE INDEX idx_sm_date ON stock_movements (movement_date)',
        ],
      })
      app.save(movementsCollection)
    }

    // 3. Update module_permissions select field to include 'Almoxarifado'
    try {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const modField = mpCol.fields.getByName('module')
      if (modField) {
        const cur = modField.values || []
        if (cur.indexOf('Almoxarifado') < 0) {
          cur.push('Almoxarifado')
          modField.values = cur
          modField.maxSelect = cur.length
          app.save(mpCol)
        }
      }
    } catch (e) {
      console.log('Error updating module_permissions field:', e)
    }

    // 4. Seed default module_permissions for Almoxarifado (Manager, QCC, Consultor, Apontador)
    try {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const pscId = 'a631bv695rr4gef'
      const koalaId = 'i7kjauu378swxg6'
      const gentiId = 'zt57khfow39nwa1'
      const companiesList = [pscId, koalaId, gentiId]

      const rolesConfigs = [
        { role: 'Manager', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'QCC', can_view: true, can_create: true, can_edit: true, can_delete: false },
        {
          role: 'Consultor',
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
        },
        { role: 'Apontador', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Supervisor', can_view: true, can_create: true, can_edit: true, can_delete: false },
      ]

      for (let c = 0; c < companiesList.length; c++) {
        const cId = companiesList[c]
        for (let r = 0; r < rolesConfigs.length; r++) {
          const cfg = rolesConfigs[r]
          let exists = false
          try {
            const found = app.findRecordsByFilter(
              'module_permissions',
              "role = '" + cfg.role + "' && module = 'Almoxarifado' && company_id = '" + cId + "'",
              '',
              1,
              0,
            )
            if (found && found.length > 0) exists = true
          } catch (_) {}

          if (!exists) {
            const rec = new Record(mpCol)
            rec.set('role', cfg.role)
            rec.set('module', 'Almoxarifado')
            rec.set('can_view', cfg.can_view)
            rec.set('can_create', cfg.can_create)
            rec.set('can_edit', cfg.can_edit)
            rec.set('can_delete', cfg.can_delete)
            rec.set('company_id', cId)
            app.save(rec)
          }
        }
      }
    } catch (e) {
      console.log('Error seeding Almoxarifado module_permissions:', e)
    }

    // 5. Seed 2-3 clearly marked example items if inventory is empty, strictly for testing/preview validation
    try {
      const invCol = app.findCollectionByNameOrId('inventory_items')
      const smCol = app.findCollectionByNameOrId('stock_movements')
      const count = app.countRecords('inventory_items')

      if (count === 0) {
        const pscId = 'a631bv695rr4gef'
        const samples = [
          {
            description: '[EXEMPLO] Chapa Aço Carbono SA-516 Gr 70 1/2"',
            company_id: pscId,
            category: 'Insumo',
            unit: 'UN',
            unit_price: 1850.0,
            current_stock: 12,
            minimum_stock: 5,
            location: 'Almoxarifado',
            requires_cq_inspection: true,
            inspection_status: 'Liberado',
            is_consigned: false,
            supplier: 'Usiminas',
            is_controlled: false,
            tracking_code: 'PSC-EST-000001',
            notes: 'Item de exemplo para teste da Fase 1.',
          },
          {
            description: '[EXEMPLO] Acetona P.A. 1000ml',
            company_id: pscId,
            category: 'Consumível',
            unit: 'L',
            unit_price: 65.0,
            current_stock: 2,
            minimum_stock: 6,
            location: 'Almoxarifado',
            requires_cq_inspection: false,
            inspection_status: 'Não aplicável',
            is_consigned: false,
            supplier: 'Química do Vale',
            is_controlled: true,
            tracking_code: 'PSC-EST-000002',
            notes: 'Produto controlado - estoque baixo (alerta de mínimo).',
          },
          {
            description: '[EXEMPLO] Cilindro de Argônio 10m³ (Consignado)',
            company_id: pscId,
            category: 'Gás-Cilindro',
            unit: 'UN',
            unit_price: 420.0,
            current_stock: 8,
            minimum_stock: 4,
            location: 'Área Externa',
            requires_cq_inspection: true,
            inspection_status: 'Aguardando inspeção',
            is_consigned: true,
            supplier: 'White Martins',
            is_controlled: false,
            tracking_code: 'PSC-EST-000003',
            notes: 'Aguardando conferência do certificado pelo QCC.',
          },
        ]

        for (let s = 0; s < samples.length; s++) {
          const sample = samples[s]
          const rec = new Record(invCol)
          Object.keys(sample).forEach((k) => rec.set(k, sample[k]))
          app.save(rec)

          // Initial movement
          const mRec = new Record(smCol)
          mRec.set('item_id', rec.id)
          mRec.set('company_id', rec.getString('company_id'))
          mRec.set('movement_type', 'Saldo Inicial')
          mRec.set('quantity', sample.current_stock)
          mRec.set('unit_price', sample.unit_price)
          mRec.set('responsible_name', 'Sistema (Carga Inicial)')
          mRec.set('movement_date', new Date().toISOString())
          mRec.set('notes', 'Saldo inicial de exemplo')
          mRec.set('balance_after', sample.current_stock)
          app.save(mRec)
        }
      }
    } catch (e) {
      console.log('Error seeding sample inventory:', e)
    }
  },
  (app) => {
    if (app.hasTable('stock_movements')) {
      app.delete(app.findCollectionByNameOrId('stock_movements'))
    }
    if (app.hasTable('inventory_items')) {
      app.delete(app.findCollectionByNameOrId('inventory_items'))
    }
  },
)
