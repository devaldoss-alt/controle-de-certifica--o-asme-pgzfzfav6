import pb from '@/lib/pocketbase/client'

export interface User {
  id: string
  email: string
  name: string
  role: string
  qualification_expiry?: string
  plan?: string
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
  os_id?: string
  evidence_file?: string
  evidence_notes?: string
  category?: string
  expand?: {
    last_action_by?: User | null
    os_id?: { id: string; number: string; client: string } | null
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

export const getChecklists = async (role?: string, category?: string, osId?: string) => {
  const filters: string[] = []
  if (role) filters.push(`role_assigned = "${role}"`)
  if (category && category !== 'all') {
    filters.push(`category = "${category}"`)
  }
  if (osId && osId !== 'all') {
    filters.push(`os_id = "${osId}"`)
  }
  const opts: Record<string, any> = {
    sort: '-status,due_date',
    expand: 'last_action_by,os_id',
  }
  if (filters.length > 0) {
    opts.filter = filters.join(' && ')
  }
  return pb.collection('checklists').getFullList<Checklist>(opts)
}

export const getPendingApprovals = async () => {
  return pb.collection('checklists').getFullList<Checklist>({
    filter:
      'approval_status = "pending" && (status = "completed" || (is_critical = true && evidence_file != ""))',
    sort: 'due_date',
    expand: 'last_action_by,os_id',
  })
}

export const parseEvidenceFiles = (evidenceFile: string | undefined): string[] => {
  if (!evidenceFile) return []
  try {
    const parsed = JSON.parse(evidenceFile)
    return Array.isArray(parsed) ? parsed : [evidenceFile]
  } catch {
    return [evidenceFile]
  }
}

export const uploadEvidence = async (
  id: string,
  files: File[],
  notes: string,
  isCritical?: boolean,
) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('evidence_file', file))
  formData.append('evidence_notes', notes)
  formData.append('approval_status', 'pending')
  formData.append('last_action_by', pb.authStore.record?.id || '')
  formData.append('status', isCritical ? 'pending' : 'completed')
  return pb.collection('checklists').update(id, formData)
}

export const getServiceOrderChecklists = async (osId: string) => {
  return pb.collection('checklists').getFullList<Checklist>({
    filter: `os_id = "${osId}"`,
    sort: 'due_date',
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
    status: 'completed',
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
