migrate(
  (app) => {
    var KOALA_ID = 'i7kjauu378swxg6'
    var PSC_ID = 'a631bv695rr4gef'

    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      for (var i = 0; i < companies.length; i++) {
        var name = (companies[i].getString('name') || '').toLowerCase()
        var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
        if (name.indexOf('koala') !== -1 || nameEn.indexOf('koala') !== -1) {
          KOALA_ID = companies[i].id
        } else if (name.indexOf('psc') !== -1 || nameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[i].id
        }
      }
    } catch (_) {}

    var checkCol = app.findCollectionByNameOrId('checklists')

    var allIsoChecklists = app.findRecordsByFilter(
      'checklists',
      "category = 'ISO 9001'",
      'created',
      500,
      0,
    )

    var pscTitles = {}
    var koalaItems = []

    for (var j = 0; j < allIsoChecklists.length; j++) {
      var cl = allIsoChecklists[j]
      var cid = cl.getString('company_id')
      if (cid === PSC_ID) {
        pscTitles[cl.getString('title')] = true
      }
      if (cid === KOALA_ID) {
        koalaItems.push(cl)
      }
    }

    for (var k = 0; k < koalaItems.length; k++) {
      var src = koalaItems[k]
      var srcTitle = src.getString('title')
      if (pscTitles[srcTitle]) continue

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
      rec.set('company_id', PSC_ID)

      var osId = src.getString('os_id')
      if (osId) {
        rec.set('os_id', osId)
      }

      var lastActionBy = src.getString('last_action_by')
      if (lastActionBy) {
        rec.set('last_action_by', lastActionBy)
      }

      app.save(rec)
      pscTitles[srcTitle] = true
    }

    var PREFIXES = [
      'ISO 9001:2015 - ',
      'ASME Sec. VIII Div. 1 - ',
      'ASME Sec. VIII Div. 2 - ',
      'NBIC - ',
    ]

    function hasPrefix(title) {
      for (var p = 0; p < PREFIXES.length; p++) {
        if (title.indexOf(PREFIXES[p]) === 0) return true
      }
      return false
    }

    var soStandards = {}
    try {
      var orders = app.findRecordsByFilter('service_orders', "id != ''", 'created', 200, 0)
      for (var n = 0; n < orders.length; n++) {
        soStandards[orders[n].id] = (orders[n].getString('standard') || '').toLowerCase()
      }
    } catch (_) {}

    var allChecklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 500, 0)
    for (var m = 0; m < allChecklists.length; m++) {
      var item = allChecklists[m]
      var title = item.getString('title')
      if (!title || hasPrefix(title)) continue

      var prefix = ''
      var category = item.getString('category')
      var mcqRef = (item.getString('mcq_ref') || '').toLowerCase()
      var itemOsId = item.getString('os_id')

      if (category === 'ISO 9001' || mcqRef.indexOf('iso 9001') !== -1) {
        prefix = 'ISO 9001:2015 - '
      } else if (itemOsId && soStandards[itemOsId]) {
        var std = soStandards[itemOsId]
        if (std.indexOf('nbic') !== -1) {
          prefix = 'NBIC - '
        } else if (std.indexOf('asme') !== -1) {
          prefix = 'ASME Sec. VIII Div. 1 - '
        } else if (std.indexOf('iso') !== -1) {
          prefix = 'ISO 9001:2015 - '
        } else {
          prefix = 'ASME Sec. VIII Div. 1 - '
        }
      } else {
        prefix = 'ASME Sec. VIII Div. 1 - '
      }

      item.set('title', prefix + title)

      var titleEn = item.getString('title_en')
      if (titleEn && !hasPrefix(titleEn)) {
        item.set('title_en', prefix + titleEn)
      }

      app.save(item)
    }
  },
  (app) => {},
)
