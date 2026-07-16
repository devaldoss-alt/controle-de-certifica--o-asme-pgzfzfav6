migrate(
  (app) => {
    var soCol = new Collection({
      name: 'service_orders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'client', type: 'text', required: true },
        { name: 'equipment', type: 'text', required: true },
        { name: 'standard', type: 'text', required: true },
        { name: 'deadline', type: 'date' },
        { name: 'status', type: 'select', values: ['Active', 'Completed', 'Paused'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_service_orders_number ON service_orders (number)'],
    })
    app.save(soCol)

    var soId = app.findCollectionByNameOrId('service_orders').id

    var checkCol = app.findCollectionByNameOrId('checklists')
    if (!checkCol.fields.getByName('os_id')) {
      checkCol.fields.add(new RelationField({ name: 'os_id', collectionId: soId, maxSelect: 1 }))
    }
    if (!checkCol.fields.getByName('evidence_file')) {
      checkCol.fields.add(
        new FileField({
          name: 'evidence_file',
          maxSelect: 5,
          maxSize: 52428800,
          mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        }),
      )
    }
    if (!checkCol.fields.getByName('evidence_notes')) {
      checkCol.fields.add(new TextField({ name: 'evidence_notes' }))
    }
    if (!checkCol.fields.getByName('category')) {
      checkCol.fields.add(
        new SelectField({
          name: 'category',
          values: ['Departmental', 'OS', 'ISO 9001'],
          maxSelect: 1,
        }),
      )
    }
    app.save(checkCol)

    var docCol = new Collection({
      name: 'documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text' },
        { name: 'file_path', type: 'text' },
        { name: 'os_id', type: 'relation', collectionId: soId, maxSelect: 1 },
        {
          name: 'file',
          type: 'file',
          maxSelect: 10,
          maxSize: 52428800,
          mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        },
        { name: 'category', type: 'select', values: ['ISO', 'ASME'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docCol)

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('plan')) {
      usersCol.fields.add(
        new SelectField({ name: 'plan', values: ['Free', 'Pro', 'Gold'], maxSelect: 1 }),
      )
    }
    app.save(usersCol)

    var soCollection = app.findCollectionByNameOrId('service_orders')
    var seedOrders = [
      {
        number: 'OS-2024-001',
        client: 'Petrobras S.A.',
        equipment: 'Vaso de Pressao VP-001',
        standard: 'ASME Section VIII',
        deadline: '2026-12-31',
        status: 'Active',
      },
      {
        number: 'OS-2024-002',
        client: 'Vale S.A.',
        equipment: 'Caldeira de Recuperacao',
        standard: 'NBIC',
        deadline: '2026-10-15',
        status: 'Active',
      },
      {
        number: 'OS-2024-003',
        client: 'Braskem',
        equipment: 'Torre de Destilacao',
        standard: 'ISO 9001',
        deadline: '2026-09-30',
        status: 'Paused',
      },
    ]
    var soIds = {}
    for (var i = 0; i < seedOrders.length; i++) {
      var so = seedOrders[i]
      try {
        var existingSO = app.findFirstRecordByData('service_orders', 'number', so.number)
        soIds[so.number] = existingSO.id
      } catch (_) {
        var rec = new Record(soCollection)
        rec.set('number', so.number)
        rec.set('client', so.client)
        rec.set('equipment', so.equipment)
        rec.set('standard', so.standard)
        rec.set('deadline', so.deadline)
        rec.set('status', so.status)
        app.save(rec)
        soIds[so.number] = rec.id
      }
    }

    var docCollection = app.findCollectionByNameOrId('documents')
    var seedDocs = [
      {
        title: 'Procedimento de Soldagem ASME Section IX',
        content:
          '<h1>Procedimento de Soldagem</h1><p>Este documento descreve os procedimentos de soldagem conforme ASME Section IX.</p><h2>Escopo</h2><p>Aplicavel a todas as soldagens executadas em vasos de pressao.</p>',
        category: 'ASME',
        file_path: '\\\\rede-psc\\procedimentos\\soldagem\\WPS-001.pdf',
      },
      {
        title: 'Manual da Qualidade ISO 9001:2015',
        content:
          '<h1>Manual da Qualidade</h1><p>Sistema de Gestao da Qualidade conforme ABNT NBR ISO 9001:2015.</p><h2>Escopo</h2><p>Este manual descreve o SGQ da PSC Industria.</p>',
        category: 'ISO',
        file_path: '\\\\rede-psc\\qualidade\\manual\\MQ-001.pdf',
      },
    ]
    for (var j = 0; j < seedDocs.length; j++) {
      var d = seedDocs[j]
      try {
        app.findFirstRecordByData('documents', 'title', d.title)
      } catch (_) {
        var drec = new Record(docCollection)
        drec.set('title', d.title)
        drec.set('content', d.content)
        drec.set('category', d.category)
        drec.set('file_path', d.file_path)
        app.save(drec)
      }
    }

    var existingChecklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 200, 0)
    for (var k = 0; k < existingChecklists.length; k++) {
      var cl = existingChecklists[k]
      if (!cl.getString('category')) {
        cl.set('category', 'Departmental')
        app.save(cl)
      }
    }

    var checkCollection = app.findCollectionByNameOrId('checklists')
    var osChecklists = [
      {
        title: 'Inspecao de soldagem VP-001 conforme WPS',
        role: 'Inspector',
        ref: 'Seção 6.2',
        critical: true,
        dueDays: 15,
        osNumber: 'OS-2024-001',
        category: 'OS',
      },
      {
        title: 'Relatorio de END - Caldeira de Recuperacao',
        role: 'NDE',
        ref: 'Seção 9.4',
        critical: false,
        dueDays: 10,
        osNumber: 'OS-2024-002',
        category: 'OS',
      },
      {
        title: 'Auditoria interna ISO 9001 - Controle de documentos',
        role: 'QCC',
        ref: 'ISO 9001 Cl. 7.5',
        critical: true,
        dueDays: 30,
        osNumber: null,
        category: 'ISO 9001',
      },
      {
        title: 'Revisao do Sistema de Gestao da Qualidade',
        role: 'Director',
        ref: 'ISO 9001 Cl. 9.3',
        critical: true,
        dueDays: 45,
        osNumber: null,
        category: 'ISO 9001',
      },
      {
        title: 'Controle de registros da qualidade ISO 9001',
        role: 'QCC',
        ref: 'ISO 9001 Cl. 7.5.3',
        critical: false,
        dueDays: 20,
        osNumber: null,
        category: 'ISO 9001',
      },
    ]
    for (var n = 0; n < osChecklists.length; n++) {
      var item = osChecklists[n]
      try {
        app.findFirstRecordByData('checklists', 'title', item.title)
      } catch (_) {
        var dueDate = new Date(Date.now() + item.dueDays * 24 * 60 * 60 * 1000)
        var clRec = new Record(checkCollection)
        clRec.set('title', item.title)
        clRec.set('role_assigned', item.role)
        clRec.set('mcq_ref', item.ref)
        clRec.set('status', 'pending')
        clRec.set('is_critical', item.critical)
        clRec.set('due_date', dueDate.toISOString().replace('T', ' '))
        clRec.set('category', item.category)
        if (item.osNumber && soIds[item.osNumber]) {
          clRec.set('os_id', soIds[item.osNumber])
        }
        app.save(clRec)
      }
    }

    var existingUsers = app.findRecordsByFilter('users', "id != ''", 'created', 200, 0)
    for (var m = 0; m < existingUsers.length; m++) {
      var u = existingUsers[m]
      if (!u.getString('plan')) {
        u.set('plan', 'Pro')
        app.save(u)
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('service_orders'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('documents'))
    } catch (_) {}
    var checkCol = app.findCollectionByNameOrId('checklists')
    try {
      checkCol.fields.removeByName('os_id')
    } catch (_) {}
    try {
      checkCol.fields.removeByName('evidence_file')
    } catch (_) {}
    try {
      checkCol.fields.removeByName('evidence_notes')
    } catch (_) {}
    try {
      checkCol.fields.removeByName('category')
    } catch (_) {}
    app.save(checkCol)
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      usersCol.fields.removeByName('plan')
    } catch (_) {}
    app.save(usersCol)
  },
)
