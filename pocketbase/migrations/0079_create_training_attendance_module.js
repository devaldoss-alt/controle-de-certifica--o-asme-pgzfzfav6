migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')
    const trainingPlanActionsCol = app.findCollectionByNameOrId('training_plan_actions')
    const teamCol = app.findCollectionByNameOrId('team')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Collection training_attendance_lists
    if (!app.hasTable('training_attendance_lists')) {
      const attendanceListsCollection = new Collection({
        name: 'training_attendance_lists',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'training_plan_action',
            type: 'relation',
            required: true,
            collectionId: trainingPlanActionsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'tema', type: 'text', required: true },
          { name: 'conteudo_programatico', type: 'text' },
          { name: 'data_realizacao', type: 'date', required: true },
          { name: 'carga_horaria', type: 'number', required: false, min: 0 },
          { name: 'local', type: 'text' },
          { name: 'instrutor_instituicao', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: [
              'rascunho',
              'realizada',
              'aguardando_avaliacao_eficacia',
              'avaliacao_concluida',
            ],
            maxSelect: 1,
          },
          { name: 'avaliacao_eficacia_prevista', type: 'date', required: false },
          { name: 'programar_na_agenda', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_tal_action ON training_attendance_lists (training_plan_action)',
          'CREATE INDEX idx_tal_company ON training_attendance_lists (company_id)',
          'CREATE INDEX idx_tal_status ON training_attendance_lists (status)',
          'CREATE INDEX idx_tal_data ON training_attendance_lists (data_realizacao)',
        ],
      })
      app.save(attendanceListsCollection)
    }

    const attendanceListsCol = app.findCollectionByNameOrId('training_attendance_lists')

    // 2. Collection training_participants
    if (!app.hasTable('training_participants')) {
      const participantsCollection = new Collection({
        name: 'training_participants',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'attendance_list',
            type: 'relation',
            required: true,
            collectionId: attendanceListsCol.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'team_member',
            type: 'relation',
            required: false,
            collectionId: teamCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'nome', type: 'text', required: true },
          {
            name: 'presenca',
            type: 'select',
            required: true,
            values: ['Presente', 'Ausente'],
            maxSelect: 1,
          },
          { name: 'nota', type: 'number', required: false, min: 0, max: 100 },
          { name: 'aprovado', type: 'bool' },
          { name: 'assinatura', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_tp_attendance ON training_participants (attendance_list)',
          'CREATE INDEX idx_tp_member ON training_participants (team_member)',
          'CREATE INDEX idx_tp_presenca ON training_participants (presenca)',
        ],
      })
      app.save(participantsCollection)
    }

    const participantsCol = app.findCollectionByNameOrId('training_participants')

    // 3. Collection training_effectiveness_evaluations
    if (!app.hasTable('training_effectiveness_evaluations')) {
      const effectivenessCollection = new Collection({
        name: 'training_effectiveness_evaluations',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'attendance_list',
            type: 'relation',
            required: true,
            collectionId: attendanceListsCol.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'participant',
            type: 'relation',
            required: true,
            collectionId: participantsCol.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'resposta',
            type: 'select',
            required: true,
            values: ['SIM', 'NÃO'],
            maxSelect: 1,
          },
          { name: 'comentario', type: 'text' },
          {
            name: 'avaliador',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'nome_avaliador', type: 'text', required: true },
          { name: 'data_avaliacao', type: 'date', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_tee_attendance ON training_effectiveness_evaluations (attendance_list)',
          'CREATE INDEX idx_tee_participant ON training_effectiveness_evaluations (participant)',
          'CREATE INDEX idx_tee_data ON training_effectiveness_evaluations (data_avaliacao)',
        ],
      })
      app.save(effectivenessCollection)
    }
  },
  (app) => {
    if (app.hasTable('training_effectiveness_evaluations')) {
      app.delete(app.findCollectionByNameOrId('training_effectiveness_evaluations'))
    }
    if (app.hasTable('training_participants')) {
      app.delete(app.findCollectionByNameOrId('training_participants'))
    }
    if (app.hasTable('training_attendance_lists')) {
      app.delete(app.findCollectionByNameOrId('training_attendance_lists'))
    }
  },
)
