// Migration 0128: Reset Quality Manager password and unlink misdirected checklist from training notification
// 1. Reset password for Quality Manager (devaldoss@gmail.com) to 'Quality@2026' using record.setPassword()
// 2. Unlink notification ihl7dbqz416inco (and any training notification) from checklist plcmt2q67qji7q9 (role Director),
//    so notification click opens the training module directly instead of a checklist from a different role.
// 3. Preserve other users (real users with Proserco@2026, João Soldador with Teste@2026) untouched.

migrate(
  (app) => {
    // 1. Reset password for devaldoss@gmail.com
    try {
      const qmUser = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
      if (qmUser) {
        qmUser.setPassword('Quality@2026')
        app.save(qmUser)
        console.log(
          "Migration 0128: Successfully reset password for devaldoss@gmail.com to 'Quality@2026'.",
        )
      } else {
        console.log('Migration 0128: User devaldoss@gmail.com not found.')
      }
    } catch (err) {
      console.log('Migration 0128: Error finding/updating user devaldoss@gmail.com:', err)
      throw err
    }

    // 2. Fix notification ihl7dbqz416inco and similar training notifications pointing to checklist plcmt2q67qji7q9
    try {
      app
        .db()
        .newQuery(
          "UPDATE notifications SET checklist_id = '' WHERE id = 'ihl7dbqz416inco' OR (checklist_id = 'plcmt2q67qji7q9' AND message LIKE '%TRATATIVA DA RNC 015-26%')",
        )
        .execute()
      console.log('Migration 0128: Successfully cleared checklist_id for training notification(s).')
    } catch (notifErr) {
      console.log('Migration 0128: Notice updating training notifications:', notifErr)
    }
  },
  (app) => {
    // Revert logic
  },
)
