migrate(
  (app) => {
    var PSC_ID = ''
    var KOALA_ID = ''

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

    if (!PSC_ID || !KOALA_ID) {
      console.log('Migration 0040: PSC or Koala company not found, skipping')
      return
    }

    // Step 1: Reassign Koala documents from PSC to Koala via raw SQL (fast, no per-record save)
    var reassigned = 0
    try {
      var res1 = app
        .db()
        .newQuery(
          'UPDATE documents SET company_id = {:koala} ' +
            "WHERE company_id = {:psc} AND (origin LIKE '%koala%' OR title LIKE '%koala%')",
        )
        .bind({ koala: KOALA_ID, psc: PSC_ID })
        .execute()
      reassigned = res1.changes || 0
    } catch (err) {
      console.log('Migration 0040: Koala reassignment error: ' + err)
    }

    // Step 2: Deduplicate PSC documents via raw SQL
    // Find duplicate groups first (code+prefix+revision+title with >1 row)
    var dupRows = []
    try {
      var dupQuery = app
        .db()
        .newQuery(
          'SELECT code, prefix, revision, title, COUNT(*) as cnt ' +
            'FROM documents WHERE company_id = {:psc} ' +
            'GROUP BY code, prefix, revision, title ' +
            'HAVING cnt > 1 LIMIT 500',
        )
        .bind({ psc: PSC_ID })

      var result = dupQuery.all()
      dupRows = result || []
    } catch (err) {
      console.log('Migration 0040: Duplicate query error: ' + err)
    }

    var deleted = 0

    // For each duplicate group, fetch the records and keep the best one
    for (var d = 0; d < dupRows.length; d++) {
      var row = dupRows[d]
      var code = row['code'] || ''
      var prefix = row['prefix'] || ''
      var revision = row['revision'] || ''
      var title = row['title'] || ''

      // Build filter to get this group's records, sorted by best-first
      // Best = has file, has effective_date, most recent updated
      var groupFilter =
        "company_id = '" +
        PSC_ID +
        "'" +
        " && code = '" +
        code.replace(/'/g, "''") +
        "'" +
        " && prefix = '" +
        prefix.replace(/'/g, "''") +
        "'" +
        " && revision = '" +
        revision.replace(/'/g, "''") +
        "'" +
        " && title = '" +
        title.replace(/'/g, "''") +
        "'"

      try {
        var groupRecords = app.findRecordsByFilter('documents', groupFilter, '-updated', 100, 0)
        if (groupRecords.length <= 1) continue

        // Score each record to find the best
        var bestIdx = 0
        var bestScore = -1
        for (var g = 0; g < groupRecords.length; g++) {
          var score = 0
          if (groupRecords[g].getString('file') && groupRecords[g].getString('file') !== '')
            score += 1000
          if (groupRecords[g].getString('effective_date')) score += 10
          if (groupRecords[g].getString('sector')) score += 5
          if (groupRecords[g].getString('applicable_document')) score += 5
          if (groupRecords[g].getString('notes')) score += 5
          if (groupRecords[g].getString('origin')) score += 5
          score += groupRecords.length - g
          if (score > bestScore) {
            bestScore = score
            bestIdx = g
          }
        }

        // Delete all non-best records via raw SQL (fast bulk delete)
        var idsToDelete = []
        for (var g2 = 0; g2 < groupRecords.length; g2++) {
          if (g2 !== bestIdx) {
            idsToDelete.push("'" + groupRecords[g2].id + "'")
          }
        }

        if (idsToDelete.length > 0) {
          try {
            var delRes = app
              .db()
              .newQuery('DELETE FROM documents WHERE id IN (' + idsToDelete.join(',') + ')')
              .execute()
            deleted += idsToDelete.length
          } catch (delErr) {
            console.log('Migration 0040: Delete error: ' + delErr)
          }
        }
      } catch (grpErr) {
        console.log('Migration 0040: Group fetch error: ' + grpErr)
      }
    }

    console.log('Migration 0040: reassigned=' + reassigned + ', deleted=' + deleted)
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
