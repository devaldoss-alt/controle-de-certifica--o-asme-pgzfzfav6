migrate(
  (app) => {
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

    if (!KOALA_ID) {
      console.log('Migration 0054: Koala company not found, skipping')
      return
    }

    var checkCol = app.findCollectionByNameOrId('checklists')

    var pscChecklists = []
    if (PSC_ID) {
      try {
        pscChecklists = app.findRecordsByFilter(
          'checklists',
          'company_id = "' + PSC_ID + '" && category = "ISO 9001"',
          'created',
          500,
          0,
        )
      } catch (e) {
        console.log('Migration 0054: error fetching PSC ISO 9001 checklists: ' + e)
      }
    }

    if (pscChecklists.length === 0) {
      try {
        pscChecklists = app.findRecordsByFilter(
          'checklists',
          'category = "ISO 9001"',
          'created',
          500,
          0,
        )
      } catch (e) {
        console.log('Migration 0054: error fetching ISO 9001 checklists: ' + e)
      }
    }

    var seededChecklists = 0
    for (var j = 0; j < pscChecklists.length; j++) {
      var src = pscChecklists[j]
      var srcTitle = src.getString('title')
      var srcCompanyId = src.getString('company_id')

      if (srcCompanyId === KOALA_ID) continue

      var exists = false
      try {
        var existing = app.findRecordsByFilter(
          'checklists',
          'company_id = "' + KOALA_ID + '" && title = {:title}',
          'created',
          1,
          0,
          { title: srcTitle },
        )
        if (existing.length > 0) exists = true
      } catch (_) {}

      if (exists) continue

      var rec = new Record(checkCol)
      rec.set('title', srcTitle)
      rec.set('title_en', src.getString('title_en') || '')
      rec.set('description', src.getString('description') || '')
      rec.set('description_en', src.getString('description_en') || '')
      rec.set('role_assigned', src.getString('role_assigned') || '')
      rec.set('mcq_ref', src.getString('mcq_ref') || '')
      rec.set('status', src.getString('status') || 'pending')
      rec.set('due_date', src.getString('due_date') || '')
      rec.set('is_critical', src.getBool('is_critical'))
      rec.set('category', 'ISO 9001')
      rec.set('approval_status', src.getString('approval_status') || 'pending')
      rec.set('rejection_comment', src.getString('rejection_comment') || '')
      rec.set('locked', src.getBool('locked'))
      rec.set('evidence_notes', src.getString('evidence_notes') || '')
      rec.set('tutorial', src.getString('tutorial') || '')
      rec.set('company_id', KOALA_ID)

      try {
        app.save(rec)
        seededChecklists++
      } catch (e) {
        console.log('Migration 0054: error saving checklist "' + srcTitle + '": ' + e)
      }
    }

    console.log('Migration 0054: seeded ' + seededChecklists + ' ISO 9001 checklists for Koala')

    var indCol = app.findCollectionByNameOrId('indicators')

    var pscIndicators = []
    if (PSC_ID) {
      try {
        pscIndicators = app.findRecordsByFilter(
          'indicators',
          'company_id = "' + PSC_ID + '"',
          'title',
          500,
          0,
        )
      } catch (e) {
        console.log('Migration 0054: error fetching PSC indicators: ' + e)
      }
    }

    var defaultManagerId = ''
    try {
      defaultManagerId = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com').id
    } catch (_) {}

    var seededIndicators = 0
    for (var k = 0; k < pscIndicators.length; k++) {
      var srcInd = pscIndicators[k]
      var indTitle = srcInd.getString('title')

      var indExists = false
      try {
        var existingInd = app.findRecordsByFilter(
          'indicators',
          'company_id = "' + KOALA_ID + '" && title = {:title}',
          'created',
          1,
          0,
          { title: indTitle },
        )
        if (existingInd.length > 0) indExists = true
      } catch (_) {}

      if (indExists) continue

      var indRec = new Record(indCol)
      indRec.set('title', indTitle)
      indRec.set('formula_description', srcInd.getString('formula_description') || '')
      indRec.set('objective', srcInd.getString('objective') || '')
      indRec.set('unit', srcInd.getString('unit') || '')
      indRec.set('period', srcInd.getString('period') || 'Monthly')
      indRec.set('result_type', srcInd.getString('result_type') || 'Percentual')
      indRec.set('target_value', srcInd.getNum('target_value') || 0)
      indRec.set('target_operator', srcInd.getString('target_operator') || '>=')
      indRec.set('current_value', srcInd.getNum('current_value') || 0)
      indRec.set('verification_method', srcInd.getString('verification_method') || '')

      var responsible = srcInd.getString('responsible') || ''
      if (responsible) {
        indRec.set('responsible', responsible)
      } else if (defaultManagerId) {
        indRec.set('responsible', defaultManagerId)
      }

      indRec.set('company_id', KOALA_ID)

      try {
        app.save(indRec)
        seededIndicators++
      } catch (e) {
        console.log('Migration 0054: error saving indicator "' + indTitle + '": ' + e)
      }
    }

    console.log('Migration 0054: seeded ' + seededIndicators + ' indicators for Koala')
  },
  (app) => {
    // No-op: seed data cannot be safely reverted
  },
)
