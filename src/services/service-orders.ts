import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface ServiceOrder {
  id: string
  number: string
  client: string
  equipment: string
  standard: string
  deadline: string
  status: 'Active' | 'Completed' | 'Paused'
  owner_company_id?: string
  expand?: {
    owner_company_id?: { id: string; name: string } | null
  }
  created: string
  updated: string
}

export const getServiceOrders = async (status?: string, companyId?: string) => {
  const opts: Record<string, any> = { sort: '-created', expand: 'owner_company_id' }
  const filters: string[] = []
  if (status && status !== 'all') {
    filters.push(`status = "${status}"`)
  }
  if (companyId && companyId !== 'all') {
    filters.push(`owner_company_id = "${companyId}"`)
  }
  if (filters.length > 0) {
    opts.filter = filters.join(' && ')
  }
  try {
    const result = await pb.collection('service_orders').getFullList<ServiceOrder>(opts)
    return safeArray<ServiceOrder>(result)
  } catch (e) {
    console.error('getServiceOrders failed:', e)
    return []
  }
}

export const createServiceOrder = async (data: {
  number: string
  client: string
  equipment: string
  standard: string
  deadline?: string
  status?: string
  owner_company_id?: string
}) => {
  return pb.collection('service_orders').create({
    ...data,
    status: data.status || 'Active',
  })
}

export const updateServiceOrder = async (id: string, data: Partial<ServiceOrder>) => {
  return pb.collection('service_orders').update(id, data)
}

export const deleteServiceOrder = async (id: string) => {
  return pb.collection('service_orders').delete(id)
}
