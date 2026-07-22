import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface IndicatorHistory {
  id: string
  indicator_id: string
  value: number
  period_date: string
  evidence?: string | string[]
  notes: string
  created: string
  updated: string
}

export const getHistory = async (indicatorId: string) => {
  try {
    const result = await pb.collection('indicator_history').getFullList<IndicatorHistory>({
      filter: `indicator_id = "${indicatorId}"`,
      sort: '-period_date',
    })
    return safeArray<IndicatorHistory>(result)
  } catch (e) {
    console.error('getHistory failed:', e)
    return []
  }
}

export const createHistory = async (data: FormData) => {
  return pb.collection('indicator_history').create(data)
}

export const deleteHistory = async (id: string) => {
  return pb.collection('indicator_history').delete(id)
}
