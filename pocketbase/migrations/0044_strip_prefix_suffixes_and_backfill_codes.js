migrate(
  (app) => {
    function normalizeDocPrefix(prefix) {
      var upper = (prefix || '').trim().toUpperCase()
      if (!upper) return ''
      var normalized = upper.replace(/[\s_]+/g, '-')
      if (normalized === 'ASME-PSC') return 'ASME PSC'
      var fixes = {
        'CDE-PS': 'CDE',
        CDEPS: 'CDE',
        'CDE-PSC': 'CDE',
        'CQS-PS': 'CQS',
        CQSPS: 'CQS',
        'CQS-PSC': 'CQS',
        'EVS-PS': 'EVS',
        EVSPS: 'EVS',
        'EVS-PSC': 'EVS',
        'LP-KS': 'LP',
        LPKS: 'LP',
        'LP-KS ': 'LP',
      }
      if (fixes[normalized]) return fixes[normalized]
      if (normalized.endsWith('-PSC')) return normalized.slice(0, -4)
      if (normalized.endsWith('-KS')) return normalized.slice(0, -3)
      return upper
    }

    function extractCodeFromTitle(title) {
      if (!title) return ''
      var match = title.match(/^[A-Z][A-Z\s\-]*\s+([\d]+(?:\.[\d]+)*)/i)
      if (match) return match[1]
      match = title.match(/^([\d]+(?:\.[\d]+)*)/)
      if (match) return match[1]
      return ''
    }

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
      docs = app.findRecordsByFilter('documents', "id != ''", 'created', 5000, 0)
    } catch (_) {
      console.log('Migration 0044: no documents found')
      return
    }

    var updated = 0
    var codeBackfilled = 0

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var currentPrefix = doc.getString('prefix') || ''
      var needsUpdate = false

      var newPrefix = normalizeDocPrefix(currentPrefix)

      if (newPrefix && newPrefix !== currentPrefix) {
        var upperForCheck = currentPrefix.toUpperCase().replace(/[\s_]+/g, '-')
        if (upperForCheck.endsWith('-KS') && KOALA_ID) {
          if ((doc.getString('company_id') || '') !== KOALA_ID) {
            doc.set('company_id', KOALA_ID)
          }
        } else if ((upperForCheck.endsWith('-PSC') || upperForCheck === 'CDE-PS') && PSC_ID) {
          if ((doc.getString('company_id') || '') !== PSC_ID) {
            doc.set('company_id', PSC_ID)
          }
        }
        doc.set('prefix', newPrefix)
        needsUpdate = true
      }

      var currentCode = doc.getString('code') || ''
      if (!currentCode) {
        var title = doc.getString('title') || ''
        var extractedCode = extractCodeFromTitle(title)
        if (extractedCode) {
          doc.set('code', extractedCode)
          needsUpdate = true
          codeBackfilled++
        }
      }

      if (needsUpdate) {
        try {
          app.save(doc)
          updated++
        } catch (err) {
          console.log('Migration 0044: error saving doc ' + doc.id + ': ' + err)
        }
      }
    }

    console.log(
      'Migration 0044: updated ' + updated + ' documents, backfilled ' + codeBackfilled + ' codes',
    )

    var accessRecords = []
    try {
      accessRecords = app.findRecordsByFilter('document_access', "id != ''", 'role', 500, 0)
    } catch (_) {}

    var accessUpdated = 0
    for (var j = 0; j < accessRecords.length; j++) {
      var acc = accessRecords[j]
      var accPrefix = acc.getString('document_prefix') || ''
      var accNewPrefix = normalizeDocPrefix(accPrefix)
      if (accNewPrefix && accNewPrefix !== accPrefix) {
        acc.set('document_prefix', accNewPrefix)
        try {
          app.save(acc)
          accessUpdated++
        } catch (err) {
          console.log('Migration 0044: error saving access ' + acc.id + ': ' + err)
        }
      }
    }

    console.log('Migration 0044: updated ' + accessUpdated + ' document_access records')
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
