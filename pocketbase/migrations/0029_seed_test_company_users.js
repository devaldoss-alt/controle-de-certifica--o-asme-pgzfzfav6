migrate(
  (app) => {
    var companiesCol = app.findCollectionByNameOrId('companies')
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var allocCol = app.findCollectionByNameOrId('user_allocations')

    var companies = [
      { name: 'Empresa A', tax_id: '' },
      { name: 'Empresa B', tax_id: '' },
    ]

    var companyIds = {}

    for (var i = 0; i < companies.length; i++) {
      var companyName = companies[i].name
      var companyId = ''
      try {
        var existing = app.findFirstRecordByData('companies', 'name', companyName)
        companyId = existing.id
      } catch (_) {
        var rec = new Record(companiesCol)
        rec.set('name', companyName)
        rec.set('tax_id', companies[i].tax_id)
        app.save(rec)
        companyId = rec.id
      }
      companyIds[companyName] = companyId
    }

    var testUsers = [
      {
        email: 'teste_empresa_a@teste.com',
        name: 'Teste Empresa A',
        companyName: 'Empresa A',
      },
      {
        email: 'teste_empresa_b@teste.com',
        name: 'Teste Empresa B',
        companyName: 'Empresa B',
      },
    ]

    for (var j = 0; j < testUsers.length; j++) {
      var t = testUsers[j]
      var user = null
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', t.email)
      } catch (_) {
        user = new Record(usersCol)
        user.setEmail(t.email)
        user.setPassword('Teste@123')
        user.setVerified(true)
      }
      user.set('name', t.name)
      user.set('role', 'Manager')
      user.set('plan', 'Free')
      user.set('primary_company_id', companyIds[t.companyName])
      app.save(user)

      var alreadyAllocated = false
      try {
        var allocs = app.findRecordsByFilter(
          'user_allocations',
          "user_id = '" + user.id + "'",
          'created',
          200,
          0,
        )
        for (var k = 0; k < allocs.length; k++) {
          if (allocs[k].getString('company_id') === companyIds[t.companyName]) {
            alreadyAllocated = true
            break
          }
        }
      } catch (_) {}

      if (!alreadyAllocated) {
        var allocRec = new Record(allocCol)
        allocRec.set('user_id', user.id)
        allocRec.set('company_id', companyIds[t.companyName])
        app.save(allocRec)
      }
    }
  },
  (app) => {
    var testEmails = ['teste_empresa_a@teste.com', 'teste_empresa_b@teste.com']

    for (var i = 0; i < testEmails.length; i++) {
      try {
        var user = app.findAuthRecordByEmail('_pb_users_auth_', testEmails[i])
        try {
          var allocs = app.findRecordsByFilter(
            'user_allocations',
            "user_id = '" + user.id + "'",
            'created',
            200,
            0,
          )
          for (var j = 0; j < allocs.length; j++) {
            app.delete(allocs[j])
          }
        } catch (_) {}
        app.delete(user)
      } catch (_) {}
    }

    var companyNames = ['Empresa A', 'Empresa B']
    for (var k = 0; k < companyNames.length; k++) {
      try {
        var company = app.findFirstRecordByData('companies', 'name', companyNames[k])
        app.delete(company)
      } catch (_) {}
    }
  },
)
