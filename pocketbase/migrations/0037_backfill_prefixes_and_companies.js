migrate(
  (app) => {
    var docs = app.findRecordsByFilter('documents', "id != ''", '-created', 1000, 0)

    var KOALA_ID = ''
    var PSC_ID = ''
    var GENTI_ID = ''
    var FIRST_COMPANY_ID = ''

    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (!FIRST_COMPANY_ID) FIRST_COMPANY_ID = companies[i].id
        if (name.indexOf('koala') !== -1 || nameEn.indexOf('koala') !== -1) {
          KOALA_ID = companies[i].id
        } else if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
        } else if (name.indexOf('genti') !== -1 || nameEn.indexOf('genti') !== -1) {
          GENTI_ID = companies[i].id
        }
      }
    } catch (_) {}

    var prefixUpdated = 0
    var companyUpdated = 0

    var KNOWN_PREFIXES = [
      'ASME PSC',
      'CDE-PS',
      'CQS-PSC',
      'EVS-PSC',
      'FSGQ',
      'ISSGQ',
      'IT-CQ',
      'ITSGQ',
      'LP-KS',
      'MCQ',
      'MSGQ',
      'PR-CQ',
      'PSGQ',
    ]

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var changed = false

      var currentPrefix = doc.getString('prefix')
      if (!currentPrefix) {
        var code = doc.getString('code')
        if (code) {
          var matchedPrefix = ''
          var upperCode = code.toUpperCase()
          for (var j = 0; j < KNOWN_PREFIXES.length; j++) {
            if (upperCode.indexOf(KNOWN_PREFIXES[j]) === 0) {
              matchedPrefix = KNOWN_PREFIXES[j]
              break
            }
          }
          if (!matchedPrefix) {
            var match = code.match(/^[A-Za-z][A-Za-z\-]*/)
            if (match) {
              matchedPrefix = match[0].toUpperCase()
            }
          }
          if (matchedPrefix) {
            doc.set('prefix', matchedPrefix)
            changed = true
            prefixUpdated++
          }
        }
      }

      var currentCompany = doc.getString('company_id')
      if (!currentCompany) {
        var category = doc.getString('category')
        var assignedCompany = ''
        if (category === 'ISO' && KOALA_ID) {
          assignedCompany = KOALA_ID
        } else if (PSC_ID) {
          assignedCompany = PSC_ID
        } else if (GENTI_ID) {
          assignedCompany = GENTI_ID
        } else if (FIRST_COMPANY_ID) {
          assignedCompany = FIRST_COMPANY_ID
        }
        if (assignedCompany) {
          doc.set('company_id', assignedCompany)
          changed = true
          companyUpdated++
        }
      }

      if (changed) app.save(doc)
    }

    console.log(
      'Backfilled ' + prefixUpdated + ' document prefixes and ' + companyUpdated + ' company_ids',
    )
  },
  (app) => {},
)
