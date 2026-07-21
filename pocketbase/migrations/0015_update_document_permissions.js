migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('documents')
    col.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'QCC' || @request.auth.role = 'Manager')"
    col.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'QCC' || @request.auth.role = 'Manager')"
    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('documents')
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"
    app.save(col)
  },
)
