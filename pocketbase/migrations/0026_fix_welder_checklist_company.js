migrate(
  (app) => {
    var PSC_ID = ''

    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
          break
        }
      }
    } catch (_) {}

    if (!PSC_ID) {
      try {
        var pscCompany = app.findFirstRecordByData('companies', 'name', 'PSC Industria')
        PSC_ID = pscCompany.id
      } catch (_) {}
    }

    if (PSC_ID) {
      app
        .db()
        .newQuery(
          "UPDATE checklists SET company_id = {:pscId} WHERE role_assigned = 'Welder' AND (company_id = '' OR company_id IS NULL)",
        )
        .bind({ pscId: PSC_ID })
        .execute()

      app
        .db()
        .newQuery("UPDATE checklists SET company_id = {:pscId} WHERE role_assigned = 'Welder'")
        .bind({ pscId: PSC_ID })
        .execute()
    }

    var daCol = app.findCollectionByNameOrId('document_access')
    var welderPrefixes = ['EPS', 'RQ', 'WPS', 'PQR', 'WPQ']

    for (var p = 0; p < welderPrefixes.length; p++) {
      var prefix = welderPrefixes[p]
      var existing = []
      try {
        existing = app.findRecordsByFilter(
          'document_access',
          "role = 'Welder' && document_prefix = '" + prefix + "'",
          'created',
          1,
          0,
        )
      } catch (_) {}

      if (existing.length === 0) {
        var daRec = new Record(daCol)
        daRec.set('role', 'Welder')
        daRec.set('document_prefix', prefix)
        daRec.set('can_view', true)
        daRec.set('can_edit', false)
        app.save(daRec)
      } else {
        var rec = existing[0]
        if (!rec.getBool('can_view')) {
          rec.set('can_view', true)
          app.save(rec)
        }
      }
    }
  },
  (app) => {},
)
