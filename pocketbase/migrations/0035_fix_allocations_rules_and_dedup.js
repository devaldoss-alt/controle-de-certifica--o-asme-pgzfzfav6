migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('user_allocations')
    col.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || user_id = @request.auth.id)"
    col.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || user_id = @request.auth.id)"
    col.updateRule = "@request.auth.id != '' && @request.auth.role = 'Manager'"
    col.deleteRule = "@request.auth.id != '' && @request.auth.role = 'Manager'"
    app.save(col)

    var db = app.db()
    db.newQuery(
      'DELETE FROM user_allocations ' +
        'WHERE id IN (' +
        '  SELECT a.id FROM user_allocations a ' +
        '  WHERE EXISTS (' +
        '    SELECT 1 FROM user_allocations b ' +
        '    WHERE b.user_id = a.user_id ' +
        '      AND b.company_id = a.company_id ' +
        '      AND (b.created < a.created OR (b.created = a.created AND b.id < a.id))' +
        '  )' +
        ')',
    ).execute()
  },
  (app) => {
    var col = app.findCollectionByNameOrId('user_allocations')
    col.listRule = "@request.auth.id != '' && company_id = @request.auth.primary_company_id"
    col.viewRule = "@request.auth.id != '' && company_id = @request.auth.primary_company_id"
    col.updateRule =
      "@request.auth.id != '' && company_id = @request.auth.primary_company_id && @request.auth.role = 'Manager'"
    col.deleteRule =
      "@request.auth.id != '' && company_id = @request.auth.primary_company_id && @request.auth.role = 'Manager'"
    app.save(col)
  },
)
