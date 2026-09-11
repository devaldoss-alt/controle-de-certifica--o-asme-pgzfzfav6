import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  RotateCw,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingCart,
  ShieldAlert,
  Boxes,
  Users,
  Building2,
  Filter,
} from 'lucide-react'
import {
  computeLeadTimeMetrics,
  recalculateLeadTimeIndicators,
  type LeadTimeSummary,
} from '@/services/lead-time'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface LeadTimeReportProps {
  companyId?: string
  canEdit?: boolean
}

export function LeadTimeReport({ companyId, canEdit }: LeadTimeReportProps) {
  const { lang } = useI18n()
  const { toast } = useToast()
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [data, setData] = useState<LeadTimeSummary | null>(null)

  // Filters
  const [periodFilter, setPeriodFilter] = useState<'all' | '30d' | '90d' | '2026' | '2025'>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [processFilter, setProcessFilter] = useState<string>('all')

  const loadMetrics = async () => {
    setLoading(true)
    try {
      let startDate: string | undefined
      let endDate: string | undefined
      let year: number | undefined

      const now = new Date()
      if (periodFilter === '30d') {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        startDate = d.toISOString().split('T')[0]
      } else if (periodFilter === '90d') {
        const d = new Date()
        d.setDate(d.getDate() - 90)
        startDate = d.toISOString().split('T')[0]
      } else if (periodFilter === '2026') {
        year = 2026
      } else if (periodFilter === '2025') {
        year = 2025
      }

      const summary = await computeLeadTimeMetrics({
        companyId,
        startDate,
        endDate,
        year,
        roleOrResponsible: roleFilter,
        process: processFilter,
      })
      setData(summary)
    } catch (e) {
      console.error('loadMetrics error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [companyId, periodFilter, roleFilter, processFilter])

  const handleSyncIndicators = async () => {
    if (!companyId || companyId === 'all') return
    try {
      setSyncing(true)
      await recalculateLeadTimeIndicators({ companyId })
      await loadMetrics()
      toast({
        title: txt('Indicadores de Lead Time sincronizados', 'Lead Time indicators synced'),
        description: txt(
          'Os KPIs de RNC, Serviços Especiais e Compras foram recalculados com sucesso.',
          'RNC, Special Services and Purchases KPIs recalculated successfully.',
        ),
      })
    } catch {
      toast({
        title: txt('Erro ao sincronizar', 'Error syncing'),
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading && !data) {
    return (
      <Card className="glass border-white/10 p-8 text-center text-muted-foreground animate-pulse">
        <Clock className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
        <p className="text-sm">
          {txt('Calculando métricas de Lead Time...', 'Calculating Lead Time metrics...')}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs gap-1">
                <Clock className="w-3.5 h-3.5" />
                {txt('Relatório de Eficiência Operacional', 'Operational Efficiency Report')}
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[11px]">
                Onda F • 100% Automático
              </Badge>
            </div>
            <CardTitle className="text-lg font-heading font-bold text-white flex items-center gap-2">
              {txt(
                'Lead Time por Período, Processo e Cargo Responsável',
                'Lead Time by Period, Process & Role',
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {txt(
                'Consolidação de tempos médios do ciclo de qualidade (RNC, Serviços Especiais fora da fábrica, Compras e Almoxarifado).',
                'Consolidation of cycle times (RNCs, External Special Services, Supplies Pipeline & Warehouse).',
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && companyId && companyId !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncIndicators}
                disabled={syncing}
                className="border-white/10 text-xs hover:bg-white/10 gap-1.5 h-8"
              >
                <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {txt('Recalcular Indicadores', 'Recalculate Indicators')}
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Filter Controls */}
        <CardContent className="p-4 bg-black/20 border-b border-white/5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold">{txt('Filtros:', 'Filters:')}</span>
          </div>

          {/* Period Filter */}
          <div className="w-36">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
              <SelectTrigger className="h-8 text-xs bg-black/30 border-white/10 text-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todo o Histórico
                </SelectItem>
                <SelectItem value="30d" className="text-xs">
                  Últimos 30 dias
                </SelectItem>
                <SelectItem value="90d" className="text-xs">
                  Últimos 90 dias
                </SelectItem>
                <SelectItem value="2026" className="text-xs">
                  Exercício 2026
                </SelectItem>
                <SelectItem value="2025" className="text-xs">
                  Exercício 2025
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Process Filter */}
          <div className="w-44">
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="h-8 text-xs bg-black/30 border-white/10 text-white">
                <SelectValue placeholder="Processo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todos os Processos
                </SelectItem>
                <SelectItem value="Soldagem" className="text-xs">
                  Soldagem
                </SelectItem>
                <SelectItem value="Caldeiraria" className="text-xs">
                  Caldeiraria
                </SelectItem>
                <SelectItem value="Usinagem" className="text-xs">
                  Usinagem
                </SelectItem>
                <SelectItem value="Pintura" className="text-xs">
                  Pintura
                </SelectItem>
                <SelectItem value="CQ" className="text-xs">
                  CQ / Inspeção
                </SelectItem>
                <SelectItem value="Almoxarifado" className="text-xs">
                  Almoxarifado
                </SelectItem>
                <SelectItem value="Suprimentos" className="text-xs">
                  Suprimentos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role / Responsible Filter */}
          <div className="w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 text-xs bg-black/30 border-white/10 text-white">
                <SelectValue placeholder="Cargo / Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todos os Cargos
                </SelectItem>
                <SelectItem value="Manager" className="text-xs">
                  Gestor da Qualidade
                </SelectItem>
                <SelectItem value="Inspetor" className="text-xs">
                  Inspetor CQ
                </SelectItem>
                <SelectItem value="Solda" className="text-xs">
                  Soldador / Caldeiraria
                </SelectItem>
                <SelectItem value="Almoxarife" className="text-xs">
                  Almoxarife
                </SelectItem>
                <SelectItem value="Suprimentos" className="text-xs">
                  Suprimentos / Compras
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(periodFilter !== 'all' || processFilter !== 'all' || roleFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPeriodFilter('all')
                setProcessFilter('all')
                setRoleFilter('all')
              }}
              className="h-8 text-xs text-muted-foreground hover:text-white"
            >
              {txt('Limpar filtros', 'Clear filters')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* KPI Headline Cards (Onda F) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Lead Time RNC */}
        <Card className="glass border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                RNC (Abertura → Eficácia)
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  (data?.rncAvgDays || 0) <= 15
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-rose-500/30 text-rose-400 bg-rose-500/10',
                )}
              >
                Meta ≤ 15 dias
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {data?.rncAvgDays.toFixed(1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">dias</span>
              </span>
              {(data?.rncAvgDays || 0) <= 15 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <p>
              Base: <strong>{data?.rncTotalClosed}</strong> Não Conformidades tratadas e fechadas.
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Lead Time Serviços Especiais */}
        <Card className="glass border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-primary" />
                Serviços Especiais (Romaneio)
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  (data?.specialServicesAvgDays || 0) <= 7
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-rose-500/30 text-rose-400 bg-rose-500/10',
                )}
              >
                Meta ≤ 7 dias
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {data?.specialServicesAvgDays.toFixed(1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">dias</span>
              </span>
              {(data?.specialServicesAvgDays || 0) <= 7 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <p>
              Tempo fora da fábrica: <strong>{data?.specialServicesTotalClosed}</strong> remessas
              (Galv./Pintura).
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Lead Time Ciclo de Compras */}
        <Card className="glass border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                Ciclo de Suprimentos
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  (data?.suppliesAvgDays || 0) <= 10
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-rose-500/30 text-rose-400 bg-rose-500/10',
                )}
              >
                Meta ≤ 10 dias
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {data?.suppliesAvgDays.toFixed(1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">dias</span>
              </span>
              {(data?.suppliesAvgDays || 0) <= 10 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <p>
              Cotação até entrega: <strong>{data?.suppliesTotalDelivered}</strong> pedidos
              concluídos.
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Atendimento do Almoxarifado */}
        <Card className="glass border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-blue-400" />
                Atendimento Almoxarifado
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  (data?.warehouseRequisitionsAvgDays || 0) <= 1.0
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-rose-500/30 text-rose-400 bg-rose-500/10',
                )}
              >
                Meta ≤ 1 dia
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {data?.warehouseRequisitionsAvgDays.toFixed(1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">dia</span>
              </span>
              {(data?.warehouseRequisitionsAvgDays || 0) <= 1.0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <p>
              Requisição → Retirada: <strong>{data?.warehouseRequisitionsTotalFulfilled}</strong>{' '}
              atendimentos.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart (Pure CSS bars with clean legend) */}
      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-white/10 bg-white/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              {txt('Evolução Mensal do Lead Time (Últimos Meses)', 'Monthly Lead Time Trend')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {txt(
                'Acompanhamento da redução dos tempos de ciclo em RNC, Serviços Especiais e Suprimentos.',
                'Tracking cycle time reduction over RNC, Special Services and Supplies.',
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <span className="text-muted-foreground">RNC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary inline-block" />
              <span className="text-muted-foreground">Serviço Especial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              <span className="text-muted-foreground">Suprimentos</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {data?.monthlyTrend.map((m) => {
              const maxScale = 20
              const rncH = Math.min(100, (m.rncLeadTime / maxScale) * 100)
              const servH = Math.min(100, (m.specialServicesLeadTime / maxScale) * 100)
              const supH = Math.min(100, (m.suppliesLeadTime / maxScale) * 100)

              return (
                <div
                  key={m.monthKey}
                  className="p-3 rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-between"
                >
                  <span className="text-xs font-bold text-white mb-2">{m.monthLabel}</span>

                  {/* Graphical Bar Container */}
                  <div className="h-32 w-full flex items-end justify-center gap-1.5 px-2 pb-1 border-b border-white/10">
                    {/* RNC Bar */}
                    <div className="flex flex-col items-center flex-1 h-full justify-end group relative">
                      <div
                        className="w-full bg-amber-400/80 hover:bg-amber-400 rounded-t transition-all"
                        style={{ height: `${rncH}%` }}
                      />
                      <span className="text-[10px] font-mono text-amber-300 mt-1">
                        {m.rncLeadTime.toFixed(0)}d
                      </span>
                    </div>

                    {/* Special Services Bar */}
                    <div className="flex flex-col items-center flex-1 h-full justify-end group relative">
                      <div
                        className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all"
                        style={{ height: `${servH}%` }}
                      />
                      <span className="text-[10px] font-mono text-primary mt-1">
                        {m.specialServicesLeadTime.toFixed(0)}d
                      </span>
                    </div>

                    {/* Supplies Bar */}
                    <div className="flex flex-col items-center flex-1 h-full justify-end group relative">
                      <div
                        className="w-full bg-emerald-400/80 hover:bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${supH}%` }}
                      />
                      <span className="text-[10px] font-mono text-emerald-300 mt-1">
                        {m.suppliesLeadTime.toFixed(0)}d
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground mt-2">
                    Méd:{' '}
                    {((m.rncLeadTime + m.specialServicesLeadTime + m.suppliesLeadTime) / 3).toFixed(
                      1,
                    )}
                    d
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Tables: By Process/Role and By External Supplier */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Table 1: Breakdown by Process / Role */}
        <Card className="glass border-white/10 overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-white/10 bg-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {txt(
                'Tempo Médio por Processo / Cargo Responsável',
                'Lead Time by Process / Responsible Role',
              )}
            </CardTitle>
            <Badge variant="outline" className="border-white/10 text-xs">
              {data?.byProcess.length} {txt('processos mapeados', 'mapped processes')}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs text-white/70">
                    {txt('Processo / Cargo', 'Process / Role')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70">{txt('Origem', 'Origin')}</TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    {txt('Tempo Médio', 'Avg Time')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    {txt('Meta', 'Target')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-center">
                    {txt('Status', 'Status')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.byProcess.map((proc, idx) => (
                  <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-xs font-semibold text-white">
                      {proc.process}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px]',
                          proc.category === 'RNC'
                            ? 'bg-amber-500/10 text-amber-300'
                            : proc.category === 'Serviço Especial'
                              ? 'bg-primary/10 text-primary'
                              : proc.category === 'Suprimentos'
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : 'bg-blue-500/10 text-blue-300',
                        )}
                      >
                        {proc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right text-white">
                      {proc.avgLeadTimeDays.toFixed(1)} dias
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground text-right">
                      ≤ {proc.targetDays}d
                    </TableCell>
                    <TableCell className="text-center">
                      {proc.onTarget ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0">
                          OK
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-1.5 py-0">
                          Atraso
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Table 2: Breakdown by External Supplier (Dias Fora em Serviço Especial) */}
        <Card className="glass border-white/10 overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-white/10 bg-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              {txt(
                'Dias Fora por Fornecedor (Serviços Especiais)',
                'Days Out by Supplier (Special Services)',
              )}
            </CardTitle>
            <Badge variant="outline" className="border-white/10 text-xs">
              {data?.bySupplier.length} {txt('fornecedores', 'suppliers')}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs text-white/70">
                    {txt('Fornecedor Terceiro', 'Third-Party Supplier')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70">
                    {txt('Serviço', 'Service')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    {txt('Remessas', 'Shipments')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    {txt('Dias Médios', 'Avg Days')}
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    {txt('Máx. Dias', 'Max Days')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.bySupplier.map((sup, idx) => (
                  <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-xs font-semibold text-white max-w-[180px] truncate">
                      {sup.supplierName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-primary/30 text-primary"
                      >
                        {sup.serviceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground text-right">
                      {sup.count}x
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right text-emerald-400">
                      {sup.avgDaysOut.toFixed(1)}d
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-amber-300">
                      {sup.maxDaysOut}d
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
