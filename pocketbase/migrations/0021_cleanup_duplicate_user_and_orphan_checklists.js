migrate(
  (app) => {
    // 1. Remove duplicate manager user (manager@psc.com)
    //    The real user is devaldoss@gmail.com
    let primaryUserId = ''
    try {
      const primaryUser = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
      primaryUserId = primaryUser.id
    } catch (_) {}

    if (primaryUserId) {
      try {
        const duplicateUser = app.findAuthRecordByEmail('_pb_users_auth_', 'manager@psc.com')
        const dupId = duplicateUser.id

        // Reassign checklist references
        app
          .db()
          .newQuery(
            'UPDATE checklists SET last_action_by = {:newId} WHERE last_action_by = {:oldId}',
          )
          .bind({ newId: primaryUserId, oldId: dupId })
          .execute()

        // Reassign indicator references
        app
          .db()
          .newQuery('UPDATE indicators SET responsible = {:newId} WHERE responsible = {:oldId}')
          .bind({ newId: primaryUserId, oldId: dupId })
          .execute()

        // Remove allocations for the duplicate user
        app
          .db()
          .newQuery('DELETE FROM user_allocations WHERE user_id = {:oldId}')
          .bind({ oldId: dupId })
          .execute()

        // Delete the duplicate user record
        app.delete(duplicateUser)
      } catch (_) {}
    }

    // 2. Link orphan checklists (company_id is empty/null) to Koala company
    let koalaCompanyId = ''
    try {
      const koalaCompanies = app.findRecordsByFilter(
        'companies',
        'name ~ "koala" || name_en ~ "koala"',
        'name',
        10,
        0,
      )
      if (koalaCompanies.length > 0) {
        koalaCompanyId = koalaCompanies[0].id
      }
    } catch (_) {}

    if (!koalaCompanyId) {
      try {
        const koalaCompany = app.findFirstRecordByData('companies', 'name', 'KOALA Engenharia')
        koalaCompanyId = koalaCompany.id
      } catch (_) {}
    }

    if (koalaCompanyId) {
      app
        .db()
        .newQuery(
          "UPDATE checklists SET company_id = {:koalaId} WHERE company_id = '' OR company_id IS NULL",
        )
        .bind({ koalaId: koalaCompanyId })
        .execute()
    }
  },
  (app) => {
    // Irreversible data migration — no automatic down
  },
)
