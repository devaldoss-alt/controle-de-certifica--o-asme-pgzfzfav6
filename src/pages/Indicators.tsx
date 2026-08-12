import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import useRealtime from '@/hooks/use-realtime'
import { getIndicators, type Indicator } from '@/services/indicators'
import { IndicatorFormDialog } from '@/components/IndicatorFormDialog'
import { IndicatorCard } from '@/components/IndicatorCard'
import { Button } from '@/components/ui/button'
import { Plus, Target } from 'lucide-react'

import { ShieldAlert } from 'lucide-react'

export default function Indicators() {
  const { user } = useAuth()
  const { lang } = useI18n()
  const { selectedCompanyId } = useCompany()
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
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

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])
  useRealtime('indicators', () => loadData())
  useRealtime('indicator_history', () => loadData())

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
        {indicators.map((ind) => (
          <IndicatorCard key={ind.id} indicator={ind} canEdit={canEdit} onUpdated={loadData} />
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

      <IndicatorFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSaved={loadData}
      />
    </div>
  )
}
