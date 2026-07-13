migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: [
            'Director',
            'QCC',
            'Inspector',
            'AI',
            'Designer',
            'Engineer',
            'CertifyingEngineer',
            'Welder',
            'NDE',
            'Manager',
          ],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('qualification_expiry')) {
      col.fields.add(
        new DateField({
          name: 'qualification_expiry',
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('role')
    col.fields.removeByName('qualification_expiry')
    app.save(col)
  },
)
