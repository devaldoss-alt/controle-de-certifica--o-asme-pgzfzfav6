migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    let manager
    try {
      manager = app.findAuthRecordByEmail('_pb_users_auth_', 'manager@psc.com')
    } catch (_) {
      manager = new Record(usersCol)
      manager.setEmail('manager@psc.com')
      manager.setPassword('Skip@Pass')
      manager.setVerified(true)
    }
    manager.set('name', 'Gestor da Qualidade')
    manager.set('role', 'Manager')
    app.save(manager)
  },
  (app) => {
    try {
      const manager = app.findAuthRecordByEmail('_pb_users_auth_', 'manager@psc.com')
      app.delete(manager)
    } catch (_) {}
  },
)
