migrate(
  (app) => {
    function extractCodeFromTitle(title) {
      if (!title) return ''
      var trimmed = title.trim()
      var match = trimmed.match(/^[^\d]+?\s+(\d+(?:[\.\-]\d+)*)/)
      if (match) return match[1]
      match = trimmed.match(/^(\d+(?:[\.\-]\d+)*)/)
      if (match) return match[1]
      match = trimmed.match(/\b(\d+[\.\-]\d+(?:[\.\-]\d+)*)\b/)
      if (match) return match[1]
      match = trimmed.match(/\b(\d{2,})\b/)
      if (match) return match[1]
      return ''
    }

    var companies = []
    try {
      companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
    } catch (_) {
      console.log('Migration 0047: no companies found')
      return
    }

    var PSC_ID = ''
    for (var i = 0; i < companies.length; i++) {
      var cname = (companies[i].getString('name') || '').toLowerCase()
      var cnameEn = (companies[i].getString('name_en') || '').toLowerCase()
      if (cname.indexOf('psc') !== -1 || cnameEn.indexOf('psc') !== -1) {
        PSC_ID = companies[i].id
        break
      }
    }

    if (!PSC_ID) {
      console.log('Migration 0047: PSC company not found, skipping')
      return
    }

    var docs = []
    try {
      docs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + PSC_ID + '" && (code = "" || code = null)',
        'created',
        5000,
        0,
      )
    } catch (_) {
      console.log('Migration 0047: no PSC documents found with empty code')
      return
    }

    var backfilled = 0
    for (var j = 0; j < docs.length; j++) {
      var doc = docs[j]
      var title = doc.getString('title') || ''
      var titleEn = doc.getString('title_en') || ''
      var extractedCode = extractCodeFromTitle(title)
      if (!extractedCode && titleEn) {
        extractedCode = extractCodeFromTitle(titleEn)
      }
      if (extractedCode) {
        doc.set('code', extractedCode)
        try {
          app.save(doc)
          backfilled++
        } catch (err) {
          console.log('Migration 0047: error saving doc ' + doc.id + ': ' + err)
        }
      }
    }

    console.log('Migration 0047: backfilled ' + backfilled + ' PSC document codes')
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
