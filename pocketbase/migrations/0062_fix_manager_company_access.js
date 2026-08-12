migrate(
  (app) => {
    function allowManagerOrCompany(col, coField) {
      if (!col) return
      coField = coField || 'company_id'
      var rule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || " +
        coField +
        ' = @request.auth.primary_company_id || ' +
        coField +
        " = '')"
      col.listRule = rule
      col.viewRule = rule
      app.save(col)
    }

    allowManagerOrCompany(app.findCollectionByNameOrId('checklists'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('documents'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('service_orders'), 'owner_company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('indicators'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('indicator_history'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('interactions'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('user_allocations'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('user_certificates'), 'company_id')
    allowManagerOrCompany(app.findCollectionByNameOrId('packing_slips'), 'company_id')

    var notifCol = app.findCollectionByNameOrId('notifications')
    if (notifCol) {
      var notifRule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || user_id = @request.auth.id || company_id = @request.auth.primary_company_id)"
      notifCol.listRule = notifRule
      notifCol.viewRule = notifRule
      app.save(notifCol)
    }
  },
  (app) => {
    // down migration
  },
)
