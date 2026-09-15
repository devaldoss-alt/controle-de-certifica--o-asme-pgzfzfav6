// Migration 0097 — Import/Update Team Collaborators & Users Configuration
// 1. Adds `disabled` (bool) field to users collection (for deactivating login access without deleting records).
// 2. Adds `is_active` (bool) field to team collection (for marking active vs afastado/inativo collaborators).
// 3. Re-assigns Geraldo Timóteo and Dainara Jesus Fonseca login users to GENTI (primary_company_id and user_allocations).
//    Murilo Franco remains PSC / Fábrica.
// 4. Imports/synchronizes all collaborators across companies (PSC, GENTI, KS) and departments (CQ, SOLDA, CALDEIRARIA, etc.),
//    setting role to empty ("") for new ones (or preserving existing), and setting is_active = false for afastados (Cidiclei, Washington).
// 5. Idempotent: checks by normalized name + company before creating.

migrate(
  (app) => {
    var db = app.db()

    // -------------------------------------------------------------
    // Step 1: Add `disabled` field to `users` collection if not present
    // -------------------------------------------------------------
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('disabled')) {
      usersCol.fields.add(new BoolField({ name: 'disabled' }))
      app.save(usersCol)
      console.log('Migration 0097: Added `disabled` field to users collection.')
    }

    // -------------------------------------------------------------
    // Step 2: Add `is_active` field to `team` collection if not present
    // -------------------------------------------------------------
    var teamCol = app.findCollectionByNameOrId('team')
    if (!teamCol.fields.getByName('is_active')) {
      teamCol.fields.add(new BoolField({ name: 'is_active' }))
      app.save(teamCol)
      console.log('Migration 0097: Added `is_active` field to team collection.')
    }

    // Default existing team members to is_active = true if null/undefined
    try {
      db.newQuery('UPDATE team SET is_active = 1 WHERE is_active IS NULL').execute()
    } catch (e) {
      console.log('Migration 0097: Error updating default is_active:', e)
    }

    // Default existing users disabled = false if null
    try {
      db.newQuery('UPDATE users SET disabled = 0 WHERE disabled IS NULL').execute()
    } catch (e) {
      console.log('Migration 0097: Error updating default disabled:', e)
    }

    // -------------------------------------------------------------
    // Step 3: Identify Company IDs
    // -------------------------------------------------------------
    var pscCompany = null
    var gentiCompany = null
    var ksCompany = null

    try {
      pscCompany = app.findFirstRecordByData(
        'companies',
        'name',
        'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA',
      )
    } catch (_) {
      try {
        var pscList = app.findRecordsByFilter('companies', "name ~ 'PSC'", '', 1, 0)
        if (pscList && pscList.length > 0) pscCompany = pscList[0]
      } catch (_) {}
    }

    try {
      gentiCompany = app.findFirstRecordByData(
        'companies',
        'name',
        'GENTI SERVICOS EMPRESARIAIS LTDA - ME',
      )
    } catch (_) {
      try {
        var gentiList = app.findRecordsByFilter('companies', "name ~ 'GENTI'", '', 1, 0)
        if (gentiList && gentiList.length > 0) gentiCompany = gentiList[0]
      } catch (_) {}
    }

    try {
      ksCompany = app.findFirstRecordByData(
        'companies',
        'name',
        'KOALA SYSTEM INDUSTRIA E COMERCIO LTDA',
      )
    } catch (_) {
      try {
        var ksList = app.findRecordsByFilter('companies', "name ~ 'KOALA'", '', 1, 0)
        if (ksList && ksList.length > 0) ksCompany = ksList[0]
      } catch (_) {}
    }

    var pscId = pscCompany ? pscCompany.id : 'a631bv695rr4gef'
    var gentiId = gentiCompany ? gentiCompany.id : 'zt57khfow39nwa1'
    var ksId = ksCompany ? ksCompany.id : 'i7kjauu378swxg6'

    console.log('Migration 0097: Company IDs -> PSC:', pscId, 'GENTI:', gentiId, 'KS:', ksId)

    // -------------------------------------------------------------
    // Step 4: Reassign Geraldo Timóteo and Dainara Jesus Fonseca to GENTI
    // -------------------------------------------------------------
    var allocCol = app.findCollectionByNameOrId('user_allocations')

    function setUserCompany(email, targetCompanyId) {
      try {
        var user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        if (user) {
          user.set('primary_company_id', targetCompanyId)
          app.save(user)
          console.log(
            'Migration 0097: Updated user ' + email + ' primary_company_id to ' + targetCompanyId,
          )

          // Ensure allocation exists for target company
          var allocs = app.findRecordsByFilter(
            'user_allocations',
            "user_id = '" + user.id + "' && company_id = '" + targetCompanyId + "'",
            '',
            1,
            0,
          )
          if (!allocs || allocs.length === 0) {
            var alloc = new Record(allocCol)
            alloc.set('user_id', user.id)
            alloc.set('company_id', targetCompanyId)
            app.save(alloc)
            console.log(
              'Migration 0097: Created allocation to company ' +
                targetCompanyId +
                ' for user ' +
                email,
            )
          }
        }
      } catch (e) {
        console.log('Migration 0097: Error updating user company for ' + email + ':', e)
      }
    }

    setUserCompany('geraldo.timoteo@proserco.com.br', gentiId)
    setUserCompany('dainara.jesus@proserco.com.br', gentiId)

    // Ensure Murilo Franco remains PSC
    setUserCompany('murilo.franco@proserco.com.br', pscId)

    // -------------------------------------------------------------
    // Step 5: Full List of Collaborators (~70) by Company and Department
    // -------------------------------------------------------------
    // Afastados flagged with is_active: false (Cidiclei Sena Barbosa, Washington Luis Santos)
    // Geraldo Timóteo and Dainara Jesus assigned to GENTI
    // Murilo Franco assigned to PSC / FÁBRICA
    // Empty role ("") for general collaborators to be filled by GQ later,
    // or keeping specific designated roles if already known.

    var collaboratorsData = [
      // === PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA ===
      {
        name: 'AGNALDO SILVA SANTOS',
        company: pscId,
        dept: 'CQ',
        role: 'Colaborador',
        is_active: true,
        is_indicator: true,
      },
      {
        name: 'ALDAIR DOS SANTOS BARAÚNA',
        company: pscId,
        dept: 'SOLDA',
        role: '',
        is_active: true,
      },
      { name: 'ALEJANDRO DROGUETT', company: pscId, dept: 'DIRETORIA', role: '', is_active: true },
      {
        name: 'ALESSON SILVA DE CASTRO',
        company: pscId,
        dept: 'LOGÍSTICA',
        role: '',
        is_active: true,
      },
      {
        name: 'ANDRÉ DE JESUS SANTOS',
        company: pscId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'ANTONIO CARLOS DOS S. OLIVEIRA',
        company: pscId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      { name: 'ARGEMIRO RODRIGUES', company: pscId, dept: 'USINAGEM', role: '', is_active: true },
      {
        name: 'ÁTILA NASCIMENTO CABRAL',
        company: pscId,
        dept: 'USINAGEM',
        role: '',
        is_active: true,
      },
      { name: 'BRUNA GOMES', company: pscId, dept: 'ESTAGIÁRIA', role: '', is_active: true },
      {
        name: 'DAVID ENRIQUE ARCHILA MUNOZ',
        company: pscId,
        dept: 'CQ',
        role: '',
        is_active: true,
      },
      {
        name: 'EDUARDO BATISTA DOS SANTOS',
        company: pscId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'EDUARDO BRUNO AGUILERA',
        company: pscId,
        dept: 'DIRETORIA',
        role: '',
        is_active: true,
      },
      {
        name: 'ERONILDO OLIVEIRA DA SILVA',
        company: pscId,
        dept: 'SUP',
        role: '',
        is_active: true,
      },
      { name: 'FÁBIO FERREIRA SILVA', company: pscId, dept: 'SOLDA', role: '', is_active: true },
      {
        name: 'FLÁVIO WAGNER SANTOS HENRIQUE',
        company: pscId,
        dept: 'PROJ',
        role: '',
        is_active: true,
      },
      {
        name: 'IRÊNIO BISPO DOS SANTOS',
        company: pscId,
        dept: 'USINAGEM',
        role: '',
        is_active: true,
      },
      {
        name: 'JAIRO TRINDADE DE SOUZA REIS',
        company: pscId,
        dept: 'PONTE ROLANTE',
        role: '',
        is_active: true,
      },
      {
        name: 'JOSÉ DERALDO PACHEICO DE JESUS',
        company: pscId,
        dept: 'SOLDA',
        role: '',
        is_active: true,
      },
      {
        name: 'JOSEILTON DE SOUZA REIS',
        company: pscId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'MÁRCIO SILVA SANTOS',
        company: pscId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      { name: 'MÁRCIO PEREIRA DE SANTANA', company: pscId, dept: 'PCP', role: '', is_active: true },
      {
        name: 'MARCOS VINÍCIUS MACIEL SANDES',
        company: pscId,
        dept: 'DIRETORIA',
        role: '',
        is_active: true,
      },
      {
        name: 'MURILO DE CARVALHO FRANCO',
        company: pscId,
        dept: 'FÁBRICA',
        role: 'Coordenador de Fábrica',
        is_active: true,
        is_indicator: true,
      },
      {
        name: 'ROBERTA CARVALHO BAIÃO JUNQUEIRA',
        company: pscId,
        dept: 'SGQ',
        role: 'Gestora da Qualidade / Analista de Gestão da Qualidade',
        is_active: true,
        is_indicator: true,
      },
      { name: 'SHEILA GOMES FRANÇA', company: pscId, dept: 'ALMOX', role: '', is_active: true },
      {
        name: 'VANDERLAN OLIVEIRA DOS SANTOS',
        company: pscId,
        dept: 'PROJ',
        role: '',
        is_active: true,
      },

      // === GENTI SERVICOS EMPRESARIAIS LTDA ===
      {
        name: 'ALAN DOS SANTOS DE JESUS',
        company: gentiId,
        dept: 'ASG',
        role: '',
        is_active: true,
      },
      { name: 'ALMIR PEREIRA PORTELA', company: gentiId, dept: 'SOLDA', role: '', is_active: true },
      {
        name: 'ANTONIO FAUSTINO PEREIRA DA SILVA',
        company: gentiId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'ATANAEL RODRIGUES PEREIRA',
        company: gentiId,
        dept: 'MANUTENÇÃO',
        role: '',
        is_active: true,
      },
      {
        name: 'CÍCERO FERREIRA DE LIMA',
        company: gentiId,
        dept: 'USINAGEM',
        role: '',
        is_active: true,
      },
      {
        name: 'CIDICLEI SENA BARBOSA',
        company: gentiId,
        dept: 'MANUTENÇÃO',
        role: '',
        is_active: false,
      }, // AFASTADO
      {
        name: 'DAINARA PEREIRA FONSECA DE JESUS',
        company: gentiId,
        dept: 'SGQ',
        role: 'Auxiliar Administrativo',
        is_active: true,
      },
      { name: 'DÉBORA SILVA GUIMARÃES', company: gentiId, dept: 'CQ', role: '', is_active: true },
      {
        name: 'DEIVID MARTINS NASCIMENTOS DOSA SANTOS',
        company: gentiId,
        dept: 'MANUTENÇÃO',
        role: '',
        is_active: true,
      },
      {
        name: 'DIEGO SANTOS DE OLIVEIRA',
        company: gentiId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'DOUGLAS NERI CONCEIÇÃO',
        company: gentiId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'ELIANA NUNES RODRIGUES',
        company: gentiId,
        dept: 'FINANCEIRO',
        role: '',
        is_active: true,
      },
      { name: 'GABRIELA DA SILVA SANTOS', company: gentiId, dept: 'RH', role: '', is_active: true },
      {
        name: 'GEORGE SALES BENVINDO',
        company: gentiId,
        dept: 'USINAGEM',
        role: '',
        is_active: true,
      },
      {
        name: 'GERALDO JOSÉ TIMÓTEO DA LUZ',
        company: gentiId,
        dept: 'CQ',
        role: 'Coordenador do Controle de Qualidade',
        is_active: true,
      },
      {
        name: 'JOÃO MARCOS SANTANA DE JESUS',
        company: gentiId,
        dept: 'CORTE',
        role: '',
        is_active: true,
      },
      {
        name: 'JORGIVAL IDALINO DA CUNHA',
        company: gentiId,
        dept: 'SOLDA',
        role: '',
        is_active: true,
      },
      {
        name: 'JOSÉ ANTÔNIO CANELON MUJICA',
        company: gentiId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'LIDIANE PITA BARBOSA',
        company: gentiId,
        dept: 'FINANCEIRO',
        role: '',
        is_active: true,
      },
      {
        name: 'LUAN VITOR FERNANDEZ DE JESUS',
        company: gentiId,
        dept: 'ALMOXARIFADO',
        role: '',
        is_active: true,
      },
      { name: 'LUCIANA SENA SANTANA', company: gentiId, dept: 'PCP', role: '', is_active: true },
      {
        name: 'LUCIANO DOS SANTOS MOURA',
        company: gentiId,
        dept: 'SOLDA',
        role: '',
        is_active: true,
      },
      {
        name: 'LUIS HENRIQUE CERQUEIRA',
        company: gentiId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'LUIS HENRIQUE GONÇALVES TRINDADE',
        company: gentiId,
        dept: 'MANUTENÇÃO',
        role: '',
        is_active: true,
      },
      {
        name: 'LUIZ CARLOS SOUZA',
        company: gentiId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      { name: 'REBECA ALVES COSTA', company: gentiId, dept: 'RECEPÇÃO', role: '', is_active: true },
      {
        name: 'REINILDO PEREIRA BATISTA BATISTA',
        company: gentiId,
        dept: 'USINAGEM',
        role: '',
        is_active: true,
      },
      { name: 'RODRIGO OLIVEIRA', company: gentiId, dept: 'SOLDA', role: '', is_active: true },
      { name: 'RONILSON MOREIRA RIBEIRO', company: gentiId, dept: 'CQ', role: '', is_active: true },
      {
        name: 'WASHINGTON LUIS SANTOS',
        company: gentiId,
        dept: 'SOLDA',
        role: '',
        is_active: false,
      }, // AFASTADO

      // === KOALA SYSTEM INDUSTRIA E COMERCIO LTDA (KS) ===
      { name: 'CLAUDIA RIBEIRO MAGALHÃES', company: ksId, dept: 'ADM', role: '', is_active: true },
      {
        name: 'DANILO DE SOUSA BULCÃO',
        company: ksId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      { name: 'FABIANA DE SOUZA SANTOS', company: ksId, dept: 'SMS', role: '', is_active: true },
      {
        name: 'MANOEL EVANGELISTA DE ARAÚJO FILHO',
        company: ksId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'NILTON SANTOS DE OLIVEIRA',
        company: ksId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'PAULO SÉRGIO MAIA DA PAIXÃO',
        company: ksId,
        dept: 'CALDEIRARIA',
        role: '',
        is_active: true,
      },
      {
        name: 'RONALDO DA SILVA ARAÚJO',
        company: ksId,
        dept: 'USINAGEM',
        role: '',
        is_active: true,
      },
    ]

    // Normalize helper
    function cleanStr(s) {
      if (!s) return ''
      return s.trim().toUpperCase()
    }

    // Step 5.1: Clean up orphaned/unlinked team records (company_id is empty or null)
    // If an identical named record already exists in GENTI, PSC, or KS, clean up the duplicate unlinked ones.
    try {
      var unlinkedTeam = app.findRecordsByFilter(
        'team',
        'company_id = "" || company_id = null',
        '',
        200,
        0,
      )
      for (var u = 0; u < unlinkedTeam.length; u++) {
        var unl = unlinkedTeam[u]
        var unlName = cleanStr(unl.getString('name'))
        // If unlName is one of our GENTI collaborators, associate it directly to GENTI or delete duplicate
        var isGentiPerson = collaboratorsData.find(function (c) {
          return c.company === gentiId && cleanStr(c.name) === unlName
        })
        if (isGentiPerson) {
          // Check if there is already a GENTI record
          var gentiRecords = app.findRecordsByFilter(
            'team',
            "company_id = '" +
              gentiId +
              "' && name = '" +
              unl.getString('name').replace(/'/g, "''") +
              "'",
            '',
            1,
            0,
          )
          if (gentiRecords && gentiRecords.length > 0) {
            // Duplicate exists with company_id set, safely remove unlinked orphan
            app.delete(unl)
          } else {
            // Assign unlinked record to GENTI
            unl.set('company_id', gentiId)
            unl.set('department', isGentiPerson.dept)
            unl.set('is_active', isGentiPerson.is_active)
            app.save(unl)
          }
        }
      }
    } catch (cleanErr) {
      console.log('Migration 0097: Notice during unlinked cleanup:', cleanErr)
    }

    // Step 5.2: Sync / Upsert Collaborators into `team` collection
    var createdCount = 0
    var updatedCount = 0

    for (var i = 0; i < collaboratorsData.length; i++) {
      var item = collaboratorsData[i]
      var escapedName = item.name.replace(/'/g, "''")
      var existingRecords = []

      try {
        existingRecords = app.findRecordsByFilter(
          'team',
          "company_id = '" + item.company + "' && name = '" + escapedName + "'",
          '',
          1,
          0,
        )
      } catch (_) {}

      var rec = null
      if (existingRecords && existingRecords.length > 0) {
        rec = existingRecords[0]
        updatedCount++
      } else {
        // Also check if there is an unlinked record with this name
        try {
          var unlinkedMatch = app.findRecordsByFilter(
            'team',
            "(company_id = '' || company_id = null) && name = '" + escapedName + "'",
            '',
            1,
            0,
          )
          if (unlinkedMatch && unlinkedMatch.length > 0) {
            rec = unlinkedMatch[0]
            updatedCount++
          }
        } catch (_) {}

        if (!rec) {
          rec = new Record(teamCol)
          createdCount++
        }
      }

      rec.set('name', item.name)
      rec.set('company_id', item.company)
      rec.set('department', item.dept)
      if (item.role !== undefined) {
        rec.set('role', item.role)
      } else if (!rec.getString('role')) {
        rec.set('role', '')
      }
      rec.set('is_active', item.is_active)
      if (item.is_indicator !== undefined) {
        rec.set('is_indicator', item.is_indicator)
      }

      app.save(rec)
    }

    // Step 5.3: Ensure Geraldo and Dainara team records in PSC are relocated or ensured in GENTI
    // (If they previously had a team record in PSC, adjust company_id to GENTI)
    try {
      var pscGeraldo = app.findRecordsByFilter(
        'team',
        "company_id = '" + pscId + "' && name ~ 'GERALDO'",
        '',
        5,
        0,
      )
      for (var g = 0; g < pscGeraldo.length; g++) {
        pscGeraldo[g].set('company_id', gentiId)
        pscGeraldo[g].set('department', 'CQ')
        pscGeraldo[g].set('role', 'Coordenador do Controle de Qualidade')
        pscGeraldo[g].set('is_active', true)
        app.save(pscGeraldo[g])
      }

      var pscDainara = app.findRecordsByFilter(
        'team',
        "company_id = '" + pscId + "' && name ~ 'DAINARA'",
        '',
        5,
        0,
      )
      for (var d = 0; d < pscDainara.length; d++) {
        pscDainara[d].set('company_id', gentiId)
        pscDainara[d].set('department', 'SGQ')
        pscDainara[d].set('role', 'Auxiliar Administrativo')
        pscDainara[d].set('is_active', true)
        app.save(pscDainara[d])
      }
    } catch (reErr) {
      console.log(
        'Migration 0097: Notice during GENTI reassignment for Geraldo/Dainara team records:',
        reErr,
      )
    }

    console.log(
      'Migration 0097 completed successfully. Team collaborators created: ' +
        createdCount +
        ', updated: ' +
        updatedCount,
    )
  },
  (app) => {
    // Revert logic
    try {
      var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('disabled')) {
        usersCol.fields.removeByName('disabled')
        app.save(usersCol)
      }
    } catch (_) {}

    try {
      var teamCol = app.findCollectionByNameOrId('team')
      if (teamCol.fields.getByName('is_active')) {
        teamCol.fields.removeByName('is_active')
        app.save(teamCol)
      }
    } catch (_) {}
  },
)
