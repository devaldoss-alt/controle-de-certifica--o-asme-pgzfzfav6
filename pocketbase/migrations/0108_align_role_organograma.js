// Migration 0108 — Teste e Validação do SelectField users.role
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const userRoleField = usersCol.fields.getByName('role')
    console.log(
      'Migration 0108: Current role values:',
      JSON.stringify(userRoleField ? userRoleField.values : []),
    )

    const combinedRoles = [
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
      'Consultor',
      'Diretoria',
      'Gestor da Qualidade',
      'Gerente',
      'Coordenador de Fábrica',
      'Coordenador de CQ',
      'Supervisor',
      'Analista',
      'Técnico',
      'Inspetor',
      'Engenheiro',
      'Soldador',
      'Caldeireiro',
      'Torneiro/Usinador',
      'Almoxarife',
      'PCP',
      'Operador',
      'Colaborador',
      'Auxiliar Administrativo',
    ]

    if (userRoleField) {
      const currentValues = userRoleField.values || []
      const merged = Array.from(new Set([...currentValues, ...combinedRoles]))
      userRoleField.values = merged
      userRoleField.maxSelect = 1
      app.save(usersCol)
      console.log('Migration 0108: Saved users.role with values:', JSON.stringify(merged))
    }

    try {
      const docAccessCol = app.findCollectionByNameOrId('document_access')
      const docRoleField = docAccessCol.fields.getByName('role')
      if (docRoleField) {
        const currentValues = docRoleField.values || []
        const merged = Array.from(new Set([...currentValues, ...combinedRoles]))
        docRoleField.values = merged
        docRoleField.maxSelect = 1
        app.save(docAccessCol)
        console.log(
          'Migration 0108: Saved document_access.role with values:',
          JSON.stringify(merged),
        )
      }
    } catch (e) {
      console.log('Migration 0108: document_access notice:', e)
    }

    try {
      const checklistsCol = app.findCollectionByNameOrId('checklists')
      const chkRoleField = checklistsCol.fields.getByName('role_assigned')
      if (chkRoleField) {
        const currentValues = chkRoleField.values || []
        const merged = Array.from(new Set([...currentValues, ...combinedRoles]))
        chkRoleField.values = merged
        chkRoleField.maxSelect = chkRoleField.maxSelect > 1 ? merged.length : 1
        app.save(checklistsCol)
        console.log(
          'Migration 0108: Saved checklists.role_assigned with values:',
          JSON.stringify(merged),
        )
      }
    } catch (e) {
      console.log('Migration 0108: checklists notice:', e)
    }

    // Validação direta no backend: tentar criar um usuário com cargo 'Técnico' e deletá-lo
    try {
      const testEmail = 'temp_tecnico_test_' + Date.now() + '@test.internal'
      const testRecord = new Record(usersCol)
      testRecord.setEmail(testEmail)
      testRecord.setPassword('Skip@Pass1234')
      testRecord.setVerified(true)
      testRecord.set('name', 'Usuario Teste Tecnico')
      testRecord.set('role', 'Técnico')
      app.save(testRecord)
      console.log(
        'Migration 0108: Successfully created test user with role "Técnico", id:',
        testRecord.id,
      )

      // Remover o usuário temporário
      app.delete(testRecord)
      console.log('Migration 0108: Successfully cleaned up test user')
    } catch (testErr) {
      console.log('Migration 0108: Error creating/deleting test user with role Técnico:', testErr)
      throw testErr
    }
  },
  (app) => {},
)
