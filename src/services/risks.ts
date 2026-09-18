import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { RNC_PROCESS_LIST } from '@/services/rnc'

export const RISK_PROCESS_LIST = RNC_PROCESS_LIST

export const RISK_TYPES = ['Risco', 'Oportunidade'] as const
export type RiskType = (typeof RISK_TYPES)[number]

export const RISK_CAUSE_CATEGORIES = [
  'Processo e Procedimento',
  'Pessoas e Capacitação',
  'Equipamentos e Infraestrutura',
  'Fornecedores e Suprimentos',
  'Tecnologia da Informação',
  'Financeiro e Mercado',
  'Legal, Normativo e Compliance',
  'Segurança, Meio Ambiente e Saúde (SMS)',
  'Cliente e Demanda',
  'Outro',
] as const

export const TREATMENT_STATUSES = ['Planejado', 'Em andamento', 'Implementado'] as const
export type TreatmentStatus = (typeof TREATMENT_STATUSES)[number]

export const RISK_STATUSES = ['Ativo', 'Encerrado'] as const
export type RiskStatus = (typeof RISK_STATUSES)[number]

export type RiskGrade = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'

export interface RiskRegisterItem {
  id: string
  company_id: string
  process: string
  type: RiskType
  description: string
  cause_category?: string
  probability: number // 1 to 5
  impact: number // 1 to 5
  risk_level: number // probability * impact (1 to 25)
  risk_grade: RiskGrade
  treatment_plan?: string
  treatment_responsible?: string
  treatment_deadline?: string
  treatment_status: TreatmentStatus
  status: RiskStatus
  created?: string
  updated?: string
  expand?: {
    company_id?: { id: string; name: string }
  }
}

/**
 * Calculates risk level and grade from probability and impact:
 * - 1 to 4: Baixo (Verde)
 * - 5 to 9: Médio (Amarelo)
 * - 10 to 15: Alto (Laranja)
 * - 16 to 25: Crítico (Vermelho)
 */
export function calculateRiskLevelAndGrade(
  probability: number,
  impact: number,
): { level: number; grade: RiskGrade; colorClass: string; bgClass: string; textClass: string } {
  const prob = Math.max(1, Math.min(5, Number(probability) || 1))
  const imp = Math.max(1, Math.min(5, Number(impact) || 1))
  const level = prob * imp

  if (level <= 4) {
    return {
      level,
      grade: 'Baixo',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-700',
    }
  }
  if (level <= 9) {
    return {
      level,
      grade: 'Médio',
      colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-700',
    }
  }
  if (level <= 15) {
    return {
      level,
      grade: 'Alto',
      colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
      bgClass: 'bg-orange-500',
      textClass: 'text-orange-700',
    }
  }
  return {
    level,
    grade: 'Crítico',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    bgClass: 'bg-rose-600',
    textClass: 'text-rose-700',
  }
}

// ---------------- API Calls ----------------

export async function getRiskRegister(params: {
  companyId?: string
  process?: string
  type?: string
  grade?: string
  status?: string
  search?: string
}): Promise<RiskRegisterItem[]> {
  try {
    const filters: string[] = []
    if (params.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}" || company_id = ""`)
    }
    if (params.process && params.process !== 'all') {
      filters.push(`process = "${params.process}"`)
    }
    if (params.type && params.type !== 'all') {
      filters.push(`type = "${params.type}"`)
    }
    if (params.grade && params.grade !== 'all') {
      filters.push(`risk_grade = "${params.grade}"`)
    }
    if (params.status && params.status !== 'all') {
      filters.push(`status = "${params.status}"`)
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim()
      filters.push(
        `(description ~ "${s}" || treatment_plan ~ "${s}" || treatment_responsible ~ "${s}" || cause_category ~ "${s}")`,
      )
    }

    const records = await pb.collection('risk_register').getFullList<RiskRegisterItem>({
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-risk_level,-created',
      expand: 'company_id',
    })

    return safeArray<RiskRegisterItem>(records).map((r) => {
      const calculated = calculateRiskLevelAndGrade(r.probability, r.impact)
      return {
        ...r,
        risk_level: r.risk_level || calculated.level,
        risk_grade: (r.risk_grade as RiskGrade) || calculated.grade,
      }
    })
  } catch (err) {
    console.error('getRiskRegister failed:', err)
    return []
  }
}

export async function getRiskById(id: string): Promise<RiskRegisterItem | null> {
  try {
    const record = await pb.collection('risk_register').getOne<RiskRegisterItem>(id, {
      expand: 'company_id',
    })
    const calculated = calculateRiskLevelAndGrade(record.probability, record.impact)
    return {
      ...record,
      risk_level: record.risk_level || calculated.level,
      risk_grade: (record.risk_grade as RiskGrade) || calculated.grade,
    }
  } catch (err) {
    console.error('getRiskById failed:', err)
    return null
  }
}

export async function createRiskRegister(
  data: Partial<RiskRegisterItem>,
): Promise<RiskRegisterItem> {
  const prob = Number(data.probability) || 1
  const imp = Number(data.impact) || 1
  const { level, grade } = calculateRiskLevelAndGrade(prob, imp)

  const payload: any = {
    ...data,
    probability: prob,
    impact: imp,
    risk_level: level,
    risk_grade: grade,
    treatment_status: data.treatment_status || 'Planejado',
    status: data.status || 'Ativo',
  }

  const created = await pb.collection('risk_register').create<RiskRegisterItem>(payload)
  return created
}

export async function updateRiskRegister(
  id: string,
  data: Partial<RiskRegisterItem>,
): Promise<RiskRegisterItem> {
  const updatePayload: any = { ...data }
  if (data.probability !== undefined || data.impact !== undefined) {
    const existing = await getRiskById(id)
    const prob =
      data.probability !== undefined ? Number(data.probability) : existing?.probability || 1
    const imp = data.impact !== undefined ? Number(data.impact) : existing?.impact || 1
    const { level, grade } = calculateRiskLevelAndGrade(prob, imp)
    updatePayload.probability = prob
    updatePayload.impact = imp
    updatePayload.risk_level = level
    updatePayload.risk_grade = grade
  }

  const updated = await pb.collection('risk_register').update<RiskRegisterItem>(id, updatePayload)
  return updated
}

export async function deleteRiskRegister(id: string): Promise<void> {
  await pb.collection('risk_register').delete(id)
}
