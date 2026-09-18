import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { RNC_PROCESS_LIST } from '@/services/rnc'

export const OBJECTIVE_PROCESS_LIST = RNC_PROCESS_LIST

export type MetricType = 'percentual' | 'número' | 'dias' | 'custo'
export type ObjectiveStatus =
  | 'Planejado'
  | 'Em andamento'
  | 'Atingido'
  | 'Não atingido'
  | 'Cancelado'

export interface ObjectiveActionItem {
  id: string
  description: string
  responsible: string
  deadline: string
  status: 'Aberta' | 'Em andamento' | 'Concluída' | 'Cancelada'
}

export interface QualityObjective {
  id: string
  company_id: string
  year: number
  objective: string
  process: string
  indicator: string
  metric_type: MetricType
  target_value: number
  baseline?: number | null
  current_value?: number | null
  responsible_id?: string | null
  deadline?: string | null
  status: ObjectiveStatus
  action_plan?: ObjectiveActionItem[] | string | null
  notes?: string | null
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string }
    responsible_id?: { id: string; name: string; role?: string }
  }
}

export interface QualityObjectiveComputed extends QualityObjective {
  actionsList: ObjectiveActionItem[]
  achievementPercent: number
  trafficLight: 'green' | 'yellow' | 'red' | 'gray'
  isOverdue: boolean
}

/**
 * Calculates achievement percentage and traffic light.
 * Supports logic where higher is better (standard) or normal ratio.
 */
export function calculateObjectiveProgress(
  target: number,
  current: number | null | undefined,
  metricType: MetricType,
  status: ObjectiveStatus,
  deadline?: string | null,
): {
  achievementPercent: number
  trafficLight: 'green' | 'yellow' | 'red' | 'gray'
  isOverdue: boolean
} {
  const isOverdue = Boolean(
    deadline &&
    new Date(deadline).getTime() < new Date().setHours(0, 0, 0, 0) &&
    status !== 'Atingido' &&
    status !== 'Cancelado',
  )

  if (status === 'Cancelado') {
    return { achievementPercent: 0, trafficLight: 'gray', isOverdue: false }
  }

  if (status === 'Atingido') {
    return { achievementPercent: 100, trafficLight: 'green', isOverdue }
  }

  if (current === null || current === undefined || isNaN(current) || target === 0) {
    return { achievementPercent: 0, trafficLight: isOverdue ? 'red' : 'yellow', isOverdue }
  }

  // Standard ratio calculation
  const ratio = Math.round((current / target) * 100)
  const pct = Math.max(0, ratio)

  let trafficLight: 'green' | 'yellow' | 'red' = 'yellow'
  if (pct >= 100) {
    trafficLight = 'green'
  } else if (isOverdue || pct < 50 || status === 'Não atingido') {
    trafficLight = 'red'
  } else {
    trafficLight = 'yellow'
  }

  return { achievementPercent: pct, trafficLight, isOverdue }
}

/**
 * Parses action plan safely from JSON or string
 */
export function parseObjectiveActionPlan(data: unknown): ObjectiveActionItem[] {
  if (!data) return []
  if (Array.isArray(data)) return data as ObjectiveActionItem[]
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function withObjectiveComputed(item: QualityObjective): QualityObjectiveComputed {
  const actionsList = parseObjectiveActionPlan(item.action_plan)
  const { achievementPercent, trafficLight, isOverdue } = calculateObjectiveProgress(
    item.target_value,
    item.current_value,
    item.metric_type,
    item.status,
    item.deadline,
  )

  return {
    ...item,
    actionsList,
    achievementPercent,
    trafficLight,
    isOverdue,
  }
}

export async function getQualityObjectives(params: {
  companyId?: string
  year?: number
  process?: string
  status?: string
  search?: string
}): Promise<QualityObjectiveComputed[]> {
  const filters: string[] = []
  if (params.companyId && params.companyId !== 'all') {
    filters.push(`company_id = "${params.companyId}"`)
  }
  if (params.year) {
    filters.push(`year = ${params.year}`)
  }
  if (params.process && params.process !== 'all') {
    filters.push(`process = "${params.process}"`)
  }
  if (params.status && params.status !== 'all') {
    filters.push(`status = "${params.status}"`)
  }
  if (params.search && params.search.trim()) {
    const s = params.search.trim()
    filters.push(`(objective ~ "${s}" || indicator ~ "${s}" || notes ~ "${s}")`)
  }

  try {
    const list = await pb.collection('quality_objectives').getFullList<QualityObjective>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: 'process,objective',
      expand: 'company_id,responsible_id',
    })
    return safeArray<QualityObjective>(list).map(withObjectiveComputed)
  } catch (err) {
    console.error('getQualityObjectives error:', err)
    return []
  }
}

export async function getQualityObjectiveById(id: string): Promise<QualityObjectiveComputed> {
  const item = await pb.collection('quality_objectives').getOne<QualityObjective>(id, {
    expand: 'company_id,responsible_id',
  })
  return withObjectiveComputed(item)
}

export async function createQualityObjective(
  data: Partial<QualityObjective>,
): Promise<QualityObjectiveComputed> {
  const payload: any = { ...data }
  if (data.action_plan && typeof data.action_plan !== 'string') {
    payload.action_plan = JSON.stringify(data.action_plan)
  }

  const created = await pb.collection('quality_objectives').create<QualityObjective>(payload, {
    expand: 'company_id,responsible_id',
  })
  return withObjectiveComputed(created)
}

export async function updateQualityObjective(
  id: string,
  data: Partial<QualityObjective>,
): Promise<QualityObjectiveComputed> {
  const payload: any = { ...data }
  if (data.action_plan && typeof data.action_plan !== 'string') {
    payload.action_plan = JSON.stringify(data.action_plan)
  }

  const updated = await pb.collection('quality_objectives').update<QualityObjective>(id, payload, {
    expand: 'company_id,responsible_id',
  })
  return withObjectiveComputed(updated)
}

export async function deleteQualityObjective(id: string): Promise<boolean> {
  return pb.collection('quality_objectives').delete(id)
}
