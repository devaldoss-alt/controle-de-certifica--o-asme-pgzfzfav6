migrate(
  (app) => {
    var checkCol = app.findCollectionByNameOrId('checklists')
    if (!checkCol.fields.getByName('title_en')) {
      checkCol.fields.add(new TextField({ name: 'title_en' }))
    }
    if (!checkCol.fields.getByName('description_en')) {
      checkCol.fields.add(new TextField({ name: 'description_en' }))
    }
    app.save(checkCol)

    var docCol = app.findCollectionByNameOrId('documents')
    if (!docCol.fields.getByName('title_en')) {
      docCol.fields.add(new TextField({ name: 'title_en' }))
    }
    if (!docCol.fields.getByName('content_en')) {
      docCol.fields.add(new TextField({ name: 'content_en' }))
    }
    app.save(docCol)

    var compCol = app.findCollectionByNameOrId('companies')
    if (!compCol.fields.getByName('name_en')) {
      compCol.fields.add(new TextField({ name: 'name_en' }))
    }
    app.save(compCol)

    var soCol = app.findCollectionByNameOrId('service_orders')
    if (!soCol.fields.getByName('equipment_en')) {
      soCol.fields.add(new TextField({ name: 'equipment_en' }))
    }
    app.save(soCol)
  },
  (app) => {
    var checkCol = app.findCollectionByNameOrId('checklists')
    try {
      checkCol.fields.removeByName('title_en')
    } catch (_) {}
    try {
      checkCol.fields.removeByName('description_en')
    } catch (_) {}
    app.save(checkCol)

    var docCol = app.findCollectionByNameOrId('documents')
    try {
      docCol.fields.removeByName('title_en')
    } catch (_) {}
    try {
      docCol.fields.removeByName('content_en')
    } catch (_) {}
    app.save(docCol)

    var compCol = app.findCollectionByNameOrId('companies')
    try {
      compCol.fields.removeByName('name_en')
    } catch (_) {}
    app.save(compCol)

    var soCol = app.findCollectionByNameOrId('service_orders')
    try {
      soCol.fields.removeByName('equipment_en')
    } catch (_) {}
    app.save(soCol)
  },
)
