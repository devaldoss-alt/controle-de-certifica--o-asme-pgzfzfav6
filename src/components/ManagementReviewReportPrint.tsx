import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  Presentation,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  DollarSign,
  AlertOctagon,
  Target,
  GraduationCap,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { ManagementReviewComputed } from '@/services/management-review'
import { Company } from '@/services/companies'

interface ManagementReviewReportPrintProps {
  review: ManagementReviewComputed
  company?: Company
  onClose?: () => void
}

export const ManagementReviewReportPrint: React.FC<ManagementReviewReportPrintProps> = ({
  review,
  company,
  onClose,
}) => {
  const handlePrint = () => {
    window.print()
  }

  const snap = review.snapshotData

  const formatCurrency = (val?: number | null) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Action Header (hidden in print) */}
      <div className="flex items-center justify-between p-4 bg-muted/40 border rounded-lg print:hidden">
        <div>
          <h3 className="font-semibold text-sm">
            Ata e Relatório Oficial de Revisão pela Direção (ISO 9001 §9.3)
          </h3>
          <p className="text-xs text-muted-foreground">
            Documento consolidado pronto para impressão e arquivamento formal do SGQ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
              Voltar
            </Button>
          )}
          <Button onClick={handlePrint} className="gap-2 text-xs h-8">
            <Printer className="w-4 h-4" />
            Imprimir / Gerar PDF
          </Button>
        </div>
      </div>

      {/* Printable Document */}
      <div className="bg-white text-slate-900 border rounded-lg p-8 shadow-xs print:shadow-none print:border-none print:p-0 space-y-6">
        {/* Header with Title and Metadata */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center font-bold text-primary text-xl">
              RD
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                {company?.name ||
                  review.expand?.company_id?.name ||
                  'UQualiHub — Sistema de Gestão da Qualidade'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Ata de Reunião de Análise Crítica pela Direção — ISO 9001:2015 §9.3
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-800">
              Data da Reunião:{' '}
              {review.meeting_date
                ? new Date(review.meeting_date).toLocaleDateString('pt-BR')
                : '—'}
            </p>
            <p>Ano-Base: {review.year}</p>
            <p className="font-semibold text-slate-700">Status: {review.status}</p>
          </div>
        </div>

        {/* Participants */}
        <div className="p-4 bg-slate-50 border rounded-md text-xs space-y-2">
          <span className="font-bold text-slate-800 uppercase tracking-wide block">
            Participantes Presentes na Reunião
          </span>
          {review.participantsList.length === 0 ? (
            <p className="text-slate-500 italic">Participantes não registrados.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {review.participantsList.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={p.present ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {p.present ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <span className="text-[11px] text-slate-500">({p.role})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Snapshot Summary Cards (if available) */}
        {snap && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800">
              Resumo Executivo Consolidado do Exercício ({review.year})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border rounded text-center">
                <span className="text-slate-500 block">Total de RNCs</span>
                <span className="text-xl font-bold text-slate-800">{snap.rncs.total}</span>
                <span className="text-[10px] text-slate-500 block">
                  {snap.rncs.closedCount} fechadas | {snap.rncs.openCount} em aberto
                </span>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded text-center">
                <span className="text-emerald-800 block">Custo Não Qualidade</span>
                <span className="text-xl font-bold text-emerald-700">
                  {formatCurrency(snap.rncs.totalCostOverall)}
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  Invest. ações: {formatCurrency(snap.rncs.totalActionCost)}
                </span>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded text-center">
                <span className="text-blue-800 block">Auditorias Realizadas</span>
                <span className="text-xl font-bold text-blue-700">
                  {snap.audits.realizedCount} / {snap.audits.totalPlanned}
                </span>
                <span className="text-[10px] text-blue-600 block">
                  {snap.audits.executionPercent}% de eficácia do plano
                </span>
              </div>

              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded text-center">
                <span className="text-purple-800 block">Objetivos Atingidos</span>
                <span className="text-xl font-bold text-purple-700">
                  {snap.objectives.achieved} / {snap.objectives.total}
                </span>
                <span className="text-[10px] text-purple-600 block">
                  {snap.objectives.achievementPercent}% de atendimento
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: ISO 9001 §9.3 Entradas */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b pb-1">
            1. Entradas para a Revisão pela Direção (ISO 9001:2015 §9.3.2)
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                a) Situação das ações provenientes de revisões anteriores:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_previous_actions || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                b) Mudanças em questões externas e internas pertinentes ao SGQ (§4.1 / §4.2):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_context_changes || 'Sem alterações registradas.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.1) Satisfação dos clientes e feedback de partes interessadas:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_customer_satisfaction || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.2) Grau de atendimento dos objetivos da qualidade (§6.2):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_quality_objectives || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.3) Desempenho de processos e conformidade de produtos e serviços:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_process_performance || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.4) Não conformidades, ações corretivas e Custo da Não Qualidade:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_nonconformities_corrective || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.5) Resultados de monitoramento e medição:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_monitoring_measurement || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.6) Resultados de auditorias internas e externas (§9.2):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_audit_results || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                c.7) Desempenho de fornecedores e provedores externos (§8.4):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_supplier_performance || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                d) Adequação dos recursos (§7.1):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_resources_adequacy || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                e) Eficácia de ações tomadas contra riscos e oportunidades (§6.1):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_risks_opportunities || 'Sem apontamentos registrados.'}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border rounded">
              <span className="font-bold text-slate-800 block">
                f) Oportunidades de melhoria contínua (§10):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.input_improvement_opportunities || 'Sem apontamentos registrados.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: ISO 9001 §9.3 Saídas */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b pb-1">
            2. Saídas da Revisão pela Direção (ISO 9001:2015 §9.3.3)
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <span className="font-bold text-slate-800 block">
                1. Decisões e ações relacionadas a oportunidades de melhoria:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.output_improvement_decisions || 'Nenhuma decisão formal registrada.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <span className="font-bold text-slate-800 block">
                2. Necessidades de mudanças no Sistema de Gestão da Qualidade:
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.output_qms_changes || 'Nenhuma mudança no SGQ requerida.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <span className="font-bold text-slate-800 block">
                3. Necessidades de recursos (investimentos, maquinários, pessoas):
              </span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {review.output_resource_needs ||
                  'Sem necessidades de recursos adicionais registradas.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Ações Decorrentes */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b pb-1">
            3. Plano de Ações Deliberadas pela Alta Direção ({review.actionsList.length})
          </h4>
          {review.actionsList.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border">
              Nenhuma ação formal deliberada nesta reunião.
            </p>
          ) : (
            <table className="w-full text-xs text-left border">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="p-2 border-r">#</th>
                  <th className="p-2 border-r">Descrição da Ação</th>
                  <th className="p-2 border-r">Responsável</th>
                  <th className="p-2 border-r">Prazo</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {review.actionsList.map((a, idx) => (
                  <tr key={a.id || idx}>
                    <td className="p-2 border-r text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border-r font-medium text-slate-800">{a.description}</td>
                    <td className="p-2 border-r text-slate-700">{a.responsible || '—'}</td>
                    <td className="p-2 border-r whitespace-nowrap text-slate-700">
                      {a.deadline ? new Date(a.deadline).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 4: Ata Estruturada */}
        {review.minutes && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b pb-1">
              4. Ata Circunstanciada da Reunião
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded border whitespace-pre-line">
              {review.minutes}
            </p>
          </div>
        )}

        {/* Formal Signatures Section */}
        <div className="pt-12 mt-8 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-800">Diretoria Executiva</p>
            <p className="text-slate-500">Alta Direção</p>
          </div>
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-800">Gestor da Qualidade</p>
            <p className="text-slate-500">Representante do SGQ</p>
          </div>
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-800">Coordenação / Supervisão</p>
            <p className="text-slate-500">Operações & CQ</p>
          </div>
        </div>
      </div>
    </div>
  )
}
