import pb from '@/lib/pocketbase/client'

export interface User {
  id: string
  email: string
  name: string
  role: string
  qualification_expiry?: string
  created: string
}

export interface Checklist {
  id: string
  title: string
  description: string
  role_assigned: string
  mcq_ref: string
  status: 'pending' | 'completed'
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_comment: string
  locked: boolean
  due_date: string
  is_critical: boolean
  last_action_by: string
  created: string
  expand?: {
    last_action_by?: User | null
  }
}

export interface Interaction {
  id: string
  source_role: string
  target_role: string
  description: string
  mcq_ref: string
  status: 'pending' | 'resolved'
  created: string
}

export const getChecklists = async (role?: string) => {
  const opts: Record<string, any> = {
    sort: '-status, due_date',
    expand: 'last_action_by',
  }
  if (role) {
    opts.filter = `role_assigned = "${role}"`
  }
  return pb.collection('checklists').getFullList<Checklist>(opts)
}

export const getPendingApprovals = async () => {
  return pb.collection('checklists').getFullList<Checklist>({
    filter: 'status = "completed" && approval_status = "pending"',
    sort: 'due_date',
    expand: 'last_action_by',
  })
}

export const updateChecklistStatus = async (id: string, status: 'pending' | 'completed') => {
  const data: Record<string, any> = {
    status,
    last_action_by: pb.authStore.record?.id,
  }
  if (status === 'completed') {
    data.approval_status = 'pending'
  }
  return pb.collection('checklists').update(id, data)
}

export const approveChecklist = async (id: string) => {
  return pb.collection('checklists').update(id, {
    approval_status: 'approved',
    locked: true,
    last_action_by: pb.authStore.record?.id,
  })
}

export const rejectChecklist = async (id: string, comment: string) => {
  return pb.collection('checklists').update(id, {
    status: 'pending',
    approval_status: 'rejected',
    rejection_comment: comment,
    last_action_by: pb.authStore.record?.id,
  })
}

export const getUsers = async () => {
  return pb.collection('users').getFullList<User>({ sort: 'name' })
}

export const createUser = async (data: {
  email: string
  password: string
  passwordConfirm: string
  name: string
  role: string
  qualification_expiry?: string
}) => {
  return pb.collection('users').create(data)
}

export const updateUser = async (id: string, data: Partial<User>) => {
  return pb.collection('users').update(id, data)
}

export const deleteUser = async (id: string) => {
  return pb.collection('users').delete(id)
}

export const getInteractions = async (role?: string) => {
  const opts: Record<string, any> = { sort: '-created' }
  if (role) {
    opts.filter = `source_role = "${role}" || target_role = "${role}"`
  }
  return pb.collection('interactions').getFullList<Interaction>(opts)
}
