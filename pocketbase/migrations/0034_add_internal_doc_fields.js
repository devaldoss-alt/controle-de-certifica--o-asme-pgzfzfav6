migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('documents')

    if (!col.fields.getByName('applicable_document')) {
      col.fields.add(new TextField({ name: 'applicable_document' }))
    }
    if (!col.fields.getByName('sector')) {
      col.fields.add(new TextField({ name: 'sector' }))
    }
    if (!col.fields.getByName('review_deadline_days')) {
      col.fields.add(new NumberField({ name: 'review_deadline_days' }))
    }
    if (!col.fields.getByName('notes')) {
      col.fields.add(new TextField({ name: 'notes' }))
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('documents')
    var fields = ['applicable_document', 'sector', 'review_deadline_days', 'notes']
    for (var i = 0; i < fields.length; i++) {
      try {
        col.fields.removeByName(fields[i])
      } catch (_) {}
    }
    app.save(col)
  },
)
