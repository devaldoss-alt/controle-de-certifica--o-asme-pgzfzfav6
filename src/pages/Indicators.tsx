import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { getIndicators, updateIndicator, type Indicator } from '@/services/indicators'
import { IndicatorFormDialog } from '@/components/IndicatorFormDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target, Edit3, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Indicators() {
  const { user } = useAuth()
  const { lang } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId } = useCompany()
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)
  const canEdit = ['Manager', 'Director', 'QCC'].includes(user?.role || '')

  const loadData = async () => {
    const data = await getIndicators(selectedCompanyId)
    setIndicators(data)
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])
  useRealtime('indicators', () => loadData())

  const isLowerBetter = (title: string) => {
    const l = title.toLowerCase()
    return l.includes('incf') || l.includes('não conform') || l.includes('nao conform')
  }

  const isOnTarget = (ind: Indicator) => {
    if (isLowerBetter(ind.title)) return ind.current_value <= ind.target_value
    return ind.current_value >= ind.target_value
  }

  const getProgress = (ind: Indicator) => {
    if (ind.target_value === 0) return 0
    if (isLowerBetter(ind.title)) {
      return Math.min(100, (ind.target_value / Math.max(ind.current_value, 0.01)) * 100)
    }
    return Math.min(100, (ind.current_value / ind.target_value) * 100)
  }

  const handleSaveValue = async (id: string) => {
    try {
      await updateIndicator(id, { current_value: parseFloat(editValue) || 0 })
      setEditingId(null)
      toast({ title: txt('Valor atualizado', 'Value updated') })
      loadData()
    } catch (e) {
      toast({ title: txt('Erro ao atualizar', 'Error updating'), variant: 'destructive' })
    }
  }

  const periodLabels: Record<string, { pt: string; en: string }> = {
    Annual: { pt: 'Anual', en: 'Annual' },
    Semestral: { pt: 'Semestral', en: 'Semestral' },
    Monthly: { pt: 'Mensal', en: 'Monthly' },
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {txt('Indicadores de Desempenho', 'Performance Indicators')}
          </h1>
          <p className="text-muted-foreground">
            {txt('Acompanhamento de metas e KPIs estratégicos', 'Strategic goals and KPI tracking')}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            {txt('Novo Indicador', 'New Indicator')}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {indicators.map((ind) => {
          const onTarget = isOnTarget(ind)
          const progress = getProgress(ind)
          const periodLabel = periodLabels[ind.period]?.[lang] || ind.period

          return (
            <Card
              key={ind.id}
              className={cn(
                'backdrop-blur-md transition-all duration-300',
                onTarget
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-rose-500/20 bg-rose-500/5',
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
                    {periodLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{ind.formula_description}</p>

                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{txt('Meta:', 'Target:')}</span>
                  <span className="text-sm font-medium text-white">
                    {ind.target_value} {ind.unit}
                  </span>
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
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveValue(ind.id)}
                      />
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleSaveValue(ind.id)}
                      >
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
                    className={cn(
                      'h-2',
                      onTarget ? '[&>div]:bg-emerald-500' : '[&>div]:bg-rose-500',
                    )}
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {indicators.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="mb-4">{txt('Nenhum indicador encontrado', 'No indicators found')}</p>
          {canEdit && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {txt('Criar Indicador', 'Create Indicator')}
            </Button>
          )}
        </div>
      )}

      <IndicatorFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSaved={loadData}
      />
    </div>
  )
}
