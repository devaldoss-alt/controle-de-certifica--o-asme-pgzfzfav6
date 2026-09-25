// Hook que intercepta exclusão de colaboradores (team)
// Regra SGQ ASME/NBIC: histórico nunca se apaga.
// Impede exclusão dura de qualquer colaborador que possua histórico ou referências no sistema.

onRecordDelete((e) => {
  const memberId = e.record.id
  const memberName = e.record.getString('name')

  // 1. Verificar registros em training_participants (treinamentos realizados/registrados)
  try {
    const trainings = $app.findRecordsByFilter(
      'training_participants',
      `team_member = "${memberId}" || nome ~ "${memberName}"`,
      '',
      1,
      0,
    )
    if (trainings.length > 0) {
      throw new BadRequestError(
        'Exclusão bloqueada: este colaborador possui histórico de treinamentos registrados no SGQ. O histórico auditado ASME/NBIC não pode ser apagado. Utilize a opção "Desativar".',
      )
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
  }

  // 2. Verificar document_reading_sessions (leituras de documentos)
  try {
    const readings = $app.findRecordsByFilter(
      'document_reading_sessions',
      `team_member_id = "${memberId}" || reader_name ~ "${memberName}"`,
      '',
      1,
      0,
    )
    if (readings.length > 0) {
      throw new BadRequestError(
        'Exclusão bloqueada: este colaborador possui histórico de leitura de documentos no SGQ. Utilize a opção "Desativar".',
      )
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
  }

  // 3. Verificar quiz_attempts
  try {
    const quizzes = $app.findRecordsByFilter(
      'quiz_attempts',
      `team_member_id = "${memberId}" || collaborator_name ~ "${memberName}"`,
      '',
      1,
      0,
    )
    if (quizzes.length > 0) {
      throw new BadRequestError(
        'Exclusão bloqueada: este colaborador possui tentativas de avaliação/quiz no SGQ. Utilize a opção "Desativar".',
      )
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
  }

  // 4. Verificar requisições de materiais ou compras (requester_id)
  try {
    const matReqs = $app.findRecordsByFilter(
      'material_requisitions',
      `requester_id = "${memberId}"`,
      '',
      1,
      0,
    )
    if (matReqs.length > 0) {
      throw new BadRequestError(
        'Exclusão bloqueada: este colaborador possui requisições de material registradas. Utilize a opção "Desativar".',
      )
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
  }

  // 5. Verificar não conformidades (RNCs) onde conste como responsável ou emissor
  try {
    const rncs = $app.findRecordsByFilter(
      'non_conformities',
      `responsible ~ "${memberName}" || issuer ~ "${memberName}"`,
      '',
      1,
      0,
    )
    if (rncs.length > 0) {
      throw new BadRequestError(
        'Exclusão bloqueada: este colaborador consta em registros de RNC (Não Conformidades). Utilize a opção "Desativar".',
      )
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
  }

  // 6. Verificar se possui conta de usuário vinculada
  try {
    const users = $app.findRecordsByFilter('users', `name ~ "${memberName}"`, '', 1, 0)
    if (users.length > 0) {
      throw new BadRequestError(
        'Exclusão bloqueada: este colaborador possui conta de usuário no sistema. Utilize a opção "Desativar" para suspender o acesso mantendo a rastreabilidade.',
      )
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
  }

  e.next()
}, 'team')
