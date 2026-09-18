import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { getNonConformities, NonConformity } from '@/services/rnc'
import {
  getAuditPrograms,
  getAuditFindings,
  AuditProgramItem,
  AuditFinding,
} from '@/services/audits'
import { getRiskRegister, RiskRegisterItem } from '@/services/risks'
import { getQualityObjectives, QualityObjectiveComputed } from '@/services/quality-objectives'
import { getTrainingPlanActions, TrainingPlanActionComputed } from '@/services/trainings'

export type ReviewStatus = 'Em preparação' | 'Realizada' | 'Cancelada'

export interface ReviewActionItem {
  id: string
  description: string
  responsible: string
  deadline: string
  status: 'Aberta' | 'Em andamento' | 'Concluída' | 'Cancelada'
}

export interface ReviewParticipant {
  id?: string
  name: string
  role: string
  present: boolean
}

export interface ConsolidatedSGQSnapshot {
  year: number
  generatedAt: string
  companyId?: string
  companyName?: string

  // (a) RNCs & Cost of Quality
  rncs: {
    total: number
    openCount: number
    closedCount: number
    canceledCount: number
    bySeverity: Record<string, number>
    totalCostRaw: number
    totalCostSupplies: number
    totalCostServices: number
    totalCostOverall: number
    totalActionCost: number
  }

  // (b) Auditorias Internas
  audits: {
    totalPlanned: number
    realizedCount: number
    openDelayedCount: number
    executionPercent: number
    findingsTotal: number
    findingsByType: Record<string, number>
    findingsOpenNC: number
  }

  // (c) Riscos e Oportunidades
  risks: {
    totalRisks: number
    totalOpportunities: number
    criticalOpen: number
    highOpen: number
    treatmentsImplemented: number
    treatmentsPlannedOrProgress: number
  }

  // (d) Treinamentos e Competências
  trainings: {
    totalPlanned: number
    realizedCount: number
    delayedCount: number
    executionPercent: number
    totalHours: number
    totalParticipants: number
  }

  // (e) Objetivos da Qualidade
  objectives: {
    total: number
    achieved: number
    inProgress: number
    notAchieved: number
    overdueNotAchieved: number
    achievementPercent: number
  }

  // (f) Indicadores Chave
  indicators: {
    irpi?: number | null
    incf?: number | null
  }
}

export interface ManagementReview {
  id: string
  year: number
  company_id: string
  meeting_date: string
  status: ReviewStatus
  participants?: ReviewParticipant[] | string | null

  // Entradas do §9.3
  input_previous_actions?: string | null
  input_context_changes?: string | null
  input_customer_satisfaction?: string | null
  input_quality_objectives?: string | null
  input_process_performance?: string | null
  input_nonconformities_corrective?: string | null
  input_monitoring_measurement?: string | null
  input_audit_results?: string | null
  input_supplier_performance?: string | null
  input_resources_adequacy?: string | null
  input_risks_opportunities?: string | null
  input_improvement_opportunities?: string | null

  // Snapshot consolidado
  consolidated_data_snapshot?: ConsolidatedSGQSnapshot | string | null

  // Saídas do §9.3
  output_improvement_decisions?: string | null
  output_qms_changes?: string | null
  output_resource_needs?: string | null

  // Ata e anexo
  minutes?: string | null
  attachment?: string | null

  // Ações decorrentes
  actions?: ReviewActionItem[] | string | null

  created: string
  updated: string

  expand?: {
    company_id?: { id: string; name: string }
  }
}

export interface ManagementReviewComputed extends ManagementReview {
  participantsList: ReviewParticipant[]
  actionsList: ReviewActionItem[]
  snapshotData?: ConsolidatedSGQSnapshot | null
}

export function parseReviewParticipants(data: unknown): ReviewParticipant[] {
  if (!data) return []
  if (Array.isArray(data)) return data as ReviewParticipant[]
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function parseReviewActions(data: unknown): ReviewActionItem[] {
  if (!data) return []
  if (Array.isArray(data)) return data as ReviewActionItem[]
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function parseReviewSnapshot(data: unknown): ConsolidatedSGQSnapshot | null {
  if (!data) return null
  if (typeof data === 'object' && 'rncs' in (data as any)) {
    return data as ConsolidatedSGQSnapshot
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as ConsolidatedSGQSnapshot
    } catch {
      return null
    }
  }
  return null
}

export function withReviewComputed(item: ManagementReview): ManagementReviewComputed {
  return {
    ...item,
    participantsList: parseReviewParticipants(item.participants),
    actionsList: parseReviewActions(item.actions),
    snapshotData: parseReviewSnapshot(item.consolidated_data_snapshot),
  }
}

/**
 * Consolidates real database data for the given year and company into an executive summary
 * ready for pre-filling ISO 9001 §9.3 inputs.
 */
export async function consolidateSGQData(params: { year: number; companyId?: string }): Promise<{
  snapshot: ConsolidatedSGQSnapshot
  suggestedInputs: {
    input_previous_actions?: string
    input_context_changes?: string
    input_customer_satisfaction?: string
    input_quality_objectives: string
    input_process_performance: string
    input_nonconformities_corrective: string
    input_monitoring_measurement: string
    input_audit_results: string
    input_supplier_performance: string
    input_resources_adequacy?: string
    input_risks_opportunities: string
    input_improvement_opportunities?: string
  }
}> {
  const { year, companyId } = params

  // 1. Non-conformities & Cost of Quality
  const allNcs = await getNonConformities({
    companyId: companyId !== 'all' ? companyId : undefined,
  })

  // Filter year by date or created
  const yearNcs = allNcs.filter((n) => {
    const d = n.date || n.created || ''
    return d.startsWith(String(year))
  })

  const rncOpen = yearNcs.filter((n) => n.status === 'Aberta' || n.status === 'Em Andamento').length
  const rncClosed = yearNcs.filter((n) => n.status === 'Fechada').length
  const rncCanceled = yearNcs.filter((n) => n.status === 'Cancelada').length

  const bySeverity: Record<string, number> = { Leve: 0, Médio: 0, Grave: 0, Gravíssimo: 0 }
  let totalCostRaw = 0
  let totalCostSupplies = 0
  let totalCostServices = 0
  let totalCostOverall = 0
  let totalActionCost = 0

  for (const n of yearNcs) {
    if (n.severity && bySeverity[n.severity] !== undefined) {
      bySeverity[n.severity]++
    }
    const raw = Number(n.cost_raw_material) || 0
    const sup = Number(n.cost_supplies) || 0
    const srv = Number(n.cost_services) || 0
    const tot = Number(n.cost_total) || raw + sup + srv
    const act = Number(n.action_cost) || 0

    totalCostRaw += raw
    totalCostSupplies += sup
    totalCostServices += srv
    totalCostOverall += tot
    totalActionCost += act
  }

  // 2. Audits of the year
  const audits = await getAuditPrograms({
    year,
    companyId: companyId !== 'all' ? companyId : undefined,
  })
  const auditRealized = audits.filter((a) => a.status === 'Realizada').length
  const today = new Date().setHours(0, 0, 0, 0)
  const auditDelayed = audits.filter((a) => {
    if (a.status === 'Realizada' || a.status === 'Cancelada') return false
    if (!a.planned_date) return false
    return new Date(a.planned_date).getTime() < today
  }).length
  const auditExecPercent = audits.length > 0 ? Math.round((auditRealized / audits.length) * 100) : 0

  // Audit findings
  let totalFindings = 0
  const findingsByType: Record<string, number> = {
    'Não Conformidade': 0,
    Observação: 0,
    'Oportunidade de Melhoria': 0,
    'Ponto Forte': 0,
  }
  let openNCFindings = 0

  await Promise.all(
    audits.map(async (a) => {
      try {
        const fList = await getAuditFindings(a.id)
        totalFindings += fList.length
        for (const f of fList) {
          if (findingsByType[f.type] !== undefined) findingsByType[f.type]++
          if (f.type === 'Não Conformidade' && f.status !== 'Fechado') {
            openNCFindings++
          }
        }
      } catch {
        /* ignore */
      }
    }),
  )

  // 3. Risks & Opportunities
  const risks = await getRiskRegister({
    companyId: companyId !== 'all' ? companyId : undefined,
  })
  const totalRisks = risks.filter((r) => r.type === 'Risco').length
  const totalOpportunities = risks.filter((r) => r.type === 'Oportunidade').length
  const criticalOpen = risks.filter(
    (r) => r.type === 'Risco' && r.risk_grade === 'Crítico' && r.status === 'Ativo',
  ).length
  const highOpen = risks.filter(
    (r) => r.type === 'Risco' && r.risk_grade === 'Alto' && r.status === 'Ativo',
  ).length
  const treatmentsImplemented = risks.filter((r) => r.treatment_status === 'Implementado').length
  const treatmentsPlannedOrProgress = risks.filter(
    (r) => r.treatment_status === 'Planejado' || r.treatment_status === 'Em andamento',
  ).length

  // 4. Trainings
  const trainings = await getTrainingPlanActions({
    year,
    companyId: companyId !== 'all' ? companyId : undefined,
  })
  const trainingsRealized = trainings.filter((t) => !!t.realized_date).length
  const trainingsDelayed = trainings.filter((t) => t.status_days === 'Atrasado').length
  const trainingsExecPercent =
    trainings.length > 0 ? Math.round((trainingsRealized / trainings.length) * 100) : 0
  const totalTrainingHours = trainings.reduce((acc, t) => acc + (Number(t.ch_total) || 0), 0)
  const totalTrainingParticipants = trainings.reduce(
    (acc, t) => acc + (Number(t.participants_count) || 0),
    0,
  )

  // 5. Quality Objectives
  const objectives = await getQualityObjectives({
    year,
    companyId: companyId !== 'all' ? companyId : undefined,
  })
  const objAchieved = objectives.filter((o) => o.status === 'Atingido').length
  const objInProgress = objectives.filter((o) => o.status === 'Em andamento').length
  const objNotAchieved = objectives.filter((o) => o.status === 'Não atingido').length
  const objOverdueNotAchieved = objectives.filter((o) => o.isOverdue).length
  const objPercent = objectives.length > 0 ? Math.round((objAchieved / objectives.length) * 100) : 0

  // 6. Indicators (IRPI / INCF)
  let irpiVal: number | null = null
  let incfVal: number | null = null
  try {
    const indFilter = companyId && companyId !== 'all' ? `company_id = "${companyId}"` : undefined
    const indList = await pb
      .collection('indicators')
      .getFullList<{ title: string; current_value?: number }>({
        filter: indFilter,
      })
    for (const ind of indList) {
      if (ind.title.includes('IRPI') && ind.current_value !== undefined) irpiVal = ind.current_value
      if (ind.title.includes('INCF') && ind.current_value !== undefined) incfVal = ind.current_value
    }
  } catch {
    /* ignore */
  }

  const snapshot: ConsolidatedSGQSnapshot = {
    year,
    generatedAt: new Date().toISOString(),
    companyId,
    rncs: {
      total: yearNcs.length,
      openCount: rncOpen,
      closedCount: rncClosed,
      canceledCount: rncCanceled,
      bySeverity,
      totalCostRaw,
      totalCostSupplies,
      totalCostServices,
      totalCostOverall,
      totalActionCost,
    },
    audits: {
      totalPlanned: audits.length,
      realizedCount: auditRealized,
      openDelayedCount: auditDelayed,
      executionPercent: auditExecPercent,
      findingsTotal: totalFindings,
      findingsByType,
      findingsOpenNC: openNCFindings,
    },
    risks: {
      totalRisks,
      totalOpportunities,
      criticalOpen,
      highOpen,
      treatmentsImplemented,
      treatmentsPlannedOrProgress,
    },
    trainings: {
      totalPlanned: trainings.length,
      realizedCount: trainingsRealized,
      delayedCount: trainingsDelayed,
      executionPercent: trainingsExecPercent,
      totalHours: Math.round(totalTrainingHours * 10) / 10,
      totalParticipants: totalTrainingParticipants,
    },
    objectives: {
      total: objectives.length,
      achieved: objAchieved,
      inProgress: objInProgress,
      notAchieved: objNotAchieved,
      overdueNotAchieved: objOverdueNotAchieved,
      achievementPercent: objPercent,
    },
    indicators: {
      irpi: irpiVal,
      incf: incfVal,
    },
  }

  // Pre-generate rich executive texts in Portuguese for each §9.3 input
  const fmtCurr = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const suggestedInputs = {
    input_previous_actions:
      'As ações deliberadas na revisão pela direção anterior foram acompanhadas periodicamente pelo SGQ. Recomenda-se ratificar o encerramento das ações cumpridas e replanejar eventuais pendências.',
    input_context_changes:
      'Avaliação dos fatores internos e externos (§4.1): requisitos de clientes em soldagem/caldeiraria ASME e ISO 9001 foram mantidos estáveis. Partes interessadas (§4.2) atendidas com monitoramento de conformidade legal e fornecimento.',
    input_customer_satisfaction: `Satisfação dos clientes monitorada continuamente. Indicador IRPI (Reclamações de Produto/Inspeção): ${irpiVal !== null ? irpiVal : 'N/A'}. Ações corretivas aplicadas pontualmente às eventuais contestações registradas via RNC.`,
    input_quality_objectives: `No ano de ${year}, foram monitorados ${objectives.length} objetivos da qualidade vinculados aos 21 processos do SGQ. Atingidos: ${objAchieved} (${objPercent}% de eficácia global). Em andamento: ${objInProgress}. Não atingidos: ${objNotAchieved}. Vencidos sem atingimento: ${objOverdueNotAchieved}.`,
    input_process_performance: `Desempenho dos processos e conformidade de produtos: Plano anual de treinamentos registrou ${trainingsRealized}/${trainings.length} ações concluídas (${trainingsExecPercent}%), somando ${Math.round(totalTrainingHours)} horas de capacitação e ${totalTrainingParticipants} participações. Processos operacionais mantiveram estabilidade com acompanhamento via checklists e ensaios.`,
    input_nonconformities_corrective: `Registradas ${yearNcs.length} Não Conformidades no ano (${rncClosed} fechadas com análise de causa raiz 5 Porquês/Ishikawa e ${rncOpen} em tratamento). Por grau: ${bySeverity.Leve} Leves, ${bySeverity.Médio} Médias, ${bySeverity.Grave} Graves e ${bySeverity.Gravíssimo} Gravíssimas. Custo Total da Não Qualidade consolidado: ${fmtCurr(totalCostOverall)} (Matéria-prima: ${fmtCurr(totalCostRaw)}, Insumos: ${fmtCurr(totalCostSupplies)}, Serviços: ${fmtCurr(totalCostServices)}). Custo investido em ações corretivas: ${fmtCurr(totalActionCost)}.`,
    input_monitoring_measurement: `Equipamentos de medição calibrados conforme cronograma. Indicador de recebimento de fornecedores INCF: ${incfVal !== null ? `${incfVal}%` : 'Conforme'}. Inspeções de CQ liberadas com rastreabilidade formal.`,
    input_audit_results: `Programa anual de auditorias (§9.2): ${auditRealized} de ${audits.length} auditorias realizadas (${auditExecPercent}% de aderência ao plano). Total de achados identificados: ${totalFindings} (${findingsByType['Não Conformidade']} Não Conformidades, ${findingsByType['Observação']} Observações, ${findingsByType['Oportunidade de Melhoria']} Oportunidades de Melhoria e ${findingsByType['Ponto Forte']} Pontos Fortes). Achados de Não Conformidade em aberto: ${openNCFindings}.`,
    input_supplier_performance: `Desempenho dos fornecedores externos (§8.4): Qualificação sistemática através dos critérios da norma e FSGQ 8.4-2. Desempenho monitorado pelo indicador INCF${incfVal !== null ? ` (atual: ${incfVal}%)` : ''} e cotações com mínimo de três propostas nas categorias críticas.`,
    input_resources_adequacy:
      'Os recursos humanos, infraestrutura física, máquinas e softwares do SGQ foram considerados adequados para manter a conformidade dos produtos e a eficácia operacional.',
    input_risks_opportunities: `Mapeamento de Riscos e Oportunidades (§6.1): Total de ${totalRisks} riscos e ${totalOpportunities} oportunidades registrados. Riscos críticos ativos em aberto: ${criticalOpen}. Riscos de nível alto ativos: ${highOpen}. Planos de tratamento implementados com sucesso: ${treatmentsImplemented}; em planejamento/andamento: ${treatmentsPlannedOrProgress}.`,
    input_improvement_opportunities:
      'Identificadas oportunidades na digitalização de ordens de serviço, otimização de lead time de compras críticas e ampliação da capacitação em leitura de procedimentos operacionais.',
  }

  return { snapshot, suggestedInputs }
}

export async function getManagementReviews(params: {
  companyId?: string
  year?: number
  status?: string
}): Promise<ManagementReviewComputed[]> {
  const filters: string[] = []
  if (params.companyId && params.companyId !== 'all') {
    filters.push(`company_id = "${params.companyId}"`)
  }
  if (params.year) {
    filters.push(`year = ${params.year}`)
  }
  if (params.status && params.status !== 'all') {
    filters.push(`status = "${params.status}"`)
  }

  try {
    const list = await pb.collection('management_review').getFullList<ManagementReview>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-meeting_date',
      expand: 'company_id',
    })
    return safeArray<ManagementReview>(list).map(withReviewComputed)
  } catch (err) {
    console.error('getManagementReviews error:', err)
    return []
  }
}

export async function getManagementReviewById(id: string): Promise<ManagementReviewComputed> {
  const item = await pb.collection('management_review').getOne<ManagementReview>(id, {
    expand: 'company_id',
  })
  return withReviewComputed(item)
}

export async function createManagementReview(
  data: Partial<ManagementReview>,
  attachmentFile?: File,
): Promise<ManagementReviewComputed> {
  const payload: any = { ...data }
  if (data.participants && typeof data.participants !== 'string') {
    payload.participants = JSON.stringify(data.participants)
  }
  if (data.actions && typeof data.actions !== 'string') {
    payload.actions = JSON.stringify(data.actions)
  }
  if (data.consolidated_data_snapshot && typeof data.consolidated_data_snapshot !== 'string') {
    payload.consolidated_data_snapshot = JSON.stringify(data.consolidated_data_snapshot)
  }

  let created: ManagementReview
  if (attachmentFile) {
    const formData = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v))
    })
    formData.append('attachment', attachmentFile)
    created = await pb.collection('management_review').create<ManagementReview>(formData, {
      expand: 'company_id',
    })
  } else {
    created = await pb.collection('management_review').create<ManagementReview>(payload, {
      expand: 'company_id',
    })
  }

  return withReviewComputed(created)
}

export async function updateManagementReview(
  id: string,
  data: Partial<ManagementReview>,
  attachmentFile?: File,
): Promise<ManagementReviewComputed> {
  const payload: any = { ...data }
  if (data.participants && typeof data.participants !== 'string') {
    payload.participants = JSON.stringify(data.participants)
  }
  if (data.actions && typeof data.actions !== 'string') {
    payload.actions = JSON.stringify(data.actions)
  }
  if (data.consolidated_data_snapshot && typeof data.consolidated_data_snapshot !== 'string') {
    payload.consolidated_data_snapshot = JSON.stringify(data.consolidated_data_snapshot)
  }

  let updated: ManagementReview
  if (attachmentFile) {
    const formData = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v))
    })
    formData.append('attachment', attachmentFile)
    updated = await pb.collection('management_review').update<ManagementReview>(id, formData, {
      expand: 'company_id',
    })
  } else {
    updated = await pb.collection('management_review').update<ManagementReview>(id, payload, {
      expand: 'company_id',
    })
  }

  return withReviewComputed(updated)
}

export async function deleteManagementReview(id: string): Promise<boolean> {
  return pb.collection('management_review').delete(id)
}
