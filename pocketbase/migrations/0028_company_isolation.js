migrate(
  (app) => {
    var companiesId = app.findCollectionByNameOrId('companies').id
    var db = app.db()

    var interactionsCol = app.findCollectionByNameOrId('interactions')
    if (!interactionsCol.fields.getByName('company_id')) {
      interactionsCol.fields.add(
        new RelationField({ name: 'company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(interactionsCol)

    var notificationsCol = app.findCollectionByNameOrId('notifications')
    if (!notificationsCol.fields.getByName('company_id')) {
      notificationsCol.fields.add(
        new RelationField({ name: 'company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(notificationsCol)

    var ihCol = app.findCollectionByNameOrId('indicator_history')
    if (!ihCol.fields.getByName('company_id')) {
      ihCol.fields.add(
        new RelationField({ name: 'company_id', collectionId: companiesId, maxSelect: 1 }),
      )
    }
    app.save(ihCol)

    var PSC_ID = ''
    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        if ((companies[i].getString('name') || '').toLowerCase().indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
          break
        }
      }
      if (!PSC_ID && companies.length > 0) PSC_ID = companies[0].id
    } catch (_) {}

    if (PSC_ID) {
      db.newQuery(
        "UPDATE interactions SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE notifications SET company_id = (SELECT company_id FROM checklists WHERE id = notifications.checklist_id) WHERE (company_id = '' OR company_id IS NULL) AND checklist_id IS NOT NULL AND checklist_id != ''",
      ).execute()
      db.newQuery(
        "UPDATE notifications SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE indicator_history SET company_id = (SELECT company_id FROM indicators WHERE id = indicator_history.indicator_id) WHERE (company_id = '' OR company_id IS NULL) AND indicator_id IS NOT NULL AND indicator_id != ''",
      ).execute()
      db.newQuery(
        "UPDATE indicator_history SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE checklists SET company_id = (SELECT owner_company_id FROM service_orders WHERE id = checklists.os_id) WHERE (company_id = '' OR company_id IS NULL) AND os_id IS NOT NULL AND os_id != ''",
      ).execute()
      db.newQuery(
        "UPDATE checklists SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE documents SET company_id = (SELECT owner_company_id FROM service_orders WHERE id = documents.os_id) WHERE (company_id = '' OR company_id IS NULL) AND os_id IS NOT NULL AND os_id != ''",
      ).execute()
      db.newQuery(
        "UPDATE documents SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE service_orders SET owner_company_id = {:id} WHERE owner_company_id = '' OR owner_company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE indicators SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE user_allocations SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
      db.newQuery(
        "UPDATE users SET primary_company_id = {:id} WHERE primary_company_id = '' OR primary_company_id IS NULL",
      )
        .bind({ id: PSC_ID })
        .execute()
    }

    var co = 'company_id = @request.auth.primary_company_id'
    var coOwner = 'owner_company_id = @request.auth.primary_company_id'
    var auth = "@request.auth.id != ''"
    var authCo = auth + ' && ' + co
    var authCoOwner = auth + ' && ' + coOwner
    var notifCo = '@request.auth.id = user_id && ' + co
    var qccMgr = " && (@request.auth.role = 'QCC' || @request.auth.role = 'Manager')"
    var dirMgrQcc =
      " && (@request.auth.role = 'Manager' || @request.auth.role = 'Director' || @request.auth.role = 'QCC')"

    function setRules(col, listR, viewR, createR, updateR, deleteR) {
      col.listRule = listR
      col.viewRule = viewR
      col.createRule = createR
      col.updateRule = updateR
      col.deleteRule = deleteR
      app.save(col)
    }

    setRules(app.findCollectionByNameOrId('checklists'), authCo, authCo, auth, authCo, authCo)
    setRules(
      app.findCollectionByNameOrId('documents'),
      authCo,
      authCo,
      auth,
      authCo + qccMgr,
      authCo + qccMgr,
    )
    setRules(
      app.findCollectionByNameOrId('service_orders'),
      authCoOwner,
      authCoOwner,
      auth,
      authCoOwner,
      authCoOwner,
    )
    setRules(
      app.findCollectionByNameOrId('indicators'),
      authCo,
      authCo,
      auth + dirMgrQcc,
      authCo + dirMgrQcc,
      authCo + " && @request.auth.role = 'Manager'",
    )
    setRules(interactionsCol, authCo, authCo, auth, authCo, authCo)
    setRules(notificationsCol, notifCo, notifCo, auth, notifCo, notifCo)
    setRules(
      ihCol,
      authCo,
      authCo,
      auth + dirMgrQcc,
      authCo + dirMgrQcc,
      authCo + " && @request.auth.role = 'Manager'",
    )
    setRules(
      app.findCollectionByNameOrId('user_allocations'),
      authCo,
      authCo,
      auth + " && @request.auth.role = 'Manager'",
      authCo + " && @request.auth.role = 'Manager'",
      authCo + " && @request.auth.role = 'Manager'",
    )
  },
  (app) => {
    var auth = "@request.auth.id != ''"
    var qccMgr = " && (@request.auth.role = 'QCC' || @request.auth.role = 'Manager')"
    var dirMgrQcc =
      " && (@request.auth.role = 'Manager' || @request.auth.role = 'Director' || @request.auth.role = 'QCC')"
    var mgr = auth + " && @request.auth.role = 'Manager'"

    function revert(name, listR, viewR, createR, updateR, deleteR) {
      var col = app.findCollectionByNameOrId(name)
      col.listRule = listR
      col.viewRule = viewR
      col.createRule = createR
      col.updateRule = updateR
      col.deleteRule = deleteR
      app.save(col)
    }

    revert('checklists', auth, auth, auth, auth, auth)
    revert('documents', auth, auth, auth, auth + qccMgr, auth + qccMgr)
    revert('service_orders', auth, auth, auth, auth, auth)
    revert('indicators', auth, auth, auth + dirMgrQcc, auth + dirMgrQcc, mgr)
    revert('interactions', auth, auth, auth, auth, auth)
    revert(
      'notifications',
      '@request.auth.id = user_id',
      '@request.auth.id = user_id',
      auth,
      '@request.auth.id = user_id',
      '@request.auth.id = user_id',
    )
    revert('indicator_history', auth, auth, auth + dirMgrQcc, auth + dirMgrQcc, mgr)
    revert('user_allocations', auth, auth, mgr, mgr, mgr)

    var ic = app.findCollectionByNameOrId('interactions')
    try {
      ic.fields.removeByName('company_id')
    } catch (_) {}
    app.save(ic)
    var nc = app.findCollectionByNameOrId('notifications')
    try {
      nc.fields.removeByName('company_id')
    } catch (_) {}
    app.save(nc)
    var ihc = app.findCollectionByNameOrId('indicator_history')
    try {
      ihc.fields.removeByName('company_id')
    } catch (_) {}
    app.save(ihc)
  },
)
