migrate(
  (app) => {
    const checklists = new Collection({
      name: 'checklists',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        {
          name: 'role_assigned',
          type: 'select',
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
        },
        { name: 'mcq_ref', type: 'text' },
        { name: 'status', type: 'select', values: ['pending', 'completed'], maxSelect: 1 },
        { name: 'due_date', type: 'date' },
        { name: 'is_critical', type: 'bool' },
        { name: 'last_action_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(checklists)

    const interactions = new Collection({
      name: 'interactions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'source_role', type: 'text' },
        { name: 'target_role', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'status', type: 'select', values: ['pending', 'resolved'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(interactions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('checklists'))
    app.delete(app.findCollectionByNameOrId('interactions'))
  },
)
