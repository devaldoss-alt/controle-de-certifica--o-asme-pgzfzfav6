import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import {
  getChecklists,
  updateChecklistStatus,
  parseEvidenceFiles,
  type Checklist,
} from '@/services/api'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import pb from '@/lib/pocketbase/client'
import type { TeamMember } from '@/services/team'
import useRealtime from '@/hooks/use-realtime'
import { useCompany } from '@/hooks/use-company'
import { EvidenceDialog } from '@/components/EvidenceDialog'
import { HowToDialog } from '@/components/HowToDialog'
import { ContextualHelpButton } from '@/components/ContextualHelpButton'
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
import { AlertCircle, FileText, CheckCircle2, Lock, Paperclip, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeDifferenceInHours, safeFormatDate, safeParseEvidenceFiles } from '@/lib/safe-data'
import { localizedField } from '@/lib/i18n-content'

export default function Checklists() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [osFilter, setOsFilter] = useState('all')
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [evidenceItem, setEvidenceItem] = useState<Checklist | null>(null)
  const [tutorialItem, setTutorialItem] = useState<Checklist | null>(null)
  const isManager = user?.role === 'Manager' || user?.role === 'Consultor'
  const isApontador = user?.role === 'Apontador'
  const { selectedCompanyId } = useCompany()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('checklistId')

  const loadData = async () => {
    try {
      const [data, osData] = await Promise.all([
        getChecklists(
          isManager || isApontador ? undefined : user?.role,
          categoryFilter,
          osFilter === 'all' ? undefined : osFilter,
          selectedCompanyId,
        ),
        getServiceOrders(undefined, selectedCompanyId),
      ])

      if (isApontador) {
        let apontadorChecklists = data.filter((c: any) => c.apontador_id === user?.id)

        try {
          // 2.a: Buscar na collection `team` os registros da empresa atual em que esse usuário é o Apontador
          const teamFilters: string[] = ['is_indicator = true']
          if (selectedCompanyId && selectedCompanyId !== 'all') {
            teamFilters.push(`company_id = "${selectedCompanyId}"`)
          }
          if (user?.email) {
            teamFilters.push(
              `(name ~ "${user.name || ''}" || name ~ "${user.email.split('@')[0]}" || id = "${user.id}")`,
            )
          }

          // Busca primeiro com filtro contextual do apontador logado
          let myApontadorRecords = await pb.collection('team').getFullList<TeamMember>({
            filter: teamFilters.join(' && '),
          })

          // Se não encontrou pelo nome/email composto, busca todos is_indicator da empresa
          if (myApontadorRecords.length === 0) {
            const fallbackFilters = ['is_indicator = true']
            if (selectedCompanyId && selectedCompanyId !== 'all') {
              fallbackFilters.push(`company_id = "${selectedCompanyId}"`)
            }
            const allIndicators = await pb.collection('team').getFullList<TeamMember>({
              filter: fallbackFilters.join(' && '),
            })

            // Match por nome (ex: Roberta, Agnaldo) ou email do usuário logado
            const userNameLower = (user?.name || '').toLowerCase().trim()
            const userEmailLower = (user?.email || '').toLowerCase().trim()
            const userEmailPrefix = userEmailLower.split('@')[0]

            const matched = allIndicators.filter((m) => {
              const mName = (m.name || '').toLowerCase()
              return (
                (userNameLower && mName.includes(userNameLower)) ||
                (userEmailPrefix && mName.includes(userEmailPrefix)) ||
                (userNameLower && userNameLower.includes(mName))
              )
            })

            // Se ainda não deu match específico mas há apenas apontadores na empresa ou o usuário é 'Apontador',
            // usa os apontadores encontrados para obter os operadores vinculados
            myApontadorRecords = matched.length > 0 ? matched : allIndicators
          }

          // 2.b: Extrair os linked_operators (IDs ou nomes dos operadores)
          const linkedOpIdentifiers: string[] = []
          for (const rec of myApontadorRecords) {
            const raw = rec.linked_operators
            let list: string[] = []
            if (Array.isArray(raw)) {
              list = raw
            } else if (typeof raw === 'string' && raw.trim()) {
              try {
                const parsed = JSON.parse(raw)
                list = Array.isArray(parsed) ? parsed : [raw]
              } catch {
                list = raw.split(',').map((s) => s.trim())
              }
            }
            for (const item of list) {
              const str = String(item).trim()
              if (str && !linkedOpIdentifiers.includes(str)) {
                linkedOpIdentifiers.push(str)
              }
            }
          }

          // 2.c: Buscar os cargos desses operadores na collection `team`
          const operatorRoles = new Set<string>()

          if (linkedOpIdentifiers.length > 0) {
            // Os identificadores podem ser IDs ou nomes de operadores no `team`
            // Buscar operadores no team correspondentes
            const idChunks = linkedOpIdentifiers.map((id) => `id = "${id}" || name = "${id}"`)
            // Divide em lotes caso haja muitos
            const filterExpr = `(${idChunks.join(' || ')})`
            const operators = await pb.collection('team').getFullList<TeamMember>({
              filter: filterExpr,
            })

            for (const op of operators) {
              if (op.role && op.role.trim() && op.role !== 'Colaborador') {
                operatorRoles.add(op.role.trim())
              }
              // Caso o cargo no team seja "Colaborador", mas o departamento indique o cargo funcional (ex: SOLDA -> Welder)
              const dept = (op.department || '').toUpperCase().trim()
              if (dept === 'SOLDA') {
                operatorRoles.add('Welder')
              }
            }
          }

          // 2.d: Busque os checklists cujo `role_assigned` contenha QUALQUER um desses cargos,
          // OU cujo `apontador_id` seja igual ao id do usuário logado. Exiba essa lista unificada.
          const rolesArray = Array.from(operatorRoles)
          const matchesOperatorRoles = (chk: Checklist) => {
            if (rolesArray.length === 0) return false
            const assigned = chk.role_assigned
            const assignedList = Array.isArray(assigned)
              ? assigned
              : typeof assigned === 'string'
                ? [assigned]
                : []
            return assignedList.some((r) =>
              rolesArray.some((targetRole) => r.toLowerCase() === targetRole.toLowerCase()),
            )
          }

          const unified = data.filter(
            (c: any) => c.apontador_id === user?.id || matchesOperatorRoles(c),
          )

          // Fallback seguro: se a lista unificada tiver registros, usa ela, senão fallback para apontador_id
          apontadorChecklists = unified.length > 0 ? unified : apontadorChecklists
        } catch (err) {
          console.error('Erro ao buscar checklists de operadores vinculados para Apontador:', err)
          // 4. Se a busca de operadores vinculados falhar, fallback atual sem quebrar a tela
        }

        setChecklists(apontadorChecklists)
      } else {
        setChecklists(data)
      }
      setServiceOrders(osData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, categoryFilter, osFilter, selectedCompanyId])
  useRealtime('checklists', () => loadData())

  useEffect(() => {
    if (highlightId && checklists.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`checklist-${highlightId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [highlightId, checklists])

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            <BilingualText k="page.checklists.title" />
          </h1>
          <p className="text-muted-foreground">
            <BilingualText k="page.checklists.desc" />
          </p>
        </div>
        <ContextualHelpButton variant="button" />
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1.5">
          {['all', 'Departmental', 'ISO 9001'].map((c) => (
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
                  : t('filter.iso9001')}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={categoryFilter === 'OS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('OS')}
            className={filterBtn(categoryFilter === 'OS')}
          >
            {t('filter.osLinked')}
          </Button>
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
                id={`checklist-${item.id}`}
                className={cn(
                  'transition-all duration-500 backdrop-blur-md',
                  getCardStyle(item),
                  item.locked && 'opacity-75',
                  highlightId === item.id &&
                    'ring-2 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]',
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
                        {localizedField(item.title, item.title_en, lang)}
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
                      {item.tutorial && (
                        <button
                          onClick={() => setTutorialItem(item)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          {lang === 'pt' ? 'Como Fazer' : 'How-To'}
                        </button>
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
                    {item.approval_status === 'approved' && (item as any).approval_comment && (
                      <div className="mt-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-xs text-emerald-400">{(item as any).approval_comment}</p>
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

      <HowToDialog
        open={!!tutorialItem}
        onOpenChange={(v) => !v && setTutorialItem(null)}
        title={tutorialItem?.title || ''}
        tutorial={tutorialItem?.tutorial || ''}
      />

      <EvidenceDialog
        open={!!evidenceItem}
        onOpenChange={(v) => !v && setEvidenceItem(null)}
        checklist={evidenceItem}
        onSubmitted={loadData}
      />
    </div>
  )
}
