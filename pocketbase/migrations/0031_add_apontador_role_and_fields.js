migrate(
  (app) => {
    const newRoleValues = [
      'Director',
      'QCC',
      'Inspector',
      'AI',
      'Designer',
      'Engineer',
      'CertifyingEngineer',
      'Welder',
      'NDE',
      'Apontador',
      'Manager',
    ]
    const oldRoleValues = newRoleValues.filter(function (v) {
      return v !== 'Apontador'
    })

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.fields.removeByName('role')
    usersCol.fields.add(new SelectField({ name: 'role', values: newRoleValues, maxSelect: 1 }))
    app.save(usersCol)

    var daCol = app.findCollectionByNameOrId('document_access')
    daCol.fields.removeByName('role')
    daCol.fields.add(new SelectField({ name: 'role', values: newRoleValues, maxSelect: 1 }))
    app.save(daCol)

    var checkCol = app.findCollectionByNameOrId('checklists')
    if (!checkCol.fields.getByName('approval_comment')) {
      checkCol.fields.add(new TextField({ name: 'approval_comment' }))
    }
    if (!checkCol.fields.getByName('apontador_id')) {
      checkCol.fields.add(
        new RelationField({
          name: 'apontador_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    app.save(checkCol)

    var notifCol = app.findCollectionByNameOrId('notifications')
    notifCol.fields.removeByName('type')
    notifCol.fields.add(
      new SelectField({
        name: 'type',
        values: ['submission', 'approved', 'rejected', 'deadline_alert'],
        maxSelect: 1,
      }),
    )
    app.save(notifCol)

    try {
      app.findFirstRecordByData('document_access', 'role', 'Apontador')
    } catch (_) {
      var daCollection = app.findCollectionByNameOrId('document_access')
      var prefixes = ['MCQ', 'ITP', 'WPS', 'MDeR', 'PQR']
      for (var p = 0; p < prefixes.length; p++) {
        try {
          var rec = new Record(daCollection)
          rec.set('role', 'Apontador')
          rec.set('document_prefix', prefixes[p])
          rec.set('can_view', true)
          rec.set('can_edit', false)
          app.save(rec)
        } catch (_) {}
      }
    }
  },
  (app) => {
    var oldRoleValues = [
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
    ]

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.fields.removeByName('role')
    usersCol.fields.add(new SelectField({ name: 'role', values: oldRoleValues, maxSelect: 1 }))
    app.save(usersCol)

    var daCol = app.findCollectionByNameOrId('document_access')
    daCol.fields.removeByName('role')
    daCol.fields.add(new SelectField({ name: 'role', values: oldRoleValues, maxSelect: 1 }))
    app.save(daCol)

    var checkCol = app.findCollectionByNameOrId('checklists')
    try {
      checkCol.fields.removeByName('approval_comment')
    } catch (_) {}
    try {
      checkCol.fields.removeByName('apontador_id')
    } catch (_) {}
    app.save(checkCol)

    var notifCol = app.findCollectionByNameOrId('notifications')
    notifCol.fields.removeByName('type')
    notifCol.fields.add(
      new SelectField({
        name: 'type',
        values: ['submission', 'approved', 'rejected'],
        maxSelect: 1,
      }),
    )
    app.save(notifCol)
  },
)
