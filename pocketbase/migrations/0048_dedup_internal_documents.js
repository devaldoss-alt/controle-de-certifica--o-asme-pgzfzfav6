migrate(
  (app) => {
    var docs = []
    try {
      docs = app.findRecordsByFilter('documents', "category = 'Internal'", 'created', 10000, 0)
    } catch (e) {
      console.log('Migration 0048: error fetching documents: ' + e)
      return
    }

    if (docs.length === 0) {
      console.log('Migration 0048: no internal documents found')
      return
    }

    function isEmpty(v) {
      if (!v) return true
      var t = v.trim()
      return t === '' || t === '-' || t === '—' || t === '–'
    }

    function scoreRecord(rec) {
      var score = 0
      if (!isEmpty(rec.getString('file'))) score += 100
      if (!isEmpty(rec.getString('effective_date'))) score += 20
      if (!isEmpty(rec.getString('next_review_date'))) score += 10
      if (!isEmpty(rec.getString('sector'))) score += 5
      if (!isEmpty(rec.getString('applicable_document'))) score += 5
      if (!isEmpty(rec.getString('notes'))) score += 5
      if (!isEmpty(rec.getString('origin'))) score += 5
      if (!isEmpty(rec.getString('content'))) score += 3
      if (!isEmpty(rec.getString('code'))) score += 10
      var rd = rec.get('review_deadline_days')
      if (rd !== null && rd !== undefined && rd !== 0) score += 5
      return score
    }

    var groups = {}
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var companyId = doc.getString('company_id') || ''
      var code = doc.getString('code') || ''
      var prefix = doc.getString('prefix') || ''
      var revision = doc.getString('revision') || ''
      var title = (doc.getString('title') || '').trim().toLowerCase()

      if (isEmpty(code)) code = ''
      if (isEmpty(revision)) revision = ''
      if (isEmpty(prefix)) prefix = ''

      var key
      if (code) {
        key =
          'C:' +
          companyId +
          '|' +
          code.toUpperCase() +
          '|' +
          prefix.toUpperCase() +
          '|' +
          revision.toUpperCase()
      } else if (title) {
        key = 'T:' + companyId + '|' + title + '|' + prefix.toUpperCase()
      } else {
        key = 'UNIQUE:' + doc.id
      }

      if (!groups[key]) groups[key] = []
      groups[key].push(doc)
    }

    var deleted = 0
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
        'effective_date',
        'next_review_date',
        'origin',
        'applicable_document',
        'sector',
        'notes',
        'content',
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
      }
      if (changed) {
        try {
          app.save(kept)
        } catch (e) {
          console.log('Migration 0048: merge save error: ' + e)
        }
      }

      for (var d2 = 1; d2 < group.length; d2++) {
        try {
          app.delete(group[d2])
          deleted++
        } catch (err) {
          console.log('Migration 0048: delete error for ' + group[d2].id + ': ' + err)
        }
      }
    }

    var remaining = 0
    try {
      var remainingDocs = app.findRecordsByFilter(
        'documents',
        "category = 'Internal'",
        'created',
        10000,
        0,
      )
      remaining = remainingDocs.length
    } catch (e) {}

    console.log(
      'Migration 0048: deleted ' +
        deleted +
        ' duplicate internal documents, ' +
        remaining +
        ' remaining',
    )
  },
  (app) => {
    // No-op: data cleanup cannot be safely reverted
  },
)
