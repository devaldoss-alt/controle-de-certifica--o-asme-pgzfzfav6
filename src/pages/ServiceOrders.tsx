import { useEffect, useState } from 'react'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import { getServiceOrders, createServiceOrder, type ServiceOrder } from '@/services/service-orders'
import { getCompanies, type Company } from '@/services/companies'
import { getChecklists, type Checklist } from '@/services/api'
import { getMaxOS } from '@/lib/plans'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Briefcase, Calendar, Factory, ClipboardCheck, Building2 } from 'lucide-react'
import { safeFormatDate } from '@/lib/safe-data'
import { cn } from '@/lib/utils'
import { localizedField } from '@/lib/i18n-content'

const STATUS_STYLES: Record<string, string> = {
  Active: 'border-emerald-500/30 text-emerald-500',
  Completed: 'border-blue-500/30 text-blue-500',
  Paused: 'border-amber-500/30 text-amber-500',
}

export default function ServiceOrders() {
  const { t, lang } = useI18n()
  const { selectedCompanyId } = useCompany()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    number: '',
    client: '',
    equipment: '',
    standard: 'ASME',
    deadline: '',
    owner_company_id: '',
  })

  const loadData = async () => {
    try {
      const [data, clData, compData] = await Promise.all([
        getServiceOrders(statusFilter, selectedCompanyId),
        getChecklists(),
        getCompanies(),
      ])
      setOrders(data)
      setChecklists(clData)
      setCompanies(compData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter, selectedCompanyId])
  useRealtime('service_orders', () => loadData())

  const maxOS = getMaxOS(undefined)
  const canCreate = orders.length < maxOS

  const handleCreate = async () => {
    if (!form.number || !form.client || !form.equipment || !form.owner_company_id) return
    try {
      await createServiceOrder(form)
      setForm({
        number: '',
        client: '',
        equipment: '',
        standard: 'ASME',
        deadline: '',
        owner_company_id: '',
      })
      setDialogOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            <BilingualText k="page.serviceOrders.title" />
          </h1>
          <p className="text-muted-foreground">
            <BilingualText k="page.serviceOrders.desc" />
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={!canCreate}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          <BilingualText k="os.new" />
        </Button>
      </div>

      {!canCreate && (
        <p className="text-sm text-amber-500">
          <BilingualText k="msg.osLimitReached" />
        </p>
      )}

      <div className="flex gap-2">
        {['all', 'Active', 'Completed', 'Paused'].map((s) => (
          <Button
            key={s}
            variant={s === statusFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className={cn(
              s === statusFilter ? 'bg-primary' : 'border-white/10 text-muted-foreground',
            )}
          >
            {s === 'all' ? t('common.all') : t(`status.${s.toLowerCase()}`)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((os) => (
          <Card
            key={os.id}
            className="glass border-white/5 backdrop-blur-md hover:border-primary/20 transition-colors"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-primary font-semibold">{os.number}</span>
                <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[os.status])}>
                  {t(`status.${os.status.toLowerCase()}`)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-white/80">{os.client || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Factory className="w-3.5 h-3.5" />
                  <span className="text-white/80">
                    {localizedField(os.equipment, os.equipment_en, lang) || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {os.standard}
                    </Badge>
                    {os.expand?.owner_company_id && (
                      <Badge variant="outline" className="border-primary/20 text-primary text-xs">
                        <Building2 className="w-3 h-3 mr-1" />
                        {localizedField(
                          os.expand.owner_company_id.name,
                          os.expand.owner_company_id.name_en,
                          lang,
                        )}
                      </Badge>
                    )}
                  </div>
                  {os.deadline && os.deadline.trim() !== '' && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {safeFormatDate(os.deadline, 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
              </div>
              {(() => {
                const osItems = checklists.filter((c) => c.os_id === os.id)
                const done = osItems.filter(
                  (c) => c.status === 'completed' || c.approval_status === 'approved',
                ).length
                if (osItems.length === 0) return null
                return (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs">
                    <ClipboardCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground shrink-0">
                      {done}/{osItems.length}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{ width: `${(done / osItems.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>
            <BilingualText k="msg.noServiceOrders" />
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              <BilingualText k="os.new" />
            </DialogTitle>
            <DialogDescription>
              <BilingualText k="page.serviceOrders.desc" />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-white/80 mb-1 block">
                <BilingualText k="common.number" />
              </Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">
                <BilingualText k="common.client" />
              </Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">
                <BilingualText k="common.equipment" />
              </Label>
              <Input
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80 mb-1 block">
                  <BilingualText k="common.standard" />
                </Label>
                <Select
                  value={form.standard}
                  onValueChange={(v) => setForm({ ...form, standard: v })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASME">ASME</SelectItem>
                    <SelectItem value="NBIC">NBIC</SelectItem>
                    <SelectItem value="ISO 9001">ISO 9001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80 mb-1 block">
                  <BilingualText k="common.deadline" />
                </Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">
                <BilingualText k="os.ownerCompany" />
              </Label>
              <Select
                value={form.owner_company_id}
                onValueChange={(v) => setForm({ ...form, owner_company_id: v })}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              <BilingualText k="common.cancel" />
            </Button>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              <BilingualText k="common.create" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
