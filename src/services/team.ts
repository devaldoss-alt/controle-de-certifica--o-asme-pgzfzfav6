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
  is_active?: boolean
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

export interface CollaboratorPendingItems {
  checklists: Array<{ id: string; title: string; status: string; role_assigned: string | string[] }>
  rncs: Array<{ id: string; number: string; description: string; status: string }>
  linkedUser?: { id: string; name: string; email: string; disabled?: boolean } | null
}

export async function getTeamMembers(
  params: {
    companyId?: string
    department?: string
    search?: string
    activeOnly?: boolean
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
    if (params.activeOnly) {
      filters.push('is_active = true')
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

/**
 * Busca as pendências ativas de um colaborador antes de desativá-lo:
 * - Checklists em aberto (status='pending') atribuídos ao papel ou ao apontador
 * - RNCs sob responsabilidade dele em andamento (status='Em Andamento')
 * - Conta de usuário vinculada (se houver, por correspondência de nome ou e-mail)
 */
export async function getCollaboratorPendingItems(
  member: TeamMember,
): Promise<CollaboratorPendingItems> {
  const result: CollaboratorPendingItems = {
    checklists: [],
    rncs: [],
    linkedUser: null,
  }

  // 1. Procurar conta de usuário associada ao colaborador
  try {
    const normName = (member.name || '').trim().toLowerCase()
    const users = await pb.collection('users').getFullList<any>({
      filter: `name ~ "${member.name.trim()}" || name = "${member.name.trim()}"`,
    })
    const matched =
      users.find((u) => (u.name || '').trim().toLowerCase() === normName) || users[0] || null
    if (matched) {
      result.linkedUser = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        disabled: matched.disabled,
      }
    }
  } catch (e) {
    console.warn('Erro ao verificar usuário vinculado:', e)
  }

  // 2. Checklists pendentes atribuídos ao usuário logado ou vinculados aos papéis/apontador
  try {
    const chkFilters: string[] = ['status = "pending"']
    if (member.company_id) {
      chkFilters.push(`company_id = "${member.company_id}"`)
    }

    if (result.linkedUser) {
      // Checklists onde last_action_by ou apontador_id seja o usuário
      const userChecklists = await pb.collection('checklists').getFullList<any>({
        filter: `${chkFilters.join(' && ')} && (apontador_id = "${result.linkedUser.id}" || last_action_by = "${result.linkedUser.id}")`,
      })
      for (const c of userChecklists) {
        result.checklists.push({
          id: c.id,
          title: c.title,
          status: c.status,
          role_assigned: c.role_assigned,
        })
      }
    }

    // Se o colaborador tem cargo específico único que não seja amplo, poderiam haver pendências
    // Mas preservamos a busca direta se for apontador
    if (member.is_indicator && result.linkedUser) {
      // Já coberto acima
    }
  } catch (e) {
    console.warn('Erro ao buscar checklists pendentes:', e)
  }

  // 3. RNCs em andamento atribuídas ao colaborador
  try {
    const rncFilters = ['status = "Em Andamento"', `responsible ~ "${member.name.trim()}"`]
    if (member.company_id) {
      rncFilters.push(`company_id = "${member.company_id}"`)
    }
    const rncList = await pb.collection('non_conformities').getFullList<any>({
      filter: rncFilters.join(' && '),
    })
    result.rncs = rncList.map((r) => ({
      id: r.id,
      number: r.number || r.id,
      description: r.description || r.summary || 'RNC em andamento',
      status: r.status,
    }))
  } catch (e) {
    console.warn('Erro ao buscar RNCs pendentes:', e)
  }

  return result
}

/**
 * Desativa o colaborador com segurança:
 * - Define is_active = false no team
 * - Se houver conta de usuário vinculada, desativa também (disabled = true no users) — NUNCA exclui o usuário
 * - Se fornecido substituto (reassignTo), reatribui as pendências ativas (RNCs) para o substituto
 */
export async function deactivateCollaborator(
  memberId: string,
  options?: {
    reassignToMember?: TeamMember
    linkedUserId?: string
  },
): Promise<{ success: boolean; reassignedCount: number; userDisabled: boolean }> {
  let reassignedCount = 0
  let userDisabled = false

  // 1. Atualizar registro no team para is_active = false
  const member = await pb.collection('team').getOne<TeamMember>(memberId)
  await pb.collection('team').update(memberId, {
    is_active: false,
  })

  // 2. Se houver conta de usuário correspondente, marcar disabled = true
  let userIdToDisable = options?.linkedUserId
  if (!userIdToDisable) {
    try {
      const users = await pb.collection('users').getFullList<any>({
        filter: `name ~ "${member.name.trim()}"`,
      })
      const found = users.find(
        (u) => (u.name || '').trim().toLowerCase() === (member.name || '').trim().toLowerCase(),
      )
      if (found) userIdToDisable = found.id
    } catch {
      /* intentionally ignored */
    }
  }

  if (userIdToDisable) {
    try {
      await pb.collection('users').update(userIdToDisable, {
        disabled: true,
      })
      userDisabled = true
    } catch (e) {
      console.warn('Falha ao desativar conta de usuário:', e)
    }
  }

  // 3. Reatribuição de pendências ativas (RNCs em andamento) para o substituto
  if (options?.reassignToMember) {
    const substituteName = options.reassignToMember.name.trim()
    try {
      const rncs = await pb.collection('non_conformities').getFullList<any>({
        filter: `status = "Em Andamento" && responsible ~ "${member.name.trim()}"`,
      })
      for (const rnc of rncs) {
        // Substituir apenas a referência do responsável mantendo o histórico de análise intacto
        await pb.collection('non_conformities').update(rnc.id, {
          responsible: substituteName,
        })
        reassignedCount++
      }
    } catch (e) {
      console.warn('Falha ao reatribuir RNCs:', e)
    }

    // Se o substituto tiver usuário no users e o desativado for apontador em checklists pendentes
    if (userIdToDisable) {
      try {
        const subUsers = await pb.collection('users').getFullList<any>({
          filter: `name ~ "${options.reassignToMember.name.trim()}"`,
        })
        const subUser = subUsers.find(
          (u) =>
            (u.name || '').trim().toLowerCase() ===
            (options.reassignToMember?.name || '').trim().toLowerCase(),
        )
        if (subUser) {
          const chks = await pb.collection('checklists').getFullList<any>({
            filter: `status = "pending" && apontador_id = "${userIdToDisable}"`,
          })
          for (const chk of chks) {
            await pb.collection('checklists').update(chk.id, {
              apontador_id: subUser.id,
            })
            reassignedCount++
          }
        }
      } catch (e) {
        console.warn('Falha ao reatribuir apontador de checklists:', e)
      }
    }
  }

  return { success: true, reassignedCount, userDisabled }
}

/**
 * Reativa o colaborador:
 * - Define is_active = true no team
 * - Se houver conta de usuário vinculada, reativa também (disabled = false no users)
 */
export async function reactivateCollaborator(
  memberId: string,
): Promise<{ success: boolean; userReactivated: boolean }> {
  let userReactivated = false

  const member = await pb.collection('team').getOne<TeamMember>(memberId)
  await pb.collection('team').update(memberId, {
    is_active: true,
  })

  try {
    const users = await pb.collection('users').getFullList<any>({
      filter: `name ~ "${member.name.trim()}"`,
    })
    const found = users.find(
      (u) => (u.name || '').trim().toLowerCase() === (member.name || '').trim().toLowerCase(),
    )
    if (found) {
      await pb.collection('users').update(found.id, {
        disabled: false,
      })
      userReactivated = true
    }
  } catch (e) {
    console.warn('Falha ao reativar conta de usuário:', e)
  }

  return { success: true, userReactivated }
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
    role: data.role || '',
    is_indicator: !!data.is_indicator,
    is_active: data.is_active !== undefined ? data.is_active : true,
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
    is_active: data.is_active,
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
  'genti servicos empresariais': 'zt57khfow39nwa1',
  'genti serviços empresariais': 'zt57khfow39nwa1',
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

    // Direct alias match
    if (COMPANY_ID_BY_ALIAS[norm]) return COMPANY_ID_BY_ALIAS[norm]

    // GENTI flexible check: if normalized string starts with or includes 'genti'
    if (norm.includes('genti')) {
      return COMPANY_ID_BY_ALIAS['genti']
    }

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

  // Fetch Master List document sectors for company mapping
  let masterListSectors: string[] = []
  try {
    const docSectors = await pb.collection('documents').getFullList<{ sector?: string }>({
      filter: 'category = "Internal" && sector != ""',
      fields: 'sector',
    })
    const sectorSet = new Set<string>()
    for (const d of docSectors) {
      if (d.sector?.trim()) sectorSet.add(d.sector.trim())
    }
    masterListSectors = Array.from(sectorSet)
  } catch (e) {
    masterListSectors = []
  }

  // Helper function to map a row's raw department/sector text to Master List sectors
  const mapDepartmentToMasterListSector = (deptRaw: string): string => {
    if (!deptRaw || !masterListSectors.length) return deptRaw
    const normDept = normalizeText(deptRaw)

    // Exact or case-insensitive match
    const exact = masterListSectors.find((s) => normalizeText(s) === normDept)
    if (exact) return exact

    // Partial/contains match
    const partial = masterListSectors.find(
      (s) => normalizeText(s).includes(normDept) || normDept.includes(normalizeText(s)),
    )
    if (partial) return partial

    return deptRaw
  }

  // Existing members for dedup (by normalized Name + Company combination)
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

    const rawDepartment = (row.department || '').trim()
    const mappedDepartment = mapDepartmentToMasterListSector(rawDepartment)
    const role = (row.role || 'Colaborador').trim()

    // Key unique constraint: Name + Company
    const normName = normalizeText(name)
    const dup = existing.find(
      (m) =>
        (normalizeText(m.name || '') === normName ||
          (m.name || '').trim().toLowerCase() === name.toLowerCase()) &&
        m.company_id === companyId,
    )

    try {
      if (dup) {
        // Upsert (update existing member data for this company)
        const updatedRecord = await pb.collection('team').update<TeamMember>(dup.id, {
          name,
          company_id: companyId,
          department: mappedDepartment || dup.department,
          role: role || dup.role,
        })
        // Update in memory so subsequent rows in the same spreadsheet run de-dup correctly
        const idx = existing.findIndex((e) => e.id === dup.id)
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...updatedRecord }
        }
      } else {
        // Create new member record
        const createdRecord = await pb.collection('team').create<TeamMember>({
          name,
          company_id: companyId,
          department: mappedDepartment,
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
