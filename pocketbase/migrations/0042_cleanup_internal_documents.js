migrate(
  (app) => {
    var companies = []
    try {
      companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
    } catch (_) {}

    var targetCompanyIds = []
    for (var i = 0; i < companies.length; i++) {
      var name = (companies[i].getString('name') || '').toLowerCase()
      var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
      if (
        name.indexOf('koala') !== -1 ||
        nameEn.indexOf('koala') !== -1 ||
        name.indexOf('psc') !== -1 ||
        nameEn.indexOf('psc') !== -1
      ) {
        targetCompanyIds.push(companies[i].id)
      }
    }

    if (targetCompanyIds.length === 0) {
      console.log('Migration 0042: No target companies found, skipping')
      return
    }

    var deleted = 0

    for (var c = 0; c < targetCompanyIds.length; c++) {
      var companyId = targetCompanyIds[c]
      var docs = []
      try {
        docs = app.findRecordsByFilter(
          'documents',
          "company_id = '" + companyId + "' && category = 'Internal'",
          'created',
          5000,
          0,
        )
      } catch (_) {
        continue
      }

      for (var d = 0; d < docs.length; d++) {
        try {
          app.delete(docs[d])
          deleted++
        } catch (err) {
          console.log('Migration 0042: error deleting doc ' + docs[d].id + ': ' + err)
        }
      }
    }

    console.log('Migration 0042: deleted ' + deleted + ' internal documents for PSC/Koala')
  },
  (app) => {
    // No-op: data cleanup cannot be safely reverted
  },
)
