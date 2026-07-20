import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import { getChecklists, getUsers, type Checklist, type User } from '@/services/api'
import { generateComplianceReport } from '@/services/reports'
import useRealtime from '@/hooks/use-realtime'
import { ErrorBoundary, WidgetErrorFallback } from '@/components/ErrorBoundary'
import { ManagerDashboardSkeleton } from '@/components/ManagerDashboardSkeleton'
import {
  safeArray,
  safeDifferenceInDays,
  safeFormatDate,
  safeRole,
  safeString,
} from '@/lib/safe-data'
import { localizedField } from '@/lib/i18n-content'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Clock,
  FileDown,
  CheckCircle,
} from 'lucide-react'

export function ManagerDashboard() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [clData, uData] = await Promise.all([getChecklists(), getUsers()])
      setChecklists(safeArray(clData))
      setUsers(safeArray(uData))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('checklists', () => loadData())

  const safeChecklists = safeArray(checklists)
  const safeUsers = safeArray(users)

  const pending = safeChecklists.filter((c) => c && c.status === 'pending').length
  const awaiting = safeChecklists.filter(
    (c) => c && c.status === 'completed' && c.approval_status === 'pending',
  ).length
  const approved = safeChecklists.filter((c) => c && c.approval_status === 'approved').length
  const expired = safeChecklists.filter(
    (c) => c && c.status === 'pending' && safeDifferenceInDays(c.due_date) < 0,
  ).length

  const roleStats = safeChecklists.reduce(
    (acc, c) => {
      if (!c || !c.role_assigned) return acc
      const role = safeRole(c.role_assigned)
      if (!acc[role]) {
        acc[role] = { total: 0, done: 0 }
      }
      acc[role].total += 1
      if (c.status === 'completed' || c.approval_status === 'approved') {
        acc[role].done += 1
      }
      return acc
    },
    {} as Record<string, { total: number; done: number }>,
  )

  const pendingApprovals = safeChecklists
    .filter((c) => c && c.status === 'completed' && c.approval_status === 'pending')
    .slice(0, 5)

  if (loading) {
    return <ManagerDashboardSkeleton />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <ErrorBoundary message="Erro ao carregar o cabeçalho do dashboard.">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              <BilingualText k="dashboard.title" />
            </h1>
            <p className="text-muted-foreground">
              {t('dashboard.subtitle')} - {safeString(user?.name, t('common.user'))}
            </p>
          </div>
          <Button
            onClick={() => generateComplianceReport(safeChecklists, safeUsers, t)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileDown className="w-4 h-4 mr-2" /> <BilingualText k="dashboard.exportReport" />
          </Button>
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
                  <BilingualText k="dashboard.awaitingApprovalShort" />
                </p>
                <h3 className="text-3xl font-bold text-amber-500">{awaiting}</h3>
                {awaiting > 0 && (
                  <Link
                    to="/approvals"
                    className="text-xs text-amber-500 hover:underline mt-1 inline-block"
                  >
                    <BilingualText k="dashboard.reviewEvidence" />
                  </Link>
                )}
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
                  <BilingualText k="dashboard.approved" />
                </p>
                <h3 className="text-3xl font-bold text-emerald-500">{approved}</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ErrorBoundary
          message="Erro ao carregar aprovações pendentes."
          fallback={<WidgetErrorFallback />}
        >
          <Card className="glass border-white/5">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                <BilingualText k="dashboard.awaitingApprovalList" />
              </CardTitle>
              <Link to="/approvals" className="text-xs text-primary hover:underline">
                <BilingualText k="dashboard.viewAll" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {safeArray(pendingApprovals).map((item) => {
                  if (!item) return null
                  return (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white mb-1 line-clamp-1">
                          {localizedField(safeString(item.title), item.title_en, lang) ||
                            t('dashboard.noTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {safeRole(item.role_assigned)} - {t('dashboard.ref')}:{' '}
                          {safeString(item.mcq_ref, t('common.na'))}
                        </p>
                      </div>
                      <span className="text-xs text-amber-500 shrink-0">
                        {safeFormatDate(item.due_date, 'dd/MM')}
                      </span>
                    </div>
                  )
                })}
                {pendingApprovals.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <BilingualText k="dashboard.noPendingApprovals" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary
          message="Erro ao carregar conformidade por cargo."
          fallback={<WidgetErrorFallback />}
        >
          <Card className="glass border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg">
                <BilingualText k="dashboard.complianceByRole" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(roleStats).map(([role, s]) => {
                const pct = s.total === 0 ? 100 : Math.round((s.done / s.total) * 100)
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{safeRole(role)}</span>
                      <span className="text-white font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2 bg-white/5" />
                  </div>
                )
              })}
              {Object.keys(roleStats).length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  <BilingualText k="dashboard.noComplianceData" />
                </div>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </div>
  )
}
