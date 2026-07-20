import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import {
  getChecklists,
  getInteractions,
  updateChecklistStatus,
  type Checklist,
  type Interaction,
} from '@/services/api'
import { roleData } from '@/lib/role-data'
import useRealtime from '@/hooks/use-realtime'
import { ErrorBoundary, WidgetErrorFallback } from '@/components/ErrorBoundary'
import { OperationalDashboardSkeleton } from '@/components/OperationalDashboardSkeleton'
import {
  safeArray,
  safeDifferenceInDays,
  safeDifferenceInHours,
  safeFormatDate,
  safeRole,
  safeString,
} from '@/lib/safe-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowRight,
  Target,
  FileText,
  AlertCircle,
  Paperclip,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { localizedField } from '@/lib/i18n-content'

export function OperationalDashboard() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [clData, intData] = await Promise.all([
        getChecklists(user?.role),
        getInteractions(user?.role),
      ])
      setChecklists(safeArray(clData))
      setInteractions(safeArray(intData))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('checklists', () => loadData())
  useRealtime('interactions', () => loadData())

  const safeChecklists = safeArray(checklists)
  const safeInteractions = safeArray(interactions)

  const pending = safeChecklists.filter((c) => c && c.status === 'pending').length
  const completed = safeChecklists.filter(
    (c) => c && (c.status === 'completed' || c.approval_status === 'approved'),
  ).length
  const critical = safeChecklists.filter((c) => c && c.is_critical && c.status === 'pending').length
  const expired = safeChecklists.filter(
    (c) => c && c.status === 'pending' && safeDifferenceInDays(c.due_date) < 0,
  ).length

  const userRole = safeRole(user?.role)
  const data = roleData[userRole] ??
    roleData['Unknown'] ?? {
      objetivo: '',
      authorities: [],
      responsibilities: [],
      observacoes: '',
    }

  const handleToggle = async (item: Checklist) => {
    if (!item || item.locked) return
    try {
      const newStatus = item.status === 'pending' ? 'completed' : 'pending'
      await updateChecklistStatus(item.id, newStatus)
    } catch (e) {
      console.error('Update failed', e)
    }
  }

  if (loading) {
    return <OperationalDashboardSkeleton />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <ErrorBoundary message="Erro ao carregar cabeçalho.">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {t('dashboard.welcome')}, {safeString(user?.name, t('common.user'))}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.responsibilitiesOverview')}{' '}
            <strong className="text-primary">{userRole}</strong>.
          </p>
        </div>
      </ErrorBoundary>

      <ErrorBoundary message="Erro ao carregar estatísticas." fallback={<WidgetErrorFallback />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <BilingualText k="dashboard.pending" />
                </p>
                <h3 className="text-3xl font-bold text-white">{pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <BilingualText k="dashboard.completed" />
                </p>
                <h3 className="text-3xl font-bold text-emerald-500">{completed}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <BilingualText k="dashboard.critical" />
                </p>
                <h3 className="text-3xl font-bold text-amber-500">{critical}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <BilingualText k="dashboard.expired" />
                </p>
                <h3 className="text-3xl font-bold text-rose-500">{expired}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>

      <ErrorBoundary
        message="Erro ao carregar objetivo da função."
        fallback={<WidgetErrorFallback />}
      >
        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <BilingualText k="dashboard.roleObjective" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {safeString(data?.objetivo, t('common.na'))}
            </p>
            <div className="mt-3 p-3 rounded bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-500 mb-1">
                  <BilingualText k="dashboard.observations" />
                </p>
                <p className="text-xs text-muted-foreground">
                  {safeString(data?.observacoes, t('common.na'))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary
          message="Erro ao carregar responsabilidades."
          fallback={<WidgetErrorFallback />}
        >
          <Card className="glass border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg">
                <BilingualText k="dashboard.responsibilities" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {safeArray(data?.responsibilities).map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ClipboardCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{safeString(r, t('common.na'))}</span>
                </div>
              ))}
              {safeArray(data?.responsibilities).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  <BilingualText k="common.noData" />
                </p>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary message="Erro ao carregar autoridades." fallback={<WidgetErrorFallback />}>
          <Card className="glass border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg">
                <BilingualText k="dashboard.authorities" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {safeArray(data?.authorities).map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{safeString(a, t('common.na'))}</span>
                </div>
              ))}
              {safeArray(data?.authorities).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  <BilingualText k="common.noData" />
                </p>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>

      <ErrorBoundary
        message="Erro ao carregar checklist de execução."
        fallback={<WidgetErrorFallback />}
      >
        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg">
              <BilingualText k="dashboard.executionChecklist" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {safeChecklists.map((item) => {
                if (!item) return null
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 flex items-start gap-3 hover:bg-white/5 transition-colors',
                      item.locked && 'opacity-60',
                    )}
                  >
                    <Checkbox
                      checked={item.status === 'completed' || item.locked}
                      onCheckedChange={() => handleToggle(item)}
                      disabled={item.locked}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm',
                          item.status === 'completed' || item.locked
                            ? 'text-muted-foreground line-through'
                            : 'text-white',
                        )}
                      >
                        {localizedField(safeString(item.title), item.title_en, lang) ||
                          t('dashboard.noTitle')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-black/20 px-2 py-0.5 rounded border border-white/5">
                          <FileText className="w-3 h-3" />
                          {safeString(item.mcq_ref, t('common.na'))}
                        </span>
                        {item.is_critical && (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 text-rose-500 text-xs"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {t('dashboard.critical')}
                          </Badge>
                        )}
                        {item.evidence_file && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/20 text-emerald-500 text-xs"
                          >
                            <Paperclip className="w-3 h-3 mr-1" />
                            <BilingualText k="common.evidence" />
                          </Badge>
                        )}
                        {(() => {
                          const hours = safeDifferenceInHours(item.due_date)
                          if (hours < 0 && item.status === 'pending')
                            return (
                              <span className="text-xs text-rose-500">
                                <BilingualText k="status.expired" />
                              </span>
                            )
                          if (item.status === 'pending')
                            return (
                              <span className="text-xs text-muted-foreground">
                                {safeFormatDate(item.due_date, 'dd/MM')}
                              </span>
                            )
                          return null
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
              {safeChecklists.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <BilingualText k="dashboard.noChecklistAssigned" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary message="Erro ao carregar interações." fallback={<WidgetErrorFallback />}>
        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg">
              <BilingualText k="dashboard.interactions" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {safeInteractions.map((int) => {
              if (!int) return null
              return (
                <div key={int.id} className="text-sm border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary font-medium">{safeRole(int.source_role)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-primary font-medium">{safeRole(int.target_role)}</span>
                    {int.mcq_ref && (
                      <span className="text-xs text-muted-foreground font-mono">
                        [{safeString(int.mcq_ref, t('common.na'))}]
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {safeString(int.description, t('common.na'))}
                  </p>
                </div>
              )
            })}
            {safeInteractions.length === 0 && (
              <div className="text-center text-muted-foreground text-sm">
                <BilingualText k="dashboard.noInteractions" />
              </div>
            )}
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
