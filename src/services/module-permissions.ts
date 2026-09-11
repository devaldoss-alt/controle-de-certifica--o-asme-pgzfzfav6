import pb from '@/lib/pocketbase/client'

export type ModuleName =
  | 'Documentos'
  | 'Romaneios'
  | 'Checklists'
  | 'Indicadores'
  | 'Ordens de Serviço'
  | 'Agenda'
  | 'RNC'
  | 'PCP'
  | 'Almoxarifado'
  | 'Treinamentos'
  | 'Suprimentos'

export const ALL_MODULE_NAMES: ModuleName[] = [
  'Documentos',
  'Checklists',
  'Indicadores',
  'Romaneios',
  'Ordens de Serviço',
  'Agenda',
  'RNC',
  'PCP',
  'Almoxarifado',
  'Treinamentos',
  'Suprimentos',
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

/**
 * Replicates module permissions from a source role or user to target role(s) or user(s).
 * Sends non-blocking audit notification to Managers.
 */
export async function replicatePermissions(params: {
  companyId?: string
  sourceRole: string
  sourceLabel: string
  targetRoles: string[]
  targetLabels: string[]
  replicatedByName?: string
}): Promise<{ success: boolean; replicatedCount: number; error?: string }> {
  const { companyId, sourceRole, sourceLabel, targetRoles, targetLabels, replicatedByName } = params

  if (!sourceRole || targetRoles.length === 0) {
    return { success: false, replicatedCount: 0, error: 'Origem ou destino não informados.' }
  }

  try {
    // 1. Fetch current permissions for the company
    const allPerms = await getModulePermissions(companyId)
    const sourcePerms = allPerms.filter((p) => p.role === sourceRole)

    let totalUpdated = 0

    // 2. For each target role, mirror the source role's view/edit permissions for each module
    for (const targetRole of targetRoles) {
      for (const mod of ALL_MODULE_NAMES) {
        const src = sourcePerms.find((p) => p.module === mod)
        const canView = src ? src.can_view : true
        const canEdit = src ? src.can_edit : false

        // Check if target already has a record for this module in this company
        const existing = allPerms.find(
          (p) =>
            p.role === targetRole &&
            p.module === mod &&
            (companyId ? p.company_id === companyId : true),
        )

        if (existing) {
          await saveModulePermission({
            id: existing.id,
            can_view: canView,
            can_edit: canEdit,
          })
        } else {
          await saveModulePermission({
            role: targetRole,
            module: mod,
            can_view: canView,
            can_edit: canEdit,
            company_id: companyId || '',
          })
        }
      }
      totalUpdated++
    }

    // 3. Auditoria simples: notificação não-bloqueante aos Gestores
    try {
      const users = await pb
        .collection('users')
        .getFullList<{ id: string; role?: string | string[] }>({
          fields: 'id,role',
        })
      const managers = users.filter((u) => {
        const r = Array.isArray(u.role) ? u.role : [u.role || '']
        return r.includes('Manager') || r.includes('Director')
      })

      const targetListStr = targetLabels.join(', ')
      const auditMsg = `Auditoria: Permissões de "${sourceLabel}" foram replicadas para [${targetListStr}] por ${replicatedByName || 'Gestor'}.`

      await Promise.all(
        managers.map((m) =>
          pb
            .collection('notifications')
            .create({
              user_id: m.id,
              message: auditMsg,
              read: false,
              type: 'submission',
              company_id: companyId && companyId !== 'all' ? companyId : undefined,
            })
            .catch(() => {}),
        ),
      )
    } catch (auditErr) {
      console.warn('[replicate-permissions] Tolerant audit notification error:', auditErr)
    }

    return { success: true, replicatedCount: totalUpdated }
  } catch (err: any) {
    console.error('[replicate-permissions] Replication error:', err)
    return {
      success: false,
      replicatedCount: 0,
      error: err?.message || 'Falha ao replicar permissões.',
    }
  }
}
