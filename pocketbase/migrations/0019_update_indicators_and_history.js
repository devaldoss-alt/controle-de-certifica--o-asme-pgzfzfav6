migrate(
  (app) => {
    var indCol = app.findCollectionByNameOrId('indicators')

    if (!indCol.fields.getByName('objective')) {
      indCol.fields.add(new TextField({ name: 'objective' }))
    }
    if (!indCol.fields.getByName('result_type')) {
      indCol.fields.add(
        new SelectField({
          name: 'result_type',
          values: ['Percentual', 'Numérico'],
          maxSelect: 1,
        }),
      )
    }
    if (!indCol.fields.getByName('verification_method')) {
      indCol.fields.add(new TextField({ name: 'verification_method' }))
    }
    if (!indCol.fields.getByName('target_operator')) {
      indCol.fields.add(
        new SelectField({
          name: 'target_operator',
          values: ['≥', '>', '<', '≤', '='],
          maxSelect: 1,
        }),
      )
    }

    try {
      indCol.fields.removeByName('responsible')
    } catch (_) {}
    indCol.fields.add(
      new RelationField({
        name: 'responsible',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        required: true,
      }),
    )

    app.save(indCol)

    var indicatorsId = indCol.id

    var historyCol = new Collection({
      name: 'indicator_history',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'Director' || @request.auth.role = 'QCC')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'Director' || @request.auth.role = 'QCC')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      fields: [
        {
          name: 'indicator_id',
          type: 'relation',
          collectionId: indicatorsId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'value', type: 'number', required: true },
        { name: 'period_date', type: 'date', required: true },
        {
          name: 'evidence',
          type: 'file',
          maxSelect: 5,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(historyCol)
  },
  (app) => {
    var indCol = app.findCollectionByNameOrId('indicators')
    try {
      indCol.fields.removeByName('objective')
    } catch (_) {}
    try {
      indCol.fields.removeByName('result_type')
    } catch (_) {}
    try {
      indCol.fields.removeByName('verification_method')
    } catch (_) {}
    try {
      indCol.fields.removeByName('target_operator')
    } catch (_) {}
    app.save(indCol)
    try {
      app.delete(app.findCollectionByNameOrId('indicator_history'))
    } catch (_) {}
  },
)
