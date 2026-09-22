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
  disabled?: boolean
  avatar?: string
  created: string
  updated: string
  expand?: {
    primary_company_id?: { id: string; name: string; name_en?: string }
  }
}

export interface Checklist {
  id: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  role_assigned: string | string[]
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
  if (role) {
    // role_assigned no PocketBase é select multi ou single.
    // Usamos operador ~ (contains) ou = para cobrir array e string.
    // Além disso, mapeamos papéis sinônimos conhecidos (ex: Welder <-> Soldador).
    const roleAliases: Record<string, string[]> = {
      welder: ['Welder', 'Soldador'],
      soldador: ['Welder', 'Soldador'],
      diretoria: ['Diretoria', 'Director'],
      director: ['Diretoria', 'Director'],
      inspetor: ['Inspetor', 'Inspector'],
      inspector: ['Inspetor', 'Inspector'],
      engenheiro: ['Engenheiro', 'Engineer'],
      engineer: ['Engenheiro', 'Engineer'],
    }
    const normalizedRole = role.toLowerCase().trim()
    const candidates = roleAliases[normalizedRole] || [role]
    const roleSubFilters = candidates.map(
      (c) => `(role_assigned ~ "${c}" || role_assigned = "${c}")`,
    )
    filters.push(`(${roleSubFilters.join(' || ')})`)
  }
  if (category && category !== 'all') filters.push(`category = "${category}"`)
  if (osId) filters.push(`os_id = "${osId}"`)
  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
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
  const companyFilter =
    companyId && companyId !== 'all' ? `company_id = "${companyId}"` : 'company_id != ""'

  const statusCondition =
    '(status = "completed" || (status = "pending" && is_critical = true && evidence_file != ""))'

  const filter = `${statusCondition} && ${companyFilter}`
  const opts: Record<string, any> = {
    sort: '-updated',
    expand: 'os_id,last_action_by',
    filter,
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

export const uploadEvidence = async (
  id: string,
  files: File[],
  notes: string,
  isCritical: boolean,
) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('evidence_file', file))
  formData.append('evidence_notes', notes)
  formData.append('last_action_by', pb.authStore.record?.id || '')
  if (isCritical) {
    formData.append('status', 'pending')
    formData.append('approval_status', 'pending')
  } else {
    formData.append('status', 'completed')
  }
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
    status: 'completed',
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

/**
 * Zera apenas os checklists cujo título se inicia com "DEMO" para o kit de demonstrações.
 * Mantém intactos todos os checklists reais.
 * Restaura status='pending', approval_status='pending', locked=false, limpa evidências,
 * notas, comentários de aprovação/rejeição, approved_by, approved_at, last_action_by
 * e redefine os prazos (+30 dias padrão; DEMO — Checklist Expirado recebe -15 dias).
 */
export const resetDemoChecklists = async (
  companyId?: string,
): Promise<{ total: number; resetCount: number }> => {
  const filters: string[] = ['title ~ "DEMO"']
  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
  }

  const list = await pb.collection('checklists').getFullList<Checklist>({
    filter: filters.join(' && '),
    sort: 'created',
  })

  // Filtro estrito: título DEVE iniciar com "DEMO" (case-insensitive)
  const demoList = list.filter((item) => {
    const trimmed = (item.title || '').trim()
    return /^DEMO\b/i.test(trimmed)
  })

  const now = new Date()
  const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const minus15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()

  let resetCount = 0

  for (const item of demoList) {
    const isExpiredDemo = (item.title || '').toLowerCase().includes('expirado')
    const dueDate = isExpiredDemo ? minus15 : plus30

    // Para role_assigned multi-select, preserva array garantindo conformidade com o schema
    const assignedRoles = Array.isArray(item.role_assigned)
      ? item.role_assigned
      : typeof item.role_assigned === 'string' && item.role_assigned.trim()
        ? [item.role_assigned]
        : ['Welder']

    await pb.collection('checklists').update(item.id, {
      status: 'pending',
      approval_status: 'pending',
      locked: false,
      evidence_file: [],
      evidence_notes: '',
      rejection_comment: '',
      approval_comment: '',
      approved_by: null,
      approved_at: null,
      last_action_by: null,
      due_date: dueDate,
      role_assigned: assignedRoles,
    })
    resetCount++
  }

  return { total: demoList.length, resetCount }
}

export const getUsers = async (companyId?: string) => {
  try {
    const filter =
      companyId && companyId !== 'all' ? `primary_company_id = "${companyId}"` : undefined
    const result = await pb.collection('users').getFullList<User>({
      filter,
      sort: 'name',
      expand: 'primary_company_id',
    })
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
