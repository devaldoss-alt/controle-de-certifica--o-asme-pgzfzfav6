migrate(
  (app) => {
    var PSC_ID = ''
    var KOALA_ID = ''

    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('koala') !== -1 || nameEn.indexOf('koala') !== -1) {
          KOALA_ID = companies[i].id
        }
        if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          if (companies[i].id !== KOALA_ID) {
            PSC_ID = companies[i].id
          }
        }
      }
    } catch (_) {}

    if (!PSC_ID || !KOALA_ID || PSC_ID === KOALA_ID) {
      console.log(
        'Migration 0052: PSC or Koala company not found (PSC=' +
          PSC_ID +
          ', Koala=' +
          KOALA_ID +
          '), skipping',
      )
      return
    }

    var pscDocs = []
    try {
      pscDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + PSC_ID + '" && category = "Internal"',
        'created',
        50000,
        0,
      )
    } catch (e) {
      console.log('Migration 0052: error fetching PSC documents: ' + e)
      return
    }

    var koalaDocs = []
    try {
      koalaDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + KOALA_ID + '" && category = "Internal"',
        'created',
        50000,
        0,
      )
    } catch (e) {
      console.log('Migration 0052: error fetching Koala documents: ' + e)
    }

    var deleted = 0

    if (koalaDocs.length > 0) {
      var koalaKeys = {}
      for (var j = 0; j < koalaDocs.length; j++) {
        var kCode = koalaDocs[j].getString('code') || ''
        var kRev = koalaDocs[j].getString('revision') || ''
        var kTitle = (koalaDocs[j].getString('title') || '').trim()
        if (kCode) {
          koalaKeys[kCode + '|' + kRev] = true
        }
        if (kTitle) {
          koalaKeys['t|' + kTitle] = true
        }
      }

      for (var k = 0; k < pscDocs.length; k++) {
        var pCode = pscDocs[k].getString('code') || ''
        var pRev = pscDocs[k].getString('revision') || ''
        var pTitle = (pscDocs[k].getString('title') || '').trim()
        if ((pCode && koalaKeys[pCode + '|' + pRev]) || (pTitle && koalaKeys['t|' + pTitle])) {
          try {
            app.delete(pscDocs[k])
            deleted++
          } catch (e) {
            console.log('Migration 0052: cross-company delete error: ' + e)
          }
        }
      }
    }

    var pscDocs2 = []
    try {
      pscDocs2 = app.findRecordsByFilter(
        'documents',
        'company_id = "' + PSC_ID + '" && category = "Internal"',
        'created',
        50000,
        0,
      )
    } catch (e) {
      console.log('Migration 0052: error re-fetching PSC documents: ' + e)
      pscDocs2 = pscDocs
    }

    var codeGroups = {}
    for (var m = 0; m < pscDocs2.length; m++) {
      var code = pscDocs2[m].getString('code') || ''
      var rev = pscDocs2[m].getString('revision') || ''
      if (code) {
        var key = code + '|' + rev
        if (!codeGroups[key]) {
          codeGroups[key] = []
        }
        codeGroups[key].push(m)
      }
    }

    for (var dupKey in codeGroups) {
      if (codeGroups[dupKey].length > 1) {
        for (var n = 1; n < codeGroups[dupKey].length; n++) {
          try {
            app.delete(pscDocs2[codeGroups[dupKey][n]])
            deleted++
          } catch (e) {
            console.log('Migration 0052: within-PSC duplicate delete error: ' + e)
          }
        }
      }
    }

    var titleGroups = {}
    for (var t = 0; t < pscDocs2.length; t++) {
      var title = (pscDocs2[t].getString('title') || '').trim()
      var tCode = pscDocs2[t].getString('code') || ''
      if (title && !tCode) {
        if (!titleGroups[title]) {
          titleGroups[title] = []
        }
        titleGroups[title].push(t)
      }
    }

    for (var titleKey in titleGroups) {
      if (titleGroups[titleKey].length > 1) {
        for (var tn = 1; tn < titleGroups[titleKey].length; tn++) {
          try {
            app.delete(pscDocs2[titleGroups[titleKey][tn]])
            deleted++
          } catch (e) {
            console.log('Migration 0052: title duplicate delete error: ' + e)
          }
        }
      }
    }

    console.log(
      'Migration 0052: deleted ' +
        deleted +
        ' misdirected Koala documents from PSC company. PSC had ' +
        pscDocs.length +
        ' internal docs before cleanup, Koala had ' +
        koalaDocs.length +
        ' internal docs. PSC ID: ' +
        PSC_ID +
        ', Koala ID: ' +
        KOALA_ID,
    )
  },
  (app) => {
    // No-op: data cleanup cannot be safely reverted
  },
)
