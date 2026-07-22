import pb from '@/lib/pocketbase/client'
import { safeArray, safeParseEvidenceFiles } from '@/lib/safe-data'

export interface User {
  id: string
  name: string
  email: string
  role: string
  qualification_expiry?: string
  plan?: string
  primary_company_id?: string
  avatar?: string
  created: string
  updated: string
}

export interface Checklist {
  id: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  role_assigned: string
  mcq_ref?: string
  status: 'pending' | 'completed'
  due_date?: string
  is_critical: boolean
  last_action_by?: string
  os_id?: string
  evidence_file?: string | string[]
  evidence_notes?: string
  category?: string
  company_id?: string
  approval_status?: 'pending' | 'approved' | 'rejected'
  rejection_comment?: string
  locked?: boolean
  tutorial?: string
  expand?: {
    os_id?: { id: string; number: string; client: string }
    last_action_by?: { id: string; name: string }
  }
  created: string
  updated: string
}

export interface Interaction {
  id: string
  source_role: string
  target_role: string
  description: string
  status: 'pending' | 'resolved'
  mcq_ref?: string
  created: string
  updated: string
}

export const getChecklists = async (
  role?: string,
  category?: string,
  osId?: string,
  companyId?: string,
): Promise<Checklist[]> => {
  const filters: string[] = []
  if (role) filters.push(`role_assigned = "${role}"`)
  if (category && category !== 'all') filters.push(`category = "${category}"`)
  if (osId) filters.push(`os_id = "${osId}"`)
  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
  } else if (companyId === 'all') {
    filters.push('company_id != ""')
  }
  const opts: Record<string, any> = {
    sort: '-created',
    expand: 'os_id,last_action_by',
  }
  if (filters.length > 0) opts.filter = filters.join(' && ')
  try {
    const result = await pb.collection('checklists').getFullList<Checklist>(opts)
    return safeArray<Checklist>(result)
  } catch (e) {
    console.error('getChecklists failed:', e)
    return []
  }
}

export const getPendingApprovals = async (companyId?: string): Promise<Checklist[]> => {
  const filters: string[] = ['status = "completed"', 'approval_status = "pending"']
  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
  } else {
    filters.push('company_id != ""')
  }
  const opts: Record<string, any> = {
    sort: '-updated',
    expand: 'os_id,last_action_by',
    filter: filters.join(' && '),
  }
  try {
    const result = await pb.collection('checklists').getFullList<Checklist>(opts)
    return safeArray<Checklist>(result)
  } catch (e) {
    console.error('getPendingApprovals failed:', e)
    return []
  }
}

export const parseEvidenceFiles = safeParseEvidenceFiles

export const uploadEvidence = async (id: string, formData: FormData) => {
  return pb.collection('checklists').update(id, formData)
}

export const getServiceOrderChecklists = async (osId: string): Promise<Checklist[]> => {
  try {
    const result = await pb.collection('checklists').getFullList<Checklist>({
      filter: `os_id = "${osId}"`,
      sort: 'created',
      expand: 'os_id,last_action_by',
    })
    return safeArray<Checklist>(result)
  } catch (e) {
    console.error('getServiceOrderChecklists failed:', e)
    return []
  }
}

export const updateChecklistStatus = async (id: string, status: string) => {
  return pb.collection('checklists').update(id, {
    status,
    last_action_by: pb.authStore.record?.id,
  })
}

export const approveChecklist = async (id: string) => {
  return pb.collection('checklists').update(id, {
    approval_status: 'approved',
    locked: true,
  })
}

export const rejectChecklist = async (id: string, comment: string) => {
  return pb.collection('checklists').update(id, {
    approval_status: 'rejected',
    rejection_comment: comment,
    status: 'pending',
    locked: false,
  })
}

export const getUsers = async () => {
  try {
    const result = await pb.collection('users').getFullList<User>({ sort: 'name' })
    return safeArray<User>(result)
  } catch (e) {
    console.error('getUsers failed:', e)
    return []
  }
}

export const createUser = async (data: {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role: string
  plan?: string
  primary_company_id?: string
  qualification_expiry?: string
}) => {
  return pb.collection('users').create(data)
}

export const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
  const updateData: Record<string, any> = { ...data }
  if (data.password) {
    updateData.password = data.password
    updateData.passwordConfirm = data.password
  }
  return pb.collection('users').update(id, updateData)
}

export const deleteUser = async (id: string) => {
  return pb.collection('users').delete(id)
}

export const getInteractions = async () => {
  try {
    const result = await pb
      .collection('interactions')
      .getFullList<Interaction>({ sort: '-created' })
    return safeArray<Interaction>(result)
  } catch (e) {
    console.error('getInteractions failed:', e)
    return []
  }
}
