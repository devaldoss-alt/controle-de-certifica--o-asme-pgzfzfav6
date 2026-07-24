migrate(
  (app) => {
    var db = app.db()

    function getCompanyIdForUser(email) {
      try {
        var user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        var companyId = user.getString('primary_company_id')
        if (companyId) return companyId
      } catch (_) {}
      return ''
    }

    function upgradePlan(email) {
      try {
        var user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        if (user.getString('plan') !== 'Gold') {
          user.set('plan', 'Gold')
          app.save(user)
        }
      } catch (_) {}
    }

    function findRecordByField(collection, field, value) {
      try {
        return app.findFirstRecordByData(collection, field, value)
      } catch (_) {
        return null
      }
    }

    var testUsers = [{ email: 'teste_empresa_a@teste.com' }, { email: 'teste_empresa_b@teste.com' }]

    for (var i = 0; i < testUsers.length; i++) {
      upgradePlan(testUsers[i].email)
    }

    var companyAId = getCompanyIdForUser('teste_empresa_a@teste.com')
    var companyBId = getCompanyIdForUser('teste_empresa_b@teste.com')

    var soCollection = app.findCollectionByNameOrId('service_orders')
    var checkCollection = app.findCollectionByNameOrId('checklists')
    var docCollection = app.findCollectionByNameOrId('documents')

    var seedData = [
      {
        companyId: companyAId,
        serviceOrder: {
          number: 'OS-2025-001',
          client: 'Metalurgica ABC',
          equipment: 'Vaso de pressão HP-101',
          standard: 'ASME Section VIII',
          deadline: '2026-12-31',
          status: 'Active',
        },
        checklist: {
          title: 'Inspeção de soldagem do vaso de pressão HP-101',
          role_assigned: 'Inspector',
          mcq_ref: 'Seção 6.2',
          status: 'pending',
          is_critical: true,
          category: 'OS',
        },
        document: {
          title: 'Procedimento de Soldagem WPS-001 para Vaso HP-101',
          content:
            '<h1>Procedimento de Soldagem</h1><p>Este documento descreve os procedimentos de soldagem conforme ASME Section IX para o vaso de pressão HP-101.</p>',
          category: 'ASME',
          file_path: '\\\\rede\\procedimentos\\WPS-001.pdf',
        },
      },
      {
        companyId: companyBId,
        serviceOrder: {
          number: 'OS-2025-002',
          client: 'SoldaTech Ltda',
          equipment: 'Tanque de armazenamento TA-200',
          standard: 'NBIC',
          deadline: '2026-10-15',
          status: 'Active',
        },
        checklist: {
          title: 'Inspeção de manutenção do tanque TA-200',
          role_assigned: 'NDE',
          mcq_ref: 'Seção 9.4',
          status: 'pending',
          is_critical: false,
          category: 'OS',
        },
        document: {
          title: 'Relatório de Inspeção END do Tanque TA-200',
          content:
            '<h1>Relatório de END</h1><p>Relatório de ensaios não destrutivos realizados no tanque de armazenamento TA-200 conforme NBIC.</p>',
          category: 'ASME',
          file_path: '\\\\rede\\relatorios\\END-TA-200.pdf',
        },
      },
    ]

    for (var s = 0; s < seedData.length; s++) {
      var item = seedData[s]
      if (!item.companyId) continue

      var existingSO = findRecordByField('service_orders', 'number', item.serviceOrder.number)
      var soId = ''

      if (existingSO) {
        soId = existingSO.id
        if (existingSO.getString('owner_company_id') !== item.companyId) {
          existingSO.set('owner_company_id', item.companyId)
          app.save(existingSO)
        }
      } else {
        var soRec = new Record(soCollection)
        soRec.set('number', item.serviceOrder.number)
        soRec.set('client', item.serviceOrder.client)
        soRec.set('equipment', item.serviceOrder.equipment)
        soRec.set('standard', item.serviceOrder.standard)
        soRec.set('deadline', item.serviceOrder.deadline)
        soRec.set('status', item.serviceOrder.status)
        soRec.set('owner_company_id', item.companyId)
        app.save(soRec)
        soId = soRec.id
      }

      var existingChecklist = findRecordByField('checklists', 'title', item.checklist.title)
      if (!existingChecklist) {
        var dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        var clRec = new Record(checkCollection)
        clRec.set('title', item.checklist.title)
        clRec.set('role_assigned', item.checklist.role_assigned)
        clRec.set('mcq_ref', item.checklist.mcq_ref)
        clRec.set('status', item.checklist.status)
        clRec.set('is_critical', item.checklist.is_critical)
        clRec.set('due_date', dueDate.toISOString().replace('T', ' '))
        clRec.set('category', item.checklist.category)
        clRec.set('company_id', item.companyId)
        clRec.set('os_id', soId)
        app.save(clRec)
      } else {
        if (existingChecklist.getString('company_id') !== item.companyId) {
          existingChecklist.set('company_id', item.companyId)
          app.save(existingChecklist)
        }
      }

      var existingDoc = findRecordByField('documents', 'title', item.document.title)
      if (!existingDoc) {
        var dRec = new Record(docCollection)
        dRec.set('title', item.document.title)
        dRec.set('content', item.document.content)
        dRec.set('category', item.document.category)
        dRec.set('file_path', item.document.file_path)
        dRec.set('company_id', item.companyId)
        dRec.set('os_id', soId)
        app.save(dRec)
      } else {
        if (existingDoc.getString('company_id') !== item.companyId) {
          existingDoc.set('company_id', item.companyId)
          app.save(existingDoc)
        }
      }
    }
  },
  (app) => {
    var soNumbers = ['OS-2025-001', 'OS-2025-002']
    var checklistTitles = [
      'Inspeção de soldagem do vaso de pressão HP-101',
      'Inspeção de manutenção do tanque TA-200',
    ]
    var docTitles = [
      'Procedimento de Soldagem WPS-001 para Vaso HP-101',
      'Relatório de Inspeção END do Tanque TA-200',
    ]

    for (var i = 0; i < soNumbers.length; i++) {
      try {
        var so = app.findFirstRecordByData('service_orders', 'number', soNumbers[i])
        app.delete(so)
      } catch (_) {}
      try {
        var cl = app.findFirstRecordByData('checklists', 'title', checklistTitles[i])
        app.delete(cl)
      } catch (_) {}
      try {
        var d = app.findFirstRecordByData('documents', 'title', docTitles[i])
        app.delete(d)
      } catch (_) {}
    }

    var testEmails = ['teste_empresa_a@teste.com', 'teste_empresa_b@teste.com']
    for (var j = 0; j < testEmails.length; j++) {
      try {
        var user = app.findAuthRecordByEmail('_pb_users_auth_', testEmails[j])
        user.set('plan', 'Pro')
        app.save(user)
      } catch (_) {}
    }
  },
)
