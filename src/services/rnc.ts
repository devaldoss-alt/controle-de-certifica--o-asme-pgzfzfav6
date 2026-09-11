import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export type RNCOrigin =
  | 'R.O.'
  | 'Reclamação de Cliente'
  | 'Auditoria Interna'
  | 'Auditoria Externa'
  | 'Fornecedor'
  | 'SMS'
  | 'Análise Crítica'
  | 'Outro'

export type RNCActionType = 'Corretiva' | 'Preventiva' | 'N/A'
export type RNCSeverity = 'Leve' | 'Médio' | 'Grave' | 'Crítico' | 'Gravíssimo'
export type RNCStatus = 'Aberta' | 'Em Andamento' | 'Fechada' | 'Cancelada'
export type RNCCorrectionType =
  | 'Retrabalhar'
  | 'Reparar'
  | 'Rejeitar-Sucatar'
  | 'Concessão'
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
  severity: 'Leve' | 'Médio' | 'Grave' | 'Crítico' | 'Gravíssimo'
  status: 'Aberta' | 'Em Andamento' | 'Fechada' | 'Cancelada'

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
  immediate_correction_type?: RNCCorrectionType
  immediate_correction_other?: string
  immediate_action?: string
  cost_raw_material?: number
  cost_supplies?: number
  cost_services?: number
  cost_total?: number

  // Section 3: Reinspection
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
  action_cost?: number

  // Section 6: Risk & Opportunity Assessment
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
] as const

export const RNC_ORIGINS: RNCOrigin[] = [
  'R.O.',
  'Reclamação de Cliente',
  'Auditoria Interna',
  'Auditoria Externa',
  'Fornecedor',
  'SMS',
  'Análise Crítica',
  'Outro',
]

export const ROOT_CAUSE_CATEGORIES = [
  'Método / Procedimento',
  'Mão de Obra / Capacitação',
  'Máquina / Equipamento',
  'Material / Matéria-Prima',
  'Meio Ambiente / Condições',
  'Medição / Instrumento',
  'Fornecedor / Terceiro',
  'Projeto / Engenharia',
  'Planejamento / Gestão',
] as const

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

    // 1. IRPI = Total de reclamações de produtos/inspeções (Origem = 'Reclamação de Cliente' ou 'R.O.')
    const irpiCount = allRNCs.filter(
      (r) =>
        r.origin === 'Reclamação de Cliente' ||
        r.origin === 'R.O.' ||
        r.severity === 'Grave' ||
        r.severity === 'Crítico' ||
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
    origin: parentRNC.origin || 'Auditoria Interna',
    action_type: 'Corretiva',
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
