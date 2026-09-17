import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export type RNCOrigin = 'R.O.' | 'R.C.' | 'Auditorias' | 'Fornecedor' | 'SMS' | 'Análise Crítica'

export type RNCActionType = 'Ação Corretiva' | 'Ação Preventiva' | 'N/A'
export type RNCSeverity = 'Leve' | 'Médio' | 'Grave' | 'Gravíssimo'
export type RNCStatus = 'Aberta' | 'Em Andamento' | 'Fechada' | 'Cancelada'
export type RNCCorrectionType =
  | 'Retrabalhar'
  | 'Reparar'
  | 'Rejeitar ou Sucatar'
  | 'Autorizado sob concessão'
  | 'Outra'

export interface FiveWhyItem {
  why: string
  answer: string
}

export interface IshikawaData {
  metodo?: string[]
  maquina?: string[]
  mao_de_obra?: string[]
  material?: string[]
  meio_ambiente?: string[]
  medicao?: string[]
}

export interface NonConformity {
  id: string
  number: string
  date: string
  process: string
  severity: RNCSeverity
  status: 'Aberta' | 'Em Andamento' | 'Fechada' | 'Cancelada'

  // 3 Header Yes/No flags (FSGQ 8.7-2 Rev.04)
  interferes_subsequent_process?: boolean
  interferes_delivery_deadline?: boolean
  requested_by_client?: boolean

  // Header & Context
  origin?: RNCOrigin
  action_type?: RNCActionType
  summary?: string
  issuer?: string
  service_order_id?: string
  company_id?: string
  parent_rnc_id?: string

  // Section 1: NC description, involved & responsible
  description: string
  involved_parties?: string
  responsible?: string
  supplier_name?: string

  // Section 2: Immediate correction & Cost of Non-Quality
  immediate_correction_type?: RNCCorrectionType | string
  immediate_correction_other?: string
  immediate_action?: string
  cost_raw_material?: number
  cost_supplies?: number
  cost_services?: number
  cost_total?: number

  // Section 3: Reinspection
  is_reinspected?: boolean
  reinspection_result?: 'Aprovado' | 'Não Aprovado' | 'N/A'
  reinspection_inspector?: string
  reinspection_date?: string
  reinspection_notes?: string

  // Section 4: Root Cause
  root_cause_category?: string
  root_cause_details?: string
  root_cause_analysis?: string
  five_whys?: string | FiveWhyItem[]
  ishikawa_data?: string | IshikawaData

  // Section 5: Corrective / Preventive Action
  corrective_action?: string
  action_plan?: string
  deadline?: string
  completion_actual_date?: string
  action_cost?: number

  // Section 6: Risk & Opportunity Assessment (novos riscos e/ou oportunidades identificadas)
  risk_assessment?: string

  // Section 7: Effectiveness Verification
  effectiveness_target_date?: string
  is_effective?: 'SIM' | 'NÃO' | 'Pendente'
  effectiveness_verification?: string
  verification_date?: string
  verifier?: string

  // Section 8: Evidences (files)
  evidences?: string[]

  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string; name_en?: string }
    service_order_id?: { id: string; number: string; client?: string; equipment?: string }
    parent_rnc_id?: { id: string; number: string; summary?: string }
  }
}

export const RNC_PROCESS_LIST = [
  'SGQ',
  'Projetos',
  'Engenharia',
  'Suprimentos',
  'RH',
  'Financeiro',
  'Comercial',
  'TI',
  'Diretoria',
  'PCP',
  'CQ',
  'Almoxarifado',
  'Manutenção',
  'Corte',
  'Solda',
  'Caldeiraria',
  'Usinagem',
  'Produção',
  'SMS',
  'Fornecedor',
  'Expedição',
] as const

export const RNC_ORIGINS: RNCOrigin[] = [
  'R.O.',
  'R.C.',
  'Auditorias',
  'Fornecedor',
  'SMS',
  'Análise Crítica',
]

export const ROOT_CAUSE_CATEGORIES = [
  'Máquina e Ferramenta',
  'Pessoa',
  'Processo e Programa',
  'Material',
  'SMS',
  'Instrumentos de Medição',
  'Fornecedor',
  'Especificação e Projeto',
  'Outros',
] as const

export const RNC_CORRECTION_TYPES: RNCCorrectionType[] = [
  'Retrabalhar',
  'Reparar',
  'Rejeitar ou Sucatar',
  'Autorizado sob concessão',
  'Outra',
]

export const RNC_ACTION_TYPES: RNCActionType[] = ['Ação Corretiva', 'Ação Preventiva', 'N/A']

export async function getNonConformities(
  params: {
    companyId?: string
    status?: string
    severity?: string
    process?: string
    origin?: string
    action_type?: string
    search?: string
  } = {},
): Promise<NonConformity[]> {
  try {
    const filters: string[] = []
    if (params.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}" || company_id = ""`)
    }
    if (params.status && params.status !== 'all') {
      filters.push(`status = "${params.status}"`)
    }
    if (params.severity && params.severity !== 'all') {
      filters.push(`severity = "${params.severity}"`)
    }
    if (params.process && params.process !== 'all') {
      filters.push(`process = "${params.process}"`)
    }
    if (params.origin && params.origin !== 'all') {
      filters.push(`origin = "${params.origin}"`)
    }
    if (params.action_type && params.action_type !== 'all') {
      filters.push(`action_type = "${params.action_type}"`)
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim()
      filters.push(
        `(number ~ "${s}" || process ~ "${s}" || description ~ "${s}" || responsible ~ "${s}" || summary ~ "${s}" || issuer ~ "${s}" || supplier_name ~ "${s}")`,
      )
    }

    const result = await pb.collection('non_conformities').getFullList<NonConformity>({
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'company_id,service_order_id,parent_rnc_id',
    })
    return safeArray<NonConformity>(result)
  } catch (e) {
    console.error('getNonConformities failed:', e)
    return []
  }
}

/**
 * Generates official company RNC number:
 * Format: "RNC 015-26" (RNC <3-digits>-<2-digit-year>)
 */
export async function generateRNCNumber(companyId?: string): Promise<string> {
  const currentYearFull = new Date().getFullYear()
  const yearSuffix = String(currentYearFull).slice(-2)
  try {
    const records = await pb.collection('non_conformities').getFullList<NonConformity>({
      sort: '-created',
      limit: 200,
    })

    let maxNum = 0
    for (const r of records) {
      // Matches both "RNC 015-26" and legacy "RNC-015/2026"
      const match1 = r.number.match(/RNC\s+(\d+)-(\d{2})/i)
      const match2 = r.number.match(/RNC-(\d+)\/(\d{4})/i)

      if (match1 && match1[2] === yearSuffix) {
        const num = parseInt(match1[1], 10)
        if (num > maxNum) maxNum = num
      } else if (match2 && match2[2].slice(-2) === yearSuffix) {
        const num = parseInt(match2[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    const nextNum = String(maxNum + 1).padStart(3, '0')
    return `RNC ${nextNum}-${yearSuffix}`
  } catch (e) {
    return `RNC 001-${yearSuffix}`
  }
}

/**
 * Tolerant notification sender: failure never throws or breaks the main operation.
 */
export async function sendRNCNotification(params: {
  userId?: string
  message: string
  companyId?: string
}): Promise<void> {
  try {
    if (params.userId) {
      await pb.collection('notifications').create({
        user_id: params.userId,
        message: params.message,
        read: false,
        company_id: params.companyId,
        type: 'deadline_alert',
      })
      return
    }

    // Broadcast to Quality Managers & Supervisors
    const users = await pb.collection('users').getFullList<{ id: string; role?: string }>({
      fields: 'id,role',
    })
    const targetUsers = users.filter((u) => {
      const r = u.role ? (Array.isArray(u.role) ? u.role : [u.role]) : []
      return r.includes('Manager') || r.includes('QCC') || r.includes('Supervisor')
    })

    await Promise.all(
      targetUsers.map((u) =>
        pb.collection('notifications').create({
          user_id: u.id,
          message: params.message,
          read: false,
          company_id: params.companyId,
          type: 'deadline_alert',
        }),
      ),
    )
  } catch (e) {
    console.warn('[rnc-notifications] Silent error sending notification:', e)
  }
}

/**
 * Recalculate IRPI & INCF indicators automatically.
 * Tolerant pattern: failure NEVER crashes or aborts RNC creation/update.
 */
export async function recalculateRNCIndicators(params: { companyId?: string }): Promise<void> {
  try {
    const companyFilter =
      params.companyId && params.companyId !== 'all' ? `company_id = "${params.companyId}"` : ''

    // Fetch all RNCs for calculation
    const allRNCs = await pb.collection('non_conformities').getFullList<NonConformity>({
      filter: companyFilter || undefined,
    })

    // 1. IRPI = Total de reclamações de produtos/inspeções (Origem = 'R.C.', 'Reclamação de Cliente' ou 'R.O.')
    const irpiCount = allRNCs.filter(
      (r) =>
        r.origin === 'R.C.' ||
        (r.origin as any) === 'Reclamação de Cliente' ||
        r.origin === 'R.O.' ||
        r.severity === 'Grave' ||
        r.severity === 'Gravíssimo',
    ).length

    // 2. INCF por Fornecedor = Recebimentos NC ÷ Pedidos totais × 100
    // Contagem de RNCs com origem Fornecedor
    const supplierNCs = allRNCs.filter((r) => r.origin === 'Fornecedor').length

    // Total de recebimentos/pedidos de compra (módulo almoxarifado/compras)
    let totalPurchases = 0
    try {
      const purchases = await pb.collection('purchase_requests').getFullList({
        filter: companyFilter || undefined,
        fields: 'id',
      })
      totalPurchases = purchases.length
    } catch {
      totalPurchases = 0
    }

    // Se totalPurchases for zero, usa fornecedores únicos ou base padrão tolerante
    const incfRate =
      totalPurchases > 0
        ? Math.round((supplierNCs / totalPurchases) * 100 * 10) / 10
        : supplierNCs > 0
          ? Math.min(100, supplierNCs * 5)
          : 0

    // Atualiza indicadores na tabela 'indicators' se existirem
    const targetIndicators = await pb.collection('indicators').getFullList<{
      id: string
      title: string
      company_id?: string
      current_value?: number
    }>({
      filter: companyFilter || undefined,
    })

    for (const ind of targetIndicators) {
      if (ind.title.includes('IRPI')) {
        await pb.collection('indicators').update(ind.id, {
          current_value: irpiCount,
        })
      } else if (ind.title.includes('INCF')) {
        await pb.collection('indicators').update(ind.id, {
          current_value: incfRate,
        })
      }
    }
  } catch (err) {
    console.warn('[rnc-indicators] recalculateRNCIndicators silent error:', err)
  }
}

export async function createNonConformity(
  data: Partial<NonConformity>,
  evidenceFiles?: File[],
): Promise<NonConformity> {
  const costTotal =
    (Number(data.cost_raw_material) || 0) +
    (Number(data.cost_supplies) || 0) +
    (Number(data.cost_services) || 0)

  // Format payload
  const payload: any = {
    ...data,
    status: data.status || 'Aberta',
    cost_total: costTotal,
    date: data.date || new Date().toISOString(),
  }

  // Handle JSON fields
  if (data.five_whys && typeof data.five_whys !== 'string') {
    payload.five_whys = JSON.stringify(data.five_whys)
  }
  if (data.ishikawa_data && typeof data.ishikawa_data !== 'string') {
    payload.ishikawa_data = JSON.stringify(data.ishikawa_data)
  }

  let created: NonConformity

  if (evidenceFiles && evidenceFiles.length > 0) {
    const formData = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        formData.append(k, String(v))
      }
    })
    evidenceFiles.forEach((file) => {
      formData.append('evidences', file)
    })
    created = await pb.collection('non_conformities').create<NonConformity>(formData)
  } else {
    created = await pb.collection('non_conformities').create<NonConformity>(payload)
  }

  // Non-blocking notification
  sendRNCNotification({
    companyId: created.company_id,
    message: `Nova Não Conformidade registrada: ${created.number} (${created.process} - ${created.severity})`,
  })

  // Non-blocking indicator recalculation
  recalculateRNCIndicators({ companyId: created.company_id })

  return created
}

export async function updateNonConformity(
  id: string,
  data: Partial<NonConformity>,
  evidenceFiles?: File[],
): Promise<NonConformity> {
  const costTotal =
    (Number(data.cost_raw_material) || 0) +
    (Number(data.cost_supplies) || 0) +
    (Number(data.cost_services) || 0)

  const payload: any = {
    ...data,
    cost_total: costTotal,
  }

  if (data.five_whys && typeof data.five_whys !== 'string') {
    payload.five_whys = JSON.stringify(data.five_whys)
  }
  if (data.ishikawa_data && typeof data.ishikawa_data !== 'string') {
    payload.ishikawa_data = JSON.stringify(data.ishikawa_data)
  }

  let updated: NonConformity

  if (evidenceFiles && evidenceFiles.length > 0) {
    const formData = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        formData.append(k, String(v))
      }
    })
    evidenceFiles.forEach((file) => {
      formData.append('evidences', file)
    })
    updated = await pb.collection('non_conformities').update<NonConformity>(id, formData)
  } else {
    updated = await pb.collection('non_conformities').update<NonConformity>(id, payload)
  }

  // If status is closed or updated, recalculate indicators
  recalculateRNCIndicators({ companyId: updated.company_id })
  // Tolerant update for Lead Time indicators
  try {
    const { recalculateLeadTimeIndicators } = await import('./lead-time')
    recalculateLeadTimeIndicators({ companyId: updated.company_id })
  } catch {
    /* intentionally ignored */
  }

  return updated
}

export async function deleteNonConformity(id: string): Promise<void> {
  const existing = await pb.collection('non_conformities').getOne<NonConformity>(id)
  await pb.collection('non_conformities').delete(id)
  recalculateRNCIndicators({ companyId: existing.company_id })
}

/**
 * Automates opening a child RNC when effectiveness verification results in 'NÃO' (Ineficaz).
 */
export async function createChildRNC(parentRNC: NonConformity): Promise<NonConformity> {
  const newNumber = await generateRNCNumber(parentRNC.company_id)

  const childPayload: Partial<NonConformity> = {
    number: newNumber,
    parent_rnc_id: parentRNC.id,
    company_id: parentRNC.company_id,
    service_order_id: parentRNC.service_order_id,
    process: parentRNC.process,
    severity: parentRNC.severity,
    origin: parentRNC.origin || 'Auditorias',
    action_type: 'Ação Corretiva',
    issuer: parentRNC.verifier || 'Gestor da Qualidade',
    summary: `Reincidência / Ineficácia da RNC ${parentRNC.number}`,
    description:
      `Aberta automaticamente devido à verificação ineficaz da RNC ${parentRNC.number}. Tratativa anterior não eliminou a causa raiz. ${parentRNC.effectiveness_verification || ''}`.trim(),
    status: 'Aberta',
    date: new Date().toISOString(),
  }

  const child = await createNonConformity(childPayload)

  sendRNCNotification({
    companyId: child.company_id,
    message: `⚠️ Atenção: RNC Filha ${child.number} aberta automaticamente devido a ineficácia comprovada na ${parentRNC.number}!`,
  })

  return child
}

/* ------------------------------------------------------------------ */
/* Bulk Import Service for RNCs (Client-Side Parser & Importer)        */
/* ------------------------------------------------------------------ */

export interface RNCImportRow {
  number: string
  date: string
  process: string
  severity: RNCSeverity
  description: string
  origin?: RNCOrigin
  action_type?: RNCActionType
  status: 'Em Andamento' | 'Fechada' | 'Cancelada'
  interferes_subsequent_process?: boolean
  interferes_delivery_deadline?: boolean
  requested_by_client?: boolean
  responsible?: string
  issuer?: string
  service_order_number?: string
  summary?: string
  involved_parties?: string
  supplier_name?: string
  immediate_correction_type?: string
  immediate_action?: string
  is_reinspected?: boolean
  reinspection_result?: 'Aprovado' | 'Não Aprovado' | 'N/A'
  reinspection_inspector?: string
  reinspection_date?: string
  reinspection_notes?: string
  root_cause_category?: string
  root_cause_details?: string
  risk_assessment?: string
  corrective_action?: string
  action_plan?: string
  deadline?: string
  completion_actual_date?: string
  cost_raw_material?: number
  cost_supplies?: number
  cost_services?: number
  cost_total?: number
  action_cost?: number
  effectiveness_target_date?: string
  effectiveness_verification?: string
  verification_date?: string
  verifier?: string
  is_effective?: 'SIM' | 'NÃO' | 'Pendente'
  parent_rnc_number?: string
  five_whys?: FiveWhyItem[]
  ishikawa_data?: IshikawaData
  matched_evidence_files?: File[]
  matched_evidence_names?: string[]
}

export interface RNCImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ row: number; number: string; error: string }>
  unmatchedPdfFiles: string[]
}

export type RNCImportProgressCallback = (
  current: number,
  total: number,
  currentNumber?: string,
) => void

/**
 * Normalizes an RNC number string for tolerant comparison:
 * e.g. "RNC-007/2025", "RNC 007-2025", "RNC 007/25" -> normalized comparison key
 */
export function normalizeRNCNumberForMatch(raw: string): string {
  if (!raw) return ''
  return raw
    .toUpperCase()
    .replace(/\.PDF$/i, '')
    .replace(/[^A-Z0-9]/g, '') // remove spaces, hyphens, slashes, underscores
}

/**
 * Normalizes legacy status from Excel into non_conformities schema:
 * Collection accepts: 'Em Andamento' | 'Fechada' | 'Cancelada'
 * Rule: "fechadas continuam fechadas, em aberto como Em Andamento"
 */
export function normalizeRNCStatus(rawStatus?: string): 'Em Andamento' | 'Fechada' | 'Cancelada' {
  if (!rawStatus) return 'Em Andamento'
  const s = rawStatus.toLowerCase().trim()
  if (
    s.includes('fechad') ||
    s.includes('concluid') ||
    s.includes('finalizad') ||
    s.includes('encerrad') ||
    s === 'ok'
  ) {
    return 'Fechada'
  }
  if (s.includes('cancel')) {
    return 'Cancelada'
  }
  // 'Aberta', 'Em Aberto', 'Em Andamento', 'Pendente', 'Em Análise', etc.
  return 'Em Andamento'
}

/**
 * Normalizes severity into valid collection options: 'Leve' | 'Médio' | 'Grave' | 'Gravíssimo'
 */
export function normalizeRNCSeverity(raw?: string): RNCSeverity {
  if (!raw) return 'Médio'
  const s = raw.toLowerCase().trim()
  if (s.includes('gravissim') || s.includes('crit')) return 'Gravíssimo'
  if (s.includes('grav')) return 'Grave'
  if (s.includes('med') || s.includes('moder')) return 'Médio'
  if (s.includes('lev') || s.includes('baix')) return 'Leve'
  return 'Médio'
}

/**
 * Normalizes origin into collection valid values (FSGQ 8.7-1 / 8.7-2):
 * 'R.O.' | 'R.C.' | 'Auditorias' | 'Fornecedor' | 'SMS' | 'Análise Crítica'
 */
export function normalizeRNCOrigin(raw?: string): RNCOrigin {
  if (!raw) return 'Auditorias'
  const s = raw.toLowerCase().trim()
  if (s.includes('r.c.') || s.includes('rc') || s.includes('cliente') || s.includes('reclam')) {
    return 'R.C.'
  }
  if (s.includes('r.o.') || s.includes('ro') || s.includes('recebimento')) {
    return 'R.O.'
  }
  if (s.includes('fornec') || s.includes('terceir')) {
    return 'Fornecedor'
  }
  if (s.includes('sms') || s.includes('seguran') || s.includes('meio ambient')) {
    return 'SMS'
  }
  if (s.includes('critica') || s.includes('analise')) {
    return 'Análise Crítica'
  }
  if (s.includes('audit')) {
    return 'Auditorias'
  }
  return 'Auditorias'
}

/**
 * Normalizes Action Type into: 'Ação Corretiva' | 'Ação Preventiva' | 'N/A'
 */
export function normalizeRNCActionType(raw?: string): RNCActionType {
  if (!raw) return 'Ação Corretiva'
  const s = raw.toLowerCase().trim()
  if (s.includes('prev')) return 'Ação Preventiva'
  if (s.includes('corret')) return 'Ação Corretiva'
  if (s.includes('n/a') || s.includes('na') || s === 'n') return 'N/A'
  return 'Ação Corretiva'
}

/**
 * Normalizes Immediate Correction Type:
 * 'Retrabalhar' | 'Reparar' | 'Rejeitar ou Sucatar' | 'Autorizado sob concessão' | 'Outra'
 */
export function normalizeRNCCorrectionType(raw?: string): RNCCorrectionType {
  if (!raw) return 'Retrabalhar'
  const s = raw.toLowerCase().trim()
  if (s.includes('retrabalh')) return 'Retrabalhar'
  if (s.includes('repar')) return 'Reparar'
  if (s.includes('rejeit') || s.includes('sucat')) return 'Rejeitar ou Sucatar'
  if (s.includes('concess') || s.includes('autoriz')) return 'Autorizado sob concessão'
  return 'Outra'
}

/**
 * Normalizes Root Cause Category into official 9 categories
 */
export function normalizeRNCRootCauseCategory(raw?: string): string {
  if (!raw) return 'Processo e Programa'
  const s = raw.toLowerCase().trim()
  if (s.includes('maquin') || s.includes('ferram')) return 'Máquina e Ferramenta'
  if (
    s.includes('pess') ||
    s.includes('mao de obra') ||
    s.includes('colaborador') ||
    s.includes('treina')
  )
    return 'Pessoa'
  if (s.includes('mater') || s.includes('materia')) return 'Material'
  if (s.includes('sms') || s.includes('seguran') || s.includes('ambient')) return 'SMS'
  if (s.includes('instrument') || s.includes('medic') || s.includes('calibr'))
    return 'Instrumentos de Medição'
  if (s.includes('fornec') || s.includes('terceir')) return 'Fornecedor'
  if (s.includes('especific') || s.includes('projet') || s.includes('engenhar'))
    return 'Especificação e Projeto'
  if (s.includes('process') || s.includes('program') || s.includes('metod'))
    return 'Processo e Programa'
  return 'Outros'
}

/**
 * Normalizes Process into official dashboard list:
 * SGQ, Projetos, Engenharia, Suprimentos, RH, Financeiro, Comercial, TI,
 * Diretoria, PCP, CQ, Almoxarifado, Manutenção, Corte, Solda, Caldeiraria,
 * Usinagem, Produção, SMS, Fornecedor, Expedição
 */
export function normalizeRNCProcess(raw?: string): string {
  if (!raw) return 'SGQ'
  const s = raw.trim()
  const found = RNC_PROCESS_LIST.find((p) => p.toLowerCase() === s.toLowerCase())
  if (found) return found
  const sLow = s.toLowerCase()
  if (sLow.includes('sold')) return 'Solda'
  if (sLow.includes('caldeir')) return 'Caldeiraria'
  if (sLow.includes('usin')) return 'Usinagem'
  if (sLow.includes('cort')) return 'Corte'
  if (sLow.includes('cq') || sLow.includes('qualidade')) return 'CQ'
  if (sLow.includes('almox')) return 'Almoxarifado'
  if (sLow.includes('manuten')) return 'Manutenção'
  if (sLow.includes('pcp')) return 'PCP'
  if (sLow.includes('suprim') || sLow.includes('compr')) return 'Suprimentos'
  if (sLow.includes('engenh')) return 'Engenharia'
  if (sLow.includes('proj')) return 'Projetos'
  if (sLow.includes('exped')) return 'Expedição'
  if (sLow.includes('prod')) return 'Produção'
  if (sLow.includes('comerc')) return 'Comercial'
  if (sLow.includes('financ')) return 'Financeiro'
  if (sLow.includes('diret')) return 'Diretoria'
  if (sLow.includes('ti') || sLow.includes('informat')) return 'TI'
  if (sLow.includes('rh') || sLow.includes('human')) return 'RH'
  if (sLow.includes('sms') || sLow.includes('seguran')) return 'SMS'
  if (sLow.includes('fornec')) return 'Fornecedor'
  if (sLow.includes('sgq')) return 'SGQ'
  return 'SGQ'
}

/**
 * Imports a batch of parsed RNC records into non_conformities
 */
export async function bulkImportRNCs(
  rows: RNCImportRow[],
  companyId: string,
  onProgress?: RNCImportProgressCallback,
): Promise<RNCImportResult> {
  const result: RNCImportResult = {
    total: rows.length,
    success: 0,
    failed: 0,
    errors: [],
    unmatchedPdfFiles: [],
  }

  // Pre-load service orders for potential linking
  let soMap = new Map<string, string>() // normalized SO number -> SO id
  try {
    const orders = await pb.collection('service_orders').getFullList({
      filter: `owner_company_id = "${companyId}"`,
      fields: 'id,number',
    })
    for (const ord of orders) {
      if (ord.number) {
        soMap.set(ord.number.trim().toLowerCase(), ord.id)
      }
    }
  } catch {
    /* ignore */
  }

  // Pre-load existing RNC numbers for this company to avoid duplicates or update them
  let existingRncMap = new Map<string, string>() // normalized number -> existing record ID
  try {
    const existing = await pb
      .collection('non_conformities')
      .getFullList<{ id: string; number: string }>({
        filter: `company_id = "${companyId}"`,
        fields: 'id,number',
      })
    for (const item of existing) {
      if (item.number) {
        existingRncMap.set(normalizeRNCNumberForMatch(item.number), item.id)
      }
    }
  } catch {
    /* ignore */
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    onProgress?.(i + 1, rows.length, row.number)

    try {
      if (!row.number || !row.number.trim()) {
        result.failed++
        result.errors.push({
          row: i + 1,
          number: '—',
          error: 'Número da RNC está em branco.',
        })
        continue
      }

      // Check OS link
      let linkedSoId: string | undefined = undefined
      if (row.service_order_number) {
        const soKey = row.service_order_number.trim().toLowerCase()
        linkedSoId = soMap.get(soKey)
      }

      const rawMaterial = Number(row.cost_raw_material) || 0
      const supplies = Number(row.cost_supplies) || 0
      const services = Number(row.cost_services) || 0
      const computedTotalCost = Number(row.cost_total) || rawMaterial + supplies + services

      const payload: Record<string, any> = {
        number: row.number.trim(), // EXACT original numbering preserved!
        date: row.date
          ? row.date.includes('T')
            ? row.date
            : `${row.date} 12:00:00.000Z`
          : new Date().toISOString(),
        company_id: companyId,
        process: normalizeRNCProcess(row.process),
        severity: row.severity || 'Médio',
        description: row.description ? row.description.trim() : `RNC ${row.number.trim()}`,
        status: normalizeRNCStatus(row.status),
        origin: row.origin || 'Auditorias',
        action_type: row.action_type || 'Ação Corretiva',
        interferes_subsequent_process: !!row.interferes_subsequent_process,
        interferes_delivery_deadline: !!row.interferes_delivery_deadline,
        requested_by_client: !!row.requested_by_client,
        responsible: row.responsible ? row.responsible.trim() : '',
        issuer: row.issuer ? row.issuer.trim() : '',
        summary: row.summary ? row.summary.trim() : '',
        involved_parties: row.involved_parties ? row.involved_parties.trim() : '',
        supplier_name: row.supplier_name ? row.supplier_name.trim() : '',
        immediate_correction_type: row.immediate_correction_type || '',
        immediate_action: row.immediate_action ? row.immediate_action.trim() : '',
        is_reinspected: !!row.is_reinspected,
        reinspection_result: row.reinspection_result || 'N/A',
        reinspection_inspector: row.reinspection_inspector ? row.reinspection_inspector.trim() : '',
        reinspection_notes: row.reinspection_notes ? row.reinspection_notes.trim() : '',
        root_cause_category: row.root_cause_category
          ? normalizeRNCRootCauseCategory(row.root_cause_category)
          : 'Processo e Programa',
        root_cause_details: row.root_cause_details ? row.root_cause_details.trim() : '',
        risk_assessment: row.risk_assessment ? row.risk_assessment.trim() : '',
        corrective_action: row.corrective_action ? row.corrective_action.trim() : '',
        action_plan: row.action_plan ? row.action_plan.trim() : '',
        cost_raw_material: rawMaterial,
        cost_supplies: supplies,
        cost_services: services,
        cost_total: computedTotalCost,
        action_cost: Number(row.action_cost) || 0,
        effectiveness_verification: row.effectiveness_verification
          ? row.effectiveness_verification.trim()
          : '',
        verifier: row.verifier ? row.verifier.trim() : '',
        is_effective: row.is_effective || (row.status === 'Fechada' ? 'SIM' : 'Pendente'),
      }

      if (row.deadline) {
        payload.deadline = row.deadline.includes('T')
          ? row.deadline
          : `${row.deadline} 12:00:00.000Z`
      }
      if (row.completion_actual_date) {
        payload.completion_actual_date = row.completion_actual_date.includes('T')
          ? row.completion_actual_date
          : `${row.completion_actual_date} 12:00:00.000Z`
      }
      if (row.reinspection_date) {
        payload.reinspection_date = row.reinspection_date.includes('T')
          ? row.reinspection_date
          : `${row.reinspection_date} 12:00:00.000Z`
      }
      if (row.effectiveness_target_date) {
        payload.effectiveness_target_date = row.effectiveness_target_date.includes('T')
          ? row.effectiveness_target_date
          : `${row.effectiveness_target_date} 12:00:00.000Z`
      }
      if (row.verification_date) {
        payload.verification_date = row.verification_date.includes('T')
          ? row.verification_date
          : `${row.verification_date} 12:00:00.000Z`
      }
      if (linkedSoId) {
        payload.service_order_id = linkedSoId
      }
      if (row.five_whys && row.five_whys.length > 0) {
        payload.five_whys = JSON.stringify(row.five_whys)
      }
      if (row.ishikawa_data) {
        payload.ishikawa_data = JSON.stringify(row.ishikawa_data)
      }

      const normKey = normalizeRNCNumberForMatch(row.number)
      const existingId = existingRncMap.get(normKey)

      const filesToAttach = row.matched_evidence_files || []

      if (filesToAttach.length > 0) {
        const formData = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            formData.append(k, String(v))
          }
        })
        filesToAttach.forEach((file) => {
          formData.append('evidences', file)
        })

        if (existingId) {
          await pb.collection('non_conformities').update(existingId, formData)
        } else {
          const created = await pb.collection('non_conformities').create(formData)
          existingRncMap.set(normKey, created.id)
        }
      } else {
        if (existingId) {
          await pb.collection('non_conformities').update(existingId, payload)
        } else {
          const created = await pb.collection('non_conformities').create(payload)
          existingRncMap.set(normKey, created.id)
        }
      }

      result.success++
    } catch (err: any) {
      result.failed++
      result.errors.push({
        row: i + 1,
        number: row.number || `Linha ${i + 1}`,
        error: err?.message || 'Falha ao salvar no banco de dados',
      })
    }
  }

  // Recalculate indicators for this company after bulk import
  try {
    await recalculateRNCIndicators({ companyId })
  } catch (err) {
    console.warn('recalculateRNCIndicators warning:', err)
  }

  return result
}
