import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import type {
  TrainingAttendanceList,
  TrainingParticipant,
  TrainingEffectivenessEvaluation,
} from './training-attendance'
import type { TrainingPlanAction } from './trainings'

export const DEFAULT_BASE_HOURS_PER_MONTH = 220
export const HHT_TARGET_PERCENT = 0.4
export const EFICACIA_TARGET_PERCENT = 90
export const PLANO_TARGET_PERCENT = 90

export interface MonthlyHHTData {
  monthIndex: number // 0-11
  monthName: string
  year: number
  hhTreinado: number // total hours trained (sum of ch * presentes)
  activeEmployeesCount: number
  baseHours: number // e.g. 220
  totalAvailableHours: number // activeEmployees * 220
  percentHHT: number // (hhTreinado / totalAvailableHours) * 100
  targetPercent: number // 0.4
  isOnTarget: boolean // percentHHT >= 0.4
  listsCount: number
}

export interface TrainingIndicatorsSummary {
  companyId: string
  year: number
  activeEmployeesCount: number
  baseHoursPerMonth: number
  monthlyHHT: MonthlyHHTData[]
  currentMonthHHT: MonthlyHHTData
  yearAverageHHT: number
  totalYearHHTrained: number
  // % Eficácia
  totalEvaluationsCompleted: number
  totalEvaluationsSim: number
  percentEficacia: number
  isEficaciaOnTarget: boolean
  // % Plano Concluído
  totalActionsPlanned: number
  totalActionsRealized: number
  percentPlanoConcluido: number
  isPlanoOnTarget: boolean
}

export const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

/**
 * Get active collaborators count for a given company.
 * Counts from `team` collection where company_id matches.
 */
export async function getCompanyEmployeesCount(companyId: string): Promise<number> {
  if (!companyId || companyId === 'all') return 0
  try {
    const members = await pb.collection('team').getFullList<{ id: string; role?: string }>({
      filter: `company_id = "${companyId}"`,
      fields: 'id,role',
    })
    // In team, all records are collaborators (colaboradores próprios e parceiros/PJ).
    return members.length > 0 ? members.length : 1 // minimum 1 to prevent division by zero
  } catch (e) {
    console.warn('getCompanyEmployeesCount failed:', e)
    return 1
  }
}

/**
 * Compute monthly and overall training indicators for a company and year.
 */
export async function computeTrainingIndicators(params: {
  companyId: string
  year: number
  baseHoursPerMonth?: number
}): Promise<TrainingIndicatorsSummary> {
  const { companyId, year } = params
  const baseHours = params.baseHoursPerMonth || DEFAULT_BASE_HOURS_PER_MONTH

  // 1. Employee count
  const employeesCount = await getCompanyEmployeesCount(companyId)

  // 2. Fetch all attendance lists for this company
  let attendanceLists: TrainingAttendanceList[] = []
  try {
    const records = await pb
      .collection('training_attendance_lists')
      .getFullList<TrainingAttendanceList>({
        filter: companyId && companyId !== 'all' ? `company_id = "${companyId}"` : undefined,
      })
    attendanceLists = safeArray<TrainingAttendanceList>(records)
  } catch (e) {
    console.warn('Failed to load training_attendance_lists for indicators:', e)
  }

  // Filter to valid realized lists (status realizada, aguardando_avaliacao_eficacia, avaliacao_concluida)
  const validLists = attendanceLists.filter(
    (l) =>
      l.status === 'realizada' ||
      l.status === 'aguardando_avaliacao_eficacia' ||
      l.status === 'avaliacao_concluida',
  )

  // 3. For each valid list, fetch its participants count if not known
  // Fetch participants for these lists
  let participants: TrainingParticipant[] = []
  if (validLists.length > 0) {
    try {
      const listIds = validLists.map((l) => `attendance_list = "${l.id}"`).join(' || ')
      const partRecords = await pb
        .collection('training_participants')
        .getFullList<TrainingParticipant>({
          filter: listIds,
          fields: 'id,attendance_list,presenca',
        })
      participants = safeArray<TrainingParticipant>(partRecords)
    } catch (e) {
      console.warn('Failed to load training_participants for indicators:', e)
    }
  }

  // Pre-calculate present count per attendance list
  const presentCountByList: Record<string, number> = {}
  participants.forEach((p) => {
    if (p.presenca === 'Presente') {
      presentCountByList[p.attendance_list] = (presentCountByList[p.attendance_list] || 0) + 1
    }
  })

  // Group training hours by month (0-11) for the requested year
  const monthlyHH: number[] = Array(12).fill(0)
  const monthlyListsCount: number[] = Array(12).fill(0)

  validLists.forEach((l) => {
    if (!l.data_realizacao) return
    const d = new Date(l.data_realizacao)
    if (isNaN(d.getTime())) return
    if (d.getFullYear() !== year) return

    const m = d.getMonth()
    const ch = l.carga_horaria || 0
    const count = presentCountByList[l.id] !== undefined ? presentCountByList[l.id] : 0
    const hh = Number((ch * count).toFixed(2))

    monthlyHH[m] += hh
    monthlyListsCount[m] += 1
  })

  // Incorporate tracked document readings into HHT (Onda D - Bloco 2)
  try {
    const readingFilter =
      companyId && companyId !== 'all' ? `company_id = "${companyId}"` : undefined
    const readingRecords = await pb.collection('document_reading_sessions').getFullList<{
      id: string
      started_at: string
      duration_seconds: number
      completed: boolean
      abandoned: boolean
    }>({
      filter: readingFilter,
    })
    for (const rs of readingRecords) {
      if (rs.abandoned || !rs.duration_seconds || rs.duration_seconds <= 0) continue
      const rDate = new Date(rs.started_at)
      if (!isNaN(rDate.getTime()) && rDate.getFullYear() === year) {
        const rMonth = rDate.getMonth()
        const rHours = Number((rs.duration_seconds / 3600).toFixed(2))
        monthlyHH[rMonth] += rHours
      }
    }
  } catch (err) {
    console.warn('Incorporate reading sessions in HHT tolerant catch:', err)
  }

  // Build monthly HHT data
  const totalAvailablePerMonth = employeesCount * baseHours
  const monthlyHHT: MonthlyHHTData[] = monthlyHH.map((hh, idx) => {
    const pct =
      totalAvailablePerMonth > 0 ? Number(((hh / totalAvailablePerMonth) * 100).toFixed(3)) : 0
    return {
      monthIndex: idx,
      monthName: MONTH_NAMES_SHORT[idx],
      year,
      hhTreinado: Number(hh.toFixed(2)),
      activeEmployeesCount: employeesCount,
      baseHours,
      totalAvailableHours: totalAvailablePerMonth,
      percentHHT: pct,
      targetPercent: HHT_TARGET_PERCENT,
      isOnTarget: pct >= HHT_TARGET_PERCENT,
      listsCount: monthlyListsCount[idx],
    }
  })

  // Current month
  const now = new Date()
  const currentMonthIdx = now.getFullYear() === year ? now.getMonth() : 0
  const currentMonthHHT = monthlyHHT[currentMonthIdx]

  // Totals for the year
  const totalYearHHTrained = Number(monthlyHH.reduce((acc, h) => acc + h, 0).toFixed(2))
  const monthsWithDataOrUpToCurrent = now.getFullYear() === year ? currentMonthIdx + 1 : 12
  const sumPct = monthlyHHT
    .slice(0, monthsWithDataOrUpToCurrent)
    .reduce((acc, m) => acc + m.percentHHT, 0)
  const yearAverageHHT = Number((sumPct / monthsWithDataOrUpToCurrent).toFixed(3))

  // 4. Calculate % Eficácia de Treinamento
  // Total completed evaluations with SIM / total completed evaluations
  let evaluations: TrainingEffectivenessEvaluation[] = []
  try {
    const listFilter =
      companyId && companyId !== 'all' ? `attendance_list.company_id = "${companyId}"` : undefined
    const evRecords = await pb
      .collection('training_effectiveness_evaluations')
      .getFullList<TrainingEffectivenessEvaluation>({
        filter: listFilter,
        expand: 'attendance_list',
      })
    evaluations = safeArray<TrainingEffectivenessEvaluation>(evRecords)
  } catch (e) {
    console.warn('Failed to load evaluations for indicators:', e)
  }

  // Filter evaluations whose attendance list belongs to this company and optionally year
  const companyEvals = evaluations.filter((ev) => {
    const attCompany = (ev.expand as any)?.attendance_list?.company_id
    if (companyId && companyId !== 'all' && attCompany && attCompany !== companyId) {
      return false
    }
    if (ev.data_avaliacao) {
      const d = new Date(ev.data_avaliacao)
      if (!isNaN(d.getTime()) && d.getFullYear() !== year) {
        return false
      }
    }
    return true
  })

  const totalEvaluationsCompleted = companyEvals.length
  const totalEvaluationsSim = companyEvals.filter((ev) => ev.resposta === 'SIM').length

  // Incorporate quiz attempts into % Eficácia (Onda D - Bloco 2)
  let quizAttemptsTotal = 0
  let quizAttemptsApproved = 0
  try {
    const attemptFilter =
      companyId && companyId !== 'all' ? `company_id = "${companyId}"` : undefined
    const quizAttempts = await pb.collection('quiz_attempts').getFullList<{
      id: string
      approved: boolean
      created: string
    }>({
      filter: attemptFilter,
    })
    for (const qa of quizAttempts) {
      const qDate = new Date(qa.created)
      if (!isNaN(qDate.getTime()) && qDate.getFullYear() === year) {
        quizAttemptsTotal++
        if (qa.approved) quizAttemptsApproved++
      }
    }
  } catch (err) {
    console.warn('Incorporate quiz attempts in Eficácia tolerant catch:', err)
  }

  const combinedEvalsCompleted = totalEvaluationsCompleted + quizAttemptsTotal
  const combinedEvalsSim = totalEvaluationsSim + quizAttemptsApproved

  const percentEficacia =
    combinedEvalsCompleted > 0
      ? Number(((combinedEvalsSim / combinedEvalsCompleted) * 100).toFixed(1))
      : 0

  // 5. Calculate % do Plano de Treinamento Concluído
  let planActions: TrainingPlanAction[] = []
  try {
    const pFilters: string[] = [`year = ${year}`]
    if (companyId && companyId !== 'all') {
      pFilters.push(`company_id = "${companyId}"`)
    }
    const actRecords = await pb
      .collection('training_plan_actions')
      .getFullList<TrainingPlanAction>({
        filter: pFilters.join(' && '),
      })
    planActions = safeArray<TrainingPlanAction>(actRecords)
  } catch (e) {
    console.warn('Failed to load plan actions for indicators:', e)
  }

  const totalActionsPlanned = planActions.length
  const totalActionsRealized = planActions.filter((a) => !!a.realized_date).length
  const percentPlanoConcluido =
    totalActionsPlanned > 0
      ? Number(((totalActionsRealized / totalActionsPlanned) * 100).toFixed(1))
      : 0

  return {
    companyId,
    year,
    activeEmployeesCount: employeesCount,
    baseHoursPerMonth: baseHours,
    monthlyHHT,
    currentMonthHHT,
    yearAverageHHT,
    totalYearHHTrained,
    totalEvaluationsCompleted,
    totalEvaluationsSim,
    percentEficacia,
    isEficaciaOnTarget: percentEficacia >= EFICACIA_TARGET_PERCENT,
    totalActionsPlanned,
    totalActionsRealized,
    percentPlanoConcluido,
    isPlanoOnTarget: percentPlanoConcluido >= PLANO_TARGET_PERCENT,
  }
}

/**
 * Recalculate indicators and update the `indicators` and `indicator_history` collections.
 * Safe and non-blocking: errors are logged and never throw to the caller.
 */
export async function recalculateTrainingIndicators(params: {
  companyId: string
  year?: number
}): Promise<TrainingIndicatorsSummary | null> {
  const currentYear = params.year || new Date().getFullYear()
  const companyId = params.companyId

  if (!companyId || companyId === 'all') {
    return null
  }

  try {
    const summary = await computeTrainingIndicators({
      companyId,
      year: currentYear,
    })

    // Fetch existing indicator records for this company
    const indicators = await pb.collection('indicators').getFullList<{
      id: string
      title: string
      current_value: number
      company_id: string
    }>({
      filter: `company_id = "${companyId}"`,
    })

    const hhtIndicator = indicators.find((i) => i.title.startsWith('HHT'))
    const eficaciaIndicator = indicators.find((i) => i.title.includes('Eficácia'))
    const planoIndicator = indicators.find((i) => i.title.includes('Plano de Treinamento'))

    // 1. Update HHT indicator
    // Current value set to current month HHT (or year average if current month is 0 and previous has data)
    if (hhtIndicator) {
      const now = new Date()
      const currentMonthIdx = now.getMonth()
      const curMonthVal = summary.monthlyHHT[currentMonthIdx]?.percentHHT || 0
      // If current month is 0 and there are realized hours in the year, we can show either current month or average
      const valToSet = curMonthVal > 0 ? curMonthVal : summary.yearAverageHHT

      await pb
        .collection('indicators')
        .update(hhtIndicator.id, {
          current_value: valToSet,
        })
        .catch((e) => console.warn('Could not update HHT current_value:', e))

      // Also upsert history entries for months that have data
      await syncMonthlyHHTHistory(hhtIndicator.id, companyId, summary.monthlyHHT)
    }

    // 2. Update % Eficácia indicator
    if (eficaciaIndicator) {
      await pb
        .collection('indicators')
        .update(eficaciaIndicator.id, {
          current_value: summary.percentEficacia,
        })
        .catch((e) => console.warn('Could not update Eficácia current_value:', e))
    }

    // 3. Update % Plano indicator
    if (planoIndicator) {
      await pb
        .collection('indicators')
        .update(planoIndicator.id, {
          current_value: summary.percentPlanoConcluido,
        })
        .catch((e) => console.warn('Could not update Plano current_value:', e))
    }

    return summary
  } catch (err) {
    console.warn('recalculateTrainingIndicators silent error:', err)
    return null
  }
}

/**
 * Sync monthly measurements to `indicator_history` so the history dialog and reports
 * reflect the calculated values per month.
 */
async function syncMonthlyHHTHistory(
  indicatorId: string,
  companyId: string,
  monthlyHHT: MonthlyHHTData[],
) {
  try {
    const existingHistory = await pb.collection('indicator_history').getFullList<{
      id: string
      period_date: string
      notes: string
    }>({
      filter: `indicator_id = "${indicatorId}"`,
    })

    for (const m of monthlyHHT) {
      if (m.hhTreinado === 0 && m.percentHHT === 0) continue

      // ISO date for 1st of that month
      const monthStr = String(m.monthIndex + 1).padStart(2, '0')
      const periodDateIso = `${m.year}-${monthStr}-01 00:00:00.000Z`
      const periodDatePrefix = `${m.year}-${monthStr}-01`

      const existing = existingHistory.find((h) => h.period_date.startsWith(periodDatePrefix))
      const notes = `Cálculo automático HHT: ${m.hhTreinado}h treinadas ÷ (${m.activeEmployeesCount} colab × ${m.baseHours}h) | ${m.listsCount} lista(s) realizada(s)`

      if (existing) {
        await pb
          .collection('indicator_history')
          .update(existing.id, {
            value: m.percentHHT,
            notes,
          })
          .catch(() => {})
      } else {
        await pb
          .collection('indicator_history')
          .create({
            indicator_id: indicatorId,
            company_id: companyId,
            value: m.percentHHT,
            period_date: periodDateIso,
            notes,
          })
          .catch(() => {})
      }
    }
  } catch (e) {
    console.warn('syncMonthlyHHTHistory error (non-blocking):', e)
  }
}
