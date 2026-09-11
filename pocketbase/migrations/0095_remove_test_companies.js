// Migration 0095 — Remove test companies ("Empresa A" and "Empresa B") and their linked test records
// Ensuring no foreign key / relation constraints break, and no real data (PSC, KOALA SYSTEM, GENTI) is touched.

migrate(
  (app) => {
    var db = app.db()

    // 1. Identify the test companies by name
    var testCompanyNames = ['Empresa A', 'Empresa B']
    var testCompanyIds = []

    for (var i = 0; i < testCompanyNames.length; i++) {
      try {
        var comp = app.findFirstRecordByData('companies', 'name', testCompanyNames[i])
        if (comp && comp.id) {
          testCompanyIds.push(comp.id)
        }
      } catch (_) {}
    }

    if (testCompanyIds.length === 0) {
      console.log('Migration 0095: No test companies ("Empresa A", "Empresa B") found to delete.')
      return
    }

    var idFilterList = testCompanyIds
      .map(function (id) {
        return "'" + id + "'"
      })
      .join(', ')

    console.log('Migration 0095: Found test company IDs:', testCompanyIds.join(', '))

    // 2. Clean up or unlink references across all collections

    // 2.1 user_allocations pointing to test companies
    try {
      db.newQuery(
        'DELETE FROM user_allocations WHERE company_id IN (' + idFilterList + ')',
      ).execute()
      console.log('Migration 0095: Cleaned user_allocations for test companies.')
    } catch (e) {
      console.log('Migration 0095: Error deleting user_allocations:', e)
    }

    // 2.2 users: delete test users created specifically for Empresa A and B,
    // and unset primary_company_id for any other user if applicable
    var testUserEmails = ['teste_empresa_a@teste.com', 'teste_empresa_b@teste.com']
    for (var u = 0; u < testUserEmails.length; u++) {
      try {
        var userRec = app.findAuthRecordByEmail('_pb_users_auth_', testUserEmails[u])
        if (userRec) {
          // delete any allocations remaining for this user
          try {
            db.newQuery(
              "DELETE FROM user_allocations WHERE user_id = '" + userRec.id + "'",
            ).execute()
          } catch (_) {}
          app.delete(userRec)
          console.log('Migration 0095: Deleted test user:', testUserEmails[u])
        }
      } catch (_) {}
    }

    // Any remaining user that had primary_company_id pointing to Empresa A or B: set to NULL or empty
    try {
      db.newQuery(
        'UPDATE users SET primary_company_id = "" WHERE primary_company_id IN (' +
          idFilterList +
          ')',
      ).execute()
    } catch (e) {
      console.log('Migration 0095: Error unlinking users primary_company_id:', e)
    }

    // 2.3 module_permissions for test companies
    try {
      db.newQuery(
        'DELETE FROM module_permissions WHERE company_id IN (' + idFilterList + ')',
      ).execute()
      console.log('Migration 0095: Cleaned module_permissions for test companies.')
    } catch (e) {
      console.log('Migration 0095: Error deleting module_permissions:', e)
    }

    // 2.4 document_permissions for test companies
    try {
      db.newQuery(
        'DELETE FROM document_permissions WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (e) {
      console.log('Migration 0095: Error deleting document_permissions:', e)
    }

    // 2.5 team records linked to test companies (and their related training/reading sessions if any)
    try {
      // Find team ids for test companies
      var teamRows = app.findRecordsByFilter(
        'team',
        'company_id IN (' + idFilterList + ')',
        '',
        500,
        0,
      )
      for (var t = 0; t < teamRows.length; t++) {
        var tId = teamRows[t].id
        // Delete dependent records pointing to this team member if any
        try {
          db.newQuery(
            "DELETE FROM training_participants WHERE team_member = '" + tId + "'",
          ).execute()
        } catch (_) {}
        try {
          db.newQuery(
            "DELETE FROM document_reading_sessions WHERE team_member_id = '" + tId + "'",
          ).execute()
        } catch (_) {}
        try {
          db.newQuery("DELETE FROM quiz_attempts WHERE team_member_id = '" + tId + "'").execute()
        } catch (_) {}
        try {
          db.newQuery("DELETE FROM document_permissions WHERE team_id = '" + tId + "'").execute()
        } catch (_) {}
        app.delete(teamRows[t])
      }
      console.log(
        'Migration 0095: Cleaned team records for test companies (' + teamRows.length + ').',
      )
    } catch (e) {
      console.log('Migration 0095: Error deleting team records:', e)
    }

    // 2.6 checklists for test companies (e.g. from 0030 seed)
    try {
      db.newQuery('DELETE FROM checklists WHERE company_id IN (' + idFilterList + ')').execute()
      console.log('Migration 0095: Cleaned checklists for test companies.')
    } catch (e) {
      console.log('Migration 0095: Error deleting checklists:', e)
    }

    // 2.7 documents for test companies (e.g. from 0030 seed)
    try {
      // Also clean any reading sessions/quizzes referencing these documents
      var docRows = app.findRecordsByFilter(
        'documents',
        'company_id IN (' + idFilterList + ')',
        '',
        500,
        0,
      )
      for (var d = 0; d < docRows.length; d++) {
        var docId = docRows[d].id
        try {
          db.newQuery(
            "DELETE FROM document_reading_sessions WHERE document_id = '" + docId + "'",
          ).execute()
        } catch (_) {}
        try {
          db.newQuery("DELETE FROM quiz_attempts WHERE document_id = '" + docId + "'").execute()
        } catch (_) {}
        try {
          db.newQuery("DELETE FROM document_quizzes WHERE document_id = '" + docId + "'").execute()
        } catch (_) {}
        app.delete(docRows[d])
      }
      console.log('Migration 0095: Cleaned documents for test companies (' + docRows.length + ').')
    } catch (e) {
      console.log('Migration 0095: Error deleting documents:', e)
    }

    // 2.8 service_orders for test companies (e.g. OS-2025-001, OS-2025-002)
    try {
      db.newQuery(
        'DELETE FROM service_orders WHERE owner_company_id IN (' + idFilterList + ')',
      ).execute()
      console.log('Migration 0095: Cleaned service_orders for test companies.')
    } catch (e) {
      console.log('Migration 0095: Error deleting service_orders:', e)
    }

    // 2.9 Other possible collections defensively cleaned
    try {
      db.newQuery('DELETE FROM notifications WHERE company_id IN (' + idFilterList + ')').execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM non_conformities WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery('DELETE FROM indicators WHERE company_id IN (' + idFilterList + ')').execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM indicator_history WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM user_certificates WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery('DELETE FROM packing_slips WHERE company_id IN (' + idFilterList + ')').execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM inventory_items WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM stock_movements WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM material_requisitions WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM purchase_requests WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery('DELETE FROM suppliers WHERE company_id IN (' + idFilterList + ')').execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM supplier_evaluations WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM purchase_quotes WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM training_plan_actions WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery(
        'DELETE FROM training_attendance_lists WHERE company_id IN (' + idFilterList + ')',
      ).execute()
    } catch (_) {}
    try {
      db.newQuery('DELETE FROM user_feedback WHERE company_id IN (' + idFilterList + ')').execute()
    } catch (_) {}
    try {
      db.newQuery('DELETE FROM interactions WHERE company_id IN (' + idFilterList + ')').execute()
    } catch (_) {}

    // 3. Finally, delete the test companies themselves
    for (var c = 0; c < testCompanyIds.length; c++) {
      try {
        var compRecord = app.findFirstRecordByData('companies', 'id', testCompanyIds[c])
        app.delete(compRecord)
        console.log('Migration 0095: Deleted company record ID:', testCompanyIds[c])
      } catch (err) {
        // Fallback raw query if find throws
        try {
          db.newQuery("DELETE FROM companies WHERE id = '" + testCompanyIds[c] + "'").execute()
          console.log('Migration 0095: Deleted company record via raw query ID:', testCompanyIds[c])
        } catch (rawErr) {
          console.log(
            'Migration 0095: Failed to delete company ID ' + testCompanyIds[c] + ':',
            rawErr,
          )
        }
      }
    }

    console.log('Migration 0095 completed successfully.')
  },
  (app) => {
    // Revert is intentionally non-destructive — test seed data should not be resurrected
  },
)
