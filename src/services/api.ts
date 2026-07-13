import pb from '@/lib/pocketbase/client'

export interface Checklist {
  id: string
  title: string
  description: string
  role_assigned: string
  mcq_ref: string
  status: 'pending' | 'completed'
  due_date: string
  is_critical: boolean
  created: string
}

export interface UserStats {
  total: number
  completed: number
  pending: number
  expired: number
}

export const getChecklists = async (role?: string) => {
  const filter = role ? `role_assigned = "${role}"` : ''
  return pb.collection('checklists').getFullList<Checklist>({
    filter,
    sort: 'status, due_date',
  })
}

export const updateChecklistStatus = async (id: string, status: 'pending' | 'completed') => {
  return pb.collection('checklists').update(id, {
    status,
    last_action_by: pb.authStore.record?.id,
  })
}

export const getUsers = async () => {
  return pb.collection('users').getFullList({ sort: 'name' })
}
