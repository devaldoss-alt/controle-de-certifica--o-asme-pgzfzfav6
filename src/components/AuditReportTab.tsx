import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  FileCheck,
  AlertOctagon,
  Eye,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  User,
} from 'lucide-react'
import { AuditProgramItem, AuditChecklistSection, AuditFinding } from '@/services/audits'
import { Company } from '@/services/companies'

interface AuditReportTabProps {
  audit: AuditProgramItem
  checklistSections: AuditChecklistSection[]
  findings: AuditFinding[]
  company?: Company
}

export const AuditReportTab: React.FC<AuditReportTabProps> = ({
  audit,
  checklistSections,
  findings,
  company,
}) => {
  const ncs = findings.filter((f) => f.type === 'Não Conformidade')
  const observations = findings.filter((f) => f.type === 'Observação')
  const opportunities = findings.filter((f) => f.type === 'Oportunidade de Melhoria')
  const strengths = findings.filter((f) => f.type === 'Ponto Forte')

  // Checklist counts
  const totalItems = checklistSections.reduce((acc, s) => acc + s.items.length, 0)
  const cCount = checklistSections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.compliance === 'C').length,
    0,
  )
  const ncCount = checklistSections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.compliance === 'NC').length,
    0,
  )
  const naCount = checklistSections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.compliance === 'N.A.').length,
    0,
  )

  const complianceRate =
    totalItems - naCount > 0 ? Math.round((cCount / (totalItems - naCount)) * 100) : 100

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Action Header (hidden in print) */}
      <div className="flex items-center justify-between p-4 bg-muted/40 border rounded-lg print:hidden">
        <div>
          <h3 className="font-semibold text-sm">
            Relatório Oficial de Auditoria Interna (ISO 9001 §9.2)
          </h3>
          <p className="text-xs text-muted-foreground">
            Documento consolidado pronto para impressão e arquivo técnico do SGQ.
          </p>
        </div>
        <Button onClick={handlePrint} className="gap-2 text-xs">
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white text-slate-900 border rounded-lg p-8 shadow-xs print:shadow-none print:border-none print:p-0 space-y-6">
        {/* Header with Company Logo / Title */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center font-bold text-primary text-xl">
              Q
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                {company?.name || 'UQualiHub — Sistema de Gestão da Qualidade'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Relatório de Auditoria Interna da Qualidade — ISO 9001:2015 §9.2
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-800">
              Data de Emissão: {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p>Ano-Base: {audit.year}</p>
          </div>
        </div>

        {/* Audit Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-md text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Processo / Escopo:</span>
            <span className="font-bold text-slate-800 text-sm">{audit.audit_scope}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Tipo de Auditoria:</span>
            <span className="font-semibold text-slate-800">{audit.audit_type}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Data Prevista:</span>
            <span className="text-slate-800">
              {audit.planned_date ? new Date(audit.planned_date).toLocaleDateString('pt-BR') : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Data Realizada:</span>
            <span className="text-slate-800 font-medium">
              {audit.realized_date
                ? new Date(audit.realized_date).toLocaleDateString('pt-BR')
                : '—'}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-500 block font-medium">Equipe Auditora:</span>
            <span className="text-slate-800 font-medium">
              {audit.expand?.auditor_ids?.map((a) => a.name).join(', ') ||
                'Equipe Interna da Qualidade'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block font-medium">Normas de Referência:</span>
            <span className="text-slate-800">
              {audit.standard_ref?.join(' | ') || 'ISO 9001:2015'}
            </span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 border rounded-md bg-emerald-50/50 border-emerald-200 text-center">
            <span className="text-xs text-emerald-800 block font-semibold">
              Índice Conformidade
            </span>
            <span className="text-2xl font-black text-emerald-700">{complianceRate}%</span>
          </div>
          <div className="p-3 border rounded-md bg-rose-50/50 border-rose-200 text-center">
            <span className="text-xs text-rose-800 block font-semibold">Não Conformidades</span>
            <span className="text-2xl font-black text-rose-700">{ncs.length}</span>
          </div>
          <div className="p-3 border rounded-md bg-amber-50/50 border-amber-200 text-center">
            <span className="text-xs text-amber-800 block font-semibold">Observações</span>
            <span className="text-2xl font-black text-amber-700">{observations.length}</span>
          </div>
          <div className="p-3 border rounded-md bg-blue-50/50 border-blue-200 text-center">
            <span className="text-xs text-blue-800 block font-semibold">
              Oportunidades Melhoria
            </span>
            <span className="text-2xl font-black text-blue-700">{opportunities.length}</span>
          </div>
          <div className="p-3 border rounded-md bg-purple-50/50 border-purple-200 text-center">
            <span className="text-xs text-purple-800 block font-semibold">Pontos Fortes</span>
            <span className="text-2xl font-black text-purple-700">{strengths.length}</span>
          </div>
        </div>

        {/* Audit Scope / Notes */}
        {audit.notes && (
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide">
              1. Objetivo e Escopo da Avaliação
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border">
              {audit.notes}
            </p>
          </div>
        )}

        {/* Section 2: Non-Conformities */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wide text-rose-900 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            2. Não Conformidades Identificadas ({ncs.length})
          </h4>
          {ncs.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border">
              Nenhuma Não Conformidade registrada nesta auditoria.
            </p>
          ) : (
            <div className="space-y-2">
              {ncs.map((nc, idx) => (
                <div
                  key={nc.id}
                  className="p-3 border border-rose-200 bg-rose-50/30 rounded text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900">NC #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {nc.linked_rnc_id && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white border-rose-300 text-rose-700"
                        >
                          RNC Vinculada: {nc.linked_rnc_id}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        Status: {nc.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-800">{nc.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1 border-t border-rose-100">
                    <span>
                      Responsável: <strong>{nc.responsible || '—'}</strong>
                    </span>
                    <span>
                      Prazo:{' '}
                      <strong>
                        {nc.deadline ? new Date(nc.deadline).toLocaleDateString('pt-BR') : '—'}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Observations & Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-amber-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              3. Observações ({observations.length})
            </h4>
            {observations.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border">
                Nenhuma observação apontada.
              </p>
            ) : (
              <div className="space-y-2">
                {observations.map((obs, idx) => (
                  <div
                    key={obs.id}
                    className="p-2.5 border border-amber-200 bg-amber-50/30 rounded text-xs"
                  >
                    <p className="font-semibold text-slate-800">Obs #{idx + 1}</p>
                    <p className="text-slate-700 mt-0.5">{obs.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-blue-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              4. Oportunidades de Melhoria ({opportunities.length})
            </h4>
            {opportunities.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border">
                Nenhuma oportunidade de melhoria formalizada.
              </p>
            ) : (
              <div className="space-y-2">
                {opportunities.map((om, idx) => (
                  <div
                    key={om.id}
                    className="p-2.5 border border-blue-200 bg-blue-50/30 rounded text-xs"
                  >
                    <p className="font-semibold text-slate-800">OM #{idx + 1}</p>
                    <p className="text-slate-700 mt-0.5">{om.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-purple-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-600" />
              5. Pontos Fortes e Boas Práticas ({strengths.length})
            </h4>
            <div className="space-y-2">
              {strengths.map((str, idx) => (
                <div
                  key={str.id}
                  className="p-2.5 border border-purple-200 bg-purple-50/30 rounded text-xs"
                >
                  <p className="text-slate-800">{str.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formal Signatures Section */}
        <div className="pt-12 mt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-800">Auditor Líder</p>
            <p className="text-slate-500">Gestão da Qualidade / SGQ</p>
          </div>
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-800">Responsável pelo Processo Auditado</p>
            <p className="text-slate-500">{audit.audit_scope}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
