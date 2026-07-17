import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface UserAllocation {
  id: string
  user_id: string
  company_id: string
  expand?: {
    user_id?: { id: string; name: string; email: string; role: string }
    company_id?: { id: string; name: string }
  }
  created: string
  updated: string
}

export const getAllocations = async (userId?: string) => {
  const opts: Record<string, any> = { expand: 'user_id,company_id', sort: '-created' }
  if (userId) {
    opts.filter = `user_id = "${userId}"`
  }
  try {
    const result = await pb.collection('user_allocations').getFullList<UserAllocation>(opts)
    return safeArray<UserAllocation>(result)
  } catch (e) {
    console.error('getAllocations failed:', e)
    return []
  }
}

export const getAllAllocations = async () => {
  try {
    const result = await pb.collection('user_allocations').getFullList<UserAllocation>({
      expand: 'user_id,company_id',
      sort: '-created',
    })
    return safeArray<UserAllocation>(result)
  } catch (e) {
    console.error('getAllAllocations failed:', e)
    return []
  }
}

export const createAllocation = async (userId: string, companyId: string) => {
  return pb.collection('user_allocations').create({ user_id: userId, company_id: companyId })
}

export const deleteAllocation = async (id: string) => {
  return pb.collection('user_allocations').delete(id)
}
