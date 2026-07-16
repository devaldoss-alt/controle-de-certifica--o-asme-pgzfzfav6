import pb from '@/lib/pocketbase/client'

export interface ServiceOrder {
  id: string
  number: string
  client: string
  equipment: string
  standard: string
  deadline: string
  status: 'Active' | 'Completed' | 'Paused'
  created: string
  updated: string
}

export const getServiceOrders = async (status?: string) => {
  const opts: Record<string, any> = { sort: '-created' }
  if (status && status !== 'all') {
    opts.filter = `status = "${status}"`
  }
  return pb.collection('service_orders').getFullList<ServiceOrder>(opts)
}

export const createServiceOrder = async (data: {
  number: string
  client: string
  equipment: string
  standard: string
  deadline?: string
  status?: string
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
