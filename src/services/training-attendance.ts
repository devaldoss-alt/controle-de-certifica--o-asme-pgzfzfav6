import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { calculateEffectivenessDueDate, normalizeDateToISO } from '@/services/trainings'
import { recalculateTrainingIndicators } from '@/services/training-indicators'

export type AttendanceListStatus =
  | 'rascunho'
  | 'realizada'
  | 'aguardando_avaliacao_eficacia'
  | 'avaliacao_concluida'

export type ParticipantPresence = 'Presente' | 'Ausente'
export type EffectivenessResponse = 'SIM' | 'NÃO'

export interface TrainingAttendanceList {
  id: string
  training_plan_action: string
  company_id: string
  tema: string
  conteudo_programatico?: string
  data_realizacao: string
  carga_horaria?: number | null
  local?: string
  instrutor_instituicao?: string
  status: AttendanceListStatus
  avaliacao_eficacia_prevista?: string | null
  programar_na_agenda: boolean
  created: string
  updated: string
  expand?: {
    training_plan_action?: {
      id: string
      action: string
      responsible: string
      requires_effectiveness_eval: boolean
      ch_hours?: number
    }
    company_id?: {
      id: string
      name: string
    }
  }
}

export interface TrainingParticipant {
  id: string
  attendance_list: string
  team_member?: string | null
  nome: string
  presenca: ParticipantPresence
  nota?: number | null
  aprovado?: boolean | null
  assinatura?: string | null
  created: string
  updated: string
  expand?: {
    team_member?: {
      id: string
      name: string
      role?: string
      department?: string
    }
  }
}

export interface TrainingEffectivenessEvaluation {
  id: string
  attendance_list: string
  participant: string
  resposta: EffectivenessResponse
  comentario?: string
  avaliador?: string | null
  nome_avaliador: string
  data_avaliacao: string
  created: string
  updated: string
  expand?: {
    participant?: TrainingParticipant
    avaliador?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface FullAttendanceListData {
  list: TrainingAttendanceList
  participants: TrainingParticipant[]
  evaluations: TrainingEffectivenessEvaluation[]
}

/**
 * Fetch all attendance lists for a specific training_plan_action or company
 */
export async function getAttendanceLists(params: {
  actionId?: string
  companyId?: string
}): Promise<TrainingAttendanceList[]> {
  const filters: string[] = []
  if (params.actionId) {
    filters.push(`training_plan_action = "${params.actionId}"`)
  }
  if (params.companyId && params.companyId !== 'all') {
    filters.push(`company_id = "${params.companyId}"`)
  }

  try {
    const records = await pb
      .collection('training_attendance_lists')
      .getFullList<TrainingAttendanceList>({
        filter: filters.length > 0 ? filters.join(' && ') : undefined,
        sort: '-data_realizacao',
        expand: 'training_plan_action,company_id',
      })
    return safeArray<TrainingAttendanceList>(records)
  } catch (e) {
    console.error('getAttendanceLists failed:', e)
    return []
  }
}

/**
 * Get single attendance list with participants and evaluations
 */
export async function getAttendanceListById(id: string): Promise<FullAttendanceListData | null> {
  try {
    const list = await pb
      .collection('training_attendance_lists')
      .getOne<TrainingAttendanceList>(id, {
        expand: 'training_plan_action,company_id',
      })

    const participants = await pb
      .collection('training_participants')
      .getFullList<TrainingParticipant>({
        filter: `attendance_list = "${id}"`,
        sort: 'nome',
        expand: 'team_member',
      })

    const evaluations = await pb
      .collection('training_effectiveness_evaluations')
      .getFullList<TrainingEffectivenessEvaluation>({
        filter: `attendance_list = "${id}"`,
        sort: 'data_avaliacao,created',
        expand: 'avaliador,participant',
      })

    return {
      list,
      participants: safeArray<TrainingParticipant>(participants),
      evaluations: safeArray<TrainingEffectivenessEvaluation>(evaluations),
    }
  } catch (e) {
    console.error('getAttendanceListById failed:', e)
    return null
  }
}

/**
 * Upsert / Save full attendance list (FSGQ 7.2-3)
 * Handles:
 * 1. Upsert attendance_list record
 * 2. Sync participants (create/update/delete)
 * 3. When saving as 'realizada' or later:
 *    - Update training_plan_action (ch_hours, participants_count, ch_total, realized_date)
 *    - If requires_effectiveness_eval: set avaliacao_eficacia_prevista = realized + 60 days
 *    - Create valid notification for responsible users
 */
export async function saveAttendanceListFull(params: {
  listId?: string
  actionId: string
  companyId: string
  tema: string
  conteudoProgramatico?: string
  dataRealizacao: string
  cargaHoraria?: number
  local?: string
  instrutorInstituicao?: string
  status: AttendanceListStatus
  programarNaAgenda?: boolean
  participants: Array<{
    id?: string
    team_member?: string | null
    nome: string
    presenca: ParticipantPresence
    nota?: number | null
    aprovado?: boolean | null
    assinatura?: string | null
  }>
}): Promise<TrainingAttendanceList> {
  const normDateRealizacao = normalizeDateToISO(params.dataRealizacao) || new Date().toISOString()
  const cargaHoraria =
    params.cargaHoraria !== undefined && params.cargaHoraria !== null
      ? Number(params.cargaHoraria)
      : null

  // Calculate 60 days ahead
  const eficaciaPrevista = calculateEffectivenessDueDate(normDateRealizacao)

  // 1. Fetch action to verify requires_effectiveness_eval
  let action: any = null
  try {
    action = await pb.collection('training_plan_actions').getOne(params.actionId)
  } catch (e) {
    console.warn('Could not load training_plan_action:', e)
  }

  const reqEficacia = action?.requires_effectiveness_eval ?? true

  let resolvedStatus = params.status
  if (resolvedStatus === 'realizada' && reqEficacia) {
    resolvedStatus = 'aguardando_avaliacao_eficacia'
  }

  const listPayload: Record<string, any> = {
    training_plan_action: params.actionId,
    company_id: params.companyId,
    tema: params.tema.trim(),
    conteudo_programatico: params.conteudoProgramatico || '',
    data_realizacao: normDateRealizacao,
    carga_horaria: cargaHoraria,
    local: params.local || '',
    instrutor_instituicao: params.instrutorInstituicao || '',
    status: resolvedStatus,
    programar_na_agenda: params.programarNaAgenda ?? true,
    avaliacao_eficacia_prevista: reqEficacia ? eficaciaPrevista : null,
  }

  let savedList: TrainingAttendanceList
  if (params.listId) {
    savedList = await pb
      .collection('training_attendance_lists')
      .update<TrainingAttendanceList>(params.listId, listPayload)
  } else {
    savedList = await pb
      .collection('training_attendance_lists')
      .create<TrainingAttendanceList>(listPayload)
  }

  // 2. Sync participants
  const existingParticipants = await pb
    .collection('training_participants')
    .getFullList<TrainingParticipant>({
      filter: `attendance_list = "${savedList.id}"`,
    })

  const currentIds = new Set(params.participants.filter((p) => p.id).map((p) => p.id!))

  // Delete removed participants
  for (const ep of existingParticipants) {
    if (!currentIds.has(ep.id)) {
      try {
        await pb.collection('training_participants').delete(ep.id)
      } catch (e) {
        console.warn('Failed to delete participant:', ep.id, e)
      }
    }
  }

  // Create or update participants
  let presentesCount = 0
  for (const part of params.participants) {
    if (part.presenca === 'Presente') presentesCount++

    const partPayload: Record<string, any> = {
      attendance_list: savedList.id,
      team_member: part.team_member || null,
      nome: part.nome.trim(),
      presenca: part.presenca,
      nota: part.nota !== undefined && part.nota !== null && !isNaN(part.nota) ? part.nota : null,
      aprovado: part.aprovado ?? null,
      assinatura: part.assinatura ? part.assinatura.trim() : null,
    }

    if (part.id) {
      await pb.collection('training_participants').update(part.id, partPayload)
    } else {
      await pb.collection('training_participants').create(partPayload)
    }
  }

  // 3. Update the training_plan_action when status is not rascunho
  if (savedList.status !== 'rascunho') {
    try {
      const chHours = cargaHoraria || action?.ch_hours || 0
      const totalCH = Number((chHours * presentesCount).toFixed(2))

      const actionUpdate: Record<string, any> = {
        realized_date: normDateRealizacao,
        ch_hours: chHours,
        participants_count: presentesCount,
        ch_total: totalCH,
      }

      if (reqEficacia) {
        actionUpdate.effectiveness_due_date = eficaciaPrevista
        if (savedList.status === 'avaliacao_concluida') {
          actionUpdate.effectiveness_status = 'OK'
        } else {
          actionUpdate.effectiveness_status = 'Pendente'
        }
      } else {
        actionUpdate.effectiveness_status = 'Não aplicável'
      }

      await pb.collection('training_plan_actions').update(params.actionId, actionUpdate)
    } catch (actErr) {
      console.error('Failed to sync training_plan_action from attendance list:', actErr)
    }
  }

  // 4. In-app notifications for responsible users (safe, never fails main flow)
  if (savedList.status !== 'rascunho' && reqEficacia) {
    try {
      await createEffectivenessNotificationSafe({
        companyId: params.companyId,
        tema: params.tema,
        actionId: params.actionId,
        dueDate: eficaciaPrevista,
      })
    } catch (notifErr) {
      console.warn('Silent notification error (non-blocking):', notifErr)
    }
  }

  // 5. Automatic recalculation of training indicators (HHT, % Eficácia, % Plano)
  // Non-blocking: safe try/catch ensures list saving is NEVER interrupted
  try {
    const listYear = new Date(normDateRealizacao).getFullYear() || new Date().getFullYear()
    recalculateTrainingIndicators({
      companyId: params.companyId,
      year: listYear,
    }).catch((e) => console.warn('Silent indicator recalculation error:', e))
  } catch (recalcErr) {
    console.warn('Non-blocking recalculation error:', recalcErr)
  }

  return savedList
}

/**
 * Safe notification helper: finds manager / QCC / consultant users and inserts
 * a valid notification record referencing an existing checklist or fallback safely.
 */
async function createEffectivenessNotificationSafe(params: {
  companyId: string
  tema: string
  actionId: string
  dueDate: string
}) {
  const users = await pb.collection('users').getFullList({
    filter: `primary_company_id = "${params.companyId}" || role = "Manager" || role = "QCC"`,
  })

  // Find a valid checklist in the same company to ensure foreign key validity
  const sampleChecklist = await pb
    .collection('checklists')
    .getList(1, 1, {
      filter: `company_id = "${params.companyId}"`,
    })
    .catch(() => ({ items: [] }))

  const validChecklistId = sampleChecklist.items[0]?.id || ''
  if (!validChecklistId) {
    // If no checklist exists, skip to prevent foreign key errors
    return
  }

  const formattedDue = new Date(params.dueDate).toLocaleDateString('pt-BR')
  const message = `Treinamento realizado: "${params.tema}". Avaliação de Eficácia (+60d) programada para ${formattedDue}.`

  for (const u of users) {
    try {
      await pb.collection('notifications').create({
        user_id: u.id,
        checklist_id: validChecklistId,
        message,
        read: false,
        type: 'submission',
        company_id: params.companyId,
      })
    } catch (e) {
      // Non-blocking
    }
  }
}

/**
 * Record effectiveness evaluation for participants (FSGQ 7.2-3)
 * Up to 5 evaluators per participant
 */
export async function saveEffectivenessEvaluations(params: {
  attendanceListId: string
  evaluations: Array<{
    id?: string
    participant: string
    resposta: EffectivenessResponse
    comentario?: string
    avaliador?: string | null
    nome_avaliador: string
    data_avaliacao: string
  }>
  markCompleted?: boolean
}): Promise<void> {
  const currentList = await pb
    .collection('training_attendance_lists')
    .getOne<TrainingAttendanceList>(params.attendanceListId)

  for (const ev of params.evaluations) {
    const normDate = normalizeDateToISO(ev.data_avaliacao) || new Date().toISOString()
    const payload = {
      attendance_list: params.attendanceListId,
      participant: ev.participant,
      resposta: ev.resposta,
      comentario: ev.comentario || '',
      avaliador: ev.avaliador || null,
      nome_avaliador: ev.nome_avaliador.trim(),
      data_avaliacao: normDate,
    }

    if (ev.id) {
      await pb.collection('training_effectiveness_evaluations').update(ev.id, payload)
    } else {
      await pb.collection('training_effectiveness_evaluations').create(payload)
    }
  }

  if (params.markCompleted) {
    await pb.collection('training_attendance_lists').update(params.attendanceListId, {
      status: 'avaliacao_concluida',
    })

    if (currentList.training_plan_action) {
      try {
        await pb.collection('training_plan_actions').update(currentList.training_plan_action, {
          effectiveness_status: 'OK',
        })
      } catch (e) {
        console.warn('Failed to update action effectiveness_status to OK:', e)
      }
    }
  }

  // Recalculate indicators after evaluations are saved
  if (currentList.company_id) {
    try {
      const year = currentList.data_realizacao
        ? new Date(currentList.data_realizacao).getFullYear()
        : new Date().getFullYear()
      recalculateTrainingIndicators({
        companyId: currentList.company_id,
        year,
      }).catch((e) => console.warn('Silent recalculate on evaluations error:', e))
    } catch (e) {
      // Non-blocking
    }
  }
}

/**
 * Helper to delete an attendance list and cascade items
 */
export async function deleteAttendanceList(id: string): Promise<boolean> {
  return pb.collection('training_attendance_lists').delete(id)
}
