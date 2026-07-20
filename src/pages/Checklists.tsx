import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import {
  getChecklists,
  updateChecklistStatus,
  parseEvidenceFiles,
  type Checklist,
} from '@/services/api'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import useRealtime from '@/hooks/use-realtime'
import { useCompany } from '@/hooks/use-company'
import { EvidenceDialog } from '@/components/EvidenceDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, FileText, CheckCircle2, Lock, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeDifferenceInHours, safeFormatDate, safeParseEvidenceFiles } from '@/lib/safe-data'

export default function Checklists() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [osFilter, setOsFilter] = useState('all')
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [evidenceItem, setEvidenceItem] = useState<Checklist | null>(null)
  const isManager = user?.role === 'Manager'
  const { selectedCompanyId } = useCompany()

  const loadData = async () => {
    try {
      const [data, osData] = await Promise.all([
        getChecklists(
          isManager ? undefined : user?.role,
          categoryFilter,
          osFilter === 'all' ? undefined : osFilter,
          selectedCompanyId,
        ),
        getServiceOrders(undefined, selectedCompanyId),
      ])
      setChecklists(data)
      setServiceOrders(osData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, categoryFilter, osFilter, selectedCompanyId])
  useRealtime('checklists', () => loadData())

  const handleToggle = async (item: Checklist) => {
    if (isManager || item.locked) return
    if (item.status === 'completed') {
      try {
        await updateChecklistStatus(item.id, 'pending')
      } catch (e) {
        console.error(e)
      }
    } else {
      setEvidenceItem(item)
    }
  }

  const getDeadlineBadge = (item: Checklist) => {
    if (item.locked)
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
          <Lock className="w-3 h-3 mr-1" />
          {t('status.approved')}
        </Badge>
      )
    if (
      item.is_critical &&
      item.status === 'pending' &&
      item.evidence_file &&
      item.approval_status === 'pending'
    )
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-500">
          <AlertCircle className="w-3 h-3 mr-1" />
          {t('approval.pendingAnalysis')}{' '}
        </Badge>
      )
    if (item.status === 'completed' && item.approval_status === 'pending')
      return (
        <Badge variant="outline" className="border-blue-500/30 text-blue-500">
          {t('os.awaiting')}
        </Badge>
      )
    if (item.approval_status === 'rejected')
      return (
        <Badge variant="destructive" className="bg-rose-500/20 text-rose-400">
          {t('status.rejected')}
        </Badge>
      )
    const hours = safeDifferenceInHours(item.due_date)
    if (hours === 0 && !item.due_date)
      return (
        <Badge variant="outline" className="border-white/10 text-muted-foreground">
          {t('qualifications.noDate')}
        </Badge>
      )
    if (hours < 0)
      return (
        <Badge variant="destructive" className="bg-rose-500/20 text-rose-400">
          {t('status.expired')}
        </Badge>
      )
    if (hours <= 48)
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-500">
          {safeFormatDate(item.due_date, 'dd/MM')}
        </Badge>
      )
    return (
      <Badge variant="outline" className="border-white/10 text-muted-foreground">
        {safeFormatDate(item.due_date, 'dd/MM/yyyy')}
      </Badge>
    )
  }

  const getCardStyle = (item: Checklist) => {
    if (item.locked) return 'border-emerald-500/20 bg-emerald-500/5'
    if (
      item.is_critical &&
      item.status === 'pending' &&
      item.evidence_file &&
      item.approval_status === 'pending'
    )
      return 'border-amber-500/20 bg-amber-500/5'
    if (item.status === 'completed') return 'border-blue-500/20 bg-blue-500/5'
    if (item.approval_status === 'rejected') return 'border-rose-500/30 bg-rose-500/5'
    const hours = safeDifferenceInHours(item.due_date)
    if (!item.due_date) return 'border-white/5 bg-card/40'
    if (hours < 0) return 'border-rose-500/30 bg-rose-500/5'
    if (hours <= 48) return 'border-amber-500/30 bg-amber-500/5'
    return 'border-white/5 bg-card/40'
  }

  const grouped = checklists.reduce(
    (acc, item) => {
      const role = item.role_assigned
      if (!acc[role]) acc[role] = []
      acc[role].push(item)
      return acc
    },
    {} as Record<string, Checklist[]>,
  )

  const filterBtn = (active: boolean) =>
    cn(
      'text-xs h-7',
      active ? 'bg-primary text-primary-foreground' : 'border-white/10 text-muted-foreground',
    )

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          <BilingualText k="page.checklists.title" />
        </h1>
        <p className="text-muted-foreground">
          <BilingualText k="page.checklists.desc" />
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1.5">
          {['all', 'Departmental', 'OS', 'ISO 9001'].map((c) => (
            <Button
              key={c}
              variant={c === categoryFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(c)}
              className={filterBtn(c === categoryFilter)}
            >
              {c === 'all'
                ? t('filter.allCategories')
                : c === 'Departmental'
                  ? t('filter.departmental')
                  : c === 'OS'
                    ? t('filter.osLinked')
                    : t('filter.iso9001')}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">OS:</span>
          <Select value={osFilter} onValueChange={setOsFilter}>
            <SelectTrigger className="w-48 h-7 text-xs bg-black/20 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {serviceOrders.map((os) => (
                <SelectItem key={os.id} value={os.id}>
                  {os.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.entries(grouped).map(([role, items]) => (
        <div key={role} className="space-y-3">
          {isManager && (
            <h2 className="text-lg font-heading font-semibold text-primary flex items-center gap-2">
              <div className="w-8 h-px bg-primary/30" />
              {role}
              <div className="flex-1 h-px bg-primary/10" />
            </h2>
          )}
          <div className="grid gap-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'transition-all duration-300 backdrop-blur-md',
                  getCardStyle(item),
                  item.locked && 'opacity-75',
                )}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="pt-1">
                    <Checkbox
                      checked={item.status === 'completed' || item.locked}
                      onCheckedChange={() => handleToggle(item)}
                      disabled={isManager || item.locked}
                      className={cn(
                        'w-6 h-6 rounded-md border-2',
                        item.locked
                          ? 'bg-emerald-500 border-emerald-500'
                          : item.status === 'completed'
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-muted-foreground',
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3
                        className={cn(
                          'font-medium text-base',
                          item.locked ? 'text-muted-foreground' : 'text-white',
                          item.status === 'completed' && !item.locked && 'text-muted-foreground',
                        )}
                      >
                        {item.title}
                      </h3>
                      <div className="shrink-0 flex items-center gap-2">
                        {item.category && (
                          <Badge variant="outline" className="border-white/10 text-xs">
                            {item.category}
                          </Badge>
                        )}
                        {item.expand?.os_id && (
                          <Badge
                            variant="outline"
                            className="border-primary/20 text-primary text-xs"
                          >
                            {item.expand.os_id.number}
                          </Badge>
                        )}
                        {item.is_critical && !item.locked && (
                          <Badge variant="outline" className="border-rose-500/30 text-rose-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {t('os.critical')}
                          </Badge>
                        )}
                        {safeParseEvidenceFiles(item.evidence_file).length > 0 && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/20 text-emerald-500 text-xs"
                          >
                            <Paperclip className="w-3 h-3 mr-1" />
                            {safeParseEvidenceFiles(item.evidence_file).length}
                          </Badge>
                        )}
                        {getDeadlineBadge(item)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      {item.mcq_ref && (
                        <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded border border-white/5">
                          <FileText className="w-3 h-3" />
                          {item.mcq_ref}
                        </span>
                      )}
                      {item.expand?.last_action_by && (
                        <span className="text-white/40">{item.expand.last_action_by.name}</span>
                      )}
                    </div>
                    {item.approval_status === 'rejected' && item.rejection_comment && (
                      <div className="mt-2 p-2 rounded bg-rose-500/5 border border-rose-500/10">
                        <p className="text-xs text-rose-400">{item.rejection_comment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {checklists.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>
            <BilingualText k="msg.noChecklists" />
          </p>
        </div>
      )}

      <EvidenceDialog
        open={!!evidenceItem}
        onOpenChange={(v) => !v && setEvidenceItem(null)}
        checklist={evidenceItem}
        onSubmitted={loadData}
      />
    </div>
  )
}
