migrate(
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')

    docCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || (company_id = @request.auth.primary_company_id && @request.auth.role = 'QCC'))"
    docCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || (company_id = @request.auth.primary_company_id && @request.auth.role = 'QCC'))"

    app.save(docCol)
  },
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')

    docCol.updateRule =
      "@request.auth.id != '' && company_id = @request.auth.primary_company_id && (@request.auth.role = 'QCC' || @request.auth.role = 'Manager')"
    docCol.deleteRule =
      "@request.auth.id != '' && company_id = @request.auth.primary_company_id && (@request.auth.role = 'QCC' || @request.auth.role = 'Manager')"

    app.save(docCol)
  },
)
