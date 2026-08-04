migrate(
  (app) => {
    var docs = app.findRecordsByFilter('documents', "id != ''", '-created', 1000, 0)

    var updated = 0
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var currentPrefix = doc.getString('prefix')
      if (currentPrefix) continue

      var code = doc.getString('code')
      if (!code) continue

      var match = code.match(/^[A-Za-z]+/)
      if (!match) continue

      var prefix = match[0].toUpperCase()
      doc.set('prefix', prefix)
      app.save(doc)
      updated++
    }

    console.log('Backfilled ' + updated + ' document prefixes')
  },
  (app) => {
    // No-op: backfill is not reversible
  },
)
