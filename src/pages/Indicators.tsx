import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import useRealtime from '@/hooks/use-realtime'
import { getIndicators, type Indicator } from '@/services/indicators'
import { IndicatorFormDialog } from '@/components/IndicatorFormDialog'
import { IndicatorCard } from '@/components/IndicatorCard'
import { Button } from '@/components/ui/button'
import { Plus, Target, RotateCw, Calendar, Clock, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeadTimeReport } from '@/components/LeadTimeReport'
import { recalculateTrainingIndicators } from '@/services/training-indicators'
import { recalculateWarehouseIndicators } from '@/services/warehouse-phase2'
import { recalculateLeadTimeIndicators } from '@/services/lead-time'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ShieldAlert } from 'lucide-react'

export default function Indicators() {
  const { user } = useAuth()
  const { lang } = useI18n()
  const { selectedCompanyId } = useCompany()
  const { toast } = useToast()
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [syncingAll, setSyncingAll] = useState(false)
  const [activeTab, setActiveTab] = useState<'cards' | 'leadtime'>('cards')
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const isQualityManager =
    user?.email === 'devaldoss@gmail.com' ||
    user?.name?.toLowerCase().includes('quality manager') ||
    user?.name?.toLowerCase().includes('gestor da qualidade')
  const isConsultantTest =
    user?.name?.toLowerCase().includes('consultor teste') ||
    user?.email === 'consultor.teste@qualihub.com'

  const canView = isQualityManager || isConsultantTest || user?.role === 'Manager'
  const canEdit = ['Manager', 'Director', 'QCC', 'Consultor'].includes(user?.role || '')

  const loadData = async () => {
    const data = await getIndicators(selectedCompanyId)
    setIndicators(data)
  }

  const handleSyncTrainingIndicators = async () => {
    if (!selectedCompanyId || selectedCompanyId === 'all') return
    try {
      setSyncingAll(true)
      await recalculateTrainingIndicators({
        companyId: selectedCompanyId,
        year: selectedYear,
      })
      await loadData()
      toast({
        title: txt('Indicadores de Treinamento recalculados', 'Training indicators recalculated'),
        description: txt(
          'HHT mensal, % Eficácia e % Plano sincronizados com as listas de presença.',
          'Monthly HHT, % Effectiveness and % Plan synced with attendance lists.',
        ),
      })
    } catch {
      toast({
        title: txt('Erro ao recalcular', 'Recalculation error'),
        variant: 'destructive',
      })
    } finally {
      setSyncingAll(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])
  useRealtime('indicators', () => loadData())
  useRealtime('indicator_history', () => loadData())
  useRealtime('training_attendance_lists', () => loadData())
  useRealtime('training_plan_actions', () => loadData())
  useRealtime('training_effectiveness_evaluations', () => loadData())
  useRealtime('material_requisitions', () => loadData())
  useRealtime('purchase_requests', () => loadData())
  useRealtime('packing_slips', () => loadData())
  useRealtime('non_conformities', () => loadData())

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {lang === 'pt' ? 'Acesso Restrito' : 'Restricted Access'}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {lang === 'pt'
            ? 'A visualização dos Indicadores estratégicos (IET, Lead Time, etc.) é restrita ao Gestor da Qualidade e ao Consultor Teste.'
            : 'Viewing strategic Indicators (IET, Lead Time, etc.) is restricted to Quality Manager and Consultant Test.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {txt('Indicadores de Desempenho', 'Performance Indicators')}
          </h1>
          <p className="text-muted-foreground">
            {txt(
              'Acompanhamento de metas e KPIs estratégicos com cálculo automático integrado',
              'Strategic goals and KPI tracking with integrated automatic calculation',
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab switch between general indicators and Lead Time report */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('cards')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                activeTab === 'cards'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-white',
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{txt('Painel Estratégico', 'Strategic Board')}</span>
            </button>
            <button
              onClick={() => setActiveTab('leadtime')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                activeTab === 'leadtime'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-white',
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{txt('Lead Time (Onda F)', 'Lead Time (Wave F)')}</span>
            </button>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-md px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
            >
              <SelectTrigger className="border-0 bg-transparent h-7 text-xs text-white focus:ring-0 focus:ring-offset-0 px-1 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canEdit && selectedCompanyId && selectedCompanyId !== 'all' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncTrainingIndicators}
                disabled={syncingAll}
                className="border-white/10 text-xs hover:bg-white/10 gap-1.5 h-9"
                title="Recalcular HHT, Eficácia e Plano a partir das listas de presença"
              >
                <RotateCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                {txt('Sincronizar Treinamentos', 'Sync Trainings')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    setSyncingAll(true)
                    await recalculateWarehouseIndicators({ companyId: selectedCompanyId })
                    await loadData()
                    toast({
                      title: txt(
                        'Indicadores do Almoxarifado sincronizados',
                        'Warehouse indicators synced',
                      ),
                      description: txt(
                        'Taxa de Atendimento, Itens em Ruptura e Valor Consumido recalculados.',
                        'Fulfillment Rate, Stock Rupture and Value Consumed recalculated.',
                      ),
                    })
                  } catch {
                    toast({
                      title: txt(
                        'Erro ao recalcular almoxarifado',
                        'Warehouse recalculation error',
                      ),
                      variant: 'destructive',
                    })
                  } finally {
                    setSyncingAll(false)
                  }
                }}
                disabled={syncingAll}
                className="border-white/10 text-xs hover:bg-white/10 gap-1.5 h-9"
                title="Recalcular Taxa de Atendimento, Ruptura e Valor Consumido"
              >
                <RotateCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                {txt('Sincronizar Almoxarifado', 'Sync Warehouse')}
              </Button>
            </>
          )}

          {canEdit && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 text-xs h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              {txt('Novo Indicador', 'New Indicator')}
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'leadtime' ? (
        <LeadTimeReport companyId={selectedCompanyId} canEdit={canEdit} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {indicators.map((ind) => (
              <IndicatorCard
                key={ind.id}
                indicator={ind}
                canEdit={canEdit}
                onUpdated={loadData}
                selectedYear={selectedYear}
              />
            ))}
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
        </>
      )}

      <IndicatorFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSaved={loadData}
      />
    </div>
  )
}
