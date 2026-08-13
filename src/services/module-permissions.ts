import pb from '@/lib/pocketbase/client'

export type ModuleName =
  | 'Documentos'
  | 'Romaneios'
  | 'Checklists'
  | 'Indicadores'
  | 'Ordens de Serviço'
  | 'Agenda'

export const ALL_MODULE_NAMES: ModuleName[] = [
  'Documentos',
  'Checklists',
  'Indicadores',
  'Romaneios',
  'Ordens de Serviço',
  'Agenda',
]

export interface ModulePermission {
  id: string
  role: string
  module: ModuleName
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  company_id?: string
}

/** PocketBase stores select-multi fields as arrays; normalize to a scalar. */
const asScalar = (v: unknown): string =>
  Array.isArray(v) ? (v[0] as string) || '' : (v as string) || ''

const normalize = (r: any): ModulePermission => ({
  id: r.id,
  role: asScalar(r.role),
  module: asScalar(r.module) as ModuleName,
  can_view: !!r.can_view,
  can_create: !!r.can_create,
  can_edit: !!r.can_edit,
  can_delete: !!r.can_delete,
  company_id: r.company_id || undefined,
})

export const getModulePermissions = async (companyId?: string): Promise<ModulePermission[]> => {
  try {
    const filters: string[] = []
    if (companyId && companyId !== 'all') {
      filters.push(`company_id = '${companyId}' || company_id = ''`)
    }
    const filter = filters.length > 0 ? filters.join(' && ') : undefined

    const result = await pb.collection('module_permissions').getFullList<any>({
      filter,
    })
    return result.map(normalize)
  } catch (e) {
    console.error('getModulePermissions failed:', e)
    return []
  }
}

/**
 * Returns the set of modules the given role is allowed to view for the given
 * (or "all") company. Manager/Director bypass and see every module, so the nav
 * is never accidentally empty when a permission row is missing.
 */
export const getAllowedModules = async (
  role?: string,
  companyId?: string,
): Promise<Set<ModuleName>> => {
  const allowed = new Set<ModuleName>()
  // Manager/Director are unrestricted — always see every module.
  if (!role || role === 'Manager' || role === 'Director') {
    ALL_MODULE_NAMES.forEach((m) => allowed.add(m))
    return allowed
  }
  const perms = await getModulePermissions(companyId)
  for (const p of perms) {
    if (p.role === role && p.can_view) allowed.add(p.module)
  }
  return allowed
}

export const saveModulePermission = async (
  permission: Partial<ModulePermission>,
): Promise<ModulePermission> => {
  if (permission.id) {
    return pb.collection('module_permissions').update<ModulePermission>(permission.id, permission)
  }
  return pb.collection('module_permissions').create<ModulePermission>(permission)
}
