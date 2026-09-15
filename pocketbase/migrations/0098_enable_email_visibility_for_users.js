// Migration 0098 — Enable emailVisibility for all users
// This ensures that user emails are returned via API calls (such as in /access-control Users tab)
// and allows client-side filtering and email display for all users, including the real users:
// - devaldoss@gmail.com
// - roberta.junqueira@proserco.com.br
// - murilo.franco@proserco.com.br
// - geraldo.timoteo@proserco.com.br
// - dainara.jesus@proserco.com.br

migrate(
  (app) => {
    // 1. Direct SQL update for SQLite table `users` to ensure emailVisibility is set to 1
    try {
      app.db().newQuery('UPDATE users SET emailVisibility = 1').execute()
      console.log('Migration 0098: Executed SQL UPDATE users SET emailVisibility = 1')
    } catch (e) {
      console.log('Migration 0098: SQL update notice:', e)
    }

    // 2. Also iterate over all users records using app API to ensure PB models have emailVisibility = true
    try {
      var users = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 500, 0)
      console.log('Migration 0098: Found ' + users.length + ' users to update emailVisibility')

      for (var i = 0; i < users.length; i++) {
        var user = users[i]
        // Use dedicated helper if available, or .set
        if (typeof user.setEmailVisibility === 'function') {
          user.setEmailVisibility(true)
        } else {
          user.set('emailVisibility', true)
        }
        app.save(user)
      }
      console.log(
        'Migration 0098: Saved ' + users.length + ' user records with emailVisibility = true',
      )
    } catch (err) {
      console.log('Migration 0098: Error updating users via app API:', err)
    }
  },
  (app) => {
    try {
      app.db().newQuery('UPDATE users SET emailVisibility = 0').execute()
    } catch (_) {}
  },
)
