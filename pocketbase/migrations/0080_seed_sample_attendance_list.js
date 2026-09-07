migrate(
  (app) => {
    try {
      const actionsCol = app.findCollectionByNameOrId('training_plan_actions')
      const attendanceListsCol = app.findCollectionByNameOrId('training_attendance_lists')
      const participantsCol = app.findCollectionByNameOrId('training_participants')
      const pscId = 'a631bv695rr4gef'

      // 1. Find the target action: TRATATIVA DA RNC 015-26
      let targetAction
      try {
        const found = app.findRecordsByFilter(
          'training_plan_actions',
          "action ~ 'TRATATIVA DA RNC 015-26' && company_id = '" + pscId + "'",
          '',
          1,
          0,
        )
        if (found && found.length > 0) {
          targetAction = found[0]
        }
      } catch (e) {
        console.log('Action search error:', e)
      }

      if (!targetAction) {
        console.log('Target action TRATATIVA DA RNC 015-26 not found, skipping seed.')
        return
      }

      // 2. Check if an attendance list already exists for this action
      try {
        const existing = app.findRecordsByFilter(
          'training_attendance_lists',
          "training_plan_action = '" + targetAction.id + "'",
          '',
          1,
          0,
        )
        if (existing && existing.length > 0) {
          console.log('Attendance list already exists for action ' + targetAction.id)
          return
        }
      } catch (_) {}

      // 3. Create the attendance list for TRATATIVA DA RNC 015-26
      const attRecord = new Record(attendanceListsCol)
      attRecord.set('training_plan_action', targetAction.id)
      attRecord.set('company_id', pscId)
      attRecord.set('tema', 'TRATATIVA DA RNC 015-26 - CALIBRAÇÃO DE INSTRUMENTOS')
      attRecord.set(
        'conteudo_programatico',
        'Treinamento operacional e prático sobre sistemática de calibração, rastreabilidade RBC, tolerâncias de medição de instrumentos da qualidade e preenchimento de registros FSGQ.',
      )
      attRecord.set('data_realizacao', '2026-01-28 00:00:00.000Z')
      attRecord.set('carga_horaria', 2)
      attRecord.set('local', 'Sala de Treinamento / Oficina PSC')
      attRecord.set('instrutor_instituicao', 'Roberta - Controle da Qualidade')
      attRecord.set('status', 'aguardando_avaliacao_eficacia')
      attRecord.set('avaliacao_eficacia_prevista', '2026-03-29 00:00:00.000Z')
      attRecord.set('programar_na_agenda', true)
      app.save(attRecord)

      // 4. Find 3-4 real team members from PSC
      let pscTeam = []
      try {
        pscTeam = app.findRecordsByFilter('team', "company_id = '" + pscId + "'", 'name', 10, 0)
      } catch (e) {
        console.log('Error fetching PSC team:', e)
      }

      const sampleNames = [
        'AGNALDO SILVA SANTOS',
        'ALDAIR DOS SANTOS BARAÚNA',
        'ALEJANDRO DROGUETT',
        'ALESSON SILVA DE CASTRO',
      ]

      for (let i = 0; i < sampleNames.length; i++) {
        const name = sampleNames[i]
        const matchedMember = pscTeam.find((m) => m.getString('name') === name)

        const partRecord = new Record(participantsCol)
        partRecord.set('attendance_list', attRecord.id)
        if (matchedMember) {
          partRecord.set('team_member', matchedMember.id)
        }
        partRecord.set('nome', name)
        partRecord.set('presenca', 'Presente')
        partRecord.set('nota', 95 + i)
        partRecord.set('aprovado', true)
        partRecord.set('assinatura', name)
        app.save(partRecord)
      }

      // 5. Update the action with recalculated metrics
      targetAction.set('realized_date', '2026-01-28 00:00:00.000Z')
      targetAction.set('ch_hours', 2)
      targetAction.set('participants_count', sampleNames.length)
      targetAction.set('ch_total', 2 * sampleNames.length)
      targetAction.set('effectiveness_due_date', '2026-03-29 00:00:00.000Z')
      targetAction.set('effectiveness_status', 'Pendente')
      app.save(targetAction)

      // 6. Safe in-app notification referencing a real valid checklist in PSC
      try {
        const notifCol = app.findCollectionByNameOrId('notifications')
        const chkRecords = app.findRecordsByFilter(
          'checklists',
          "company_id = '" + pscId + "'",
          'created',
          1,
          0,
        )
        const validChecklist = chkRecords && chkRecords.length > 0 ? chkRecords[0] : null

        if (validChecklist) {
          const managerUsers = app.findRecordsByFilter(
            'users',
            "primary_company_id = '" + pscId + "' || email = 'devaldoss@gmail.com'",
            'name',
            5,
            0,
          )

          for (let u = 0; u < managerUsers.length; u++) {
            const userRec = managerUsers[u]
            const notif = new Record(notifCol)
            notif.set('user_id', userRec.id)
            notif.set('checklist_id', validChecklist.id)
            notif.set(
              'message',
              'Treinamento realizado: "TRATATIVA DA RNC 015-26 - CALIBRAÇÃO DE INSTRUMENTOS". Avaliação de Eficácia (+60d) programada para 29/03/2026.',
            )
            notif.set('read', false)
            notif.set('type', 'submission')
            notif.set('company_id', pscId)
            app.save(notif)
          }
        }
      } catch (notifErr) {
        console.log('Notification seeding note (safe/non-blocking):', notifErr)
      }

      console.log('Seeded sample attendance list for TRATATIVA DA RNC 015-26 with success.')
    } catch (err) {
      console.log('Migration 0080 failed:', (err && err.message) || err)
    }
  },
  (app) => {
    // Revert logic
    try {
      const actions = app.findRecordsByFilter(
        'training_plan_actions',
        "action ~ 'TRATATIVA DA RNC 015-26'",
        '',
        1,
        0,
      )
      if (actions.length > 0) {
        const lists = app.findRecordsByFilter(
          'training_attendance_lists',
          "training_plan_action = '" + actions[0].id + "'",
          '',
          10,
          0,
        )
        for (let i = 0; i < lists.length; i++) {
          app.delete(lists[i])
        }
      }
    } catch (_) {}
  },
)
