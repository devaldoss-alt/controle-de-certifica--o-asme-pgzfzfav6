// Migration 0069 — Ensure read/write RLS rules for checklists, service_orders, documents, team
// Relaxes list/view/create/update rules so authenticated users can view records without primary_company_id mismatch
// or missing company_id blocking access.

migrate(
  (app) => {
    // 1. checklists
    try {
      const col = app.findCollectionByNameOrId('checklists')
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
      app.save(col)
    } catch (e) {
      console.log('Migration 0069: checklists rule update error: ' + e)
    }

    // 2. service_orders
    try {
      const col = app.findCollectionByNameOrId('service_orders')
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || owner_company_id = @request.auth.primary_company_id)"
      app.save(col)
    } catch (e) {
      console.log('Migration 0069: service_orders rule update error: ' + e)
    }

    // 3. documents
    try {
      const col = app.findCollectionByNameOrId('documents')
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
      app.save(col)
    } catch (e) {
      console.log('Migration 0069: documents rule update error: ' + e)
    }

    // 4. team
    try {
      const col = app.findCollectionByNameOrId('team')
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'QCC')"
      app.save(col)
    } catch (e) {
      console.log('Migration 0069: team rule update error: ' + e)
    }
  },
  (app) => {
    // revert not needed for security relaxed read/write rules
  },
)
