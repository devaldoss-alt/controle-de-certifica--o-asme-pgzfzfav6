migrate(
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')

    if (!docCol.fields.getByName('document_type')) {
      docCol.fields.add(
        new SelectField({
          name: 'document_type',
          values: ['Internal', 'External', 'Record'],
          maxSelect: 1,
        }),
      )
    }
    if (!docCol.fields.getByName('effective_date')) {
      docCol.fields.add(new DateField({ name: 'effective_date' }))
    }
    if (!docCol.fields.getByName('next_review_date')) {
      docCol.fields.add(new DateField({ name: 'next_review_date' }))
    }
    if (!docCol.fields.getByName('origin')) {
      docCol.fields.add(new TextField({ name: 'origin' }))
    }
    if (!docCol.fields.getByName('language')) {
      docCol.fields.add(
        new SelectField({
          name: 'language',
          values: ['Portuguese', 'English', 'Spanish'],
          maxSelect: 1,
        }),
      )
    }
    if (!docCol.fields.getByName('status')) {
      docCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Active', 'Obsolete', 'Under Review'],
          maxSelect: 1,
        }),
      )
    }

    try {
      docCol.fields.removeByName('category')
    } catch (_) {}
    docCol.fields.add(
      new SelectField({
        name: 'category',
        values: ['ISO', 'ASME', 'Internal'],
        maxSelect: 1,
      }),
    )

    app.save(docCol)

    var notifCol = app.findCollectionByNameOrId('notifications')
    var soId = app.findCollectionByNameOrId('service_orders').id

    if (!notifCol.fields.getByName('service_order_id')) {
      notifCol.fields.add(
        new RelationField({
          name: 'service_order_id',
          collectionId: soId,
          maxSelect: 1,
        }),
      )
    }
    if (!notifCol.fields.getByName('day_offset')) {
      notifCol.fields.add(new NumberField({ name: 'day_offset' }))
    }

    app.save(notifCol)
  },
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')
    var fieldsToRemove = [
      'document_type',
      'effective_date',
      'next_review_date',
      'origin',
      'language',
      'status',
    ]
    for (var i = 0; i < fieldsToRemove.length; i++) {
      try {
        docCol.fields.removeByName(fieldsToRemove[i])
      } catch (_) {}
    }
    try {
      docCol.fields.removeByName('category')
    } catch (_) {}
    docCol.fields.add(
      new SelectField({
        name: 'category',
        values: ['ISO', 'ASME'],
        maxSelect: 1,
      }),
    )
    app.save(docCol)

    var notifCol = app.findCollectionByNameOrId('notifications')
    try {
      notifCol.fields.removeByName('service_order_id')
    } catch (_) {}
    try {
      notifCol.fields.removeByName('day_offset')
    } catch (_) {}
    app.save(notifCol)
  },
)
