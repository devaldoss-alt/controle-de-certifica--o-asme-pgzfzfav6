import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import {
  getCollaboratorReadingSessions,
  getCollaboratorAttempts,
  type ReadingSession,
  type QuizAttempt,
} from './document-reading-quiz'

export interface CollaboratorAttendanceRecord {
  participantId: string
  attendanceListId: string
  actionTitle: string
  date: string
  presence: 'Presente' | 'Ausente' | 'Justificado'
  score?: number
  approved: boolean
  signature?: string
  chHours: number
  instructorName?: string
  effectivenessResponse?: 'SIM' | 'NÃO' | 'Pendente'
  effectivenessComment?: string
  effectivenessDate?: string
  evaluatorName?: string
}

export interface CollaboratorPlannedTraining {
  actionId: string
  actionTitle: string
  plannedDate: string
  realizedDate?: string
  type: string
  chHours: number
  status: 'Concluído' | 'Previsto' | 'Atrasado'
  participated: boolean
}

export interface CollaboratorSummaryMetrics {
  totalTrainingsAttended: number
  totalTrainingsMissed: number
  totalTrainingHours: number
  avgEffectivenessScore: number
  effectivenessApprovedCount: number
  effectivenessPendingCount: number
  effectivenessDisapprovedCount: number
  documentsReadCount: number
  totalReadingTimeSeconds: number
  quizzesAttemptedCount: number
  quizzesApprovedCount: number
  quizzesApprovalRatePercent: number
}

export interface FullCollaboratorProfileData {
  teamMemberId: string
  name: string
  role: string
  department: string
  companyId?: string
  companyName?: string
  isIndicator?: boolean
  metrics: CollaboratorSummaryMetrics
  attendances: CollaboratorAttendanceRecord[]
  plannedMatrix: CollaboratorPlannedTraining[]
  readingSessions: ReadingSession[]
  quizAttempts: QuizAttempt[]
}

/**
 * Loads comprehensive 360 profile data for a specific collaborator
 */
export async function getCollaboratorFullProfile(params: {
  teamMemberId?: string
  name?: string
  companyId?: string
}): Promise<FullCollaboratorProfileData | null> {
  try {
    let member: any = null

    if (params.teamMemberId) {
      try {
        member = await pb.collection('team').getOne(params.teamMemberId, { expand: 'company_id' })
      } catch {
        /* intentionally ignored */
      }
    }

    if (!member && params.name) {
      try {
        const list = await pb.collection('team').getList(1, 1, {
          filter: `name ~ "${params.name}"`,
          expand: 'company_id',
        })
        if (list.items.length > 0) member = list.items[0]
      } catch {
        /* intentionally ignored */
      }
    }

    const collaboratorName = member?.name || params.name || 'Colaborador'
    const teamMemberId = member?.id || params.teamMemberId || ''
    const role = member?.role || 'Colaborador'
    const department = member?.department || '—'
    const memberCompanyId = member?.company_id || params.companyId
    const companyName = member?.expand?.company_id?.name || '—'

    // 1. Fetch participants records where this member participated (by team_member or name)
    const filterClauses: string[] = []
    if (teamMemberId) filterClauses.push(`team_member = "${teamMemberId}"`)
    if (collaboratorName) filterClauses.push(`nome ~ "${collaboratorName}"`)

    let participants: any[] = []
    if (filterClauses.length > 0) {
      try {
        participants = await pb.collection('training_participants').getFullList({
          filter: filterClauses.join(' || '),
          expand: 'attendance_list,attendance_list.training_action',
          sort: '-created',
        })
      } catch (err) {
        console.warn('participants fetch catch:', err)
      }
    }

    // 2. Fetch effectiveness evaluations for these participants
    const participantIds = participants.map((p) => p.id)
    let evaluations: any[] = []
    if (participantIds.length > 0) {
      try {
        const evalFilters = participantIds.map((id) => `participant = "${id}"`).join(' || ')
        evaluations = await pb.collection('training_effectiveness_evaluations').getFullList({
          filter: evalFilters,
          sort: '-created',
        })
      } catch (err) {
        console.warn('evaluations fetch catch:', err)
      }
    }

    // Map attendances with effectiveness
    let totalTrainingHours = 0
    let attendedCount = 0
    let missedCount = 0
    let sumScores = 0
    let countScores = 0
    let effApproved = 0
    let effDisapproved = 0
    let effPending = 0

    const attendances: CollaboratorAttendanceRecord[] = participants.map((p) => {
      const list = p.expand?.attendance_list
      const action = list?.expand?.training_action
      const hours = list?.ch_hours || action?.ch_hours || 0
      const isPresent = p.presenca === 'Presente'

      if (isPresent) {
        attendedCount++
        totalTrainingHours += hours
      } else {
        missedCount++
      }

      if (typeof p.nota === 'number' && p.nota > 0) {
        sumScores += p.nota
        countScores++
      }

      const evalRec = evaluations.find((e) => e.participant === p.id)
      let effResp: 'SIM' | 'NÃO' | 'Pendente' = 'Pendente'
      if (evalRec?.resposta === 'SIM') {
        effResp = 'SIM'
        effApproved++
      } else if (evalRec?.resposta === 'NÃO') {
        effResp = 'NÃO'
        effDisapproved++
      } else {
        effPending++
      }

      return {
        participantId: p.id,
        attendanceListId: p.attendance_list,
        actionTitle: action?.action || list?.title || 'Treinamento Operacional',
        date: list?.training_date || p.created,
        presence: p.presenca || 'Presente',
        score: p.nota,
        approved: p.aprovado ?? true,
        signature: p.assinatura,
        chHours: hours,
        instructorName: list?.instructor_name,
        effectivenessResponse: effResp,
        effectivenessComment: evalRec?.comentario,
        effectivenessDate: evalRec?.data_avaliacao,
        evaluatorName: evalRec?.nome_avaliador,
      }
    })

    // 3. Matrix Colaborador × Treinamentos do Plano (o que foi previsto vs. realizado)
    let planActions: any[] = []
    try {
      const compFilter =
        memberCompanyId && memberCompanyId !== 'all'
          ? `company_id = "${memberCompanyId}"`
          : `id != ""`
      planActions = await pb.collection('training_plan_actions').getFullList({
        filter: compFilter,
        sort: '-planned_date',
      })
    } catch (err) {
      console.warn('planActions fetch catch:', err)
    }

    const plannedMatrix: CollaboratorPlannedTraining[] = planActions.map((act) => {
      const attended = attendances.some(
        (a) =>
          a.actionTitle.toLowerCase().trim() === act.action.toLowerCase().trim() &&
          a.presence === 'Presente',
      )

      let status: 'Concluído' | 'Previsto' | 'Atrasado' = 'Previsto'
      if (attended || act.realized_date) {
        status = 'Concluído'
      } else if (new Date(act.planned_date).getTime() < Date.now()) {
        status = 'Atrasado'
      }

      return {
        actionId: act.id,
        actionTitle: act.action,
        plannedDate: act.planned_date,
        realizedDate: act.realized_date,
        type: act.type,
        chHours: act.ch_hours || 0,
        status,
        participated: attended,
      }
    })

    // 4. Fetch Document Reading sessions and Quiz attempts (Bloco 2 integration)
    const [readingSessions, quizAttempts] = await Promise.all([
      getCollaboratorReadingSessions(teamMemberId, collaboratorName),
      getCollaboratorAttempts(teamMemberId, collaboratorName),
    ])

    const validReadingSessions = readingSessions.filter(
      (s) => !s.abandoned && (s.duration_seconds || 0) > 0,
    )
    const totalReadingTimeSeconds = validReadingSessions.reduce(
      (acc, s) => acc + (s.duration_seconds || 0),
      0,
    )
    const approvedQuizzes = quizAttempts.filter((q) => q.approved).length

    // Add reading training hours to HHT if approved (converted to hours)
    const readingHours = Math.round((totalReadingTimeSeconds / 3600) * 10) / 10
    const combinedTotalHours = Math.round((totalTrainingHours + readingHours) * 10) / 10

    const metrics: CollaboratorSummaryMetrics = {
      totalTrainingsAttended: attendedCount,
      totalTrainingsMissed: missedCount,
      totalTrainingHours: combinedTotalHours,
      avgEffectivenessScore: countScores > 0 ? Math.round(sumScores / countScores) : 0,
      effectivenessApprovedCount: effApproved,
      effectivenessPendingCount: effPending,
      effectivenessDisapprovedCount: effDisapproved,
      documentsReadCount: validReadingSessions.length,
      totalReadingTimeSeconds,
      quizzesAttemptedCount: quizAttempts.length,
      quizzesApprovedCount: approvedQuizzes,
      quizzesApprovalRatePercent:
        quizAttempts.length > 0 ? Math.round((approvedQuizzes / quizAttempts.length) * 100) : 0,
    }

    return {
      teamMemberId,
      name: collaboratorName,
      role,
      department,
      companyId: memberCompanyId,
      companyName,
      isIndicator: member?.is_indicator || false,
      metrics,
      attendances,
      plannedMatrix,
      readingSessions,
      quizAttempts,
    }
  } catch (err) {
    console.error('getCollaboratorFullProfile error:', err)
    return null
  }
}
