migrate(
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')
    docCol.listRule = "@request.auth.id != ''"
    docCol.viewRule = "@request.auth.id != ''"
    app.save(docCol)

    docCol.addIndex('idx_documents_company_id', false, 'company_id', '')
    app.save(docCol)

    var PSC_ID = ''
    var KOALA_ID = ''
    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
        } else if (name.indexOf('koala') !== -1 || nameEn.indexOf('koala') !== -1) {
          KOALA_ID = companies[i].id
        }
      }
    } catch (_) {}

    if (!PSC_ID) {
      try {
        var firstCompany = app.findFirstRecordByData('companies', 'name', 'PSC Industria')
        PSC_ID = firstCompany.id
      } catch (_) {}
    }

    if (PSC_ID) {
      app
        .db()
        .newQuery(
          "UPDATE documents SET company_id = {:id} WHERE (company_id = '' OR company_id IS NULL) AND category != 'ISO'",
        )
        .bind({ id: PSC_ID })
        .execute()
    }

    if (KOALA_ID) {
      app
        .db()
        .newQuery(
          "UPDATE documents SET company_id = {:id} WHERE (company_id = '' OR company_id IS NULL) AND category = 'ISO'",
        )
        .bind({ id: KOALA_ID })
        .execute()
    }

    if (PSC_ID && !KOALA_ID) {
      app
        .db()
        .newQuery(
          "UPDATE documents SET company_id = {:id} WHERE company_id = '' OR company_id IS NULL",
        )
        .bind({ id: PSC_ID })
        .execute()
    }

    try {
      var docs = app.findRecordsByFilter('documents', "id != ''", '-created', 1000, 0)
      for (var j = 0; j < docs.length; j++) {
        var doc = docs[j]
        var prefix = doc.getString('prefix')
        if (!prefix) {
          var code = doc.getString('code')
          if (code) {
            var match = code.match(/^[A-Za-z]+/)
            if (match) {
              doc.set('prefix', match[0].toUpperCase())
              app.save(doc)
            }
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')
    docCol.listRule = "@request.auth.id != '' && company_id = @request.auth.primary_company_id"
    docCol.viewRule = "@request.auth.id != '' && company_id = @request.auth.primary_company_id"
    app.save(docCol)

    try {
      docCol.removeIndex('idx_documents_company_id')
      app.save(docCol)
    } catch (_) {}
  },
)
