import pb from '@/lib/pocketbase/client'

export interface ModulePermission {
  id: string
  role: string
  module: 'Documentos' | 'Romaneios' | 'Checklists' | 'Indicadores'
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  company_id?: string
}

export const getModulePermissions = async (companyId?: string): Promise<ModulePermission[]> => {
  try {
    const filters: string[] = []
    if (companyId && companyId !== 'all') {
      filters.push(`company_id = '${companyId}' || company_id = ''`)
    }
    const filter = filters.length > 0 ? filters.join(' && ') : undefined

    return await pb.collection('module_permissions').getFullList<ModulePermission>({
      filter,
    })
  } catch (e) {
    console.error('getModulePermissions failed:', e)
    return []
  }
}

export const saveModulePermission = async (
  permission: Partial<ModulePermission>,
): Promise<ModulePermission> => {
  if (permission.id) {
    return pb.collection('module_permissions').update<ModulePermission>(permission.id, permission)
  }
  return pb.collection('module_permissions').create<ModulePermission>(permission)
}
