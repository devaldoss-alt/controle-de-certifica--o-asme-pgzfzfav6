migrate(
  (app) => {
    var companiesColId = app.findCollectionByNameOrId('companies').id

    var collection = new Collection({
      name: 'user_certificates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'Manager')",
      updateRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'Manager')",
      deleteRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'Manager')",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'certificate_type', type: 'text', required: true },
        { name: 'certificate_number', type: 'text' },
        { name: 'expiry_date', type: 'date' },
        {
          name: 'file',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        },
        { name: 'company_id', type: 'relation', collectionId: companiesColId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    var collection = app.findCollectionByNameOrId('user_certificates')
    app.delete(collection)
  },
)
