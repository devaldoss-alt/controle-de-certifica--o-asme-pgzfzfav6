import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export type TrainingPeriodicity = 'Diária/DSS' | 'Semanal' | 'Mensal' | 'Anual' | 'Pontual'
export type TrainingOrigin = 'Interno' | 'Externo'
export type TrainingType =
  | 'SMS'
  | 'Qualificação Pessoal-Sensibilização'
  | 'Procedimentos-Instruções-Formulários'
  | 'Outros'
export type TrainingCompetenceForm = 'Treinamento' | 'Educação' | 'Experiência' | 'Empresa Parceira'
export type TrainingEffectivenessStatus = 'Não aplicável' | 'Pendente' | 'OK' | 'Atrasado'
export type TrainingDaysStatus = 'OK' | 'Atrasado' | 'Pendente'

export interface TrainingPlanAction {
  id: string
  company_id: string
  year: number
  action: string
  periodicity: TrainingPeriodicity
  responsible: string
  target_audience: string
  origin: TrainingOrigin
  type: TrainingType
  competence_form: TrainingCompetenceForm
  planned_date: string
  realized_date?: string | null
  requires_effectiveness_eval: boolean
  ch_hours?: number | null
  participants_count?: number | null
  ch_total?: number | null
  effectiveness_due_date?: string | null
  effectiveness_status?: TrainingEffectivenessStatus
  notes?: string
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string }
  }
}

export interface TrainingPlanActionComputed extends TrainingPlanAction {
  status_days: TrainingDaysStatus
}

export interface TrainingImportRow {
  action: string
  periodicity?: string
  responsible?: string
  target_audience?: string
  origin?: string
  type?: string
  competence_form?: string
  planned_date?: string
  realized_date?: string
  requires_effectiveness_eval?: boolean | string
  ch_hours?: number | string
  participants_count?: number | string
  notes?: string
  year?: number | string
  company_id?: string
}

export interface TrainingImportResult {
  success: number
  created: number
  updated: number
  errors: { row: number; error: string }[]
}

export type TrainingImportProgressCallback = (current: number, total: number) => void

/**
 * Derives the completion status relative to the planned deadline:
 * - If realized_date is set:
 *    - if realized <= planned -> "OK"
 *    - if realized > planned  -> "Atrasado"
 * - If realized_date is NOT set:
 *    - if today > planned -> "Atrasado"
 *    - otherwise          -> "Pendente"
 */
export function computeStatusDays(
  plannedDateStr: string,
  realizedDateStr?: string | null,
): TrainingDaysStatus {
  if (!plannedDateStr) return 'Pendente'

  const planned = new Date(plannedDateStr)
  if (isNaN(planned.getTime())) return 'Pendente'

  // Set to end of the day in planned for fair comparison
  const plannedEndOfDay = new Date(planned)
  plannedEndOfDay.setHours(23, 59, 59, 999)

  if (realizedDateStr) {
    const realized = new Date(realizedDateStr)
    if (isNaN(realized.getTime())) return 'Pendente'
    return realized.getTime() <= plannedEndOfDay.getTime() ? 'OK' : 'Atrasado'
  }

  const now = new Date()
  return now.getTime() > plannedEndOfDay.getTime() ? 'Atrasado' : 'Pendente'
}

/**
 * Calculates effectiveness due date: realized_date + 60 days
 */
export function calculateEffectivenessDueDate(realizedDateStr: string): string {
  const d = new Date(realizedDateStr)
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + 60)
  return d.toISOString()
}

/**
 * Normalizes an action with computed fields for UI rendering
 */
export function withComputedFields(item: TrainingPlanAction): TrainingPlanActionComputed {
  const status_days = computeStatusDays(item.planned_date, item.realized_date)
  return {
    ...item,
    status_days,
  }
}

/**
 * Normalizes input date to ISO string for PocketBase
 */
export function normalizeDateToISO(val?: string | null): string | null {
  if (!val) return null
  const str = String(val).trim()
  if (!str) return null

  // Already ISO or includes T/Z
  if (str.includes('T') || str.endsWith('Z')) {
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }

  // Format DD/MM/YYYY or DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (brMatch) {
    const [, d, m, y] = brMatch
    const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0))
    return isNaN(date.getTime()) ? null : date.toISOString()
  }

  // Format YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0))
    return isNaN(date.getTime()) ? null : date.toISOString()
  }
  const parsed = new Date(str)
  return isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/**
 * Helper to prepare payload before create or update:
 * - Computes ch_total = ch_hours * participants_count
 * - If realized_date is provided:
 *     - calculates effectiveness_due_date = +60 days
 *     - effectiveness_status = 'Pendente' (if requires_effectiveness_eval) or 'Não aplicável'
 */
export function prepareActionPayload(data: Partial<TrainingPlanAction>): Record<string, any> {
  const payload: Record<string, any> = { ...data }

  const chHours =
    data.ch_hours !== undefined && data.ch_hours !== null ? Number(data.ch_hours) : null
  const participants =
    data.participants_count !== undefined && data.participants_count !== null
      ? Number(data.participants_count)
      : null

  if (chHours !== null && participants !== null && !isNaN(chHours) && !isNaN(participants)) {
    payload.ch_total = Number((chHours * participants).toFixed(2))
  } else if (data.ch_total !== undefined) {
    payload.ch_total = data.ch_total
  }

  if (data.planned_date) {
    const norm = normalizeDateToISO(data.planned_date)
    if (norm) payload.planned_date = norm
  }

  if (data.realized_date !== undefined) {
    if (data.realized_date) {
      const normRealized = normalizeDateToISO(data.realized_date)
      if (normRealized) {
        payload.realized_date = normRealized
        if (data.effectiveness_due_date === undefined || !data.effectiveness_due_date) {
          payload.effectiveness_due_date = calculateEffectivenessDueDate(normRealized)
        }
        if (data.effectiveness_status === undefined || !data.effectiveness_status) {
          payload.effectiveness_status = data.requires_effectiveness_eval
            ? 'Pendente'
            : 'Não aplicável'
        }
      } else {
        payload.realized_date = null
      }
    } else {
      payload.realized_date = null
      if (data.requires_effectiveness_eval === false) {
        payload.effectiveness_status = 'Não aplicável'
      }
    }
  }

  if (data.effectiveness_due_date) {
    const normDue = normalizeDateToISO(data.effectiveness_due_date)
    if (normDue) payload.effectiveness_due_date = normDue
  }

  return payload
}

export async function getTrainingPlanActions(params: {
  companyId?: string
  year?: number
  search?: string
  type?: string
  origin?: string
  responsible?: string
  statusDays?: string
}): Promise<TrainingPlanActionComputed[]> {
  const filters: string[] = []
  const { companyId, year, search, type, origin, responsible } = params

  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
  }

  if (year) {
    filters.push(`year = ${year}`)
  }

  if (search && search.trim()) {
    const s = search.trim()
    filters.push(
      `(action ~ "${s}" || responsible ~ "${s}" || target_audience ~ "${s}" || notes ~ "${s}")`,
    )
  }

  if (type && type !== 'all') {
    filters.push(`type = "${type}"`)
  }

  if (origin && origin !== 'all') {
    filters.push(`origin = "${origin}"`)
  }

  if (responsible && responsible !== 'all') {
    filters.push(`responsible ~ "${responsible}"`)
  }

  try {
    const result = await pb.collection('training_plan_actions').getFullList<TrainingPlanAction>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: 'planned_date,action',
      expand: 'company_id',
    })

    let computed = safeArray<TrainingPlanAction>(result).map(withComputedFields)

    if (params.statusDays && params.statusDays !== 'all') {
      computed = computed.filter((item) => item.status_days === params.statusDays)
    }

    return computed
  } catch (e) {
    console.error('getTrainingPlanActions failed:', e)
    return []
  }
}

export async function getTrainingPlanAction(id: string): Promise<TrainingPlanActionComputed> {
  const item = await pb.collection('training_plan_actions').getOne<TrainingPlanAction>(id, {
    expand: 'company_id',
  })
  return withComputedFields(item)
}

export async function createTrainingPlanAction(
  data: Partial<TrainingPlanAction>,
): Promise<TrainingPlanActionComputed> {
  const payload = prepareActionPayload(data)
  const created = await pb.collection('training_plan_actions').create<TrainingPlanAction>(payload, {
    expand: 'company_id',
  })
  return withComputedFields(created)
}

export async function updateTrainingPlanAction(
  id: string,
  data: Partial<TrainingPlanAction>,
): Promise<TrainingPlanActionComputed> {
  const payload = prepareActionPayload(data)
  const updated = await pb
    .collection('training_plan_actions')
    .update<TrainingPlanAction>(id, payload, {
      expand: 'company_id',
    })
  return withComputedFields(updated)
}

export async function deleteTrainingPlanAction(id: string): Promise<boolean> {
  return pb.collection('training_plan_actions').delete(id)
}

/**
 * Marks realization of an action:
 * preencher data realizada, CH e participantes -> calcula CH total e datas de eficácia
 */
export async function markActionRealized(params: {
  id: string
  realizedDate: string
  chHours: number
  participantsCount: number
  effectivenessStatus?: TrainingEffectivenessStatus
  notes?: string
}): Promise<TrainingPlanActionComputed> {
  const current = await pb.collection('training_plan_actions').getOne<TrainingPlanAction>(params.id)
  const normDate = normalizeDateToISO(params.realizedDate) || new Date().toISOString()
  const chTotal = Number((params.chHours * params.participantsCount).toFixed(2))
  const effectivenessDue = calculateEffectivenessDueDate(normDate)
  const effectivenessStatus =
    params.effectivenessStatus ||
    (current.requires_effectiveness_eval ? 'Pendente' : 'Não aplicável')

  const updated = await pb.collection('training_plan_actions').update<TrainingPlanAction>(
    params.id,
    {
      realized_date: normDate,
      ch_hours: params.chHours,
      participants_count: params.participantsCount,
      ch_total: chTotal,
      effectiveness_due_date: effectivenessDue,
      effectiveness_status: effectivenessStatus,
      ...(params.notes !== undefined ? { notes: params.notes } : {}),
    },
    { expand: 'company_id' },
  )

  return withComputedFields(updated)
}

/**
 * Normalizes periodicity string
 */
export function normalizePeriodicity(val?: string): TrainingPeriodicity {
  if (!val) return 'Pontual'
  const v = val.toLowerCase().trim()
  if (v.includes('diar') || v.includes('dss') || v.includes('diár')) return 'Diária/DSS'
  if (v.includes('seman')) return 'Semanal'
  if (v.includes('mens')) return 'Mensal'
  if (v.includes('anual')) return 'Anual'
  return 'Pontual'
}

/**
 * Normalizes origin
 */
export function normalizeOrigin(val?: string): TrainingOrigin {
  if (!val) return 'Interno'
  const v = val.toLowerCase().trim()
  if (v.includes('ext')) return 'Externo'
  return 'Interno'
}

/**
 * Normalizes type
 */
export function normalizeType(val?: string): TrainingType {
  if (!val) return 'Procedimentos-Instruções-Formulários'
  const v = val.toLowerCase().trim()
  if (v.includes('sms') || v.includes('seguran') || v.includes('meio ambiente')) return 'SMS'
  if (v.includes('qualific') || v.includes('sensibiliz'))
    return 'Qualificação Pessoal-Sensibilização'
  if (v.includes('proced') || v.includes('instru') || v.includes('formul') || v.includes('it'))
    return 'Procedimentos-Instruções-Formulários'
  return 'Outros'
}

/**
 * Normalizes competence form
 */
export function normalizeCompetenceForm(val?: string): TrainingCompetenceForm {
  if (!val) return 'Treinamento'
  const v = val.toLowerCase().trim()
  if (v.includes('educ') || v.includes('gradua') || v.includes('curso')) return 'Educação'
  if (v.includes('exper')) return 'Experiência'
  if (
    v.includes('parceir') ||
    v.includes('fornecedor') ||
    v.includes('senac') ||
    v.includes('senai')
  )
    return 'Empresa Parceira'
  return 'Treinamento'
}

/**
 * Normalizes boolean flag
 */
export function normalizeBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (!val) return false
  const str = String(val).trim().toLowerCase()
  return ['sim', 's', 'yes', 'y', '1', 'true', 'v', 'verdadeiro'].includes(str)
}

/**
 * Bulk import training plan actions with deduplication by:
 * Action Name + Company ID + Year
 * Reimporting updates current record without duplicating.
 */
export async function bulkImportTrainingPlan(
  rows: TrainingImportRow[],
  targetCompanyId: string,
  targetYear: number,
  onProgress?: TrainingImportProgressCallback,
): Promise<TrainingImportResult> {
  const result: TrainingImportResult = {
    success: 0,
    created: 0,
    updated: 0,
    errors: [],
  }

  // Pre-fetch all existing actions for this company and year to dedup in-memory
  const existingActions = await pb
    .collection('training_plan_actions')
    .getFullList<TrainingPlanAction>({
      filter: `company_id = "${targetCompanyId}" && year = ${targetYear}`,
    })

  const existingMap = new Map<string, TrainingPlanAction>()
  for (const item of existingActions) {
    const key = item.action.trim().toLowerCase()
    existingMap.set(key, item)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.action || !row.action.trim()) {
      result.errors.push({ row: i + 1, error: 'Coluna AÇÃO é obrigatória' })
      onProgress?.(i + 1, rows.length)
      continue
    }

    const actionClean = row.action.trim()
    const actionKey = actionClean.toLowerCase()

    const periodicity = normalizePeriodicity(row.periodicity)
    const responsible = (row.responsible || 'A Definir').trim()
    const targetAudience = (row.target_audience || 'TODOS').trim()
    const origin = normalizeOrigin(row.origin)
    const type = normalizeType(row.type)
    const competenceForm = normalizeCompetenceForm(row.competence_form)

    const plannedDateISO = normalizeDateToISO(row.planned_date) || new Date().toISOString()
    const realizedDateISO = normalizeDateToISO(row.realized_date)
    const reqEffectiveness = normalizeBool(row.requires_effectiveness_eval)

    const chHours =
      row.ch_hours !== undefined && row.ch_hours !== '' && !isNaN(Number(row.ch_hours))
        ? Number(row.ch_hours)
        : null
    const participants =
      row.participants_count !== undefined &&
      row.participants_count !== '' &&
      !isNaN(Number(row.participants_count))
        ? Number(row.participants_count)
        : null

    const chTotal =
      chHours !== null && participants !== null ? Number((chHours * participants).toFixed(2)) : null

    const notes = row.notes ? row.notes.trim() : ''

    let effectivenessDueDate: string | null = null
    let effectivenessStatus: TrainingEffectivenessStatus = reqEffectiveness
      ? 'Pendente'
      : 'Não aplicável'

    if (realizedDateISO) {
      effectivenessDueDate = calculateEffectivenessDueDate(realizedDateISO)
    }

    const existing = existingMap.get(actionKey)

    if (existing) {
      // UPDATE existing action (no duplicate)
      try {
        const updatePayload: Record<string, any> = {
          action: actionClean,
          company_id: targetCompanyId,
          year: targetYear,
          periodicity,
          responsible,
          target_audience: targetAudience,
          origin,
          type,
          competence_form: competenceForm,
          planned_date: plannedDateISO,
          realized_date: realizedDateISO,
          requires_effectiveness_eval: reqEffectiveness,
          ch_hours: chHours,
          participants_count: participants,
          ch_total: chTotal,
          effectiveness_due_date: effectivenessDueDate,
          effectiveness_status: effectivenessStatus,
          notes: notes || existing.notes || '',
        }

        const updated = await pb
          .collection('training_plan_actions')
          .update<TrainingPlanAction>(existing.id, updatePayload)

        existingMap.set(actionKey, updated)
        result.success++
        result.updated++
      } catch (e: any) {
        result.errors.push({
          row: i + 1,
          error: e?.message || 'Falha ao atualizar ação existente',
        })
      }
    } else {
      // CREATE new action
      try {
        const createPayload: Record<string, any> = {
          action: actionClean,
          company_id: targetCompanyId,
          year: targetYear,
          periodicity,
          responsible,
          target_audience: targetAudience,
          origin,
          type,
          competence_form: competenceForm,
          planned_date: plannedDateISO,
          realized_date: realizedDateISO,
          requires_effectiveness_eval: reqEffectiveness,
          ch_hours: chHours,
          participants_count: participants,
          ch_total: chTotal,
          effectiveness_due_date: effectivenessDueDate,
          effectiveness_status: effectivenessStatus,
          notes,
        }

        const created = await pb
          .collection('training_plan_actions')
          .create<TrainingPlanAction>(createPayload)

        existingMap.set(actionKey, created)
        result.success++
        result.created++
      } catch (e: any) {
        result.errors.push({
          row: i + 1,
          error: e?.message || 'Falha ao criar nova ação',
        })
      }
    }

    onProgress?.(i + 1, rows.length)
  }

  return result
}
