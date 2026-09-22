// Migration 0127: Reset default passwords for the 4 real UQualiHub users
// Target users:
// 1. roberta.junqueira@proserco.com.br (Roberta Junqueira)
// 2. geraldo.timoteo@proserco.com.br (Geraldo Timóteo)
// 3. murilo.franco@proserco.com.br (Murilo Franco)
// 4. dainara.jesus@proserco.com.br (Dainara Jesus)
//
// New default password: 'Proserco@2026'
//
// Preserved without modification:
// - Quality Manager (devaldoss@gmail.com)
// - João Soldador (welder@psc.com, password Teste@2026)

migrate(
  (app) => {
    const targetEmails = [
      'roberta.junqueira@proserco.com.br',
      'geraldo.timoteo@proserco.com.br',
      'murilo.franco@proserco.com.br',
      'dainara.jesus@proserco.com.br',
    ]

    const newPassword = 'Proserco@2026'

    console.log('Migration 0127: starting password reset for 4 real users...')

    for (let i = 0; i < targetEmails.length; i++) {
      const email = targetEmails[i]
      try {
        const userRecord = app.findAuthRecordByEmail('_pb_users_auth_', email)
        if (!userRecord) {
          console.log('User not found for email:', email)
          continue
        }

        userRecord.setPassword(newPassword)
        app.save(userRecord)
        console.log(
          'Successfully reset password for user: ' +
            email +
            ' (' +
            userRecord.getString('name') +
            ") to '" +
            newPassword +
            "'.",
        )
      } catch (err) {
        console.log('Error resetting password for user ' + email + ':', err)
        throw err
      }
    }

    console.log('Migration 0127 finished successfully.')
  },
  (app) => {
    // Revert logic: no-op since previous passwords are not known/stored
  },
)
