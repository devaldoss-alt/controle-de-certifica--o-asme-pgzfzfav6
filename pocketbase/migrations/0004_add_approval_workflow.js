migrate(
  (app) => {
    const managerRule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || id = @request.auth.id)"
    const managerCreateRule = "@request.auth.id != '' && @request.auth.role = 'Manager'"

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = managerRule
    usersCol.viewRule = managerRule
    usersCol.createRule = managerCreateRule
    usersCol.updateRule = managerRule
    usersCol.deleteRule = managerCreateRule
    app.save(usersCol)

    var checkCol = app.findCollectionByNameOrId('checklists')

    if (!checkCol.fields.getByName('approval_status')) {
      checkCol.fields.add(
        new SelectField({
          name: 'approval_status',
          values: ['pending', 'approved', 'rejected'],
          maxSelect: 1,
        }),
      )
    }
    if (!checkCol.fields.getByName('rejection_comment')) {
      checkCol.fields.add(new TextField({ name: 'rejection_comment' }))
    }
    if (!checkCol.fields.getByName('locked')) {
      checkCol.fields.add(new BoolField({ name: 'locked' }))
    }
    app.save(checkCol)

    app
      .db()
      .newQuery(
        "UPDATE checklists SET approval_status = 'pending' WHERE approval_status IS NULL OR approval_status = ''",
      )
      .execute()
    app.db().newQuery('UPDATE checklists SET locked = 0 WHERE locked IS NULL').execute()

    var interCol = app.findCollectionByNameOrId('interactions')
    var interactions = [
      { source: 'Director', target: 'QCC', desc: 'Delegar implementacao do SCQ e revisoes do MCQ' },
      { source: 'QCC', target: 'Inspector', desc: 'Distribuir ITPs e coordenar pontos de espera' },
      { source: 'Inspector', target: 'AI', desc: 'Solicitar testemunho em Hold Points' },
      { source: 'AI', target: 'QCC', desc: 'Reportar nao-conformidades identificadas' },
      {
        source: 'Engineer',
        target: 'CertifyingEngineer',
        desc: 'Submeter MDeR para certificacao final',
      },
      { source: 'Welder', target: 'QCC', desc: 'Reportar continuidade de qualificacao mensal' },
      { source: 'NDE', target: 'Inspector', desc: 'Entregar relatorios de END para aceitacao' },
      {
        source: 'Manager',
        target: 'Director',
        desc: 'Reportar status de conformidade e auditorias',
      },
    ]

    for (var i = 0; i < interactions.length; i++) {
      var inter = interactions[i]
      try {
        app.findFirstRecordByData('interactions', 'description', inter.desc)
      } catch (_) {
        var rec = new Record(interCol)
        rec.set('source_role', inter.source)
        rec.set('target_role', inter.target)
        rec.set('description', inter.desc)
        rec.set('status', 'pending')
        app.save(rec)
      }
    }
  },
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = 'id = @request.auth.id'
    usersCol.viewRule = 'id = @request.auth.id'
    usersCol.createRule = ''
    usersCol.updateRule = 'id = @request.auth.id'
    usersCol.deleteRule = 'id = @request.auth.id'
    app.save(usersCol)

    var checkCol = app.findCollectionByNameOrId('checklists')
    checkCol.fields.removeByName('approval_status')
    checkCol.fields.removeByName('rejection_comment')
    checkCol.fields.removeByName('locked')
    app.save(checkCol)
  },
)
