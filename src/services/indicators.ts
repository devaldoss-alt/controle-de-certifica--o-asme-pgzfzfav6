import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface Indicator {
  id: string
  title: string
  objective?: string
  formula_description: string
  target_value: number
  current_value: number
  unit: string
  period: string
  result_type?: string
  verification_method?: string
  target_operator?: string
  responsible?: string
  company_id?: string
  created: string
  updated: string
  expand?: {
    responsible?: { id: string; name: string } | null
  }
}

export interface IndicatorFormData {
  title: string
  objective: string
  formula_description: string
  target_value: number
  unit: string
  period: string
  result_type: string
  verification_method: string
  target_operator: string
  responsible?: string
}

export const getIndicators = async (companyId?: string) => {
  const filters: string[] = []
  if (companyId && companyId !== 'all') filters.push(`company_id = "${companyId}"`)
  const opts: Record<string, any> = { sort: 'title', expand: 'responsible' }
  if (filters.length > 0) opts.filter = filters.join(' && ')
  try {
    const result = await pb.collection('indicators').getFullList<Indicator>(opts)
    return safeArray<Indicator>(result)
  } catch (e) {
    console.error('getIndicators failed:', e)
    return []
  }
}

export const updateIndicator = async (id: string, data: Partial<Indicator>) => {
  return pb.collection('indicators').update(id, data)
}

export const createIndicator = async (data: IndicatorFormData & { company_id: string }) => {
  return pb.collection('indicators').create(data)
}

export const deleteIndicator = async (id: string) => {
  return pb.collection('indicators').delete(id)
}
