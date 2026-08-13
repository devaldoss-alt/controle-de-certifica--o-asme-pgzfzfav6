import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface DocumentPermission {
  id: string
  team_id: string
  company_id?: string
  sector: string
  can_view: boolean
  can_edit: boolean
  created: string
  updated: string
  expand?: {
    team_id?: { id: string; name: string; department?: string }
  }
}

export async function getDocumentPermissions(companyId?: string): Promise<DocumentPermission[]> {
  try {
    const filters: string[] = []
    if (companyId && companyId !== 'all') {
      filters.push(`company_id = "${companyId}"`)
    } else {
      filters.push('company_id != ""')
    }
    const result = await pb.collection('document_permissions').getFullList<DocumentPermission>({
      filter: filters.join(' && '),
      expand: 'team_id',
    })
    return safeArray<DocumentPermission>(result)
  } catch (e) {
    console.error('getDocumentPermissions failed:', e)
    return []
  }
}

export async function createDocumentPermission(
  data: Omit<DocumentPermission, 'id' | 'created' | 'updated' | 'expand'>,
): Promise<DocumentPermission> {
  return pb.collection('document_permissions').create<DocumentPermission>(data)
}

export async function updateDocumentPermission(
  id: string,
  data: Partial<DocumentPermission>,
): Promise<DocumentPermission> {
  return pb.collection('document_permissions').update<DocumentPermission>(id, data)
}

export async function deleteDocumentPermission(id: string): Promise<void> {
  await pb.collection('document_permissions').delete(id)
}

/**
 * Unique sectors from the Lista Mestra (Internal documents) for a company.
 * Used as the row set of the per-person document permission matrix.
 */
export async function getDocumentSectors(companyId?: string): Promise<string[]> {
  try {
    const filters: string[] = ['category = "Internal"']
    if (companyId && companyId !== 'all') {
      filters.push(`company_id = "${companyId}"`)
    } else {
      filters.push('company_id != ""')
    }
    const result = await pb.collection('documents').getFullList<{ sector?: string }>({
      filter: filters.join(' && '),
      fields: 'sector',
    })
    const set = new Set<string>()
    for (const d of result) {
      const s = (d.sector || '').trim()
      if (s) set.add(s)
    }
    return Array.from(set).sort()
  } catch (e) {
    console.error('getDocumentSectors failed:', e)
    return []
  }
}
/**
 * Toggle (upsert) a per-person sector permission. Returns the resulting
 * record or null when the toggle turned both flags off (record deleted).
 */
export async function toggleDocumentPermission(
  teamId: string,
  sector: string,
  companyId: string,
  field: 'can_view' | 'can_edit',
  value: boolean,
  existing?: DocumentPermission,
): Promise<DocumentPermission | null> {
  const base = {
    team_id: teamId,
    sector,
    company_id: companyId,
  }
  if (existing && existing.id) {
    const nextView = field === 'can_view' ? value : existing.can_view
    const nextEdit = field === 'can_edit' ? value : existing.can_edit
    // If both turned off, delete the record entirely (no permission row = none).
    if (!nextView && !nextEdit) {
      await deleteDocumentPermission(existing.id)
      return null
    }
    return updateDocumentPermission(existing.id, {
      can_view: nextView,
      can_edit: nextEdit,
    })
  }
  return createDocumentPermission({
    ...base,
    can_view: field === 'can_view' ? value : true,
    can_edit: field === 'can_edit' ? value : false,
  })
}
