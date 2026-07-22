migrate(
  (app) => {
    var companyId = ''
    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          companyId = companies[i].id
          break
        }
      }
    } catch (_) {}

    var checkCol = app.findCollectionByNameOrId('checklists')
    var welderChecklists = []
    try {
      welderChecklists = app.findRecordsByFilter(
        'checklists',
        "role_assigned = 'Welder'",
        'created',
        100,
        0,
      )
    } catch (_) {}

    if (welderChecklists.length === 0) {
      var checklistTitle = 'ASME Sec. VIII Div. 1 - Acompanhamento de EPS/RQ'
      var due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      var rec = new Record(checkCol)
      rec.set('title', checklistTitle)
      rec.set('title_en', 'ASME Sec. VIII Div. 1 - WPS/PQR Tracking')
      rec.set('role_assigned', 'Welder')
      rec.set('mcq_ref', 'ASME Sec. IX')
      rec.set('status', 'pending')
      rec.set('is_critical', true)
      rec.set('due_date', due.toISOString().replace('T', ' '))
      rec.set('category', 'Departmental')
      rec.set('approval_status', 'pending')
      if (companyId) rec.set('company_id', companyId)
      app.save(rec)
    }

    var daCol = app.findCollectionByNameOrId('document_access')

    var existingPrefixes = {}
    try {
      var docs = app.findRecordsByFilter('documents', "prefix != ''", 'created', 500, 0)
      for (var d = 0; d < docs.length; d++) {
        existingPrefixes[docs[d].getString('prefix')] = true
      }
    } catch (_) {}

    if (Object.keys(existingPrefixes).length === 0) {
      try {
        var asmeDocs = app.findRecordsByFilter('documents', "category = 'ASME'", 'created', 100, 0)
        for (var a = 0; a < asmeDocs.length; a++) {
          var doc = asmeDocs[a]
          if (!doc.getString('prefix')) {
            doc.set('prefix', 'WPS')
            doc.set('prefix_en', 'WPS')
            app.save(doc)
            existingPrefixes['WPS'] = true
          }
        }
      } catch (_) {}
    }

    var defaultPrefixes = ['WPS', 'PQR', 'WPQ']
    for (var p = 0; p < defaultPrefixes.length; p++) {
      existingPrefixes[defaultPrefixes[p]] = true
    }

    var prefixesToGrant = Object.keys(existingPrefixes)
    for (var j = 0; j < prefixesToGrant.length; j++) {
      var prefix = prefixesToGrant[j]
      var existing = []
      try {
        existing = app.findRecordsByFilter(
          'document_access',
          "role = 'Welder' && document_prefix = '" + prefix + "'",
          'created',
          1,
          0,
        )
      } catch (_) {}

      if (existing.length === 0) {
        var daRec = new Record(daCol)
        daRec.set('role', 'Welder')
        daRec.set('document_prefix', prefix)
        daRec.set('can_view', true)
        daRec.set('can_edit', false)
        app.save(daRec)
      }
    }
  },
  (app) => {},
)
