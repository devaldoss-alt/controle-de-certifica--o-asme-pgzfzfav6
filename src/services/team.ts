import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { normalizeText } from '@/lib/spreadsheet-parser'

export interface TeamMember {
  id: string
  name: string
  company_id: string
  department: string
  role: string
  is_indicator: boolean
  linked_operators?: string | string[] | null
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string; name_en?: string }
  }
}

export interface TeamImportRow {
  name: string
  company_id?: string
  company_name?: string
  department?: string
  role?: string
}

export interface TeamImportResult {
  success: number
  errors: { row: number; error: string }[]
}

export type TeamImportProgressCallback = (current: number, total: number) => void

export async function getTeamMembers(
  params: {
    companyId?: string
    department?: string
    search?: string
  } = {},
): Promise<TeamMember[]> {
  try {
    const filters: string[] = []
    if (params.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}"`)
    } else {
      filters.push('company_id != ""')
    }
    if (params.department && params.department !== 'all') {
      filters.push(`department = "${params.department}"`)
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim()
      filters.push(`(name ~ "${s}" || department ~ "${s}" || role ~ "${s}")`)
    }
    const result = await pb.collection('team').getFullList<TeamMember>({
      filter: filters.join(' && '),
      sort: 'name',
      expand: 'company_id',
    })
    return safeArray<TeamMember>(result)
  } catch (e) {
    console.error('getTeamMembers failed:', e)
    return []
  }
}

export async function getTeamDepartments(companyId?: string): Promise<string[]> {
  try {
    const members = await getTeamMembers({ companyId })
    const set = new Set<string>()
    for (const m of members) {
      const d = (m.department || '').trim()
      if (d) set.add(d)
    }
    return Array.from(set).sort()
  } catch (e) {
    return []
  }
}

export async function createTeamMember(data: Partial<TeamMember>): Promise<TeamMember> {
  return pb.collection('team').create<TeamMember>({
    name: data.name || '',
    company_id: data.company_id || '',
    department: data.department || '',
    role: data.role || 'Colaborador',
    is_indicator: !!data.is_indicator,
    linked_operators: data.linked_operators || [],
  })
}

export async function updateTeamMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
  return pb.collection('team').update<TeamMember>(id, {
    name: data.name,
    company_id: data.company_id,
    department: data.department,
    role: data.role,
    is_indicator: !!data.is_indicator,
    linked_operators: data.linked_operators,
  })
}

export async function deleteTeamMember(id: string): Promise<void> {
  await pb.collection('team').delete(id)
}

export async function bulkImportTeamMembers(
  rows: TeamImportRow[],
  defaultCompanyId: string,
  companies: Array<{ id: string; name: string; name_en?: string }>,
  onProgress?: TeamImportProgressCallback,
): Promise<TeamImportResult> {
  const result: TeamImportResult = { success: 0, errors: [] }
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const findCompanyByName = (name: string): string => {
    if (!name) return ''
    const norm = normalizeText(name)
    return (
      companies.find(
        (c) =>
          normalizeText(c.name).includes(norm) || normalizeText(c.name_en || '').includes(norm),
      )?.id || ''
    )
  }

  // Existing members for dedup (by name within the resolved company)
  let existing: TeamMember[] = []
  try {
    existing = await pb.collection('team').getFullList<TeamMember>({
      filter: 'company_id != ""',
    })
  } catch (e) {
    existing = []
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const name = (row.name || '').trim()
    if (!name) {
      result.errors.push({ row: i + 1, error: 'Nome é obrigatório' })
      onProgress?.(i + 1, rows.length)
      continue
    }
    const companyId =
      row.company_id || findCompanyByName(row.company_name || '') || defaultCompanyId
    if (!companyId) {
      result.errors.push({
        row: i + 1,
        error: 'Empresa não resolvida — selecione a empresa de destino',
      })
      onProgress?.(i + 1, rows.length)
      continue
    }
    const department = (row.department || '').trim()
    const role = (row.role || 'Colaborador').trim()
    const dup = existing.find(
      (m) => (m.name || '').toLowerCase() === name.toLowerCase() && m.company_id === companyId,
    )
    try {
      if (dup) {
        await pb.collection('team').update(dup.id, {
          name,
          company_id: companyId,
          department,
          role,
        })
      } else {
        await pb.collection('team').create({
          name,
          company_id: companyId,
          department,
          role,
          is_indicator: false,
          linked_operators: [],
        })
      }
      result.success++
    } catch (e: any) {
      result.errors.push({ row: i + 1, error: getErrorMessage(e) })
    }
    onProgress?.(i + 1, rows.length)
    await sleep(150)
  }
  return result
}
