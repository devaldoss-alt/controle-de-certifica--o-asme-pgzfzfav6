import { useState } from 'react'
import type { Supplier } from '@/services/suppliers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'

interface QualifiedSuppliersListPrintProps {
  suppliers: Supplier[]
  companyName: string
  companyLogo?: string
}

export function QualifiedSuppliersListPrint({
  suppliers,
  companyName,
  companyLogo,
}: QualifiedSuppliersListPrintProps) {
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false)

  const qualifiedSuppliers = suppliers.filter((s) => {
    if (s.qualification_status !== 'Qualificado') return false
    if (filterCriticalOnly && s.classification !== 'Crítico') return false
    return true
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Action Header - hidden when printing */}
      <div className="print:hidden flex items-center justify-between flex-wrap gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
        <div>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> FSGQ 8.4-4 — Lista de Fornecedores
            Qualificados
          </h3>
          <p className="text-xs text-muted-foreground">
            Documento oficial do SGQ (Rev. 03). Visualize e gere impressão/PDF com cabeçalho formal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
            className={`text-xs ${
              filterCriticalOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-white border-white/10'
            }`}
          >
            {filterCriticalOnly ? 'Exibindo Apenas Críticos' : 'Filtrar Apenas Críticos'}
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs font-semibold shadow-md"
          >
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 SGQ Layout) */}
      <div className="bg-card text-foreground border border-white/10 rounded-xl p-6 sm:p-8 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 print:shadow-none">
        {/* SGQ Document Header */}
        <div className="border border-border/60 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center print:border-black">
          <div className="sm:col-span-1 flex items-center justify-center sm:justify-start gap-2 border-b sm:border-b-0 sm:border-r border-border/60 pb-3 sm:pb-0 pr-4 print:border-black">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-10 max-w-[120px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-primary/20 text-primary border border-primary/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-sm tracking-tight text-white print:text-black">
                    {companyName}
                  </div>
                  <div className="text-[10px] text-muted-foreground print:text-black/70">
                    SGQ ISO 9001:2015
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 text-center border-b sm:border-b-0 sm:border-r border-border/60 pb-3 sm:pb-0 px-2 print:border-black">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold print:text-black">
              Procedimento Geral SGQ 8.4 — Aquisição
            </h2>
            <h1 className="text-base sm:text-lg font-black text-white mt-0.5 print:text-black">
              FSGQ 8.4-4 • LISTA DE FORNECEDORES QUALIFICADOS
            </h1>
            <p className="text-[11px] text-muted-foreground print:text-black/70 mt-0.5">
              Empresa: {companyName} • Cadastro & Homologação
            </p>
          </div>

          <div className="sm:col-span-1 text-[11px] space-y-1 text-right print:text-black font-mono">
            <div>
              <strong className="text-muted-foreground print:text-black/70">Código:</strong> FSGQ
              8.4-4
            </div>
            <div>
              <strong className="text-muted-foreground print:text-black/70">Revisão:</strong> 03
            </div>
            <div>
              <strong className="text-muted-foreground print:text-black/70">Data Emissão:</strong>{' '}
              {new Date().toLocaleDateString('pt-BR')}
            </div>
            <div>
              <strong className="text-muted-foreground print:text-black/70">Validade:</strong> 2
              Anos
            </div>
          </div>
        </div>

        {/* Informative Box */}
        <div className="bg-black/20 border border-white/5 rounded-lg p-3 mb-6 text-xs text-muted-foreground print:bg-neutral-100 print:text-black print:border-black/20">
          <p>
            <strong>Critérios de Qualificação Aplicados (PSGQ 8.4 item 5.3):</strong> (a)
            Certificação ISO 9001 válida; (b) Certificados de calibração RBC ou qualificações ASME
            do processo/material; (c) Histórico satisfatório de fornecimento; (d) Questionário FSGQ
            8.4-2 com nota final ≥ 6,0. A reavaliação bienal (FSGQ 8.4-2.1) é dispensada enquanto o
            certificado ISO 9001 permanecer válido.
          </p>
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border/80 bg-white/5 print:bg-neutral-200 print:border-black text-[11px] font-bold text-white print:text-black">
                <th className="p-2.5">Fornecedor / Razão Social</th>
                <th className="p-2.5">CNPJ</th>
                <th className="p-2.5">Classificação</th>
                <th className="p-2.5">Escopo de Fornecimento</th>
                <th className="p-2.5">Critério de Qualificação</th>
                <th className="p-2.5">ISO 9001 / Validade</th>
                <th className="p-2.5 text-center">Próx. Reavaliação</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 print:divide-black/20">
              {qualifiedSuppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground print:text-black/60"
                  >
                    Nenhum fornecedor qualificado registrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                qualifiedSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                    <td className="p-2.5 font-medium text-white print:text-black">
                      <div>{s.name}</div>
                      {s.trade_name && (
                        <div className="text-[10px] text-muted-foreground print:text-black/70 italic">
                          {s.trade_name}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-muted-foreground print:text-black">
                      {s.cnpj || '—'}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase print:border print:border-black ${
                          s.classification === 'Crítico'
                            ? 'bg-rose-500/20 text-rose-300 print:text-black'
                            : 'bg-blue-500/20 text-blue-300 print:text-black'
                        }`}
                      >
                        {s.classification}
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground print:text-black max-w-xs">
                      <div className="line-clamp-2">
                        {s.materials_services_description ||
                          (s.critical_categories && s.critical_categories.join(', ')) ||
                          'Materiais diversos'}
                      </div>
                    </td>
                    <td className="p-2.5 text-muted-foreground print:text-black">
                      {s.qualification_criteria && s.qualification_criteria.length > 0 ? (
                        <div className="space-y-0.5">
                          {s.qualification_criteria.map((c, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-primary print:text-black flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary print:bg-black inline-block" />
                              {c}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-muted-foreground print:text-black">
                      {s.iso9001_certified ? (
                        <div>
                          <div className="text-emerald-400 print:text-black font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 print:text-black" />{' '}
                            SIM ({s.iso9001_cert_number || 'Certificado'})
                          </div>
                          {s.iso9001_valid_until && (
                            <div className="text-[10px] text-muted-foreground print:text-black/70">
                              Val: {new Date(s.iso9001_valid_until).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground print:text-black/50">
                          Não aplicável
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[11px] text-muted-foreground print:text-black">
                      {s.reevaluation_exempt ? (
                        <div
                          className="text-sky-400 print:text-black font-medium text-[10px]"
                          title={s.reevaluation_exempt_reason}
                        >
                          Dispensado (ISO 9001)
                        </div>
                      ) : s.next_reevaluation_date ? (
                        new Date(s.next_reevaluation_date).toLocaleDateString('pt-BR')
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:text-black print:border-black">
                        <CheckCircle2 className="w-3 h-3" /> Homologado
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Signatures for Audit print */}
        <div className="mt-10 pt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs print:grid-cols-3 print:border-black">
          <div className="space-y-4">
            <div className="h-10 border-b border-white/20 print:border-black mx-4" />
            <div className="text-muted-foreground print:text-black">
              <strong className="text-white print:text-black block">
                Responsável por Suprimentos
              </strong>
              Elaboração e Homologação
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-10 border-b border-white/20 print:border-black mx-4" />
            <div className="text-muted-foreground print:text-black">
              <strong className="text-white print:text-black block">
                Gestor da Qualidade (QCC)
              </strong>
              Validação dos Critérios ISO 9001 / PSGQ 8.4
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-10 border-b border-white/20 print:border-black mx-4" />
            <div className="text-muted-foreground print:text-black">
              <strong className="text-white print:text-black block">Diretoria / Gestão</strong>
              Aprovação Final da Lista Mestra
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
