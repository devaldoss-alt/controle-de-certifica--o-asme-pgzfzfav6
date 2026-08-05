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

    var deleted = 0
    try {
      var dedupRes = app
        .db()
        .newQuery(
          'DELETE FROM documents ' +
            'WHERE id IN (' +
            '  SELECT id FROM (' +
            '    SELECT id, ROW_NUMBER() OVER (' +
            '      PARTITION BY code, prefix, revision ' +
            '      ORDER BY ' +
            '        CASE WHEN file IS NOT NULL AND file != "" THEN 0 ELSE 1 END, ' +
            '        CASE WHEN effective_date IS NOT NULL AND effective_date != "" THEN 0 ELSE 1 END, ' +
            '        CASE WHEN sector IS NOT NULL AND sector != "" THEN 0 ELSE 1 END, ' +
            '        CASE WHEN applicable_document IS NOT NULL AND applicable_document != "" THEN 0 ELSE 1 END, ' +
            '        CASE WHEN notes IS NOT NULL AND notes != "" THEN 0 ELSE 1 END, ' +
            '        CASE WHEN origin IS NOT NULL AND origin != "" THEN 0 ELSE 1 END, ' +
            '        updated DESC' +
            '    ) AS rn ' +
            '    FROM documents ' +
            '    WHERE company_id = {:psc} ' +
            '      AND code IS NOT NULL AND code != "" ' +
            '  ) WHERE rn > 1' +
            ') ' +
            'AND company_id = {:psc}',
        )
        .bind({ psc: PSC_ID })
        .execute()
      deleted = dedupRes.changes || 0
    } catch (err) {
      console.log('Migration 0040: Dedup error: ' + err)
    }

    console.log('Migration 0040: reassigned=' + reassigned + ', deleted=' + deleted)
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
