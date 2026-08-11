migrate(
  (app) => {
    var checkCol = app.findCollectionByNameOrId('checklists')
    checkCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    checkCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    checkCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    checkCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    app.save(checkCol)

    var indCol = app.findCollectionByNameOrId('indicators')
    indCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    indCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    indCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || (company_id = @request.auth.primary_company_id && (@request.auth.role = 'Director' || @request.auth.role = 'QCC')))"
    indCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || (company_id = @request.auth.primary_company_id && @request.auth.role = 'Manager'))"
    app.save(indCol)

    var histCol = app.findCollectionByNameOrId('indicator_history')
    histCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    histCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    histCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || (company_id = @request.auth.primary_company_id && (@request.auth.role = 'Director' || @request.auth.role = 'QCC')))"
    histCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || (company_id = @request.auth.primary_company_id && @request.auth.role = 'Manager'))"
    app.save(histCol)

    var soCol = app.findCollectionByNameOrId('service_orders')
    soCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || owner_company_id = @request.auth.primary_company_id)"
    soCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || owner_company_id = @request.auth.primary_company_id)"
    soCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || owner_company_id = @request.auth.primary_company_id)"
    soCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || owner_company_id = @request.auth.primary_company_id)"
    app.save(soCol)

    var interCol = app.findCollectionByNameOrId('interactions')
    interCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    interCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
    app.save(interCol)

    var PSC_ID = ''
    var KOALA_ID = ''

    try {
      PSC_ID = app.findFirstRecordByData('companies', 'name', 'PSC Industria').id
    } catch (_) {}

    try {
      KOALA_ID = app.findFirstRecordByData('companies', 'name', 'Koala System').id
    } catch (_) {}

    if (!PSC_ID || !KOALA_ID) {
      try {
        var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
        for (var i = 0; i < companies.length; i++) {
          var cname = (companies[i].getString('name') || '').toLowerCase()
          var cnameEn = (companies[i].getString('name_en') || '').toLowerCase()
          if (!KOALA_ID && (cname.indexOf('koala') !== -1 || cnameEn.indexOf('koala') !== -1)) {
            KOALA_ID = companies[i].id
          }
          if (!PSC_ID && (cname.indexOf('psc') !== -1 || cnameEn.indexOf('psc') !== -1)) {
            PSC_ID = companies[i].id
          }
        }
      } catch (_) {}
    }

    if (!PSC_ID || !KOALA_ID) {
      console.log(
        'Migration 0053: PSC or Koala not found (PSC=' +
          PSC_ID +
          ', Koala=' +
          KOALA_ID +
          '), skipping cleanup',
      )
      return
    }

    var koalaDocs = []
    try {
      koalaDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + KOALA_ID + '"',
        'created',
        50000,
        0,
      )
    } catch (e) {
      console.log('Migration 0053: error fetching Koala docs: ' + e)
    }

    var koalaKeys = {}
    for (var j = 0; j < koalaDocs.length; j++) {
      var kCode = koalaDocs[j].getString('code') || ''
      var kRev = koalaDocs[j].getString('revision') || ''
      var kTitle = (koalaDocs[j].getString('title') || '').trim()
      if (kCode) koalaKeys[kCode + '|' + kRev] = true
      if (kTitle) koalaKeys['t|' + kTitle] = true
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
      console.log('Migration 0053: error fetching PSC docs: ' + e)
      return
    }

    var deleted = 0
    for (var k = 0; k < pscDocs.length; k++) {
      var pCode = pscDocs[k].getString('code') || ''
      var pRev = pscDocs[k].getString('revision') || ''
      var pTitle = (pscDocs[k].getString('title') || '').trim()
      if ((pCode && koalaKeys[pCode + '|' + pRev]) || (pTitle && koalaKeys['t|' + pTitle])) {
        try {
          app.delete(pscDocs[k])
          deleted++
        } catch (e) {
          console.log('Migration 0053: cross-company delete error: ' + e)
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
      pscDocs2 = pscDocs
    }

    var seenKeys = {}
    for (var m = 0; m < pscDocs2.length; m++) {
      var code = pscDocs2[m].getString('code') || ''
      var rev = pscDocs2[m].getString('revision') || ''
      if (code) {
        var key = code + '|' + rev
        if (seenKeys[key]) {
          try {
            app.delete(pscDocs2[m])
            deleted++
          } catch (e) {
            console.log('Migration 0053: dedup delete error: ' + e)
          }
        } else {
          seenKeys[key] = true
        }
      }
    }

    var pscDocs3 = []
    try {
      pscDocs3 = app.findRecordsByFilter(
        'documents',
        'company_id = "' + PSC_ID + '" && category = "Internal"',
        'created',
        50000,
        0,
      )
    } catch (e) {
      pscDocs3 = pscDocs2
    }

    var seenTitles = {}
    for (var t = 0; t < pscDocs3.length; t++) {
      var title = (pscDocs3[t].getString('title') || '').trim()
      var tCode = pscDocs3[t].getString('code') || ''
      if (title && !tCode) {
        if (seenTitles[title]) {
          try {
            app.delete(pscDocs3[t])
            deleted++
          } catch (e) {
            console.log('Migration 0053: title dedup delete error: ' + e)
          }
        } else {
          seenTitles[title] = true
        }
      }
    }

    console.log(
      'Migration 0053: deleted ' +
        deleted +
        ' duplicate/misdirected documents from PSC. PSC ID: ' +
        PSC_ID +
        ', Koala ID: ' +
        KOALA_ID,
    )
  },
  (app) => {
    // No-op: data cleanup and rule changes cannot be safely reverted
  },
)
