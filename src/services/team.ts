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

// Stable company IDs for PSC and Koala (Skip Cloud PocketBase). Used as a
// safety net when a spreadsheet contains the company name ("PSC", "Koala",
// "Koala System", "KS") instead of the internal ID — PocketBase requires the
// relation record id, not the human-readable name.
const COMPANY_ID_BY_ALIAS: Record<string, string> = {
  psc: 'a631bv695rr4gef',
  'psc industria comercio e servicos ltda': 'a631bv695rr4gef',
  'psc industry': 'a631bv695rr4gef',
  koala: 'i7kjauu378swxg6',
  ks: 'i7kjauu378swxg6',
  'koala system': 'i7kjauu378swxg6',
  'koala system industria e comercio ltda': 'i7kjauu378swxg6',
  'koala engineering': 'i7kjauu378swxg6',
  genti: 'zt57khfow39nwa1',
  'genti servicos': 'zt57khfow39nwa1',
  'genti serviços': 'zt57khfow39nwa1',
  'genti servicos empresariais ltda': 'zt57khfow39nwa1',
  'genti servicos empresariais ltda me': 'zt57khfow39nwa1',
  'genti serviços empresariais ltda me': 'zt57khfow39nwa1',
  'genti services': 'zt57khfow39nwa1',
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
    // Direct alias match first ("PSC", "Koala", "KS", ...).
    if (COMPANY_ID_BY_ALIAS[norm]) return COMPANY_ID_BY_ALIAS[norm]

    // Check alias keys if any substring matches
    for (const [alias, id] of Object.entries(COMPANY_ID_BY_ALIAS)) {
      if (norm === alias || norm.includes(alias) || alias.includes(norm)) {
        return id
      }
    }

    // Then resolve against the real companies list (by name / name_en)
    const found =
      companies.find(
        (c) =>
          normalizeText(c.name) === norm ||
          normalizeText(c.name_en || '') === norm ||
          normalizeText(c.name).includes(norm) ||
          normalizeText(c.name_en || '').includes(norm) ||
          norm.includes(normalizeText(c.name)) ||
          norm.includes(normalizeText(c.name_en || '')),
      )?.id || ''
    if (found) return found

    // Alias prefix match
    for (const [alias, id] of Object.entries(COMPANY_ID_BY_ALIAS)) {
      if (norm.startsWith(alias) || alias.startsWith(norm)) return id
    }
    return ''
  }

  // Existing members for dedup (by normalized name within the resolved company)
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
    const rawCompany = row.company_id || row.company_name || ''
    let companyId = ''
    if (rawCompany) {
      // Check if rawCompany is already a valid company UUID
      const matchedCompany = companies.find((c) => c.id === rawCompany)
      if (matchedCompany) {
        companyId = matchedCompany.id
      } else {
        companyId = findCompanyByName(rawCompany)
      }
    }
    if (!companyId) {
      companyId = defaultCompanyId
    }

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
    const normName = normalizeText(name)
    const dup = existing.find(
      (m) =>
        (normalizeText(m.name || '') === normName ||
          (m.name || '').trim().toLowerCase() === name.toLowerCase()) &&
        m.company_id === companyId,
    )
    try {
      if (dup) {
        const updatedRecord = await pb.collection('team').update<TeamMember>(dup.id, {
          name,
          company_id: companyId,
          department: department || dup.department,
          role: role || dup.role,
        })
        // Update in memory so subsequent rows in the same spreadsheet run de-dup correctly
        const idx = existing.findIndex((e) => e.id === dup.id)
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...updatedRecord }
        }
      } else {
        const createdRecord = await pb.collection('team').create<TeamMember>({
          name,
          company_id: companyId,
          department,
          role,
          is_indicator: false,
          linked_operators: [],
        })
        existing.push(createdRecord)
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
