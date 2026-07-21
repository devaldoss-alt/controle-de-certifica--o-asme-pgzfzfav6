migrate(
  (app) => {
    var usersId = '_pb_users_auth_'
    var companiesId = app.findCollectionByNameOrId('companies').id

    var indicators = new Collection({
      name: 'indicators',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'Director' || @request.auth.role = 'QCC')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'Director' || @request.auth.role = 'QCC')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'formula_description', type: 'text' },
        { name: 'target_value', type: 'number' },
        { name: 'current_value', type: 'number' },
        { name: 'unit', type: 'text' },
        {
          name: 'period',
          type: 'select',
          values: ['Annual', 'Semestral', 'Monthly'],
          maxSelect: 1,
        },
        { name: 'responsible', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'company_id', type: 'relation', collectionId: companiesId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(indicators)

    var checkCol = app.findCollectionByNameOrId('checklists')
    if (!checkCol.fields.getByName('tutorial')) {
      checkCol.fields.add(new TextField({ name: 'tutorial' }))
    }
    app.save(checkCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('indicators'))
    } catch (_) {}
    var checkCol = app.findCollectionByNameOrId('checklists')
    try {
      checkCol.fields.removeByName('tutorial')
    } catch (_) {}
    app.save(checkCol)
  },
)
