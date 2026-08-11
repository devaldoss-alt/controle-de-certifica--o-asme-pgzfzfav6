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

    if (!PSC_ID || !KOALA_ID) return

    // Re-fetch all documents in PSC
    var pscDocs = []
    try {
      pscDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + PSC_ID + '"',
        'created',
        50000,
        0,
      )
    } catch (e) {}

    // 1. Move Koala documents to Koala company
    for (var i = 0; i < pscDocs.length; i++) {
      var doc = pscDocs[i]
      var rawPrefix = (doc.getString('prefix') || '').trim().toUpperCase()
      var title = (doc.getString('title') || '').trim().toUpperCase()
      var notes = (doc.getString('notes') || '').trim().toUpperCase()
      var appDoc = (doc.getString('applicable_document') || '').trim().toUpperCase()

      if (
        rawPrefix.indexOf('-KS') !== -1 ||
        title.indexOf('KOALA') !== -1 ||
        notes.indexOf('KOALA') !== -1 ||
        appDoc.indexOf('KOALA') !== -1 ||
        appDoc.indexOf('-KS') !== -1
      ) {
        doc.set('company_id', KOALA_ID)
        try {
          app.save(doc)
        } catch (e) {}
      }
    }

    // 2. Perform aggressive deduplication on PSC documents
    // For documents with same (prefix, code, revision) or same (title, code) or same title when category is Internal
    var remainingDocs = []
    try {
      remainingDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + PSC_ID + '"',
        'created',
        50000,
        0,
      )
    } catch (e) {}

    var seenKeys = {}
    var deletedCount = 0

    for (var j = 0; j < remainingDocs.length; j++) {
      var d = remainingDocs[j]
      var prefix = (d.getString('prefix') || '').trim().toUpperCase()
      var code = (d.getString('code') || '').trim()
      var revision = (d.getString('revision') || '').trim()
      var title = (d.getString('title') || '').trim().toUpperCase()

      // Primary key: prefix + code + revision (if code exists)
      var key1 = code ? prefix + '||' + code + '||' + revision : null
      // Secondary key: prefix + title
      var key2 = prefix + '||' + title
      // Tertiary key: title alone
      var key3 = title

      if (key1 && seenKeys['k1:' + key1]) {
        try {
          app.delete(d)
          deletedCount++
          continue
        } catch (e) {}
      }
      if (seenKeys['k2:' + key2]) {
        try {
          app.delete(d)
          deletedCount++
          continue
        } catch (e) {}
      }
      if (seenKeys['k3:' + key3]) {
        try {
          app.delete(d)
          deletedCount++
          continue
        } catch (e) {}
      }

      if (key1) seenKeys['k1:' + key1] = true
      seenKeys['k2:' + key2] = true
      seenKeys['k3:' + key3] = true
    }

    console.log('Migration 0056: Deleted ' + deletedCount + ' duplicates from PSC')
  },
  (app) => {},
)
