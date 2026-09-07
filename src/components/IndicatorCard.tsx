import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Edit3,
  Check,
  X,
  History,
  RotateCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import { updateIndicator, type Indicator } from '@/services/indicators'
import { IndicatorHistoryDialog } from '@/components/IndicatorHistoryDialog'
import {
  computeTrainingIndicators,
  recalculateTrainingIndicators,
  type MonthlyHHTData,
  type TrainingIndicatorsSummary,
} from '@/services/training-indicators'

interface Props {
  indicator: Indicator
  canEdit: boolean
  onUpdated: () => void
  selectedYear?: number
}

export function IndicatorCard({ indicator: ind, canEdit, onUpdated, selectedYear }: Props) {
  const { lang } = useI18n()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)
  const [trainingSummary, setTrainingSummary] = useState<TrainingIndicatorsSummary | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const isHHT = ind.title.startsWith('HHT')
  const isEficacia = ind.title.includes('Eficácia')
  const isPlano = ind.title.includes('Plano de Treinamento')
  const isTrainingIndicator = isHHT || isEficacia || isPlano

  const year = selectedYear || new Date().getFullYear()

  // Load calculated summary for training indicators
  useEffect(() => {
    if (isTrainingIndicator && ind.company_id) {
      computeTrainingIndicators({
        companyId: ind.company_id,
        year,
      })
        .then((summary) => setTrainingSummary(summary))
        .catch((e) => console.warn('Could not compute training indicator summary:', e))
    }
  }, [isTrainingIndicator, ind.company_id, year, ind.current_value])

  const handleManualRecalculate = async () => {
    if (!ind.company_id) return
    try {
      setRecalculating(true)
      const res = await recalculateTrainingIndicators({
        companyId: ind.company_id,
        year,
      })
      if (res) {
        setTrainingSummary(res)
        toast({
          title: txt('Indicador recalculado', 'Indicator recalculated'),
          description: txt(
            'Valores sincronizados com as listas de presença e plano.',
            'Values synced with attendance lists and plan.',
          ),
        })
        onUpdated()
      }
    } catch {
      toast({
        title: txt('Erro ao recalcular', 'Error recalculating'),
        variant: 'destructive',
      })
    } finally {
      setRecalculating(false)
    }
  }

  const isOnTarget = () => {
    const op = ind.target_operator || '≥'
    const v = ind.current_value
    const t = ind.target_value
    if (op === '≥') return v >= t
    if (op === '>') return v > t
    if (op === '<') return v < t
    if (op === '≤') return v <= t
    if (op === '=') return v === t
    return v >= t
  }

  const getProgress = () => {
    if (ind.target_value === 0) return 0
    return Math.min(100, Math.abs((ind.current_value / ind.target_value) * 100))
  }

  const onTarget = isOnTarget()
  const progress = getProgress()
  const periodLabels: Record<string, { pt: string; en: string }> = {
    Annual: { pt: 'Anual', en: 'Annual' },
    Semestral: { pt: 'Semestral', en: 'Semestral' },
    Monthly: { pt: 'Mensal', en: 'Monthly' },
  }

  const handleSaveValue = async () => {
    try {
      await updateIndicator(ind.id, { current_value: parseFloat(editValue) || 0 })
      setEditingId(null)
      toast({ title: txt('Valor atualizado', 'Value updated') })
      onUpdated()
    } catch {
      toast({ title: txt('Erro ao atualizar', 'Error updating'), variant: 'destructive' })
    }
  }

  return (
    <>
      <Card
        className={cn(
          'backdrop-blur-md transition-all duration-300',
          onTarget ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5',
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {onTarget ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-500" />
              )}
              {ind.title}
            </CardTitle>
            <Badge variant="outline" className="border-white/10 text-xs">
              {periodLabels[ind.period]?.[lang] || ind.period}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ind.objective && <p className="text-xs text-muted-foreground italic">{ind.objective}</p>}
          <p className="text-xs text-muted-foreground">{ind.formula_description}</p>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{txt('Meta:', 'Target:')}</span>
            <span className="text-sm font-medium text-white">
              {ind.target_operator || '≥'} {ind.target_value} {ind.unit}
            </span>
            {ind.result_type && (
              <Badge variant="secondary" className="text-xs ml-auto">
                {ind.result_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{txt('Atual:', 'Current:')}</span>
            {editingId === ind.id ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-24 h-7 text-sm bg-black/20 border-white/10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveValue()}
                />
                <Button size="icon" className="h-7 w-7" onClick={handleSaveValue}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setEditingId(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-bold',
                    onTarget ? 'text-emerald-500' : 'text-rose-500',
                  )}
                >
                  {ind.current_value} {ind.unit}
                </span>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingId(ind.id)
                      setEditValue(String(ind.current_value))
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Progress
              value={progress}
              className={cn('h-2', onTarget ? '[&>div]:bg-emerald-500' : '[&>div]:bg-rose-500')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span className={onTarget ? 'text-emerald-500' : 'text-rose-500'}>
                {onTarget
                  ? txt('Meta atingida', 'Target reached')
                  : txt('Abaixo da meta', 'Below target')}
              </span>
            </div>
          </div>
          {ind.expand?.responsible && (
            <p className="text-xs text-muted-foreground">
              {txt('Responsável:', 'Responsible:')} {ind.expand.responsible.name}
            </p>
          )}

          {/* Special monthly breakdown & recalculation for HHT / Training Indicators */}
          {isHHT && trainingSummary && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {showMonthlyBreakdown
                    ? txt('Ocultar Série Mensal', 'Hide Monthly Series')
                    : txt(`Ver Série Mensal (${year})`, `View Monthly Series (${year})`)}
                </button>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleManualRecalculate}
                    disabled={recalculating}
                    className="h-6 w-6 text-muted-foreground hover:text-white"
                    title={txt(
                      'Recalcular agora a partir das listas de presença',
                      'Recalculate now from attendance lists',
                    )}
                  >
                    <RotateCw className={cn('w-3.5 h-3.5', recalculating && 'animate-spin')} />
                  </Button>
                )}
              </div>

              {showMonthlyBreakdown && (
                <div className="space-y-1.5 p-2 rounded-md bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-1">
                    <span>MÊS</span>
                    <span>HH TREINADO</span>
                    <span>% HHT (META ≥ 0,4%)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                    {trainingSummary.monthlyHHT.map((m: MonthlyHHTData) => (
                      <div
                        key={m.monthIndex}
                        className={cn(
                          'flex items-center justify-between px-2 py-1 rounded text-xs',
                          m.isOnTarget
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : m.hhTreinado > 0
                              ? 'bg-rose-500/10 border border-rose-500/20'
                              : 'bg-white/5 border border-transparent',
                        )}
                      >
                        <span className="font-semibold text-white/90">{m.monthName}</span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {m.hhTreinado.toFixed(1)}h
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'font-mono font-bold text-[11px]',
                              m.isOnTarget
                                ? 'text-emerald-400'
                                : m.hhTreinado > 0
                                  ? 'text-rose-400'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {m.percentHHT.toFixed(2)}%
                          </span>
                          {m.isOnTarget ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-400/60" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground/80 pt-1 border-t border-white/5 flex justify-between">
                    <span>
                      {trainingSummary.activeEmployeesCount} colab. ×{' '}
                      {trainingSummary.baseHoursPerMonth}h/mês
                    </span>
                    <span>Total ano: {trainingSummary.totalYearHHTrained.toFixed(1)}h</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick info badges for Eficácia / Plano */}
          {isEficacia && trainingSummary && (
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-white/10">
              <span>
                {trainingSummary.totalEvaluationsSim} SIM de{' '}
                {trainingSummary.totalEvaluationsCompleted} avaliações
              </span>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleManualRecalculate}
                  disabled={recalculating}
                  className="h-6 w-6 text-muted-foreground hover:text-white"
                  title="Recalcular"
                >
                  <RotateCw className={cn('w-3.5 h-3.5', recalculating && 'animate-spin')} />
                </Button>
              )}
            </div>
          )}

          {isPlano && trainingSummary && (
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-white/10">
              <span>
                {trainingSummary.totalActionsRealized} realizadas de{' '}
                {trainingSummary.totalActionsPlanned} previstas
              </span>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleManualRecalculate}
                  disabled={recalculating}
                  className="h-6 w-6 text-muted-foreground hover:text-white"
                  title="Recalcular"
                >
                  <RotateCw className={cn('w-3.5 h-3.5', recalculating && 'animate-spin')} />
                </Button>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/10"
            onClick={() => setShowHistory(true)}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            {txt('Histórico de Lançamentos', 'History')}
          </Button>
        </CardContent>
      </Card>
      <IndicatorHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        indicatorId={ind.id}
        indicatorTitle={ind.title}
        canEdit={canEdit}
        onSaved={onUpdated}
      />
    </>
  )
}
