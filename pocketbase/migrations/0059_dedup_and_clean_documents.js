migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var KOALA_ID = 'i7kjauu378swxg6'

    try {
      var pscRec = app.findFirstRecordByData(
        'companies',
        'name',
        'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA',
      )
      if (pscRec) PSC_ID = pscRec.id
    } catch (_) {}

    try {
      var koalaRec = app.findFirstRecordByData(
        'companies',
        'name',
        'KOALA SYSTEM INDUSTRIA E COMERCIO LTDA',
      )
      if (koalaRec) KOALA_ID = koalaRec.id
    } catch (_) {}

    function cleanupCompanyDocs(companyId, label) {
      var docs = []
      try {
        docs = app.findRecordsByFilter(
          'documents',
          'company_id = "' + companyId + '" && category = "Internal"',
          'created',
          50000,
          0,
        )
      } catch (e) {
        return
      }

      var seen = {}
      var deleted = 0

      for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]
        var title = (doc.getString('title') || '').trim().toUpperCase()
        var code = (doc.getString('code') || '').trim().toUpperCase()
        var prefix = (doc.getString('prefix') || '').trim().toUpperCase()

        var key = title
        if (!title && code) key = 'CODE:' + code + ':' + prefix

        if (seen[key]) {
          try {
            app.delete(doc)
            deleted++
          } catch (err) {}
        } else {
          seen[key] = true
        }
      }
      console.log(
        'Migration 0059: ' +
          label +
          ' - deleted ' +
          deleted +
          ', unique remaining: ' +
          Object.keys(seen).length,
      )
    }

    cleanupCompanyDocs(PSC_ID, 'PSC INDUSTRIA')
    cleanupCompanyDocs(KOALA_ID, 'KOALA SYSTEM')
  },
  (app) => {},
)
