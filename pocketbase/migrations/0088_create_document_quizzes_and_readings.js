migrate(
  (app) => {
    const docsCol = app.findCollectionByNameOrId('documents')
    const teamCol = app.findCollectionByNameOrId('team')
    const companiesCol = app.findCollectionByNameOrId('companies')

    // 1. Create document_reading_sessions collection
    if (!app.hasTable('document_reading_sessions')) {
      const readingSessionsCol = new Collection({
        name: 'document_reading_sessions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'document_id',
            type: 'relation',
            required: true,
            collectionId: docsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'team_member_id',
            type: 'relation',
            required: false,
            collectionId: teamCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'user_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'reader_name', type: 'text', required: true },
          { name: 'reader_role', type: 'text', required: false },
          {
            name: 'company_id',
            type: 'relation',
            required: false,
            collectionId: companiesCol.id,
            maxSelect: 1,
          },
          { name: 'started_at', type: 'date', required: true },
          { name: 'ended_at', type: 'date', required: false },
          { name: 'duration_seconds', type: 'number', required: false, min: 0 },
          { name: 'completed', type: 'bool' },
          { name: 'abandoned', type: 'bool' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_drs_doc ON document_reading_sessions (document_id)',
          'CREATE INDEX idx_drs_member ON document_reading_sessions (team_member_id)',
          'CREATE INDEX idx_drs_company ON document_reading_sessions (company_id)',
          'CREATE INDEX idx_drs_created ON document_reading_sessions (created)',
        ],
      })
      app.save(readingSessionsCol)
    }

    // 2. Create document_quizzes collection
    if (!app.hasTable('document_quizzes')) {
      const quizzesCol = new Collection({
        name: 'document_quizzes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'document_id',
            type: 'relation',
            required: true,
            collectionId: docsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'min_score_percent', type: 'number', required: true, min: 0, max: 100 },
          { name: 'estimated_minutes', type: 'number', required: false, min: 0 },
          { name: 'questions', type: 'json', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['draft', 'published', 'archived'],
            maxSelect: 1,
          },
          {
            name: 'generation_method',
            type: 'select',
            required: false,
            values: ['manual', 'ai_generated', 'hybrid'],
            maxSelect: 1,
          },
          { name: 'created_by_name', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_dq_doc ON document_quizzes (document_id)',
          'CREATE INDEX idx_dq_status ON document_quizzes (status)',
        ],
      })
      app.save(quizzesCol)
    }

    // 3. Create quiz_attempts collection
    if (!app.hasTable('quiz_attempts')) {
      const quizzesColRef = app.findCollectionByNameOrId('document_quizzes')
      const attemptsCol = new Collection({
        name: 'quiz_attempts',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'quiz_id',
            type: 'relation',
            required: true,
            collectionId: quizzesColRef.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'document_id',
            type: 'relation',
            required: true,
            collectionId: docsCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'team_member_id',
            type: 'relation',
            required: false,
            collectionId: teamCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'user_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'collaborator_name', type: 'text', required: true },
          { name: 'collaborator_role', type: 'text', required: false },
          {
            name: 'company_id',
            type: 'relation',
            required: false,
            collectionId: companiesCol.id,
            maxSelect: 1,
          },
          { name: 'answers', type: 'json', required: true },
          { name: 'score_percent', type: 'number', required: true, min: 0, max: 100 },
          { name: 'approved', type: 'bool' },
          { name: 'attempt_number', type: 'number', required: true, min: 1, onlyInt: true },
          { name: 'duration_seconds', type: 'number', required: false, min: 0 },
          { name: 'training_action_id', type: 'text', required: false },
          { name: 'effectiveness_evaluated', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_qa_quiz ON quiz_attempts (quiz_id)',
          'CREATE INDEX idx_qa_doc ON quiz_attempts (document_id)',
          'CREATE INDEX idx_qa_member ON quiz_attempts (team_member_id)',
          'CREATE INDEX idx_qa_approved ON quiz_attempts (approved)',
        ],
      })
      app.save(attemptsCol)
    }

    // 4. Seed realistic sample quiz and reading records
    try {
      const PSC_ID = 'a631bv695rr4gef'
      const quizzesCol = app.findCollectionByNameOrId('document_quizzes')
      const readingSessionsCol = app.findCollectionByNameOrId('document_reading_sessions')
      const attemptsCol = app.findCollectionByNameOrId('quiz_attempts')

      // Find PR-CQ-14 or WPS-001 or any existing active document
      let targetDoc = null
      try {
        const foundDocs = app.findRecordsByFilter(
          'documents',
          "prefix = 'PR-CQ' && code = '14'",
          'created',
          1,
          0,
        )
        if (foundDocs && foundDocs.length > 0) {
          targetDoc = foundDocs[0]
        }
      } catch (_) {}

      if (!targetDoc) {
        try {
          const anyDoc = app.findRecordsByFilter('documents', "id != ''", 'created', 1, 0)
          if (anyDoc && anyDoc.length > 0) {
            targetDoc = anyDoc[0]
          }
        } catch (_) {}
      }

      // Find Antonio Carlos collaborator
      let targetMember = null
      try {
        const members = app.findRecordsByFilter('team', "name ~ 'ANTONIO CARLOS'", 'created', 1, 0)
        if (members && members.length > 0) {
          targetMember = members[0]
        }
      } catch (_) {}

      // Find Márcio Silva or another collaborator for second attempt
      let secondMember = null
      try {
        const members = app.findRecordsByFilter('team', "name ~ 'MÁRCIO'", 'created', 1, 0)
        if (members && members.length > 0) {
          secondMember = members[0]
        }
      } catch (_) {}

      if (targetDoc) {
        // Check if quiz already exists for targetDoc
        let existingQuiz = null
        try {
          const qList = app.findRecordsByFilter(
            'document_quizzes',
            'document_id = {:d}',
            'created',
            1,
            0,
            { d: targetDoc.id },
          )
          if (qList && qList.length > 0) existingQuiz = qList[0]
        } catch (_) {}

        if (!existingQuiz) {
          const quiz = new Record(quizzesCol)
          quiz.set('document_id', targetDoc.id)
          quiz.set(
            'title',
            'Avaliação de Leitura e Eficácia — ' + (targetDoc.get('title') || 'PR-CQ-14'),
          )
          quiz.set(
            'description',
            'Comprovação de leitura e assimilação técnica do procedimento ' +
              (targetDoc.get('title') || '') +
              ' conforme requisitos de treinamento do SGQ.',
          )
          quiz.set('min_score_percent', 70)
          quiz.set('estimated_minutes', 15)
          quiz.set('status', 'published')
          quiz.set('generation_method', 'manual')
          quiz.set('created_by_name', 'Gestão da Qualidade (GQ)')
          quiz.set(
            'questions',
            JSON.stringify([
              {
                id: 'q1',
                question:
                  'Qual é o objetivo principal da inspeção de solda segundo o procedimento?',
                options: [
                  'Identificar descontinuidades e assegurar conformidade dimensional com o projeto',
                  'Apenas arquivar relatórios sem intervenção no chão de fábrica',
                  'Substituir o teste hidrostático obrigatório',
                  'Aumentar o tempo de produção das peças',
                ],
                correct_option_index: 0,
                explanation:
                  'A inspeção visual garante que o cordão atende aos critérios de aceitação ASME e às tolerâncias dimensionais.',
              },
              {
                id: 'q2',
                question:
                  'Qual iluminação mínima recomendada para conduzir o ensaio visual direto?',
                options: [
                  'Aproximadamente 100 lux com lanterna fraca',
                  'Mínimo de 1000 lux ou 100 foot-candles na superfície inspecionada',
                  'Qualquer iluminação ambiente é aceitável',
                  'Apenas luz solar direta ao ar livre',
                ],
                correct_option_index: 1,
                explanation:
                  'Conforme normas ASME Sec V Art 9, a intensidade mínima deve ser de pelo menos 1000 lux (100 fc).',
              },
              {
                id: 'q3',
                question:
                  'Em caso de detecção de trinca ou mordedura além do limite normativo, qual deve ser a conduta imediata?',
                options: [
                  'Cobrir com tinta e liberar a peça',
                  'Segregar a peça, registrar a RNC e abrir ação de reparo conforme procedimento de goivagem',
                  'Aguardar o cliente final apontar o defeito',
                  'Ignorar se a trinca for menor que 50mm',
                ],
                correct_option_index: 1,
                explanation:
                  'Descontinuidades inaceitáveis exigem segregação imediata e emissão formal de RNC para retrabalho qualificado.',
              },
              {
                id: 'q4',
                question:
                  'Quem possui autorização para emitir o laudo de liberação final do ensaio?',
                options: [
                  'Qualquer operador de chão de fábrica',
                  'Inspetor de Solda / CQ qualificado e credenciado',
                  'Apenas o motorista de entrega',
                  'O fornecedor de chapas',
                ],
                correct_option_index: 1,
                explanation:
                  'A liberação formal compete exclusivamente a inspetores qualificados conforme o procedimento.',
              },
            ]),
          )
          app.save(quiz)
          existingQuiz = quiz
        }

        // Seed reading session and approved attempt for Antonio Carlos
        if (targetMember && existingQuiz) {
          const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          const session = new Record(readingSessionsCol)
          session.set('document_id', targetDoc.id)
          session.set('team_member_id', targetMember.id)
          session.set('reader_name', targetMember.get('name'))
          session.set('reader_role', targetMember.get('role') || 'Colaborador')
          session.set('company_id', targetMember.get('company_id') || PSC_ID)
          session.set('started_at', twoDaysAgo.toISOString())
          session.set('ended_at', new Date(twoDaysAgo.getTime() + 18 * 60 * 1000).toISOString())
          session.set('duration_seconds', 1080) // 18 minutos
          session.set('completed', true)
          session.set('abandoned', false)
          session.set('notes', 'Leitura completa do procedimento técnico realizada com sucesso.')
          app.save(session)

          const attempt = new Record(attemptsCol)
          attempt.set('quiz_id', existingQuiz.id)
          attempt.set('document_id', targetDoc.id)
          attempt.set('team_member_id', targetMember.id)
          attempt.set('collaborator_name', targetMember.get('name'))
          attempt.set('collaborator_role', targetMember.get('role') || 'Colaborador')
          attempt.set('company_id', targetMember.get('company_id') || PSC_ID)
          attempt.set('attempt_number', 1)
          attempt.set('score_percent', 100)
          attempt.set('approved', true)
          attempt.set('duration_seconds', 420) // 7 minutos
          attempt.set('effectiveness_evaluated', true)
          attempt.set(
            'answers',
            JSON.stringify([
              { question_id: 'q1', selected_index: 0, is_correct: true },
              { question_id: 'q2', selected_index: 1, is_correct: true },
              { question_id: 'q3', selected_index: 1, is_correct: true },
              { question_id: 'q4', selected_index: 1, is_correct: true },
            ]),
          )
          app.save(attempt)
        }

        // Seed a second reading session and attempt for Márcio Silva (ex: 75% score)
        if (secondMember && existingQuiz) {
          const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          const session2 = new Record(readingSessionsCol)
          session2.set('document_id', targetDoc.id)
          session2.set('team_member_id', secondMember.id)
          session2.set('reader_name', secondMember.get('name'))
          session2.set('reader_role', secondMember.get('role') || 'Colaborador')
          session2.set('company_id', secondMember.get('company_id') || PSC_ID)
          session2.set('started_at', yesterday.toISOString())
          session2.set('ended_at', new Date(yesterday.getTime() + 14 * 60 * 1000).toISOString())
          session2.set('duration_seconds', 840) // 14 min
          session2.set('completed', true)
          session2.set('abandoned', false)
          app.save(session2)

          const attempt2 = new Record(attemptsCol)
          attempt2.set('quiz_id', existingQuiz.id)
          attempt2.set('document_id', targetDoc.id)
          attempt2.set('team_member_id', secondMember.id)
          attempt2.set('collaborator_name', secondMember.get('name'))
          attempt2.set('collaborator_role', secondMember.get('role') || 'Colaborador')
          attempt2.set('company_id', secondMember.get('company_id') || PSC_ID)
          attempt2.set('attempt_number', 1)
          attempt2.set('score_percent', 75)
          attempt2.set('approved', true)
          attempt2.set('duration_seconds', 360)
          attempt2.set('effectiveness_evaluated', true)
          attempt2.set(
            'answers',
            JSON.stringify([
              { question_id: 'q1', selected_index: 0, is_correct: true },
              { question_id: 'q2', selected_index: 1, is_correct: true },
              { question_id: 'q3', selected_index: 1, is_correct: true },
              { question_id: 'q4', selected_index: 0, is_correct: false },
            ]),
          )
          app.save(attempt2)
        }
      }
    } catch (err) {
      console.log('Error seeding reading sessions/quiz demo:', err)
    }
  },
  (app) => {
    // down migration
  },
)
