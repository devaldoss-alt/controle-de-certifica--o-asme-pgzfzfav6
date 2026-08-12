import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n, BilingualText } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getPackingSlips,
  getPackingSlip,
  getNextPackingSlipNumber,
  createPackingSlip,
  updatePackingSlip,
  deletePackingSlip,
  type PackingSlip,
  type PackingSlipItem,
  type PackingSlipGRV,
} from '@/services/packing-slips'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import { getUsers, type User } from '@/services/api'
import { generatePackingSlipPDF } from '@/lib/packing-slip-pdf'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  FileText,
  Printer,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  User as UserIcon,
  Building2,
  Layers,
} from 'lucide-react'

const EMPTY_ITEM: PackingSlipItem = {
  item: 1,
  quantity: 1,
  unit: 'UN',
  description: '',
  observation: '',
}

const EMPTY_GRV: PackingSlipGRV = {
  code: '',
  description: '',
  value: '',
  type: 'MATERIAL',
  sector: '',
  requester: '',
}

export default function PackingSlips() {
  const { user } = useAuth()
  const { selectedCompanyId, companies } = useCompany()
  const { lang, t } = useI18n()
  const { toast } = useToast()

  const [slips, setPackingSlips] = useState<PackingSlip[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Dialog State
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form State matching FSGQ 8.5-22
  const [formData, setFormData] = useState({
    number: 1001,
    issue_date: new Date().toISOString().split('T')[0],
    type: 'Entrada' as 'Entrada' | 'Saída' | 'Cancelamento',
    recipient_origin: '',
    origin_location: '',
    destination_location: '',
    delivery_responsible: '',
    responsible_id: '',
    os_id: '',
    oc_number: '',
    nfe_number: '',
    doc_non_official: '',
    cm_number: '',
    contact_phone: '',
    warehouse_responsible: '',
    cq_pcp_responsible: '',
    sector: '',
    requester: '',
    in_charge: '',
    status: 'Finalized' as 'Draft' | 'Finalized' | 'Cancelled',
  })

  const [items, setItems] = useState<PackingSlipItem[]>([{ ...EMPTY_ITEM, item: 1 }])
  const [grvItems, setGrvItems] = useState<PackingSlipGRV[]>([{ ...EMPTY_GRV }])

  const canManage = ['Manager', 'QCC', 'Consultor', 'Apontador'].includes(user?.role || '')

  const loadData = async () => {
    try {
      setLoading(true)
      const [slipsData, osData, uData] = await Promise.all([
        getPackingSlips(selectedCompanyId),
        getServiceOrders('all', selectedCompanyId),
        getUsers(selectedCompanyId),
      ])
      setPackingSlips(slipsData)
      setServiceOrders(osData)
      setUsersList(uData)
    } catch (e) {
      console.error(e)
      toast({
        title: lang === 'pt' ? 'Erro ao carregar romaneios' : 'Error loading packing slips',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])

  useRealtime('packing_slips', () => loadData())

  const handleOpenCreate = async (forcedType?: 'Entrada' | 'Saída' | 'Cancelamento') => {
    setEditingId(null)
    setFieldErrors({})
    const effectiveCompany =
      selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''
    const nextNum = await getNextPackingSlipNumber(effectiveCompany)

    setFormData({
      number: nextNum,
      issue_date: new Date().toISOString().split('T')[0],
      type: forcedType || 'Entrada',
      recipient_origin: '',
      origin_location: '',
      destination_location: '',
      delivery_responsible: user?.name || '',
      responsible_id: user?.id || '',
      os_id: '',
      oc_number: 'N/A',
      nfe_number: 'N/A',
      doc_non_official: 'N/A',
      cm_number: 'N/A',
      contact_phone: '',
      warehouse_responsible: user?.name || '',
      cq_pcp_responsible: '',
      sector: '',
      requester: '',
      in_charge: '',
      status: forcedType === 'Cancelamento' ? 'Cancelled' : 'Finalized',
    })
    setItems([{ ...EMPTY_ITEM, item: 1 }])
    setGrvItems([{ ...EMPTY_GRV }])
    setIsOpen(true)
  }

  const handleOpenEdit = async (slip: PackingSlip) => {
    setEditingId(slip.id)
    setFieldErrors({})
    try {
      const full = await getPackingSlip(slip.id)
      setFormData({
        number: full.number || 1001,
        issue_date: full.issue_date
          ? full.issue_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
        type: full.type || 'Entrada',
        recipient_origin: full.recipient_origin || '',
        origin_location: full.origin_location || '',
        destination_location: full.destination_location || '',
        delivery_responsible: full.delivery_responsible || '',
        responsible_id: full.responsible_id || '',
        os_id: full.os_id || '',
        oc_number: full.oc_number || '',
        nfe_number: full.nfe_number || '',
        doc_non_official: full.doc_non_official || '',
        cm_number: full.cm_number || '',
        contact_phone: full.contact_phone || '',
        warehouse_responsible: full.warehouse_responsible || '',
        cq_pcp_responsible: full.cq_pcp_responsible || '',
        sector: full.sector || '',
        requester: full.requester || '',
        in_charge: full.in_charge || '',
        status: full.status || 'Finalized',
      })
      setItems(full.items && full.items.length > 0 ? full.items : [{ ...EMPTY_ITEM, item: 1 }])
      setGrvItems(full.grv_info && full.grv_info.length > 0 ? full.grv_info : [{ ...EMPTY_GRV }])
      setIsOpen(true)
    } catch (e) {
      toast({
        title: lang === 'pt' ? 'Erro ao carregar detalhes' : 'Error loading details',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM, item: prev.length + 1 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    const next = items.filter((_, i) => i !== index).map((it, i) => ({ ...it, item: i + 1 }))
    setItems(next)
  }

  const handleItemChange = (index: number, key: keyof PackingSlipItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [key]: val }
      return copy
    })
  }

  const handleAddGrv = () => {
    setGrvItems((prev) => [...prev, { ...EMPTY_GRV }])
  }

  const handleRemoveGrv = (index: number) => {
    setGrvItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGrvChange = (index: number, key: keyof PackingSlipGRV, val: any) => {
    setGrvItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [key]: val }
      return copy
    })
  }

  const handleSave = async () => {
    setFieldErrors({})
    const effectiveCompany =
      selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''

    if (!effectiveCompany) {
      toast({
        title: lang === 'pt' ? 'Selecione uma empresa' : 'Select a company',
        description:
          lang === 'pt' ? 'É necessário definir a empresa do romaneio' : 'Company is required',
        variant: 'destructive',
      })
      return
    }

    const payload: Partial<PackingSlip> = {
      ...formData,
      company_id: effectiveCompany,
      items: items.filter((i) => i.description.trim() !== ''),
      grv_info: grvItems.filter((g) => g.code.trim() !== '' || g.description.trim() !== ''),
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await updatePackingSlip(editingId, payload)
        toast({ title: lang === 'pt' ? 'Romaneio atualizado' : 'Packing slip updated' })
      } else {
        await createPackingSlip(payload)
        toast({ title: lang === 'pt' ? 'Romaneio criado com sucesso' : 'Packing slip created' })
      }
      setIsOpen(false)
      loadData()
    } catch (e) {
      const errs = extractFieldErrors(e)
      setFieldErrors(errs)
      toast({
        title: lang === 'pt' ? 'Erro ao salvar romaneio' : 'Error saving packing slip',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deletePackingSlip(deleteTarget)
      toast({ title: lang === 'pt' ? 'Romaneio excluído' : 'Packing slip deleted' })
      loadData()
    } catch (e) {
      toast({
        title: lang === 'pt' ? 'Erro ao excluir' : 'Error deleting',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handlePrintPdf = (slip: PackingSlip) => {
    const compName = slip.expand?.company_id?.name || 'PSC Proserco'
    generatePackingSlipPDF(slip, compName)
  }

  const filteredSlips = slips.filter((slip) => {
    const matchesType = typeFilter === 'all' || slip.type === typeFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      String(slip.number).includes(q) ||
      (slip.recipient_origin || '').toLowerCase().includes(q) ||
      (slip.nfe_number || '').toLowerCase().includes(q) ||
      (slip.doc_non_official || '').toLowerCase().includes(q) ||
      (slip.oc_number || '').toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              FSGQ 8.5-22 - REV.02
            </span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">
            {lang === 'pt' ? 'Gestão de Romaneios' : 'Packing Slips Management'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'pt'
              ? 'Controle de Entrada, Saída e Cancelamento de Mercadorias'
              : 'Inbound, Outbound and Cancellation Goods Tracking'}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => handleOpenCreate('Entrada')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {lang === 'pt' ? 'Entrada' : 'Inbound'}
            </Button>
            <Button
              onClick={() => handleOpenCreate('Saída')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {lang === 'pt' ? 'Saída' : 'Outbound'}
            </Button>
            <Button
              onClick={() => handleOpenCreate('Cancelamento')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {lang === 'pt' ? 'Cancelamento' : 'Cancel'}
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
            className={
              typeFilter === 'all' ? 'bg-primary' : 'border-white/10 text-muted-foreground'
            }
          >
            {lang === 'pt' ? 'Todos' : 'All'}
          </Button>
          <Button
            variant={typeFilter === 'Entrada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('Entrada')}
            className={
              typeFilter === 'Entrada'
                ? 'bg-emerald-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            {lang === 'pt' ? 'Entrada' : 'Inbound'}
          </Button>
          <Button
            variant={typeFilter === 'Saída' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('Saída')}
            className={
              typeFilter === 'Saída'
                ? 'bg-rose-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            {lang === 'pt' ? 'Saída' : 'Outbound'}
          </Button>
          <Button
            variant={typeFilter === 'Cancelamento' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('Cancelamento')}
            className={
              typeFilter === 'Cancelamento'
                ? 'bg-amber-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            {lang === 'pt' ? 'Cancelamento' : 'Cancelled'}
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === 'pt'
                ? 'Buscar por nº, NF-e, destinatário...'
                : 'Search by #, invoice, recipient...'
            }
            className="bg-black/20 border-white/10 text-white pl-9"
          />
        </div>
      </div>

      {/* Grid of Slips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSlips.map((slip) => {
          const typeBadgeColor =
            slip.type === 'Entrada'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : slip.type === 'Saída'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'

          return (
            <Card
              key={slip.id}
              className="glass border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold font-mono text-primary">
                    ROM #{slip.number}
                  </span>
                  <Badge variant="outline" className={`font-semibold ${typeBadgeColor}`}>
                    {slip.type.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium text-white line-clamp-1">
                  {slip.recipient_origin || (lang === 'pt' ? 'Destinatário N/A' : 'No recipient')}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs text-muted-foreground flex-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">
                      {lang === 'pt' ? 'Data Emissão' : 'Issue Date'}
                    </span>
                    <span className="text-white flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3 h-3 text-primary" />
                      {slip.issue_date
                        ? new Date(slip.issue_date).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">
                      {lang === 'pt' ? 'O.S. Vinculada' : 'Service Order'}
                    </span>
                    <span className="text-white font-medium mt-0.5">
                      {slip.expand?.os_id?.number ? `#${slip.expand.os_id.number}` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">
                      NF-e / Doc.
                    </span>
                    <span className="text-white mt-0.5 font-mono">
                      {slip.nfe_number !== 'N/A' ? slip.nfe_number : slip.doc_non_official || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">
                      {lang === 'pt' ? 'Itens' : 'Items'}
                    </span>
                    <span className="text-white font-medium mt-0.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-primary" />
                      {slip.items?.length || 0} {lang === 'pt' ? 'itens' : 'items'}
                    </span>
                  </div>
                </div>

                {slip.origin_location && slip.destination_location && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[120px]" title={slip.origin_location}>
                      {slip.origin_location}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-primary shrink-0 mx-1" />
                    <span
                      className="truncate max-w-[120px] text-right"
                      title={slip.destination_location}
                    >
                      {slip.destination_location}
                    </span>
                  </div>
                )}
              </CardContent>

              <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintPdf(slip)}
                  className="border-white/10 hover:bg-white/10 text-xs h-8"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  PDF / Print
                </Button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(slip)}
                      className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-white"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteTarget(slip.id)}
                      className="h-8 w-8 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}

        {filteredSlips.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-white/10 rounded-lg">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
            <p className="text-base font-medium">
              {lang === 'pt' ? 'Nenhum romaneio encontrado' : 'No packing slips found'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'pt'
                ? 'Crie um novo romaneio de Entrada ou Saída.'
                : 'Create a new inbound/outbound packing slip.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal Dialog Form FSGQ 8.5-22 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10 text-white">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {editingId
                    ? `${lang === 'pt' ? 'Editar Romaneio' : 'Edit Packing Slip'} #${formData.number}`
                    : `${lang === 'pt' ? 'Novo Romaneio' : 'New Packing Slip'} FSGQ 8.5-22`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  {lang === 'pt'
                    ? 'Preencha os dados do romaneio de Entrada/Saída conforme standard ASME/ISO.'
                    : 'Fill packing slip information according to ASME/ISO standards.'}
                </DialogDescription>
              </div>
              <Badge variant="outline" className="font-bold border-primary/40 text-primary">
                Nº {formData.number}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4 text-xs">
            {/* Cabecalho Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  TIPO
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(val: any) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: val,
                      status: val === 'Cancelamento' ? 'Cancelled' : 'Finalized',
                    }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (Verde)</SelectItem>
                    <SelectItem value="Saída">Saída (Vermelho)</SelectItem>
                    <SelectItem value="Cancelamento">Cancelamento (Amarelo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  DATA DE EMISSÃO
                </label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData((p) => ({ ...p, issue_date: e.target.value }))}
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  O.S. VINCULADA
                </label>
                <Select
                  value={formData.os_id}
                  onValueChange={(val) => setFormData((p) => ({ ...p, os_id: val }))}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-9">
                    <SelectValue placeholder="Selecione a O.S." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma / N/A</SelectItem>
                    {serviceOrders.map((so) => (
                      <SelectItem key={so.id} value={so.id}>
                        O.S. #{so.number} - {so.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  PARA / DESTINATÁRIO
                </label>
                <Input
                  value={formData.recipient_origin}
                  onChange={(e) => setFormData((p) => ({ ...p, recipient_origin: e.target.value }))}
                  placeholder="Empresa / Cliente / Fornecedor"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  O.C.
                </label>
                <Input
                  value={formData.oc_number}
                  onChange={(e) => setFormData((p) => ({ ...p, oc_number: e.target.value }))}
                  placeholder="Ordem de Compra"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  NF-e
                </label>
                <Input
                  value={formData.nfe_number}
                  onChange={(e) => setFormData((p) => ({ ...p, nfe_number: e.target.value }))}
                  placeholder="Número da Nota Fiscal"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  DOC Ñ OFICIAL
                </label>
                <Input
                  value={formData.doc_non_official}
                  onChange={(e) => setFormData((p) => ({ ...p, doc_non_official: e.target.value }))}
                  placeholder="Documento Interno/Minuta"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  C.M.
                </label>
                <Input
                  value={formData.cm_number}
                  onChange={(e) => setFormData((p) => ({ ...p, cm_number: e.target.value }))}
                  placeholder="Controle de Material"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  LOCAL DE ORIGEM
                </label>
                <Input
                  value={formData.origin_location}
                  onChange={(e) => setFormData((p) => ({ ...p, origin_location: e.target.value }))}
                  placeholder="Ex: Almoxarifado Central PSC"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  LOCAL DE DESTINO
                </label>
                <Input
                  value={formData.destination_location}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, destination_location: e.target.value }))
                  }
                  placeholder="Ex: Obra/Fabrica Cliente X"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>
            </div>

            {/* Tabela de Itens Dinamicos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-sm text-primary uppercase tracking-wide">
                  Itens do Romaneio
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Item
                </Button>
              </div>

              <div className="border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black/40 text-[10px] uppercase text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="p-2 text-center w-12">Item</th>
                      <th className="p-2 w-20">Qtde</th>
                      <th className="p-2 w-20">UND</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">Observação</th>
                      <th className="p-2 text-center w-10">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2 text-center font-bold text-muted-foreground">
                          {it.item}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="bg-black/20 border-white/10 text-white h-8 text-xs text-center"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={it.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="bg-black/20 border-white/10 text-white h-8 text-xs text-center"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={it.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Descrição do material / equipamento"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={it.observation}
                            onChange={(e) => handleItemChange(idx, 'observation', e.target.value)}
                            placeholder="Obs. do item"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Informacoes Adicionais / Custo GRV */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wide">
                  Informações Adicionais (Código GRV / Custos)
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddGrv}
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar GRV
                </Button>
              </div>

              <div className="border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black/40 text-[10px] uppercase text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="p-2 w-28">Código GRV</th>
                      <th className="p-2">Descrição GRV</th>
                      <th className="p-2 w-28">Valor (R$)</th>
                      <th className="p-2 w-24">Tipo</th>
                      <th className="p-2 w-28">Setor</th>
                      <th className="p-2 w-28">Solicitante</th>
                      <th className="p-2 text-center w-10">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {grvItems.map((g, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2">
                          <Input
                            value={g.code}
                            onChange={(e) => handleGrvChange(idx, 'code', e.target.value)}
                            placeholder="GRV-001"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={g.description}
                            onChange={(e) => handleGrvChange(idx, 'description', e.target.value)}
                            placeholder="Descrição adicional"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={g.value}
                            onChange={(e) => handleGrvChange(idx, 'value', e.target.value)}
                            placeholder="0.00"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={g.type}
                            onChange={(e) => handleGrvChange(idx, 'type', e.target.value)}
                            placeholder="Material"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={g.sector}
                            onChange={(e) => handleGrvChange(idx, 'sector', e.target.value)}
                            placeholder="CQ/PCP"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={g.requester}
                            onChange={(e) => handleGrvChange(idx, 'requester', e.target.value)}
                            placeholder="Nome"
                            className="bg-black/20 border-white/10 text-white h-8 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveGrv(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rodape e Responsaveis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  FONE P/ CONTATO
                </label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData((p) => ({ ...p, contact_phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  RESPONSÁVEL ALMOXARIFADO
                </label>
                <Input
                  value={formData.warehouse_responsible}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, warehouse_responsible: e.target.value }))
                  }
                  placeholder="Nome do Almoxarife"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  RESPONSÁVEL C.Q. / P.C.P.
                </label>
                <Input
                  value={formData.cq_pcp_responsible}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, cq_pcp_responsible: e.target.value }))
                  }
                  placeholder="Nome CQ/PCP"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  SETOR
                </label>
                <Input
                  value={formData.sector}
                  onChange={(e) => setFormData((p) => ({ ...p, sector: e.target.value }))}
                  placeholder="Ex: Qualidade / Produção"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  SOLICITANTE
                </label>
                <Input
                  value={formData.requester}
                  onChange={(e) => setFormData((p) => ({ ...p, requester: e.target.value }))}
                  placeholder="Nome do Solicitante"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  ENCARREGADO
                </label>
                <Input
                  value={formData.in_charge}
                  onChange={(e) => setFormData((p) => ({ ...p, in_charge: e.target.value }))}
                  placeholder="Nome do Encarregado"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-white/10 text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
            >
              {isSaving ? 'Saving...' : 'Salvar Romaneio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Romaneio</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir este romaneio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-muted-foreground">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
