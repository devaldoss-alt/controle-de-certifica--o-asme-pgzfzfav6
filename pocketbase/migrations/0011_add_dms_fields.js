migrate(
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')
    if (!docCol.fields.getByName('prefix')) {
      docCol.fields.add(new TextField({ name: 'prefix' }))
    }
    if (!docCol.fields.getByName('code')) {
      docCol.fields.add(new TextField({ name: 'code' }))
    }
    if (!docCol.fields.getByName('revision')) {
      docCol.fields.add(new TextField({ name: 'revision' }))
    }
    if (!docCol.fields.getByName('prefix_en')) {
      docCol.fields.add(new TextField({ name: 'prefix_en' }))
    }
    app.save(docCol)

    var daCol = new Collection({
      name: 'document_access',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
      fields: [
        {
          name: 'role',
          type: 'select',
          values: [
            'Director',
            'QCC',
            'Inspector',
            'AI',
            'Designer',
            'Engineer',
            'CertifyingEngineer',
            'Welder',
            'NDE',
            'Manager',
          ],
          maxSelect: 1,
        },
        { name: 'document_prefix', type: 'text', required: true },
        { name: 'can_view', type: 'bool' },
        { name: 'can_edit', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(daCol)
  },
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')
    try {
      docCol.fields.removeByName('prefix')
    } catch (_) {}
    try {
      docCol.fields.removeByName('code')
    } catch (_) {}
    try {
      docCol.fields.removeByName('revision')
    } catch (_) {}
    try {
      docCol.fields.removeByName('prefix_en')
    } catch (_) {}
    app.save(docCol)
    try {
      app.delete(app.findCollectionByNameOrId('document_access'))
    } catch (_) {}
  },
)
