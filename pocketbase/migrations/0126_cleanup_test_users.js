// Migration 0126: Cleanup test users and reset João Soldador password
// 1. Delete the 5 test accounts identified by email:
//    - 'consultor.teste@qualihub.com' (Consultor Teste)
//    - 'qcc@psc.com' (Maria QCC)
//    - 'apontador@psc.com' (Apontador PSC)
//    - 'devaldoss@hotmal.com' (Apontador Teste)
//    - 'devaldoss@hotmail.com' (Apontador TESTE 2)
// 2. Safely unlink any existing references in:
//    - checklists (apontador_id, last_action_by, approved_by)
//    - packing_slips (responsible_id)
//    - notifications (delete notifications belonging to these users)
//    - user_allocations (delete allocations belonging to these users)
// 3. Reset João Soldador (welder@psc.com) password to 'Teste@2026'.
// 4. Preserve real users and admin account untouched.

migrate(
  (app) => {
    const targetEmails = [
      'consultor.teste@qualihub.com',
      'qcc@psc.com',
      'apontador@psc.com',
      'devaldoss@hotmal.com',
      'devaldoss@hotmail.com',
    ]

    console.log('Migration 0126: starting cleanup of test accounts...')

    for (let i = 0; i < targetEmails.length; i++) {
      const email = targetEmails[i]
      let userRecord = null

      try {
        userRecord = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        console.log('User not found by email (already removed?): ' + email)
        continue
      }

      if (!userRecord) continue

      const userId = userRecord.id
      console.log('Processing cleanup for user ' + email + ' (ID: ' + userId + ')')

      // 1. Unlink from checklists
      try {
        app
          .db()
          .newQuery("UPDATE checklists SET apontador_id = '' WHERE apontador_id = {:userId}")
          .bind({ userId })
          .execute()

        app
          .db()
          .newQuery("UPDATE checklists SET last_action_by = '' WHERE last_action_by = {:userId}")
          .bind({ userId })
          .execute()

        app
          .db()
          .newQuery("UPDATE checklists SET approved_by = '' WHERE approved_by = {:userId}")
          .bind({ userId })
          .execute()
      } catch (err) {
        console.log('Notice unlinking checklists for ' + userId + ':', err)
      }

      // 2. Unlink from packing_slips
      try {
        app
          .db()
          .newQuery("UPDATE packing_slips SET responsible_id = '' WHERE responsible_id = {:userId}")
          .bind({ userId })
          .execute()
      } catch (err) {
        console.log('Notice unlinking packing_slips for ' + userId + ':', err)
      }

      // 3. Delete notifications for this user
      try {
        app
          .db()
          .newQuery('DELETE FROM notifications WHERE user_id = {:userId}')
          .bind({ userId })
          .execute()
      } catch (err) {
        console.log('Notice deleting notifications for ' + userId + ':', err)
      }

      // 4. Delete user_allocations for this user
      try {
        app
          .db()
          .newQuery('DELETE FROM user_allocations WHERE user_id = {:userId}')
          .bind({ userId })
          .execute()
      } catch (err) {
        console.log('Notice deleting allocations for ' + userId + ':', err)
      }

      // 5. Delete user_certificates if any exist
      try {
        app
          .db()
          .newQuery('DELETE FROM user_certificates WHERE user_id = {:userId}')
          .bind({ userId })
          .execute()
      } catch (err) {
        console.log('Notice deleting certificates for ' + userId + ':', err)
      }

      // 6. Delete user_feedback if any exist
      try {
        app
          .db()
          .newQuery('DELETE FROM user_feedback WHERE user_id = {:userId}')
          .bind({ userId })
          .execute()
      } catch (err) {
        console.log('Notice deleting user_feedback for ' + userId + ':', err)
      }

      // 7. Delete the user record itself
      try {
        app.delete(userRecord)
        console.log('Successfully deleted user ' + email + ' (ID: ' + userId + ')')
      } catch (delErr) {
        console.log('Failed to delete user via app.delete, trying SQL fallback: ' + delErr)
        try {
          app.db().newQuery('DELETE FROM users WHERE id = {:userId}').bind({ userId }).execute()
          console.log('Deleted user via SQL fallback: ' + email)
        } catch (sqlErr) {
          console.log('Could not delete user ' + email + ': ' + sqlErr)
          // As per rule 1: if real conflict, disable user
          userRecord.set('disabled', true)
          app.save(userRecord)
          console.log('Disabled user account instead: ' + email)
        }
      }
    }

    // 8. Reset password for João Soldador (welder@psc.com) to 'Teste@2026'
    try {
      const welderRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'welder@psc.com')
      welderRecord.setPassword('Teste@2026')
      app.save(welderRecord)
      console.log("Successfully reset password for João Soldador (welder@psc.com) to 'Teste@2026'.")
    } catch (welderErr) {
      console.log('Error resetting password for welder@psc.com:', welderErr)
      throw welderErr
    }

    console.log('Migration 0126 finished successfully.')
  },
  (app) => {
    // Revert logic: no-op since test accounts deletion is intentional cleanup
  },
)
