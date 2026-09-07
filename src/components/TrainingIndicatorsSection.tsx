import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Target,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  computeTrainingIndicators,
  recalculateTrainingIndicators,
  type TrainingIndicatorsSummary,
  type MonthlyHHTData,
  HHT_TARGET_PERCENT,
  EFICACIA_TARGET_PERCENT,
  PLANO_TARGET_PERCENT,
  MONTH_NAMES_FULL,
} from '@/services/training-indicators'

interface Props {
  companyId: string
  year: number
  canEdit?: boolean
}

export function TrainingIndicatorsSection({ companyId, year, canEdit = true }: Props) {
  const { toast } = useToast()
  const [summary, setSummary] = useState<TrainingIndicatorsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadIndicators = async () => {
    if (!companyId || companyId === 'all') return
    try {
      setLoading(true)
      const data = await computeTrainingIndicators({
        companyId,
        year,
      })
      setSummary(data)
    } catch (e) {
      console.error('Failed to load training indicators summary:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIndicators()
  }, [companyId, year])

  const handleRecalculateAndSync = async () => {
    if (!companyId) return
    try {
      setSyncing(true)
      const res = await recalculateTrainingIndicators({
        companyId,
        year,
      })
      if (res) {
        setSummary(res)
        toast({
          title: 'Indicadores sincronizados com sucesso',
          description:
            'Valores de HHT mensal, % Eficácia e % Plano recalculados e atualizados no painel geral de Indicadores.',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Erro ao sincronizar',
        description: e?.message || 'Falha ao recalcular indicadores',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading && !summary) {
    return (
      <Card className="glass border-white/10 p-8 text-center text-muted-foreground text-sm">
        <RotateCw className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
        Carregando indicadores de treinamento...
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="glass border-white/10 p-6 text-center text-muted-foreground">
        Nenhum dado disponível para a empresa selecionada.
      </Card>
    )
  }

  const currentMonthIdx = new Date().getMonth()
  const currentMonthData = summary.monthlyHHT[currentMonthIdx]

  return (
    <div className="space-y-6">
      {/* Top Banner & Sync */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Indicadores Oficiais de Treinamento • Exercício {year}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cálculo 100% automático vinculado às Listas de Presença (FSGQ 7.2-3) e Plano Anual (FSGQ
            7.2-1).
          </p>
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={handleRecalculateAndSync}
            disabled={syncing}
            className="text-xs bg-primary text-white hover:bg-primary/90 gap-1.5 shrink-0"
          >
            <RotateCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Sincronizando...' : 'Recalcular Indicadores'}
          </Button>
        )}
      </div>

      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: HHT Horas de Treinamento */}
        <Card
          className={cn(
            'backdrop-blur-md transition-all duration-300',
            summary.currentMonthHHT.isOnTarget
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-amber-500/20 bg-amber-500/5',
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Indicador 1 (Mensal)
              </span>
              <Badge
                variant="outline"
                className={
                  summary.currentMonthHHT.isOnTarget
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                }
              >
                Meta ≥ {HHT_TARGET_PERCENT}%
              </Badge>
            </div>
            <CardTitle className="text-lg text-white flex items-center gap-2 mt-1">
              {summary.currentMonthHHT.isOnTarget ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-amber-400" />
              )}
              HHT - Horas de Treinamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted-foreground">
                  Mês Atual ({currentMonthData.monthName}):
                </span>
                <p
                  className={cn(
                    'text-3xl font-bold font-mono',
                    currentMonthData.isOnTarget ? 'text-emerald-400' : 'text-amber-400',
                  )}
                >
                  {currentMonthData.percentHHT.toFixed(2)}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Média do Ano:</span>
                <p className="text-lg font-bold font-mono text-white">
                  {summary.yearAverageHHT.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  HH Mês: <strong>{currentMonthData.hhTreinado.toFixed(1)}h</strong>
                </span>
                <span>
                  Base: {summary.activeEmployeesCount} colab × {summary.baseHoursPerMonth}h ={' '}
                  {summary.activeEmployeesCount * summary.baseHoursPerMonth}h
                </span>
              </div>
              <Progress
                value={Math.min(100, (currentMonthData.percentHHT / HHT_TARGET_PERCENT) * 100)}
                className="h-2"
              />
            </div>

            <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-white/5">
              Fórmula: (HH Treinado no Mês) ÷ (Colab. Próprios + PJ × 220h) × 100
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: % Eficácia de Treinamento */}
        <Card
          className={cn(
            'backdrop-blur-md transition-all duration-300',
            summary.isEficaciaOnTarget
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-rose-500/20 bg-rose-500/5',
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Indicador 2 (Novo)
              </span>
              <Badge
                variant="outline"
                className={
                  summary.isEficaciaOnTarget
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                }
              >
                Meta ≥ {EFICACIA_TARGET_PERCENT}%
              </Badge>
            </div>
            <CardTitle className="text-lg text-white flex items-center gap-2 mt-1">
              {summary.isEficaciaOnTarget ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              % Eficácia de Treinamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Atingimento:</span>
                <p
                  className={cn(
                    'text-3xl font-bold font-mono',
                    summary.isEficaciaOnTarget ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {summary.percentEficacia.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Avaliações:</span>
                <p className="text-sm font-semibold text-white">
                  {summary.totalEvaluationsSim} SIM / {summary.totalEvaluationsCompleted} total
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Progress value={Math.min(100, summary.percentEficacia)} className="h-2" />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{summary.totalEvaluationsCompleted} conclúidas no FSGQ 7.2-3</span>
                <span>{summary.isEficaciaOnTarget ? 'Meta Atingida' : 'Abaixo da Meta'}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-white/5">
              Fórmula: (Avaliações Eficácia com SIM) ÷ (Total de Avaliações Concluídas) × 100
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: % do Plano de Treinamento Concluído */}
        <Card
          className={cn(
            'backdrop-blur-md transition-all duration-300',
            summary.isPlanoOnTarget
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-blue-500/20 bg-blue-500/5',
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Indicador 3 (Novo)
              </span>
              <Badge
                variant="outline"
                className={
                  summary.isPlanoOnTarget
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                }
              >
                Meta ≥ {PLANO_TARGET_PERCENT}%
              </Badge>
            </div>
            <CardTitle className="text-lg text-white flex items-center gap-2 mt-1">
              <Award className="w-5 h-5 text-primary" />% Plano de Treinamento Concluído
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Conclusão:</span>
                <p className="text-3xl font-bold font-mono text-white">
                  {summary.percentPlanoConcluido.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Ações do Ano:</span>
                <p className="text-sm font-semibold text-white">
                  {summary.totalActionsRealized} realizadas / {summary.totalActionsPlanned}{' '}
                  previstas
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Progress value={Math.min(100, summary.percentPlanoConcluido)} className="h-2" />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{summary.totalActionsPlanned - summary.totalActionsRealized} pendentes</span>
                <span>{summary.isPlanoOnTarget ? 'Meta Atingida' : 'Em Andamento'}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-white/5">
              Fórmula: (Ações Realizadas) ÷ (Ações Previstas no Ano) × 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly HHT Breakdown Grid (Aba "HH TREINAMENTO") */}
      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="py-3 px-4 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Série Mensal do Indicador HHT — Exercício {year}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demonstrativo mensal fiel à aba "HH TREINAMENTO" da planilha oficial do cliente (Meta
              ≥ 0,4%).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Total Acumulado:</span>
            <span className="font-bold text-white font-mono">
              {summary.totalYearHHTrained.toFixed(1)}h
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {summary.monthlyHHT.map((m: MonthlyHHTData) => {
              const hasActivity = m.hhTreinado > 0
              const isTargetReached = m.isOnTarget

              return (
                <div
                  key={m.monthIndex}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    isTargetReached
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                      : hasActivity
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-sm shadow-rose-500/5'
                        : 'bg-white/5 border-white/10 opacity-75',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white uppercase">{m.monthName}</span>
                    {isTargetReached ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0 h-4">
                        ≥ 0,4% OK
                      </Badge>
                    ) : hasActivity ? (
                      <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] px-1.5 py-0 h-4">
                        Abaixo
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Sem treinam.</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-muted-foreground">% HHT:</span>
                      <span
                        className={cn(
                          'text-base font-bold font-mono',
                          isTargetReached
                            ? 'text-emerald-400'
                            : hasActivity
                              ? 'text-rose-400'
                              : 'text-white/60',
                        )}
                      >
                        {m.percentHHT.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>HH Treinado:</span>
                      <span className="font-mono text-white/90 font-medium">
                        {m.hhTreinado.toFixed(1)}h
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Listas:</span>
                      <span className="font-mono text-white/80">{m.listsCount}</span>
                    </div>

                    {/* Miniature Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          isTargetReached ? 'bg-emerald-400' : 'bg-rose-400',
                        )}
                        style={{
                          width: `${Math.min(100, (m.percentHHT / HHT_TARGET_PERCENT) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footnote with parameters */}
          <div className="mt-4 p-3 rounded bg-black/30 border border-white/5 text-[11px] text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span>
                <strong>Colaboradores Ativos:</strong> {summary.activeEmployeesCount} (Próprios + PJ
                na base)
              </span>
              <span>•</span>
              <span>
                <strong>Horas Base Mensais:</strong> {summary.baseHoursPerMonth}h/colaborador
              </span>
              <span>•</span>
              <span>
                <strong>Capacidade Mensal:</strong>{' '}
                {summary.activeEmployeesCount * summary.baseHoursPerMonth}h
              </span>
            </div>
            <div className="text-white/80 font-medium">
              Meta do Cliente: <span className="text-emerald-400 font-bold">≥ 0,40% ao mês</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
