import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface Interaction {
  id: string
  source_role: string
  target_role: string
  description: string
  status: string
  mcq_ref: string
  created: string
  updated: string
}

export const getRoleInteractions = async (role?: string) => {
  try {
    const opts: Record<string, any> = { sort: '-created' }
    if (role) {
      opts.filter = `source_role = "${role}" || target_role = "${role}"`
    }
    const result = await pb.collection('interactions').getFullList<Interaction>(opts)
    return safeArray<Interaction>(result)
  } catch (e) {
    console.error('getRoleInteractions failed:', e)
    return []
  }
}
