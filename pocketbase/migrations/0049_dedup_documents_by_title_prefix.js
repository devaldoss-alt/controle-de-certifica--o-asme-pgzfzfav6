migrate(
  (app) => {
    var docs = []
    try {
      docs = app.findRecordsByFilter('documents', "id != ''", 'created', 50000, 0)
    } catch (e) {
      console.log('Migration 0049: error fetching documents: ' + e)
      return
    }

    if (docs.length === 0) {
      console.log('Migration 0049: no documents found')
      return
    }

    function normalizeTitle(title) {
      if (!title) return ''
      var t = title.trim().toLowerCase()
      t = t.replace(/\s+/g, ' ')
      return t
    }

    function normalizePrefix(prefix) {
      if (!prefix) return ''
      var p = prefix.trim().toUpperCase()
      p = p.replace(/\s+/g, ' ')
      return p
    }

    function isEmpty(v) {
      if (v === null || v === undefined) return true
      var t = String(v).trim()
      return t === '' || t === '-' || t === '—' || t === '–'
    }

    function scoreRecord(rec) {
      var score = 0
      if (!isEmpty(rec.getString('file'))) score += 100
      if (!isEmpty(rec.getString('code'))) score += 50
      if (!isEmpty(rec.getString('revision'))) score += 20
      if (!isEmpty(rec.getString('effective_date'))) score += 20
      if (!isEmpty(rec.getString('next_review_date'))) score += 10
      if (!isEmpty(rec.getString('sector'))) score += 5
      if (!isEmpty(rec.getString('applicable_document'))) score += 5
      if (!isEmpty(rec.getString('notes'))) score += 5
      if (!isEmpty(rec.getString('origin'))) score += 5
      if (!isEmpty(rec.getString('content'))) score += 3
      if (!isEmpty(rec.getString('language'))) score += 2
      if (!isEmpty(rec.getString('status'))) score += 2
      if (!isEmpty(rec.getString('document_type'))) score += 2
      if (!isEmpty(rec.getString('category'))) score += 2
      var rd = rec.get('review_deadline_days')
      if (rd !== null && rd !== undefined && rd !== 0) score += 5
      if (!isEmpty(rec.getString('title_en'))) score += 3
      if (!isEmpty(rec.getString('content_en'))) score += 3
      if (!isEmpty(rec.getString('prefix_en'))) score += 3
      return score
    }

    var groups = {}
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var companyId = doc.getString('company_id') || ''
      var normTitle = normalizeTitle(doc.getString('title'))
      var normPrefix = normalizePrefix(doc.getString('prefix'))

      var key = companyId + '|' + normTitle + '|' + normPrefix

      if (!groups[key]) groups[key] = []
      groups[key].push(doc)
    }

    var deleted = 0
    var merged = 0
    var keys = Object.keys(groups)
    for (var k = 0; k < keys.length; k++) {
      var group = groups[keys[k]]
      if (group.length <= 1) continue

      group.sort(function (a, b) {
        var sa = scoreRecord(a)
        var sb = scoreRecord(b)
        if (sb !== sa) return sb - sa
        var ca = a.getString('created') || ''
        var cb = b.getString('created') || ''
        return ca < cb ? -1 : ca > cb ? 1 : 0
      })

      var kept = group[0]
      var mergeFields = [
        'code',
        'revision',
        'effective_date',
        'next_review_date',
        'origin',
        'applicable_document',
        'sector',
        'notes',
        'content',
        'title_en',
        'content_en',
        'prefix_en',
        'language',
        'status',
        'document_type',
        'category',
        'file_path',
      ]
      var changed = false
      for (var d = 1; d < group.length; d++) {
        var dup = group[d]
        for (var f = 0; f < mergeFields.length; f++) {
          var fn = mergeFields[f]
          if (isEmpty(kept.getString(fn)) && !isEmpty(dup.getString(fn))) {
            kept.set(fn, dup.get(fn))
            changed = true
          }
        }
        var rdKept = kept.get('review_deadline_days')
        var rdDup = dup.get('review_deadline_days')
        if (
          (rdKept === null || rdKept === undefined || rdKept === 0) &&
          rdDup !== null &&
          rdDup !== undefined &&
          rdDup !== 0
        ) {
          kept.set('review_deadline_days', rdDup)
          changed = true
        }
        if (isEmpty(kept.getString('file')) && !isEmpty(dup.getString('file'))) {
          kept.set('file', dup.get('file'))
          changed = true
        }
      }
      if (changed) {
        try {
          app.save(kept)
          merged++
        } catch (e) {
          console.log('Migration 0049: merge save error: ' + e)
        }
      }

      for (var d2 = 1; d2 < group.length; d2++) {
        try {
          app.delete(group[d2])
          deleted++
        } catch (err) {
          console.log('Migration 0049: delete error for ' + group[d2].id + ': ' + err)
        }
      }
    }

    var remaining = 0
    try {
      var remainingDocs = app.findRecordsByFilter('documents', "id != ''", 'created', 50000, 0)
      remaining = remainingDocs.length
    } catch (e) {}

    var pscRemaining = 0
    try {
      var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
      var PSC_ID = ''
      for (var c = 0; c < companies.length; c++) {
        var cname = (companies[c].getString('name') || '').toLowerCase()
        var cnameEn = (companies[c].getString('name_en') || '').toLowerCase()
        if (cname.indexOf('psc') !== -1 || cnameEn.indexOf('psc') !== -1) {
          PSC_ID = companies[c].id
          break
        }
      }
      if (PSC_ID) {
        var pscDocs = app.findRecordsByFilter(
          'documents',
          'company_id = "' + PSC_ID + '"',
          'created',
          50000,
          0,
        )
        pscRemaining = pscDocs.length
      }
    } catch (e) {}

    console.log(
      'Migration 0049: deleted ' +
        deleted +
        ' duplicate documents, merged ' +
        merged +
        ' records, ' +
        remaining +
        ' total remaining, PSC remaining: ' +
        pscRemaining,
    )
  },
  (app) => {
    // No-op: data cleanup cannot be safely reverted
  },
)
