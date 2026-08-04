migrate(
  (app) => {
    var PSC_ID = ''
    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
          break
        }
      }
    } catch (_) {}

    if (PSC_ID) {
      app
        .db()
        .newQuery(
          'DELETE FROM documents WHERE id IN (' +
            '  SELECT d.id FROM documents d ' +
            '  WHERE d.company_id = {:psc} ' +
            "    AND d.prefix IS NOT NULL AND d.prefix != '' " +
            "    AND d.code IS NOT NULL AND d.code != '' " +
            '    AND EXISTS (' +
            '      SELECT 1 FROM documents e ' +
            '      WHERE e.company_id = d.company_id ' +
            '        AND e.prefix = d.prefix ' +
            '        AND e.code = d.code ' +
            '        AND (e.created < d.created OR (e.created = d.created AND e.id < d.id))' +
            '    )' +
            ')',
        )
        .bind({ psc: PSC_ID })
        .execute()

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

      var docs = []
      try {
        docs = app.findRecordsByFilter(
          'documents',
          "company_id = '" + PSC_ID + "'",
          'created',
          2000,
          0,
        )
      } catch (_) {}

      var prefixUpdated = 0
      var companyUpdated = 0

      for (var j = 0; j < docs.length; j++) {
        var doc = docs[j]
        var changed = false

        if (!doc.getString('company_id')) {
          doc.set('company_id', PSC_ID)
          changed = true
          companyUpdated++
        }

        var currentPrefix = doc.getString('prefix')
        if (!currentPrefix) {
          var code = doc.getString('code')
          if (code) {
            var matchedPrefix = ''
            var upperCode = code.toUpperCase()
            for (var k = 0; k < KNOWN_PREFIXES.length; k++) {
              if (upperCode.indexOf(KNOWN_PREFIXES[k]) === 0) {
                matchedPrefix = KNOWN_PREFIXES[k]
                break
              }
            }
            if (!matchedPrefix) {
              var match = code.match(/^[A-Za-z][A-Za-z\-]*/)
              if (match) matchedPrefix = match[0].toUpperCase()
            }
            if (matchedPrefix) {
              doc.set('prefix', matchedPrefix)
              changed = true
              prefixUpdated++
            }
          }
        }

        if (changed) app.save(doc)
      }

      console.log(
        'Dedup + normalize PSC: prefix fixed=' +
          prefixUpdated +
          ', company fixed=' +
          companyUpdated,
      )
    }

    var docCol = app.findCollectionByNameOrId('documents')
    docCol.addIndex('idx_documents_prefix', false, 'prefix', '')
    docCol.listRule = "@request.auth.id != ''"
    docCol.viewRule = "@request.auth.id != ''"
    app.save(docCol)
  },
  (app) => {
    var docCol = app.findCollectionByNameOrId('documents')
    docCol.removeIndex('idx_documents_prefix')
    app.save(docCol)
  },
)
