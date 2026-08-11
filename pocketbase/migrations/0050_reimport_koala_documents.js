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
      console.log('Migration 0050: Koala company not found, skipping')
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
          console.log('Migration 0050: delete error: ' + e)
        }
      }
    } catch (e) {
      console.log('Migration 0050: error fetching Koala documents: ' + e)
    }

    var emptyCompanyDocs = 0
    try {
      var allDocs = app.findRecordsByFilter('documents', "id != ''", 'created', 50000, 0)
      for (var k = 0; k < allDocs.length; k++) {
        var cid = allDocs[k].getString('company_id') || ''
        if (!cid) {
          emptyCompanyDocs++
        }
      }
    } catch (e) {}

    if (emptyCompanyDocs > 0) {
      console.log(
        'Migration 0050: WARNING - ' +
          emptyCompanyDocs +
          ' documents have empty company_id. Future dedup migrations MUST include company_id in the grouping key.',
      )
    }

    console.log(
      'Migration 0050: deleted ' +
        deleted +
        ' Koala documents for clean reimport. Koala company ID: ' +
        KOALA_ID,
    )
  },
  (app) => {
    // No-op: data cleanup cannot be safely reverted
  },
)
