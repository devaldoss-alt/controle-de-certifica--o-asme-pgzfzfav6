// Migration 0096 — Seed/Configure the 5 real users for PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA
// Users:
// 1. devaldoss@gmail.com (Devaldo / Consultor Teste) — Role 'Manager' (Full manager access, linked to PSC)
// 2. roberta.junqueira@proserco.com.br (Roberta Junqueira) — Gestora da Qualidade, Role 'Manager'
// 3. murilo.franco@proserco.com.br (Murilo Franco) — Coordenador de Fábrica, Role 'Apontador'
// 4. geraldo.timoteo@proserco.com.br (Geraldo Timóteo) — Coordenador do Controle de Qualidade, Role 'QCC' (Quality analyst/coordinator)
// 5. dainara.jesus@proserco.com.br (Dainara Jesus Fonseca) — Auxiliar Administrativo SGQ, Role 'Apontador'

migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var allocCol = app.findCollectionByNameOrId('user_allocations')

    // 1. Locate PSC company
    var pscCompany = null
    try {
      pscCompany = app.findFirstRecordByData(
        'companies',
        'name',
        'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA',
      )
    } catch (_) {
      try {
        var pscMatches = app.findRecordsByFilter('companies', "name ~ 'PSC'", '', 1, 0)
        if (pscMatches && pscMatches.length > 0) {
          pscCompany = pscMatches[0]
        }
      } catch (_) {}
    }

    if (!pscCompany) {
      console.log('Migration 0096 ERROR: PSC company not found!')
      return
    }

    var pscId = pscCompany.id
    console.log('Migration 0096: PSC Company ID is ' + pscId)

    // Helper to ensure allocation to PSC
    function ensureAllocation(userId) {
      try {
        var existingAllocs = app.findRecordsByFilter(
          'user_allocations',
          "user_id = '" + userId + "' && company_id = '" + pscId + "'",
          '',
          1,
          0,
        )
        if (!existingAllocs || existingAllocs.length === 0) {
          var alloc = new Record(allocCol)
          alloc.set('user_id', userId)
          alloc.set('company_id', pscId)
          app.save(alloc)
          console.log('Created PSC allocation for user ID:', userId)
        }
      } catch (e) {
        console.log('Error creating PSC allocation for user ID ' + userId + ':', e)
      }
    }

    // List of users to configure / create
    var userConfigs = [
      {
        email: 'devaldoss@gmail.com',
        name: 'Devaldo',
        role: 'Manager',
        initialPassword: 'Skip@Pass',
        isExistingConsultant: true,
      },
      {
        email: 'roberta.junqueira@proserco.com.br',
        name: 'Roberta Junqueira',
        role: 'Manager',
        initialPassword: 'Skip@Pass',
        department: 'SGQ',
        jobTitle: 'Gestora da Qualidade / Analista de Gestão da Qualidade',
      },
      {
        email: 'murilo.franco@proserco.com.br',
        name: 'Murilo Franco',
        role: 'Apontador',
        initialPassword: 'Skip@Pass',
        department: 'FÁBRICA',
        jobTitle: 'Coordenador de Fábrica',
      },
      {
        email: 'geraldo.timoteo@proserco.com.br',
        name: 'Geraldo Timóteo',
        role: 'QCC',
        initialPassword: 'Skip@Pass',
        department: 'CQ',
        jobTitle: 'Coordenador do Controle de Qualidade',
      },
      {
        email: 'dainara.jesus@proserco.com.br',
        name: 'Dainara Jesus Fonseca',
        role: 'Apontador',
        initialPassword: 'Skip@Pass',
        department: 'SGQ',
        jobTitle: 'Auxiliar Administrativo',
      },
    ]

    for (var i = 0; i < userConfigs.length; i++) {
      var cfg = userConfigs[i]
      var userRecord = null

      try {
        userRecord = app.findAuthRecordByEmail('_pb_users_auth_', cfg.email)
        console.log('User already exists: ' + cfg.email)
      } catch (_) {
        // Does not exist, create new
        userRecord = new Record(usersCol)
        userRecord.setEmail(cfg.email)
        userRecord.setPassword(cfg.initialPassword)
        userRecord.setVerified(true)
        console.log('Creating new user: ' + cfg.email)
      }

      // Ensure name and role
      if (cfg.email === 'devaldoss@gmail.com') {
        // Keep name or update if empty
        if (!userRecord.getString('name')) {
          userRecord.set('name', cfg.name)
        }
      } else {
        userRecord.set('name', cfg.name)
      }

      userRecord.set('role', cfg.role)

      // Ensure primary company is PSC if not set
      if (!userRecord.getString('primary_company_id')) {
        userRecord.set('primary_company_id', pscId)
      }

      // Plan default Pro
      if (!userRecord.getString('plan')) {
        userRecord.set('plan', 'Pro')
      }

      app.save(userRecord)
      console.log('Saved user record for ' + cfg.email + ' (ID: ' + userRecord.id + ')')

      // Ensure user allocation to PSC
      ensureAllocation(userRecord.id)
    }

    // Also update team records in PSC for collaborators so their job roles / department match
    if (app.hasTable('team')) {
      try {
        // Roberta Junqueira
        var robertaTeam = app.findRecordsByFilter(
          'team',
          "company_id = '" + pscId + "' && name ~ 'ROBERTA'",
          '',
          1,
          0,
        )
        if (robertaTeam && robertaTeam.length > 0) {
          robertaTeam[0].set('department', 'SGQ')
          robertaTeam[0].set('role', 'Gestora da Qualidade / Analista de Gestão da Qualidade')
          app.save(robertaTeam[0])
        }

        // Murilo Franco
        var muriloTeam = app.findRecordsByFilter(
          'team',
          "company_id = '" + pscId + "' && name ~ 'MURILO'",
          '',
          1,
          0,
        )
        if (muriloTeam && muriloTeam.length > 0) {
          muriloTeam[0].set('department', 'FÁBRICA')
          muriloTeam[0].set('role', 'Coordenador de Fábrica')
          muriloTeam[0].set('is_indicator', true)
          app.save(muriloTeam[0])
        }

        // Geraldo Timoteo (link to PSC company if it was unlinked during test companies cleanup)
        var geraldoTeam = app.findRecordsByFilter('team', "name ~ 'GERALDO'", '', 5, 0)
        if (geraldoTeam && geraldoTeam.length > 0) {
          for (var gt = 0; gt < geraldoTeam.length; gt++) {
            if (!geraldoTeam[gt].getString('company_id')) {
              geraldoTeam[gt].set('company_id', pscId)
            }
            if (geraldoTeam[gt].getString('company_id') === pscId) {
              geraldoTeam[gt].set('department', 'CQ')
              geraldoTeam[gt].set('role', 'Coordenador do Controle de Qualidade')
              app.save(geraldoTeam[gt])
            }
          }
        }

        // Dainara Jesus (link to PSC company if it was unlinked)
        var dainaraTeam = app.findRecordsByFilter('team', "name ~ 'DAINARA'", '', 5, 0)
        if (dainaraTeam && dainaraTeam.length > 0) {
          for (var dt = 0; dt < dainaraTeam.length; dt++) {
            if (!dainaraTeam[dt].getString('company_id')) {
              dainaraTeam[dt].set('company_id', pscId)
            }
            if (dainaraTeam[dt].getString('company_id') === pscId) {
              dainaraTeam[dt].set('department', 'SGQ')
              dainaraTeam[dt].set('role', 'Auxiliar Administrativo')
              app.save(dainaraTeam[dt])
            }
          }
        }
      } catch (teamErr) {
        console.log('Non-critical notice: team table update error:', teamErr)
      }
    }

    console.log('Migration 0096 completed successfully.')
  },
  (app) => {
    // Revert logic: delete only the 4 new users created by this migration
    var toDeleteEmails = [
      'roberta.junqueira@proserco.com.br',
      'murilo.franco@proserco.com.br',
      'geraldo.timoteo@proserco.com.br',
      'dainara.jesus@proserco.com.br',
    ]

    for (var i = 0; i < toDeleteEmails.length; i++) {
      try {
        var user = app.findAuthRecordByEmail('_pb_users_auth_', toDeleteEmails[i])
        if (user) {
          try {
            app
              .db()
              .newQuery("DELETE FROM user_allocations WHERE user_id = '" + user.id + "'")
              .execute()
          } catch (_) {}
          app.delete(user)
        }
      } catch (_) {}
    }
  },
)
