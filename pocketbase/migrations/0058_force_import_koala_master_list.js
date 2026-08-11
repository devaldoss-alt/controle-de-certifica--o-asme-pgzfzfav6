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
    } catch (_) {
      try {
        var pscRec2 = app.findFirstRecordByData('companies', 'name', 'PSC Industria')
        if (pscRec2) PSC_ID = pscRec2.id
      } catch (_) {}
    }

    try {
      var koalaRec = app.findFirstRecordByData(
        'companies',
        'name',
        'KOALA SYSTEM INDUSTRIA E COMERCIO LTDA',
      )
      if (koalaRec) KOALA_ID = koalaRec.id
    } catch (_) {
      try {
        var koalaRec2 = app.findFirstRecordByData('companies', 'name', 'Koala System')
        if (koalaRec2) KOALA_ID = koalaRec2.id
      } catch (_) {}
    }

    if (!PSC_ID || !KOALA_ID) {
      console.log('Migration 0058: PSC or Koala company ID not found!')
      return
    }

    var docCol = app.findCollectionByNameOrId('documents')

    // 1. Fetch source documents from PSC (category = Internal)
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
      console.log('Migration 0058: Error fetching PSC docs: ' + e)
      return
    }

    // 2. Fetch existing Koala documents
    var existingKoalaDocs = []
    try {
      existingKoalaDocs = app.findRecordsByFilter(
        'documents',
        'company_id = "' + KOALA_ID + '" && category = "Internal"',
        'created',
        50000,
        0,
      )
    } catch (e) {}

    // Map existing Koala documents by title and code
    var koalaByTitle = {}
    var koalaByCode = {}
    for (var k = 0; k < existingKoalaDocs.length; k++) {
      var kd = existingKoalaDocs[k]
      var kTitle = (kd.getString('title') || '').trim().toUpperCase()
      var kCode = (kd.getString('code') || '').trim().toUpperCase()
      if (kTitle) koalaByTitle[kTitle] = kd
      if (kCode) koalaByCode[kCode] = kd
    }

    var createdCount = 0
    var updatedCount = 0

    // 3. Import / Copy all ~178 PSC documents specifically for Koala System
    for (var i = 0; i < pscDocs.length; i++) {
      var src = pscDocs[i]
      var title = (src.getString('title') || '').trim()
      var code = (src.getString('code') || '').trim()
      var prefix = (src.getString('prefix') || '').trim()
      var upperTitle = title.toUpperCase()
      var upperCode = code.toUpperCase()

      // Determine if matching Koala document already exists
      var targetDoc =
        (upperCode && koalaByCode[upperCode]) || (upperTitle && koalaByTitle[upperTitle])

      if (!targetDoc) {
        targetDoc = new Record(docCol)
        createdCount++
      } else {
        updatedCount++
      }

      targetDoc.set('company_id', KOALA_ID)
      targetDoc.set('category', 'Internal')
      targetDoc.set('title', title)
      targetDoc.set('title_en', src.getString('title_en') || '')
      targetDoc.set('content', src.getString('content') || '')
      targetDoc.set('prefix', prefix || 'FSGQ')
      targetDoc.set('prefix_en', src.getString('prefix_en') || '')
      targetDoc.set('code', code)
      targetDoc.set('revision', src.getString('revision') || '0')
      targetDoc.set('document_type', src.getString('document_type') || 'Record')
      targetDoc.set('effective_date', src.getString('effective_date') || '')
      targetDoc.set('next_review_date', src.getString('next_review_date') || '')
      targetDoc.set('origin', src.getString('origin') || '')
      targetDoc.set('language', src.getString('language') || 'Portuguese')
      targetDoc.set('status', src.getString('status') || 'Active')
      targetDoc.set('applicable_document', src.getString('applicable_document') || '')
      targetDoc.set('sector', src.getString('sector') || 'ADM')
      targetDoc.set('review_deadline_days', src.getInt('review_deadline_days') || 0)
      targetDoc.set('notes', src.getString('notes') || '')

      try {
        app.save(targetDoc)
      } catch (err) {
        console.log('Migration 0058: Error saving Koala doc "' + title + '": ' + err)
      }
    }

    console.log(
      'Migration 0058 complete: Created ' +
        createdCount +
        ', Updated ' +
        updatedCount +
        ' Koala System documents (Total PSC source: ' +
        pscDocs.length +
        ')',
    )
  },
  (app) => {
    // No-op
  },
)
