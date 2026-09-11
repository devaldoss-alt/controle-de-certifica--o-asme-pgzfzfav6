migrate(
  (app) => {
    // Ensure companies collection allows Managers to create, update and delete
    // Supporting both single select role ('Manager') and multi-select array containing 'Manager'
    const companiesCol = app.findCollectionByNameOrId('companies')
    if (companiesCol) {
      const managerRule =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role ~ 'Manager')"
      companiesCol.createRule = managerRule
      companiesCol.updateRule = managerRule
      companiesCol.deleteRule = managerRule
      app.save(companiesCol)
    }

    // Also verify users collection role field maxSelect is set to 1 to match single-role logic
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (usersCol) {
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        roleField.maxSelect = 1
        app.save(usersCol)
      }
    }
  },
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    if (companiesCol) {
      companiesCol.createRule = "@request.auth.id != '' && @request.auth.role = 'Manager'"
      companiesCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'Manager'"
      companiesCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'Manager'"
      app.save(companiesCol)
    }
  },
)
