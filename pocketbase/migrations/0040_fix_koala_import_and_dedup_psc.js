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
        } else if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
        }
      }
    } catch (_) {}

    if (!PSC_ID || !KOALA_ID) {
      console.log('Migration 0040: PSC or Koala company not found, skipping')
      return
    }

    // Step 1: Reassign Koala System documents from PSC to Koala
    // Match by origin field containing "koala" (case-insensitive, ~ operator)
    var reassigned = 0
    try {
      var koalaDocs = app.findRecordsByFilter(
        'documents',
        "company_id = '" + PSC_ID + "' && origin ~ 'koala'",
        'created',
        1000,
        0,
      )
      for (var k = 0; k < koalaDocs.length; k++) {
        koalaDocs[k].set('company_id', KOALA_ID)
        app.save(koalaDocs[k])
        reassigned++
      }
    } catch (_) {}

    // Fallback: if origin match yielded nothing, try matching by title containing "koala"
    if (reassigned === 0) {
      try {
        var koalaTitleDocs = app.findRecordsByFilter(
          'documents',
          "company_id = '" + PSC_ID + "' && title ~ 'koala'",
          'created',
          1000,
          0,
        )
        for (var kt = 0; kt < koalaTitleDocs.length; kt++) {
          koalaTitleDocs[kt].set('company_id', KOALA_ID)
          app.save(koalaTitleDocs[kt])
          reassigned++
        }
      } catch (_) {}
    }

    // Step 2: Deduplicate PSC documents by (code + prefix + revision + title)
    // Keep the most complete record (has file, most fields filled, most recent updated)
    var pscDocs = []
    try {
      pscDocs = app.findRecordsByFilter(
        'documents',
        "company_id = '" + PSC_ID + "'",
        '-updated',
        5000,
        0,
      )
    } catch (_) {}

    var dedupMap = {}
    for (var d = 0; d < pscDocs.length; d++) {
      var doc = pscDocs[d]
      var key =
        (doc.getString('code') || '') +
        '||' +
        (doc.getString('prefix') || '') +
        '||' +
        (doc.getString('revision') || '') +
        '||' +
        (doc.getString('title') || '')

      if (!dedupMap[key]) {
        dedupMap[key] = []
      }
      dedupMap[key].push(doc)
    }

    var deleted = 0
    for (var key in dedupMap) {
      if (dedupMap[key].length > 1) {
        var group = dedupMap[key]
        var bestIdx = 0
        var bestScore = -1
        for (var g = 0; g < group.length; g++) {
          var score = 0
          if (group[g].getString('file') && group[g].getString('file') !== '') score += 1000
          if (group[g].getString('effective_date')) score += 10
          if (group[g].getString('sector')) score += 5
          if (group[g].getString('applicable_document')) score += 5
          if (group[g].getString('notes')) score += 5
          if (group[g].getString('origin')) score += 5
          // Earlier index = more recent (sorted by -updated)
          score += group.length - g
          if (score > bestScore) {
            bestScore = score
            bestIdx = g
          }
        }
        for (var g2 = 0; g2 < group.length; g2++) {
          if (g2 !== bestIdx) {
            app.delete(group[g2])
            deleted++
          }
        }
      }
    }

    console.log('Migration 0040: reassigned=' + reassigned + ', deleted=' + deleted)
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
