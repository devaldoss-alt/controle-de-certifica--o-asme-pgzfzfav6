import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { RNC_PROCESS_LIST, createNonConformity, NonConformity } from '@/services/rnc'

export const AUDIT_PROCESS_LIST = RNC_PROCESS_LIST

export const AUDIT_TYPES = ['Interna', 'Fornecedor', 'Preparatória de certificação'] as const
export type AuditType = (typeof AUDIT_TYPES)[number]

export const AUDIT_STANDARDS = [
  'ISO 9001 §4 Contexto da Organização',
  'ISO 9001 §5 Liderança',
  'ISO 9001 §6 Planejamento',
  'ISO 9001 §7 Apoio e Recursos',
  'ISO 9001 §8 Operação',
  'ISO 9001 §9 Avaliação de Desempenho',
  'ISO 9001 §10 Melhoria',
  'ASME Sec. I',
  'ASME Sec. VIII Div 1',
  'ASME Sec. IX Soldagem',
  'ASME B31.3 Tubulações',
  'NBIC Part 1 / Part 2 / Part 3',
  'ISO 14001',
  'ISO 45001',
] as const

export const AUDIT_STATUSES = ['Planejada', 'Em andamento', 'Realizada', 'Cancelada'] as const
export type AuditStatus = (typeof AUDIT_STATUSES)[number]

export interface AuditProgramItem {
  id: string
  year: number
  company_id: string
  audit_scope: string
  audit_type: AuditType
  standard_ref: string[]
  planned_date: string
  realized_date?: string
  auditor_ids?: string[]
  status: AuditStatus
  notes?: string
  created?: string
  updated?: string
  expand?: {
    company_id?: { id: string; name: string }
    auditor_ids?: Array<{ id: string; name: string; email: string; role?: string }>
  }
}

export interface AuditChecklistItem {
  id: string
  requirement: string
  compliance: 'C' | 'NC' | 'N.A.'
  evidence: string
  evidence_file?: string
  cross_doc_id?: string
  notes?: string
}

export interface AuditChecklistSection {
  id: string
  audit_id: string
  section: string
  items: AuditChecklistItem[]
  evidence_file?: string | string[]
  cross_doc_id?: string
  created?: string
  updated?: string
  expand?: {
    cross_doc_id?: { id: string; title: string; code?: string; revision?: string }
  }
}

export const FINDING_TYPES = [
  'Não Conformidade',
  'Observação',
  'Oportunidade de Melhoria',
  'Ponto Forte',
] as const
export type FindingType = (typeof FINDING_TYPES)[number]

export const FINDING_STATUSES = ['Aberto', 'Em tratamento', 'Fechado'] as const
export type FindingStatus = (typeof FINDING_STATUSES)[number]

export interface AuditFinding {
  id: string
  audit_id: string
  type: FindingType
  description: string
  evidence_file?: string | string[]
  responsible?: string
  deadline?: string
  status: FindingStatus
  linked_rnc_id?: string
  created?: string
  updated?: string
  expand?: {
    linked_rnc_id?: NonConformity
    audit_id?: AuditProgramItem
  }
}

/**
 * Checks delay traffic light for an audit item:
 * - 'Atrasada' (red) if planned_date < today and status is not 'Realizada' or 'Cancelada'
 * - 'Realizada' (green) if status is Realizada
 * - 'Cancelada' (gray) if status is Cancelada
 * - 'Em andamento' (yellow/blue)
 * - 'No prazo' (green/blue) if planned_date >= today and status is Planejada
 */
export function getAuditTrafficLight(audit: AuditProgramItem): {
  color: 'red' | 'green' | 'yellow' | 'gray' | 'blue'
  label: string
  isDelayed: boolean
} {
  if (audit.status === 'Cancelada') {
    return { color: 'gray', label: 'Cancelada', isDelayed: false }
  }
  if (audit.status === 'Realizada') {
    return { color: 'green', label: 'Realizada', isDelayed: false }
  }

  if (audit.planned_date) {
    const planned = new Date(audit.planned_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Add timezone adjustment if date is YYYY-MM-DD
    const dateOnly = new Date(planned.getFullYear(), planned.getMonth(), planned.getDate())

    if (dateOnly < today) {
      return { color: 'red', label: 'Atrasada', isDelayed: true }
    }
  }

  if (audit.status === 'Em andamento') {
    return { color: 'yellow', label: 'Em andamento', isDelayed: false }
  }

  return { color: 'blue', label: 'Planejada', isDelayed: false }
}

/**
 * Validates rule: Auditor cannot be the responsible for the audited process.
 * Process responsible map heuristic based on department/role.
 */
export function validateAuditorConflict(
  auditorUser: { id: string; name: string; role?: string },
  process: string,
): { hasConflict: boolean; reason?: string } {
  const normRole = (auditorUser.role || '').toLowerCase()
  const normProc = (process || '').toLowerCase()

  if (!normRole) return { hasConflict: false }

  // Check direct matches
  if (
    (normProc.includes('solda') && normRole.includes('soldador')) ||
    (normProc.includes('qualidade') && normRole.includes('qualidade')) ||
    (normProc.includes('cq') && (normRole.includes('cq') || normRole.includes('inspetor'))) ||
    (normProc.includes('almoxarifado') && normRole.includes('almoxarife')) ||
    (normProc.includes('pcp') && normRole.includes('pcp')) ||
    (normProc.includes('caldeiraria') && normRole.includes('caldeireiro')) ||
    (normProc.includes('usinagem') && normRole.includes('torneiro')) ||
    (normProc.includes('engenharia') && normRole.includes('engenheiro'))
  ) {
    return {
      hasConflict: true,
      reason: `O auditor ${auditorUser.name} (${auditorUser.role}) atua no processo ${process} e não pode auto-auditar sua própria área (ISO 9001 §9.2.2).`,
    }
  }

  return { hasConflict: false }
}

// ======================== API CALLS ========================

export async function getAuditPrograms(params: {
  year?: number
  companyId?: string
  status?: string
  audit_type?: string
  search?: string
}): Promise<AuditProgramItem[]> {
  try {
    const filters: string[] = []
    if (params.year) {
      filters.push(`year = ${params.year}`)
    }
    if (params.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}" || company_id = ""`)
    }
    if (params.status && params.status !== 'all') {
      filters.push(`status = "${params.status}"`)
    }
    if (params.audit_type && params.audit_type !== 'all') {
      filters.push(`audit_type = "${params.audit_type}"`)
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim()
      filters.push(`(audit_scope ~ "${s}" || notes ~ "${s}")`)
    }

    const records = await pb.collection('audit_program').getFullList<AuditProgramItem>({
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: 'planned_date',
      expand: 'company_id,auditor_ids',
    })

    return safeArray<AuditProgramItem>(records).map((r) => ({
      ...r,
      standard_ref: Array.isArray(r.standard_ref)
        ? r.standard_ref
        : r.standard_ref
          ? [r.standard_ref]
          : [],
      auditor_ids: Array.isArray(r.auditor_ids)
        ? r.auditor_ids
        : r.auditor_ids
          ? [r.auditor_ids]
          : [],
    }))
  } catch (err) {
    console.error('getAuditPrograms failed:', err)
    return []
  }
}

export async function getAuditProgramById(id: string): Promise<AuditProgramItem | null> {
  try {
    const record = await pb.collection('audit_program').getOne<AuditProgramItem>(id, {
      expand: 'company_id,auditor_ids',
    })
    return {
      ...record,
      standard_ref: Array.isArray(record.standard_ref)
        ? record.standard_ref
        : record.standard_ref
          ? [record.standard_ref]
          : [],
      auditor_ids: Array.isArray(record.auditor_ids)
        ? record.auditor_ids
        : record.auditor_ids
          ? [record.auditor_ids]
          : [],
    }
  } catch (err) {
    console.error('getAuditProgramById failed:', err)
    return null
  }
}

export async function createAuditProgram(
  data: Partial<AuditProgramItem>,
): Promise<AuditProgramItem> {
  const payload: any = {
    ...data,
    year: data.year || new Date().getFullYear(),
    status: data.status || 'Planejada',
  }
  const created = await pb.collection('audit_program').create<AuditProgramItem>(payload)
  return created
}

export async function updateAuditProgram(
  id: string,
  data: Partial<AuditProgramItem>,
): Promise<AuditProgramItem> {
  const updated = await pb.collection('audit_program').update<AuditProgramItem>(id, data)
  return updated
}

export async function deleteAuditProgram(id: string): Promise<void> {
  await pb.collection('audit_program').delete(id)
}

// ---------------- Checklists ----------------

export async function getAuditChecklists(auditId: string): Promise<AuditChecklistSection[]> {
  try {
    const records = await pb.collection('audit_checklists').getFullList<AuditChecklistSection>({
      filter: `audit_id = "${auditId}"`,
      sort: 'created',
      expand: 'cross_doc_id',
    })

    return safeArray<AuditChecklistSection>(records).map((r) => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : r.items || [],
    }))
  } catch (err) {
    console.error('getAuditChecklists failed:', err)
    return []
  }
}

export async function saveAuditChecklistSection(
  data: {
    id?: string
    audit_id: string
    section: string
    items: AuditChecklistItem[]
    cross_doc_id?: string
  },
  evidenceFiles?: File[],
): Promise<AuditChecklistSection> {
  const payload: any = {
    audit_id: data.audit_id,
    section: data.section,
    items: JSON.stringify(data.items),
    cross_doc_id: data.cross_doc_id || null,
  }

  let result: AuditChecklistSection
  if (evidenceFiles && evidenceFiles.length > 0) {
    const formData = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v))
    })
    evidenceFiles.forEach((f) => formData.append('evidence_file', f))

    if (data.id) {
      result = await pb
        .collection('audit_checklists')
        .update<AuditChecklistSection>(data.id, formData)
    } else {
      result = await pb.collection('audit_checklists').create<AuditChecklistSection>(formData)
    }
  } else {
    if (data.id) {
      result = await pb
        .collection('audit_checklists')
        .update<AuditChecklistSection>(data.id, payload)
    } else {
      result = await pb.collection('audit_checklists').create<AuditChecklistSection>(payload)
    }
  }

  return {
    ...result,
    items: typeof result.items === 'string' ? JSON.parse(result.items || '[]') : result.items || [],
  }
}

export async function deleteAuditChecklistSection(id: string): Promise<void> {
  await pb.collection('audit_checklists').delete(id)
}

// ---------------- Findings ----------------

export async function getAuditFindings(auditId?: string): Promise<AuditFinding[]> {
  try {
    const filter = auditId ? `audit_id = "${auditId}"` : undefined
    const records = await pb.collection('audit_findings').getFullList<AuditFinding>({
      filter,
      sort: '-created',
      expand: 'linked_rnc_id,audit_id',
    })
    return safeArray<AuditFinding>(records)
  } catch (err) {
    console.error('getAuditFindings failed:', err)
    return []
  }
}

export async function createAuditFinding(
  data: Partial<AuditFinding>,
  evidenceFiles?: File[],
  autoCreateRNC = false,
  extraRNCData?: { companyId: string; process: string },
): Promise<AuditFinding> {
  let linkedRncId = data.linked_rnc_id

  // If type is Non Conformity and user asked to create linked RNC
  if (
    data.type === 'Não Conformidade' &&
    autoCreateRNC &&
    !linkedRncId &&
    extraRNCData?.companyId
  ) {
    try {
      const createdRnc = await createNonConformity({
        company_id: extraRNCData.companyId,
        process: extraRNCData.process || 'SGQ',
        severity: 'Médio',
        origin: 'Auditorias',
        action_type: 'Ação Corretiva',
        description: data.description || 'Não conformidade constatada em auditoria interna.',
        summary: `NC de Auditoria: ${(data.description || '').slice(0, 100)}`,
        responsible: data.responsible || 'Gestor da Qualidade',
        deadline: data.deadline,
        status: 'Aberta' as any,
        date: new Date().toISOString(),
      })
      linkedRncId = createdRnc.id
    } catch (rncErr) {
      console.warn('Failed to auto-create linked RNC for finding:', rncErr)
    }
  }

  const payload: any = {
    ...data,
    linked_rnc_id: linkedRncId || null,
    status: data.status || 'Aberto',
  }

  let result: AuditFinding
  if (evidenceFiles && evidenceFiles.length > 0) {
    const formData = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v))
    })
    evidenceFiles.forEach((f) => formData.append('evidence_file', f))
    result = await pb.collection('audit_findings').create<AuditFinding>(formData)
  } else {
    result = await pb.collection('audit_findings').create<AuditFinding>(payload)
  }

  return result
}

export async function updateAuditFinding(
  id: string,
  data: Partial<AuditFinding>,
  evidenceFiles?: File[],
): Promise<AuditFinding> {
  let result: AuditFinding
  if (evidenceFiles && evidenceFiles.length > 0) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v))
    })
    evidenceFiles.forEach((f) => formData.append('evidence_file', f))
    result = await pb.collection('audit_findings').update<AuditFinding>(id, formData)
  } else {
    result = await pb.collection('audit_findings').update<AuditFinding>(id, data)
  }
  return result
}

export async function deleteAuditFinding(id: string): Promise<void> {
  await pb.collection('audit_findings').delete(id)
}

/**
 * Standard ISO 9001 questions template for initializing checklists
 */
export const DEFAULT_ISO_AUDIT_SECTIONS: Array<{ section: string; requirements: string[] }> = [
  {
    section: '4. Contexto da Organização',
    requirements: [
      '4.1 A organização determinou questões externas e internas pertinentes ao seu propósito?',
      '4.2 As necessidades e expectativas de partes interessadas foram identificadas e monitoradas?',
      '4.3 O escopo do SGQ está determinado e mantido como informação documentada?',
      '4.4 Os processos do SGQ foram mapeados com entradas, saídas, recursos e indicadores?',
    ],
  },
  {
    section: '5. Liderança',
    requirements: [
      '5.1 A Alta Direção demonstra liderança e comprometimento com o SGQ e foco no cliente?',
      '5.2 A Política da Qualidade está estabelecida, comunicada e disponível às partes interessadas?',
      '5.3 Funções, responsabilidades e autoridades foram atribuídas e compreendidas na empresa?',
    ],
  },
  {
    section: '6. Planejamento',
    requirements: [
      '6.1 Ações para abordar riscos e oportunidades foram determinadas e integradas aos processos?',
      '6.2 Os objetivos da qualidade são mensuráveis, monitorados e alinhados à política?',
      '6.3 O planejamento de mudanças é conduzido de forma controlada e sistemática?',
    ],
  },
  {
    section: '7. Apoio e Recursos',
    requirements: [
      '7.1.5 Recursos de monitoramento e medição possuem calibração ou verificação periódica válida?',
      '7.2 A competência dos colaboradores envolvidos no SGQ foi avaliada e comprovada?',
      '7.3 O pessoal está consciente da política da qualidade e da sua contribuição à eficácia?',
      '7.5 A informação documentada está devidamente identificada, aprovada, controlada e protegida?',
    ],
  },
  {
    section: '8. Operação',
    requirements: [
      '8.2 Requisitos para produtos e serviços são analisados criticamente antes do compromisso?',
      '8.4 Processos, produtos e serviços providos externamente (fornecedores) são qualificados e controlados?',
      '8.5.1 A produção e fornecimento de serviços são realizados sob condições controladas (IT, PSGQ)?',
      '8.5.2 A identificação e rastreabilidade são mantidas ao longo de todas as etapas produtivas?',
      '8.5.4 A preservação de saídas, matérias-primas e insumos é assegurada durante manuseio e armazenagem?',
      '8.7 Saídas não conformes são identificadas, segregadas e tratadas formalmente (RNC)?',
    ],
  },
  {
    section: '9. Avaliação de Desempenho',
    requirements: [
      '9.1 O desempenho do SGQ e a satisfação do cliente são monitorados sistematicamente?',
      '9.2 Auditorias internas são conduzidas em intervalos planejados com auditores imparciais?',
      '9.3 A Alta Direção analisa criticamente o SGQ em reuniões periódicas registradas em ata?',
    ],
  },
  {
    section: '10. Melhoria',
    requirements: [
      '10.2 Diante de não conformidades, são implementadas ações corretivas para eliminar a causa raiz?',
      '10.3 A adequação e eficácia contínua do SGQ são promovidas através de melhorias planejadas?',
    ],
  },
]
