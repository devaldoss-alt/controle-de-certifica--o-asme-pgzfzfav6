migrate(
  (app) => {
    var KOALA_ID = 'i7kjauu378swxg6'
    var PSC_ID = 'a631bv695rr4gef'
    var GENTI_ID = 'zt57khfow39nwa1'

    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('koala') !== -1 || nameEn.indexOf('koala') !== -1) {
          KOALA_ID = companies[i].id
        } else if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
        } else if (name.indexOf('genti') !== -1 || nameEn.indexOf('genti') !== -1) {
          GENTI_ID = companies[i].id
        }
      }
    } catch (_) {}

    app
      .db()
      .newQuery("UPDATE checklists SET company_id = {:koalaId} WHERE category = 'ISO 9001'")
      .bind({ koalaId: KOALA_ID })
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE checklists SET company_id = {:pscId} WHERE (company_id = '' OR company_id IS NULL) AND category != 'ISO 9001'",
      )
      .bind({ pscId: PSC_ID })
      .execute()

    try {
      var deptItems = app.findRecordsByFilter(
        'checklists',
        "category = 'Departmental'",
        'created',
        50,
        0,
      )
      for (var d = 0; d < deptItems.length; d++) {
        if (d % 3 === 2) {
          deptItems[d].set('company_id', GENTI_ID)
          app.save(deptItems[d])
        }
      }
    } catch (_) {}

    app
      .db()
      .newQuery(
        "UPDATE service_orders SET owner_company_id = {:pscId} WHERE owner_company_id = '' OR owner_company_id IS NULL",
      )
      .bind({ pscId: PSC_ID })
      .execute()

    try {
      var so3 = app.findFirstRecordByData('service_orders', 'number', 'OS-2024-003')
      so3.set('owner_company_id', GENTI_ID)
      app.save(so3)
    } catch (_) {}

    app
      .db()
      .newQuery(
        "UPDATE documents SET company_id = {:koalaId} WHERE (company_id = '' OR company_id IS NULL) AND category = 'ISO'",
      )
      .bind({ koalaId: KOALA_ID })
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE documents SET company_id = {:pscId} WHERE (company_id = '' OR company_id IS NULL) AND category != 'ISO'",
      )
      .bind({ pscId: PSC_ID })
      .execute()
  },
  (app) => {},
)
