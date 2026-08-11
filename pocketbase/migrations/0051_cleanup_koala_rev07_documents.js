migrate(
  (app) => {
    var KOALA_ID = ''
    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('koala') !== -1 || nameEn.indexOf('koala') !== -1) {
          KOALA_ID = companies[i].id
          break
        }
      }
    } catch (_) {}

    if (!KOALA_ID) {
      console.log('Migration 0051: Koala company not found, skipping')
      return
    }

    var deleted = 0
    try {
      var koalaDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + KOALA_ID + '"',
        'created',
        50000,
        0,
      )
      for (var j = 0; j < koalaDocs.length; j++) {
        try {
          app.delete(koalaDocs[j])
          deleted++
        } catch (e) {
          console.log('Migration 0051: delete error: ' + e)
        }
      }
    } catch (e) {
      console.log('Migration 0051: error fetching Koala documents: ' + e)
    }

    console.log(
      'Migration 0051: deleted ' +
        deleted +
        ' documents from Koala System company (incorrect Rev.07 data). Koala company ID: ' +
        KOALA_ID,
    )
  },
  (app) => {
    // No-op: data cleanup cannot be safely reverted
  },
)
