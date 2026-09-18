import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Download,
  Building2,
  Calendar,
  Layers,
  TrendingUp,
  PackageX,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { NonConformity } from '@/services/rnc'
import type { Company } from '@/services/companies'

interface CostOfQualityReportProps {
  ncs: NonConformity[]
  companies: Company[]
  selectedCompanyId?: string
}

export function CostOfQualityReport({
  ncs,
  companies,
  selectedCompanyId,
}: CostOfQualityReportProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  // Target company name map
  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of companies) {
      map.set(c.id, c.name)
    }
    return map
  }, [companies])

  // Short label for companies
  const getCompanyShortName = (companyId?: string, fullFallback?: string) => {
    const fullName = (companyId ? companyNameMap.get(companyId) : '') || fullFallback || ''
    const upper = fullName.toUpperCase()
    if (upper.includes('PSC')) return 'PSC'
    if (upper.includes('KOALA')) return 'Koala System'
    if (upper.includes('GENTI')) return 'GenTi'
    return fullName || 'Outra'
  }

  // Pre-calculate costs and totals
  const metrics = useMemo(() => {
    // Filter if a company is selected (or show all)
    const activeNcs =
      selectedCompanyId && selectedCompanyId !== 'all'
        ? ncs.filter((n) => n.company_id === selectedCompanyId)
        : ncs

    let totalRaw = 0
    let totalSupplies = 0
    let totalServices = 0
    let totalOverall = 0
    let totalAction = 0

    // List of RNCs that have any cost registered (> 0)
    const ncsWithCost: NonConformity[] = []

    // Breakdown by Company
    const byCompany: Record<
      string,
      {
        companyId: string
        displayName: string
        totalCost: number
        rawCost: number
        suppliesCost: number
        servicesCost: number
        countWithCost: number
        totalRNCs: number
        actionCost: number
      }
    > = {
      PSC: {
        companyId: '',
        displayName: 'PSC Indústria',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
        actionCost: 0,
      },
      'Koala System': {
        companyId: '',
        displayName: 'Koala System',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
        actionCost: 0,
      },
      GenTi: {
        companyId: '',
        displayName: 'GenTi Serviços',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
        actionCost: 0,
      },
      Outras: {
        companyId: '',
        displayName: 'Outras',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
        actionCost: 0,
      },
    }

    // Set real company IDs into structure if found
    for (const c of companies) {
      const short = getCompanyShortName(c.id, c.name)
      if (byCompany[short]) {
        byCompany[short].companyId = c.id
      }
    }

    // Breakdown by Year (focusing on 2025, 2026, and Others)
    const byYear: Record<
      string,
      {
        year: string
        totalCost: number
        rawCost: number
        suppliesCost: number
        servicesCost: number
        countWithCost: number
        totalRNCs: number
      }
    > = {
      '2026': {
        year: '2026',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
      },
      '2025': {
        year: '2025',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
      },
      Outros: {
        year: 'Outros Anos',
        totalCost: 0,
        rawCost: 0,
        suppliesCost: 0,
        servicesCost: 0,
        countWithCost: 0,
        totalRNCs: 0,
      },
    }

    // Breakdown by Process (Top 5 processes by cost)
    const byProcess: Record<
      string,
      {
        process: string
        totalCost: number
        countWithCost: number
        rawCost: number
        suppliesCost: number
        servicesCost: number
      }
    > = {}

    for (const n of activeNcs) {
      const raw = Number(n.cost_raw_material) || 0
      const sup = Number(n.cost_supplies) || 0
      const srv = Number(n.cost_services) || 0
      const act = Number(n.action_cost) || 0
      const itemTotal = Number(n.cost_total) || raw + sup + srv

      totalRaw += raw
      totalSupplies += sup
      totalServices += srv
      totalOverall += itemTotal
      totalAction += act

      const hasCost = itemTotal > 0
      if (hasCost) {
        ncsWithCost.push(n)
      }

      // Company grouping
      const compKey = getCompanyShortName(n.company_id, n.expand?.company_id?.name)
      const targetComp = byCompany[compKey] || byCompany['Outras']
      targetComp.totalRNCs++
      targetComp.totalCost += itemTotal
      targetComp.rawCost += raw
      targetComp.suppliesCost += sup
      targetComp.servicesCost += srv
      targetComp.actionCost += act
      if (hasCost) {
        targetComp.countWithCost++
      }

      // Year grouping (from date or created)
      let yearKey = 'Outros'
      const dateStr = n.date || n.created || ''
      if (dateStr) {
        const yMatch = dateStr.match(/^(\d{4})/)
        if (yMatch) {
          const y = yMatch[1]
          if (y === '2026' || y === '2025') {
            yearKey = y
          }
        }
      }
      const targetYear = byYear[yearKey] || byYear['Outros']
      targetYear.totalRNCs++
      targetYear.totalCost += itemTotal
      targetYear.rawCost += raw
      targetYear.suppliesCost += sup
      targetYear.servicesCost += srv
      if (hasCost) {
        targetYear.countWithCost++
      }

      // Process grouping
      const proc = n.process || 'Não Definido'
      if (!byProcess[proc]) {
        byProcess[proc] = {
          process: proc,
          totalCost: 0,
          countWithCost: 0,
          rawCost: 0,
          suppliesCost: 0,
          servicesCost: 0,
        }
      }
      byProcess[proc].totalCost += itemTotal
      byProcess[proc].rawCost += raw
      byProcess[proc].suppliesCost += sup
      byProcess[proc].servicesCost += srv
      if (hasCost) {
        byProcess[proc].countWithCost++
      }
    }

    const countWithCost = ncsWithCost.length
    const averageCost = countWithCost > 0 ? totalOverall / countWithCost : 0

    // Top 5 processes by cost
    const top5Processes = Object.values(byProcess)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5)

    return {
      activeNcs,
      totalOverall,
      totalRaw,
      totalSupplies,
      totalServices,
      totalAction,
      countWithCost,
      averageCost,
      byCompany,
      byYear,
      top5Processes,
      ncsWithCost,
    }
  }, [ncs, companies, selectedCompanyId, companyNameMap])

  // CSV Export Client-Side
  const handleExportCSV = () => {
    const headers = [
      'Nº RNC',
      'Data',
      'Empresa',
      'Processo',
      'Grau',
      'Origem',
      'Status',
      'Custo Matéria-Prima (R$)',
      'Custo Insumos (R$)',
      'Custo Serviços (R$)',
      'Custo Total Não Qualidade (R$)',
      'Custo da Ação Corretiva (R$)',
      'Descrição',
    ]

    const rows = metrics.activeNcs.map((n) => {
      const raw = Number(n.cost_raw_material) || 0
      const sup = Number(n.cost_supplies) || 0
      const srv = Number(n.cost_services) || 0
      const total = Number(n.cost_total) || raw + sup + srv
      const act = Number(n.action_cost) || 0
      const comp = getCompanyShortName(n.company_id, n.expand?.company_id?.name)
      const dateFmt = n.date ? n.date.split('T')[0].split(' ')[0] : ''
      const desc = (n.summary || n.description || '').replace(/[\r\n;]/g, ' ')

      return [
        `"${n.number || ''}"`,
        `"${dateFmt}"`,
        `"${comp}"`,
        `"${n.process || ''}"`,
        `"${n.severity || ''}"`,
        `"${n.origin || ''}"`,
        `"${n.status || ''}"`,
        raw.toFixed(2).replace('.', ','),
        sup.toFixed(2).replace('.', ','),
        srv.toFixed(2).replace('.', ','),
        total.toFixed(2).replace('.', ','),
        act.toFixed(2).replace('.', ','),
        `"${desc}"`,
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = `relatorio_custo_nao_qualidade_${new Date().toISOString().split('T')[0]}.csv`
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const isEmpty = metrics.activeNcs.length === 0

  return (
    <Card className="glass border-white/10 shadow-lg">
      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-heading font-bold text-white">
                  Custo da Não Qualidade (CNQ)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono"
                >
                  Prioridade Estratégica
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Consolidação financeira de perdas e retrabalhos (Matéria-prima, Insumos e Serviços
                de terceiros)
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isEmpty}
              className="text-xs border-white/10 hover:bg-white/10 gap-1.5 h-8 text-white/90"
              title="Baixar detalhamento completo em CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Detalhamento (CSV)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 text-white/70 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-5 space-y-6">
          {isEmpty ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-muted-foreground">
                <PackageX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Nenhum custo registrado ainda</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Importe as RNCs históricas pelo assistente ou registre os valores de perdas no
                  formulário FSGQ 8.7-2 para ver o custo da não qualidade consolidado.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* TOP 4 KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-black/30 border border-white/10 space-y-1">
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Custo Total Não Qualidade
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 pt-0.5">
                    {formatCurrency(metrics.totalOverall)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Soma de Matéria-prima + Insumos + Serviços
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-black/30 border border-white/10 space-y-1">
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                    RNCs com Custo
                  </span>
                  <div className="text-2xl font-bold font-mono text-white pt-0.5">
                    {metrics.countWithCost}{' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      de {metrics.activeNcs.length} (
                      {metrics.activeNcs.length > 0
                        ? Math.round((metrics.countWithCost / metrics.activeNcs.length) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Ocorrências que geraram impacto financeiro
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-black/30 border border-white/10 space-y-1">
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Custo Médio por RNC
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-400 pt-0.5">
                    {formatCurrency(metrics.averageCost)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Média calculada sobre as RNCs com impacto
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-black/30 border border-white/10 space-y-1">
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Ações Corretivas
                  </span>
                  <div className="text-2xl font-bold font-mono text-purple-300 pt-0.5">
                    {formatCurrency(metrics.totalAction)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Investimento aplicado em soluções
                  </p>
                </div>
              </div>

              {/* SOMA POR CATEGORIA DE CUSTO (Matéria-prima, Insumos, Serviços) */}
              <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-white/90">
                  Composição do Custo por Tipo de Despesa:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Matéria-Prima</p>
                      <p className="text-base font-bold font-mono text-white mt-0.5">
                        {formatCurrency(metrics.totalRaw)}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-white/50">
                      {metrics.totalOverall > 0
                        ? `${Math.round((metrics.totalRaw / metrics.totalOverall) * 100)}%`
                        : '0%'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Insumos / Consumíveis
                      </p>
                      <p className="text-base font-bold font-mono text-white mt-0.5">
                        {formatCurrency(metrics.totalSupplies)}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-white/50">
                      {metrics.totalOverall > 0
                        ? `${Math.round((metrics.totalSupplies / metrics.totalOverall) * 100)}%`
                        : '0%'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Serviços / Terceiros
                      </p>
                      <p className="text-base font-bold font-mono text-white mt-0.5">
                        {formatCurrency(metrics.totalServices)}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-white/50">
                      {metrics.totalOverall > 0
                        ? `${Math.round((metrics.totalServices / metrics.totalOverall) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID: POR EMPRESA, POR ANO E TOP 5 PROCESSOS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Por Empresa (PSC, Koala System, GenTi) */}
                <div className="p-4 rounded-lg bg-black/25 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Custo por Empresa
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {['PSC', 'Koala System', 'GenTi'].map((key) => {
                      const item = metrics.byCompany[key]
                      const totalComp = item ? item.totalCost : 0
                      const count = item ? item.countWithCost : 0
                      const avg = count > 0 ? totalComp / count : 0
                      const pct =
                        metrics.totalOverall > 0
                          ? Math.round((totalComp / metrics.totalOverall) * 100)
                          : 0

                      return (
                        <div
                          key={key}
                          className="space-y-1 p-2 rounded bg-white/5 border border-white/5"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">{key}</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatCurrency(totalComp)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>
                              {count} com custo • Méd: {formatCurrency(avg)}
                            </span>
                            <span>{pct}% do total</span>
                          </div>
                          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Quebra por Ano (2025 / 2026) */}
                <div className="p-4 rounded-lg bg-black/25 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Custo por Ano (2025 / 2026)
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {['2026', '2025', 'Outros'].map((yKey) => {
                      const item = metrics.byYear[yKey]
                      if (!item && yKey === 'Outros') return null
                      const totalYear = item ? item.totalCost : 0
                      const count = item ? item.countWithCost : 0
                      const avg = count > 0 ? totalYear / count : 0
                      const pct =
                        metrics.totalOverall > 0
                          ? Math.round((totalYear / metrics.totalOverall) * 100)
                          : 0

                      return (
                        <div
                          key={yKey}
                          className="space-y-1 p-2 rounded bg-white/5 border border-white/5"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">
                              {yKey === 'Outros' ? 'Outros Anos' : `Ano ${yKey}`}
                            </span>
                            <span className="font-mono font-bold text-sky-400">
                              {formatCurrency(totalYear)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>
                              {count} com custo • Méd: {formatCurrency(avg)}
                            </span>
                            <span>{pct}% do total</span>
                          </div>
                          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Top 5 Processos por Custo */}
                <div className="p-4 rounded-lg bg-black/25 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Top 5 Processos por Custo
                    </h4>
                  </div>
                  <div className="space-y-2.5">
                    {metrics.top5Processes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Nenhum processo com custo registrado
                      </p>
                    ) : (
                      metrics.top5Processes.map((p, idx) => {
                        const pct =
                          metrics.totalOverall > 0
                            ? Math.round((p.totalCost / metrics.totalOverall) * 100)
                            : 0
                        return (
                          <div key={p.process} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white font-medium truncate max-w-[150px]">
                                <span className="text-muted-foreground mr-1.5 font-mono text-[10px]">
                                  #{idx + 1}
                                </span>
                                {p.process}
                              </span>
                              <span className="font-mono text-amber-300 font-semibold">
                                {formatCurrency(p.totalCost)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{p.countWithCost} RNC(s)</span>
                              <span>{pct}% do custo total</span>
                            </div>
                            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
