migrate(
  (app) => {
    const companies = new Collection({
      name: 'companies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'tax_id', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'iso_certs', type: 'text' },
        { name: 'asme_certs', type: 'text' },
        { name: 'nbic_certs', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(companies)

    const companiesId = app.findCollectionByNameOrId('companies').id

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('primary_company_id')) {
      usersCol.fields.add(
        new RelationField({ name: 'primary_company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(usersCol)

    const allocations = new Collection({
      name: 'user_allocations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
        },
        {
          name: 'company_id',
          type: 'relation',
          collectionId: companiesId,
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(allocations)

    const soCol = app.findCollectionByNameOrId('service_orders')
    if (!soCol.fields.getByName('owner_company_id')) {
      soCol.fields.add(
        new RelationField({ name: 'owner_company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(soCol)

    const checkCol = app.findCollectionByNameOrId('checklists')
    if (!checkCol.fields.getByName('company_id')) {
      checkCol.fields.add(
        new RelationField({ name: 'company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(checkCol)

    const docCol = app.findCollectionByNameOrId('documents')
    if (!docCol.fields.getByName('company_id')) {
      docCol.fields.add(
        new RelationField({ name: 'company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(docCol)

    const companyCollection = app.findCollectionByNameOrId('companies')
    const seedCompanies = [
      { name: 'PSC Industria', tax_id: '12.345.678/0001-90' },
      { name: 'KOALA Engenharia', tax_id: '23.456.789/0001-01' },
      { name: 'GENTI Servicos', tax_id: '34.567.890/0001-12' },
    ]
    const companyIds = {}
    for (let i = 0; i < seedCompanies.length; i++) {
      const c = seedCompanies[i]
      try {
        const existing = app.findFirstRecordByData('companies', 'name', c.name)
        companyIds[c.name] = existing.id
      } catch (_) {
        const rec = new Record(companyCollection)
        rec.set('name', c.name)
        rec.set('tax_id', c.tax_id)
        app.save(rec)
        companyIds[c.name] = rec.id
      }
    }

    const existingUsers = app.findRecordsByFilter('users', "id != ''", 'created', 200, 0)
    for (let j = 0; j < existingUsers.length; j++) {
      const u = existingUsers[j]
      if (!u.getString('primary_company_id')) {
        u.set('primary_company_id', companyIds['PSC Industria'])
        app.save(u)
      }
    }

    const existingOrders = app.findRecordsByFilter('service_orders', "id != ''", 'created', 200, 0)
    for (let k = 0; k < existingOrders.length; k++) {
      const so = existingOrders[k]
      if (!so.getString('owner_company_id')) {
        so.set('owner_company_id', companyIds['PSC Industria'])
        app.save(so)
      }
    }

    const existingChecklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 200, 0)
    for (let m = 0; m < existingChecklists.length; m++) {
      const cl = existingChecklists[m]
      if (!cl.getString('company_id')) {
        cl.set('company_id', companyIds['PSC Industria'])
        app.save(cl)
      }
    }

    const existingDocs = app.findRecordsByFilter('documents', "id != ''", 'created', 200, 0)
    for (let n = 0; n < existingDocs.length; n++) {
      const d = existingDocs[n]
      if (!d.getString('company_id')) {
        d.set('company_id', companyIds['PSC Industria'])
        app.save(d)
      }
    }

    const allocCollection = app.findCollectionByNameOrId('user_allocations')
    for (let p = 0; p < existingUsers.length; p++) {
      const usr = existingUsers[p]
      try {
        app.findFirstRecordByData('user_allocations', 'user_id', usr.id)
      } catch (_) {
        const allocRec = new Record(allocCollection)
        allocRec.set('user_id', usr.id)
        allocRec.set('company_id', companyIds['PSC Industria'])
        app.save(allocRec)
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('user_allocations'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('companies'))
    } catch (_) {}
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      usersCol.fields.removeByName('primary_company_id')
    } catch (_) {}
    app.save(usersCol)
    const soCol = app.findCollectionByNameOrId('service_orders')
    try {
      soCol.fields.removeByName('owner_company_id')
    } catch (_) {}
    app.save(soCol)
    const checkCol = app.findCollectionByNameOrId('checklists')
    try {
      checkCol.fields.removeByName('company_id')
    } catch (_) {}
    app.save(checkCol)
    const docCol = app.findCollectionByNameOrId('documents')
    try {
      docCol.fields.removeByName('company_id')
    } catch (_) {}
    app.save(docCol)
  },
)
