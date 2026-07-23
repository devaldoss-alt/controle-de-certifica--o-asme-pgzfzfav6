migrate(
  (app) => {
    const checklistsColId = app.findCollectionByNameOrId('checklists').id

    const collection = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: '@request.auth.id = user_id',
      viewRule: '@request.auth.id = user_id',
      createRule: "@request.auth.id != ''",
      updateRule: '@request.auth.id = user_id',
      deleteRule: '@request.auth.id = user_id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['submission', 'approved', 'rejected'],
          maxSelect: 1,
        },
        {
          name: 'checklist_id',
          type: 'relation',
          collectionId: checklistsColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'message', type: 'text', required: true },
        { name: 'read', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_user ON notifications (user_id)',
        'CREATE INDEX idx_notifications_created ON notifications (created)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('notifications')
    app.delete(collection)
  },
)
