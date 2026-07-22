import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target, Edit3, Check, X, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import { updateIndicator, type Indicator } from '@/services/indicators'
import { IndicatorHistoryDialog } from '@/components/IndicatorHistoryDialog'

interface Props {
  indicator: Indicator
  canEdit: boolean
  onUpdated: () => void
}

export function IndicatorCard({ indicator: ind, canEdit, onUpdated }: Props) {
  const { lang } = useI18n()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

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
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/10"
            onClick={() => setShowHistory(true)}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            {txt('Histórico', 'History')}
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
