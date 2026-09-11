import pb from '@/lib/pocketbase/client'
import type { NonConformity } from '@/services/rnc'

export type SupplierClassification = 'Crítico' | 'Não Crítico'

export type SupplierStatus = 'Em avaliação' | 'Qualificado' | 'Em requalificação' | 'Desqualificado'

export type QualificationCriterion =
  | 'ISO 9001 válida'
  | 'Certificados do serviço/material (RBC/ASME)'
  | 'Histórico satisfatório de fornecimento'
  | 'Questionário FSGQ 8.4-2 (Nota ≥ 6,0)'
  | 'Dispensa / Não Crítico'

export const CRITICAL_CATEGORIES = [
  'Aços e materiais de aportar',
  'Tratamentos térmicos',
  'Revestimentos e banhos',
  'Ensaios Não Destrutivos (END)',
  'Calibração de instrumentos',
  'Soldagem',
  'Transporte de produto acabado',
  'Tintas e revestimentos especiais',
  'Componentes críticos de engenharia',
  'Outros materiais e serviços gerais',
] as const

export type CriticalCategory = (typeof CRITICAL_CATEGORIES)[number]

export interface Supplier {
  id: string
  name: string
  trade_name?: string
  cnpj?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  company_id: string
  classification: SupplierClassification
  critical_categories?: string[]
  materials_services_description?: string
  qualification_status: SupplierStatus
  qualification_criteria?: QualificationCriterion[]
  iso9001_certified?: boolean
  iso9001_cert_number?: string
  iso9001_valid_until?: string
  technical_certificates_info?: string
  evaluation_score?: number
  last_evaluation_date?: string
  next_reevaluation_date?: string
  reevaluation_exempt?: boolean
  reevaluation_exempt_reason?: string
  disqualification_reason?: string
  qualification_notes?: string
  qualified_by?: string
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string }
    qualified_by?: { id: string; name: string }
  }
}

export interface SupplierEvaluationQuestion {
  id: string
  section: string
  question: string
  weight: number
  score: number // 0, 1, 2
  notes?: string
}

export interface SupplierEvaluation {
  id: string
  supplier_id: string
  company_id: string
  evaluation_type: 'Inicial (FSGQ 8.4-2)' | 'Reavaliação (FSGQ 8.4-2.1)'
  evaluation_date: string
  evaluator_name: string
  evaluator_id?: string
  answers_json?: string
  total_score: number
  result: 'Aprovado (≥ 6,0)' | 'Reprovado (< 6,0)' | 'Dispensado por ISO 9001'
  incf_recorded?: number
  observations?: string
  action_plan?: string
  next_reevaluation_date?: string
  created: string
  updated: string
  expand?: {
    supplier_id?: Supplier
  }
}

export interface PurchaseQuoteProposal {
  supplier: string
  supplierId?: string
  price: number
  deadlineDays: number
  isSelected: boolean
  isCritical?: boolean
  isQualified?: boolean
  conditions?: string
}

export interface PurchaseQuote {
  id: string
  quote_number: string
  title: string
  company_id: string
  os_id?: string
  items_summary?: string
  proposals_json?: string
  quote_count: number
  has_min_three_quotes: boolean
  selected_supplier_id?: string
  selected_supplier_name?: string
  selected_supplier_is_critical?: boolean
  selected_supplier_is_qualified?: boolean
  exception_justification?: string
  total_amount?: number
  delivery_expected_date?: string
  delivery_actual_date?: string
  delivery_status?: 'No Prazo' | 'Atrasado' | 'Pendente'
  status: 'Em cotação' | 'Resumo Aprovado' | 'Pedido Emitido' | 'Entregue' | 'Cancelado'
  notes?: string
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string }
    os_id?: { id: string; number: string; client?: string }
    selected_supplier_id?: Supplier
  }
}

export interface SupplierINCFSummary {
  supplierName: string
  supplierId?: string
  nonConformityCount: number
  purchasesCount: number
  incfRate: number
  limitExceeded: boolean // >= 30%
}

export interface SuppliesKPIsSummary {
  incfGeneral: number // INCF geral consumido do RNC / indicador
  criticalSuppliersTotal: number
  criticalSuppliersQualified: number
  pctCriticalQualified: number // meta >= 100%
  totalQuotes: number
  quotesWithMinThree: number
  pctQuotesWithMinThree: number // meta >= 90%
  totalDeliveredOrders: number
  delayedOrders: number
  pctDelayedOrders: number // meta < 10%
  suppliersExceedingINCF: SupplierINCFSummary[]
}

/** Standard Questions for FSGQ 8.4-2 (Initial Evaluation) */
export const INITIAL_EVALUATION_QUESTIONS: SupplierEvaluationQuestion[] = [
  {
    id: 'q1',
    section: 'Sistema da Qualidade & Certificações',
    question: 'A empresa possui Sistema de Gestão da Qualidade implementado ou formalizado?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'q2',
    section: 'Controle de Processos & Fabricação',
    question:
      'Os processos produtivos e de prestação de serviços possuem instruções técnicas e registros rastreáveis?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'q3',
    section: 'Rastreabilidade & Matéria-Prima',
    question:
      'Apresenta certificados de qualidade (análise química/mecânica ou RBC) com rastreabilidade de lote/corrida?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'q4',
    section: 'Capacidade Técnica & Equipamentos',
    question:
      'Possui equipamentos calibrados, pessoal qualificado (ASME, ABENDI/SNQC) e infraestrutura adequada?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'q5',
    section: 'Pontualidade, Atendimento & Conformidade',
    question:
      'Demonstra capacidade de atendimento aos prazos pactuados, suporte técnico e tratamento de desvios?',
    weight: 2,
    score: 2,
    notes: '',
  },
]

/** Standard Questions for FSGQ 8.4-2.1 (Reevaluation - Biennial) */
export const REEVALUATION_QUESTIONS: SupplierEvaluationQuestion[] = [
  {
    id: 'rq1',
    section: 'Desempenho da Qualidade (INCF)',
    question:
      'O histórico de fornecimento apresentou índice de não conformidade aceitável (INCF < 30%)?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'rq2',
    section: 'Manutenção de Certificados',
    question:
      'Mantém certificados de calibração, qualificações ASME e licenças pertinentes dentro da validade?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'rq3',
    section: 'Pontualidade de Entrega',
    question: 'Cumpriu os prazos de entrega acordados nos Pedidos de Compra sem atrasos críticos?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'rq4',
    section: 'Tratamento de RNCs & Ações Corretivas',
    question:
      'Respondeu e implementou ações corretivas com eficácia quando notificado por RNC de fornecedor?',
    weight: 2,
    score: 2,
    notes: '',
  },
  {
    id: 'rq5',
    section: 'Competitividade & Atendimento Comercial',
    question:
      'Manteve competitividade técnica-comercial e agilidade no envio de cotações e propostas?',
    weight: 2,
    score: 2,
    notes: '',
  },
]

// ================= CRUD SUPPLIERS =================

export async function getSuppliers(params?: {
  companyId?: string
  classification?: string
  status?: string
  search?: string
}): Promise<Supplier[]> {
  try {
    const filters: string[] = []
    if (params?.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}"`)
    }
    if (params?.classification && params.classification !== 'all') {
      filters.push(`classification = "${params.classification}"`)
    }
    if (params?.status && params.status !== 'all') {
      filters.push(`qualification_status = "${params.status}"`)
    }
    if (params?.search && params.search.trim()) {
      const s = params.search.trim().replace(/"/g, '\\"')
      filters.push(
        `(name ~ "${s}" || trade_name ~ "${s}" || cnpj ~ "${s}" || contact_person ~ "${s}")`,
      )
    }

    const filter = filters.length > 0 ? filters.join(' && ') : undefined
    return await pb.collection('suppliers').getFullList<Supplier>({
      filter,
      sort: 'name',
      expand: 'company_id,qualified_by',
    })
  } catch (e) {
    console.error('getSuppliers error:', e)
    return []
  }
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    return await pb.collection('suppliers').getOne<Supplier>(id, {
      expand: 'company_id,qualified_by',
    })
  } catch (e) {
    console.error('getSupplierById error:', e)
    return null
  }
}

export async function createSupplier(data: Partial<Supplier>): Promise<Supplier> {
  // Check automatic qualification logic per PSGQ 8.4
  const payload: any = { ...data }

  // Automatic qualification via ISO 9001
  if (data.iso9001_certified && data.iso9001_valid_until) {
    const validUntil = new Date(data.iso9001_valid_until)
    if (validUntil > new Date()) {
      payload.qualification_status = 'Qualificado'
      if (!payload.qualification_criteria) payload.qualification_criteria = []
      if (!payload.qualification_criteria.includes('ISO 9001 válida')) {
        payload.qualification_criteria.push('ISO 9001 válida')
      }
      payload.reevaluation_exempt = true
      const dateStr = validUntil.toLocaleDateString('pt-BR')
      payload.reevaluation_exempt_reason = `Dispensado — certificado ISO 9001 válido até ${dateStr}`
    }
  }

  // Non-critical supplier is automatically qualified with waiver
  if (data.classification === 'Não Crítico' && !data.qualification_status) {
    payload.qualification_status = 'Qualificado'
    payload.qualification_criteria = ['Dispensa / Não Crítico']
    payload.evaluation_score = payload.evaluation_score || 8.0
  }

  // Next reevaluation default: +2 years if not set
  if (!payload.next_reevaluation_date) {
    const twoYearsLater = new Date()
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2)
    payload.next_reevaluation_date = twoYearsLater.toISOString()
  }

  const created = await pb.collection('suppliers').create<Supplier>(payload)
  // Auto-recalculate KPIs
  recalculateSuppliesKPIs({ companyId: created.company_id })
  return created
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
  const payload: any = { ...data }

  // Recalculate automatic ISO 9001 exemption
  if (data.iso9001_certified !== undefined || data.iso9001_valid_until !== undefined) {
    if (data.iso9001_certified && data.iso9001_valid_until) {
      const validUntil = new Date(data.iso9001_valid_until)
      if (validUntil > new Date()) {
        payload.reevaluation_exempt = true
        const dateStr = validUntil.toLocaleDateString('pt-BR')
        payload.reevaluation_exempt_reason = `Dispensado — certificado ISO 9001 válido até ${dateStr}`
        if (
          payload.qualification_status === 'Em avaliação' ||
          payload.qualification_status === 'Em requalificação'
        ) {
          payload.qualification_status = 'Qualificado'
        }
      }
    } else if (data.iso9001_certified === false) {
      payload.reevaluation_exempt = false
      payload.reevaluation_exempt_reason = ''
    }
  }

  const updated = await pb.collection('suppliers').update<Supplier>(id, payload)
  recalculateSuppliesKPIs({ companyId: updated.company_id })
  return updated
}

export async function deleteSupplier(id: string): Promise<void> {
  const existing = await pb.collection('suppliers').getOne<Supplier>(id)
  await pb.collection('suppliers').delete(id)
  recalculateSuppliesKPIs({ companyId: existing.company_id })
}

// ================= SUPPLIER EVALUATIONS (FSGQ 8.4-2 and 8.4-2.1) =================

export async function getSupplierEvaluations(
  supplierId?: string,
  companyId?: string,
): Promise<SupplierEvaluation[]> {
  try {
    const filters: string[] = []
    if (supplierId) filters.push(`supplier_id = "${supplierId}"`)
    if (companyId && companyId !== 'all') filters.push(`company_id = "${companyId}"`)

    const filter = filters.length > 0 ? filters.join(' && ') : undefined
    return await pb.collection('supplier_evaluations').getFullList<SupplierEvaluation>({
      filter,
      sort: '-evaluation_date',
      expand: 'supplier_id',
    })
  } catch (e) {
    console.error('getSupplierEvaluations error:', e)
    return []
  }
}

export async function saveSupplierEvaluation(
  evaluation: Partial<SupplierEvaluation>,
  questions: SupplierEvaluationQuestion[],
): Promise<SupplierEvaluation> {
  const sumScore = questions.reduce((acc, q) => acc + (q.score || 0), 0)
  const isApproved = sumScore >= 6.0
  const resultStr = isApproved ? 'Aprovado (≥ 6,0)' : 'Reprovado (< 6,0)'

  const twoYears = new Date(evaluation.evaluation_date || new Date().toISOString())
  twoYears.setFullYear(twoYears.getFullYear() + 2)

  const payload: any = {
    ...evaluation,
    answers_json: JSON.stringify(questions),
    total_score: sumScore,
    result: resultStr,
    next_reevaluation_date: twoYears.toISOString(),
  }

  const saved = await pb.collection('supplier_evaluations').create<SupplierEvaluation>(payload)

  // Update supplier record qualification status based on result
  if (evaluation.supplier_id) {
    const nextStatus: SupplierStatus = isApproved ? 'Qualificado' : 'Desqualificado'
    const critUpdate: QualificationCriterion = 'Questionário FSGQ 8.4-2 (Nota ≥ 6,0)'

    try {
      const sup = await pb.collection('suppliers').getOne<Supplier>(evaluation.supplier_id)
      const currentCriteria = sup.qualification_criteria || []
      const newCriteria = currentCriteria.includes(critUpdate)
        ? currentCriteria
        : [...currentCriteria, critUpdate]

      await pb.collection('suppliers').update(evaluation.supplier_id, {
        qualification_status: nextStatus,
        evaluation_score: sumScore,
        last_evaluation_date: evaluation.evaluation_date || new Date().toISOString(),
        next_reevaluation_date: twoYears.toISOString(),
        qualification_criteria: newCriteria,
        disqualification_reason: isApproved
          ? ''
          : `Reprovado no questionário ${evaluation.evaluation_type} com nota ${sumScore.toFixed(1)} (< 6,0)`,
      })
    } catch (err) {
      console.warn('Error updating supplier from evaluation:', err)
    }
  }

  recalculateSuppliesKPIs({ companyId: evaluation.company_id })
  return saved
}

// ================= PURCHASE QUOTES (FSGQ 8.4-7 Resumo Coleta de Preço) =================

export async function getPurchaseQuotes(companyId?: string): Promise<PurchaseQuote[]> {
  try {
    const filters: string[] = []
    if (companyId && companyId !== 'all') {
      filters.push(`company_id = "${companyId}"`)
    }
    const filter = filters.length > 0 ? filters.join(' && ') : undefined
    return await pb.collection('purchase_quotes').getFullList<PurchaseQuote>({
      filter,
      sort: '-created',
      expand: 'company_id,os_id,selected_supplier_id',
    })
  } catch (e) {
    console.error('getPurchaseQuotes error:', e)
    return []
  }
}

export async function createPurchaseQuote(
  data: Partial<PurchaseQuote>,
  proposals: PurchaseQuoteProposal[],
): Promise<PurchaseQuote> {
  const quoteCount = proposals.length
  const hasMinThree = quoteCount >= 3
  const selectedProposal = proposals.find((p) => p.isSelected)

  const payload: any = {
    ...data,
    quote_count: quoteCount,
    has_min_three_quotes: hasMinThree,
    proposals_json: JSON.stringify(proposals),
    total_amount: selectedProposal?.price || data.total_amount || 0,
    selected_supplier_name: selectedProposal?.supplier || data.selected_supplier_name || '',
    selected_supplier_id: selectedProposal?.supplierId || data.selected_supplier_id,
    selected_supplier_is_critical:
      selectedProposal?.isCritical ?? data.selected_supplier_is_critical,
    selected_supplier_is_qualified:
      selectedProposal?.isQualified ?? data.selected_supplier_is_qualified,
  }

  const created = await pb.collection('purchase_quotes').create<PurchaseQuote>(payload)
  recalculateSuppliesKPIs({ companyId: created.company_id })
  return created
}

export async function updatePurchaseQuote(
  id: string,
  data: Partial<PurchaseQuote>,
  proposals?: PurchaseQuoteProposal[],
): Promise<PurchaseQuote> {
  const payload: any = { ...data }
  if (proposals) {
    payload.quote_count = proposals.length
    payload.has_min_three_quotes = proposals.length >= 3
    payload.proposals_json = JSON.stringify(proposals)
    const selected = proposals.find((p) => p.isSelected)
    if (selected) {
      payload.total_amount = selected.price
      payload.selected_supplier_name = selected.supplier
      payload.selected_supplier_id = selected.supplierId || payload.selected_supplier_id
      payload.selected_supplier_is_critical = selected.isCritical
      payload.selected_supplier_is_qualified = selected.isQualified
    }
  }

  // Delivery status calculation
  if (payload.delivery_actual_date && payload.delivery_expected_date) {
    const act = new Date(payload.delivery_actual_date)
    const exp = new Date(payload.delivery_expected_date)
    payload.delivery_status = act > exp ? 'Atrasado' : 'No Prazo'
  }

  const updated = await pb.collection('purchase_quotes').update<PurchaseQuote>(id, payload)
  recalculateSuppliesKPIs({ companyId: updated.company_id })
  return updated
}

export async function deletePurchaseQuote(id: string): Promise<void> {
  const quote = await pb.collection('purchase_quotes').getOne<PurchaseQuote>(id)
  await pb.collection('purchase_quotes').delete(id)
  recalculateSuppliesKPIs({ companyId: quote.company_id })
}

// ================= INCF & KPI RECALCULATION (Princípio de Ouro) =================

/**
 * Consumes INCF per supplier and calculates the 4 golden KPIs:
 * 1. INCF geral & por fornecedor (consumido do RNC)
 * 2. % fornecedores críticos qualificados
 * 3. % cotações com mínimo de 3 fornecedores
 * 4. Atrasos de entrega (pedidos atrasados ÷ total entregues)
 */
export async function computeSuppliesKPIs(companyId?: string): Promise<SuppliesKPIsSummary> {
  const effectiveCompanyFilter =
    companyId && companyId !== 'all' ? `company_id = "${companyId}"` : undefined

  try {
    const [allSuppliers, allQuotes, allRNCs, allPurchases, indicatorsList] = await Promise.all([
      pb.collection('suppliers').getFullList<Supplier>({ filter: effectiveCompanyFilter }),
      pb
        .collection('purchase_quotes')
        .getFullList<PurchaseQuote>({ filter: effectiveCompanyFilter }),
      pb
        .collection('non_conformities')
        .getFullList<NonConformity>({ filter: effectiveCompanyFilter }),
      pb
        .collection('purchase_requests')
        .getFullList({ filter: effectiveCompanyFilter })
        .catch(() => []),
      pb
        .collection('indicators')
        .getFullList<{ id: string; title: string; current_value?: number }>({
          filter: effectiveCompanyFilter,
        }),
    ])

    // 1. INCF Geral consumido do indicador INCF já existente
    const incfIndicator = indicatorsList.find((i) => i.title.includes('INCF'))
    const totalPurchases = allPurchases.length || allQuotes.length || 1
    const supplierNCs = allRNCs.filter((r) => r.origin === 'Fornecedor')

    const generalINCF =
      incfIndicator?.current_value !== undefined
        ? incfIndicator.current_value
        : Math.round((supplierNCs.length / Math.max(1, totalPurchases)) * 100 * 10) / 10

    // INCF por fornecedor individual
    const supplierINCFMap: Record<
      string,
      { ncCount: number; supplierName: string; supplierId?: string }
    > = {}

    allSuppliers.forEach((s) => {
      supplierINCFMap[s.name.toLowerCase()] = {
        ncCount: 0,
        supplierName: s.name,
        supplierId: s.id,
      }
      if (s.trade_name) {
        supplierINCFMap[s.trade_name.toLowerCase()] = {
          ncCount: 0,
          supplierName: s.name,
          supplierId: s.id,
        }
      }
    })

    supplierNCs.forEach((rnc) => {
      const sup = (rnc.supplier_name || '').trim().toLowerCase()
      if (sup) {
        // match exact or partial
        let foundKey = Object.keys(supplierINCFMap).find((k) => k.includes(sup) || sup.includes(k))
        if (!foundKey) {
          supplierINCFMap[sup] = { ncCount: 0, supplierName: rnc.supplier_name || sup }
          foundKey = sup
        }
        supplierINCFMap[foundKey].ncCount += 1
      }
    })

    const suppliersExceedingINCF: SupplierINCFSummary[] = []
    Object.values(supplierINCFMap).forEach((val) => {
      // Pedidos deste fornecedor
      const relatedPurchases = allQuotes.filter((q) =>
        (q.selected_supplier_name || '').toLowerCase().includes(val.supplierName.toLowerCase()),
      ).length
      const baseOrders = Math.max(1, relatedPurchases || (val.ncCount > 0 ? val.ncCount : 1))
      const rate = Math.round((val.ncCount / baseOrders) * 100)

      if (val.ncCount > 0) {
        const item: SupplierINCFSummary = {
          supplierName: val.supplierName,
          supplierId: val.supplierId,
          nonConformityCount: val.ncCount,
          purchasesCount: relatedPurchases,
          incfRate: rate,
          limitExceeded: rate >= 30 || val.ncCount >= 2, // Limite < 30% ou desvios reincidentes
        }
        suppliersExceedingINCF.push(item)
      }
    })

    // 2. % de fornecedores críticos qualificados
    const criticalSuppliers = allSuppliers.filter((s) => s.classification === 'Crítico')
    const criticalQualified = criticalSuppliers.filter(
      (s) => s.qualification_status === 'Qualificado',
    )
    const pctCriticalQualified =
      criticalSuppliers.length > 0
        ? Math.round((criticalQualified.length / criticalSuppliers.length) * 100)
        : 100

    // 3. % de cotações com mínimo de 3 fornecedores
    const quotesWithMinThree = allQuotes.filter(
      (q) => q.has_min_three_quotes || q.quote_count >= 3,
    ).length
    const pctQuotesWithMinThree =
      allQuotes.length > 0 ? Math.round((quotesWithMinThree / allQuotes.length) * 100) : 100

    // 4. Atrasos de entrega
    const deliveredQuotes = allQuotes.filter(
      (q) => q.status === 'Entregue' || q.delivery_actual_date || q.delivery_status,
    )
    const delayedQuotes = deliveredQuotes.filter(
      (q) =>
        q.delivery_status === 'Atrasado' ||
        (q.delivery_actual_date &&
          q.delivery_expected_date &&
          new Date(q.delivery_actual_date) > new Date(q.delivery_expected_date)),
    ).length
    const pctDelayedOrders =
      deliveredQuotes.length > 0 ? Math.round((delayedQuotes / deliveredQuotes.length) * 100) : 0

    return {
      incfGeneral: generalINCF,
      criticalSuppliersTotal: criticalSuppliers.length,
      criticalSuppliersQualified: criticalQualified.length,
      pctCriticalQualified,
      totalQuotes: allQuotes.length,
      quotesWithMinThree,
      pctQuotesWithMinThree,
      totalDeliveredOrders: deliveredQuotes.length,
      delayedOrders: delayedQuotes,
      pctDelayedOrders,
      suppliersExceedingINCF,
    }
  } catch (err) {
    console.error('computeSuppliesKPIs error:', err)
    return {
      incfGeneral: 0,
      criticalSuppliersTotal: 0,
      criticalSuppliersQualified: 0,
      pctCriticalQualified: 100,
      totalQuotes: 0,
      quotesWithMinThree: 0,
      pctQuotesWithMinThree: 100,
      totalDeliveredOrders: 0,
      delayedOrders: 0,
      pctDelayedOrders: 0,
      suppliersExceedingINCF: [],
    }
  }
}

/**
 * Tolerant recalculation that updates indicators collection for the company.
 * Failure NEVER crashes the caller.
 */
export async function recalculateSuppliesKPIs(params: { companyId?: string }): Promise<void> {
  try {
    const { companyId } = params
    const summary = await computeSuppliesKPIs(companyId)

    const companyFilter =
      companyId && companyId !== 'all' ? `company_id = "${companyId}"` : undefined

    const indicators = await pb
      .collection('indicators')
      .getFullList<{ id: string; title: string }>({
        filter: companyFilter,
      })

    for (const ind of indicators) {
      if (ind.title.includes('Fornecedores Críticos Qualificados')) {
        await pb
          .collection('indicators')
          .update(ind.id, { current_value: summary.pctCriticalQualified })
      } else if (ind.title.includes('Mínimo 3 Fornecedores') || ind.title.includes('Cotações')) {
        await pb
          .collection('indicators')
          .update(ind.id, { current_value: summary.pctQuotesWithMinThree })
      } else if (ind.title.includes('Atrasos na Entrega')) {
        await pb
          .collection('indicators')
          .update(ind.id, { current_value: summary.pctDelayedOrders })
      }
    }
  } catch (e) {
    console.warn('[recalculateSuppliesKPIs] Tolerant error ignored:', e)
  }
}
