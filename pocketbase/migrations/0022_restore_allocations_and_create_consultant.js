migrate(
  (app) => {
    // 1. Get all existing companies
    var companies = []
    try {
      companies = app.findRecordsByFilter('companies', "id != ''", 'created', 200, 0)
    } catch (_) {}

    if (companies.length === 0) return

    // Build a map of company ids
    var companyIds = []
    for (var i = 0; i < companies.length; i++) {
      companyIds.push(companies[i].id)
    }

    // 2. Ensure devaldoss@gmail.com has allocations to all companies
    var mainUser = null
    try {
      mainUser = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
    } catch (_) {}

    if (mainUser) {
      // Set primary_company_id if missing
      if (!mainUser.getString('primary_company_id') && companyIds.length > 0) {
        mainUser.set('primary_company_id', companyIds[0])
        app.save(mainUser)
      }

      var allocCol = app.findCollectionByNameOrId('user_allocations')

      for (var j = 0; j < companyIds.length; j++) {
        var cid = companyIds[j]
        var existing = null
        try {
          existing = app.findFirstRecordByData('user_allocations', 'user_id', mainUser.id)
        } catch (_) {}

        // Check if allocation to this specific company already exists
        var alreadyLinked = false
        if (existing) {
          // findFirstRecordByData returns only the first match; check all
          try {
            var allAllocs = app.findRecordsByFilter(
              'user_allocations',
              "user_id = '" + mainUser.id + "'",
              'created',
              200,
              0,
            )
            for (var k = 0; k < allAllocs.length; k++) {
              if (allAllocs[k].getString('company_id') === cid) {
                alreadyLinked = true
                break
              }
            }
          } catch (_) {}
        }

        if (!alreadyLinked) {
          var allocRec = new Record(allocCol)
          allocRec.set('user_id', mainUser.id)
          allocRec.set('company_id', cid)
          app.save(allocRec)
        }
      }
    }

    // 3. Create consultant test user
    var consultant = null
    try {
      consultant = app.findAuthRecordByEmail('_pb_users_auth_', 'consultor.teste@qualihub.com')
    } catch (_) {
      var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      consultant = new Record(usersCol)
      consultant.setEmail('consultor.teste@qualihub.com')
      consultant.setPassword('Skip@Pass')
      consultant.setVerified(true)
    }
    consultant.set('name', 'Consultor Teste')
    consultant.set('role', 'Manager')

    // Set primary_company_id to Koala Engenharia if possible, else first company
    var koalaId = ''
    for (var m = 0; m < companies.length; m++) {
      var cname = companies[m].getString('name').toLowerCase()
      var cnameEn = companies[m].getString('name_en').toLowerCase()
      if (cname.indexOf('koala') !== -1 || cnameEn.indexOf('koala') !== -1) {
        koalaId = companies[m].id
        break
      }
    }
    if (!koalaId) {
      koalaId = companyIds[0]
    }
    consultant.set('primary_company_id', koalaId)
    app.save(consultant)

    // 4. Create allocations for consultant to all companies
    var allocCol2 = app.findCollectionByNameOrId('user_allocations')
    for (var n = 0; n < companyIds.length; n++) {
      var cid2 = companyIds[n]
      var alreadyLinked2 = false
      try {
        var allAllocs2 = app.findRecordsByFilter(
          'user_allocations',
          "user_id = '" + consultant.id + "'",
          'created',
          200,
          0,
        )
        for (var p = 0; p < allAllocs2.length; p++) {
          if (allAllocs2[p].getString('company_id') === cid2) {
            alreadyLinked2 = true
            break
          }
        }
      } catch (_) {}

      if (!alreadyLinked2) {
        var allocRec2 = new Record(allocCol2)
        allocRec2.set('user_id', consultant.id)
        allocRec2.set('company_id', cid2)
        app.save(allocRec2)
      }
    }
  },
  (app) => {
    // Remove consultant test user and its allocations
    try {
      var consultant = app.findAuthRecordByEmail('_pb_users_auth_', 'consultor.teste@qualihub.com')
      try {
        var allocs = app.findRecordsByFilter(
          'user_allocations',
          "user_id = '" + consultant.id + "'",
          'created',
          200,
          0,
        )
        for (var i = 0; i < allocs.length; i++) {
          app.delete(allocs[i])
        }
      } catch (_) {}
      app.delete(consultant)
    } catch (_) {}
  },
)
