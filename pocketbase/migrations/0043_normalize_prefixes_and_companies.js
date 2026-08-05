migrate(
  (app) => {
    var companies = []
    try {
      companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
    } catch (_) {}

    var KOALA_ID = ''
    var PSC_ID = ''
    for (var i = 0; i < companies.length; i++) {
      var cname = (companies[i].getString('name') || '').toLowerCase()
      var cnameEn = (companies[i].getString('name_en') || '').toLowerCase()
      if (cname.indexOf('koala') !== -1 || cnameEn.indexOf('koala') !== -1) {
        KOALA_ID = companies[i].id
      } else if (cname.indexOf('psc') !== -1 || cnameEn.indexOf('psc') !== -1) {
        PSC_ID = companies[i].id
      }
    }

    var docs = []
    try {
      docs = app.findRecordsByFilter('documents', "prefix != ''", 'created', 5000, 0)
    } catch (_) {
      console.log('Migration 0043: no documents found')
      return
    }

    var PREFIX_FIXES = {
      'CDE-PS': 'CDE-PSC',
      'CDE PS': 'CDE-PSC',
      CDEPS: 'CDE-PSC',
      CDE_PS: 'CDE-PSC',
    }

    var updated = 0
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var currentPrefix = doc.getString('prefix') || ''
      var upperPrefix = currentPrefix.toUpperCase()
      var needsUpdate = false

      var fixedPrefix = PREFIX_FIXES[upperPrefix]
      if (fixedPrefix && fixedPrefix !== currentPrefix) {
        doc.set('prefix', fixedPrefix)
        needsUpdate = true
      }

      var prefixForCompany = (doc.getString('prefix') || '').toUpperCase()
      var currentCompanyId = doc.getString('company_id') || ''
      if (prefixForCompany.endsWith('-KS') && KOALA_ID && currentCompanyId !== KOALA_ID) {
        doc.set('company_id', KOALA_ID)
        needsUpdate = true
      } else if (prefixForCompany.endsWith('-PSC') && PSC_ID && currentCompanyId !== PSC_ID) {
        doc.set('company_id', PSC_ID)
        needsUpdate = true
      }

      if (needsUpdate) {
        try {
          app.save(doc)
          updated++
        } catch (err) {
          console.log('Migration 0043: error saving doc ' + doc.id + ': ' + err)
        }
      }
    }

    console.log('Migration 0043: updated ' + updated + ' documents')
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
