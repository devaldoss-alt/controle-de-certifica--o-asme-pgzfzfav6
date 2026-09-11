migrate(
  (app) => {
    const documents = app.findCollectionByNameOrId('documents')
    const contentField = documents.fields.getByName('content')
    if (contentField) {
      contentField.max = 500000
    }
    const contentEnField = documents.fields.getByName('content_en')
    if (contentEnField) {
      contentEnField.max = 500000
    }
    app.save(documents)
  },
  (app) => {},
)
