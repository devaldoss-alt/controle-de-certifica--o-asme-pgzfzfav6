migrate(
  (app) => {
    // 1. Update users collection role select values to include "Consultor"
    const usersCol = app.findCollectionByNameOrId('users')
    const userRoleField = usersCol.fields.getByName('role')
    if (userRoleField) {
      const currentValues = userRoleField.values || []
      if (!currentValues.includes('Consultor')) {
        userRoleField.values = [...currentValues, 'Consultor']
        userRoleField.maxSelect = userRoleField.values.length
        app.save(usersCol)
      }
    }

    // Also check checklists role_assigned field
    const checklistsCol = app.findCollectionByNameOrId('checklists')
    const chkRoleField = checklistsCol.fields.getByName('role_assigned')
    if (chkRoleField) {
      const chkValues = chkRoleField.values || []
      if (!chkValues.includes('Consultor')) {
        chkRoleField.values = [...chkValues, 'Consultor']
        chkRoleField.maxSelect = chkRoleField.values.length
        app.save(checklistsCol)
      }
    }

    // Also check document_access role field
    const docAccessCol = app.findCollectionByNameOrId('document_access')
    const docRoleField = docAccessCol.fields.getByName('role')
    if (docRoleField) {
      const docValues = docRoleField.values || []
      if (!docValues.includes('Consultor')) {
        docRoleField.values = [...docValues, 'Consultor']
        docRoleField.maxSelect = docRoleField.values.length
        app.save(docAccessCol)
      }
    }

    // 2. Create packing_slips collection (Romaneios)
    const usersColId = '_pb_users_auth_'
    const companiesColId = app.findCollectionByNameOrId('companies').id
    const serviceOrdersColId = app.findCollectionByNameOrId('service_orders').id

    if (!app.hasTable('packing_slips')) {
      const packingSlips = new Collection({
        name: 'packing_slips',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'number', type: 'number', required: true },
          { name: 'issue_date', type: 'date', required: true },
          {
            name: 'type',
            type: 'select',
            values: ['Entrada', 'Saída', 'Cancelamento'],
            maxSelect: 1,
            required: true,
          },
          { name: 'recipient_origin', type: 'text' },
          { name: 'origin_location', type: 'text' },
          { name: 'destination_location', type: 'text' },
          { name: 'delivery_responsible', type: 'text' },
          { name: 'responsible_id', type: 'relation', collectionId: usersColId, maxSelect: 1 },
          { name: 'os_id', type: 'relation', collectionId: serviceOrdersColId, maxSelect: 1 },
          { name: 'oc_number', type: 'text' },
          { name: 'nfe_number', type: 'text' },
          { name: 'doc_non_official', type: 'text' },
          { name: 'cm_number', type: 'text' },
          { name: 'contact_phone', type: 'text' },
          { name: 'warehouse_responsible', type: 'text' },
          { name: 'cq_pcp_responsible', type: 'text' },
          { name: 'sector', type: 'text' },
          { name: 'requester', type: 'text' },
          { name: 'in_charge', type: 'text' },
          { name: 'items', type: 'json' },
          { name: 'grv_info', type: 'json' },
          {
            name: 'status',
            type: 'select',
            values: ['Draft', 'Finalized', 'Cancelled'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'company_id',
            type: 'relation',
            collectionId: companiesColId,
            maxSelect: 1,
            required: true,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(packingSlips)
    }

    // 3. Create module_permissions collection for centralized RBAC permissions matrix
    if (!app.hasTable('module_permissions')) {
      const modulePerms = new Collection({
        name: 'module_permissions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'role', type: 'text', required: true },
          {
            name: 'module',
            type: 'select',
            values: ['Documentos', 'Romaneios', 'Checklists', 'Indicadores'],
            maxSelect: 1,
            required: true,
          },
          { name: 'can_view', type: 'bool' },
          { name: 'can_create', type: 'bool' },
          { name: 'can_edit', type: 'bool' },
          { name: 'can_delete', type: 'bool' },
          { name: 'company_id', type: 'relation', collectionId: companiesColId, maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(modulePerms)
    }
  },
  (app) => {
    if (app.hasTable('module_permissions')) {
      app.delete(app.findCollectionByNameOrId('module_permissions'))
    }
    if (app.hasTable('packing_slips')) {
      app.delete(app.findCollectionByNameOrId('packing_slips'))
    }
  },
)
