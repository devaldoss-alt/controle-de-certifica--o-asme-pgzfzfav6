import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n } from '@/hooks/use-i18n'
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
  type MovementReason,
  type SpecialServiceType,
} from '@/services/packing-slips'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import { getUsers, type User } from '@/services/api'
import { generatePackingSlipPDF } from '@/lib/packing-slip-pdf'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { ContextualHelpButton } from '@/components/ContextualHelpButton'
import {
  Plus,
  FileText,
  Printer,
  Pencil,
  Trash2,
  Search,
  Layers,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  Clock,
  Camera,
  AlertTriangle,
  RotateCcw,
  History,
  Activity,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'

const EMPTY_ITEM: PackingSlipItem = {
  item: 1,
  quantity: 1,
  unit: 'UN',
  description: '',
  observation: '',
  is_raw_material: false,
  raw_material_evidence: '',
  has_certificate: false,
  certificate_evidence: '',
  has_invoice: false,
  invoice_evidence: '',
  photos: [],
}

export default function PackingSlips() {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang } = useI18n()
  const { toast } = useToast()

  const [slips, setPackingSlips] = useState<PackingSlip[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [, setUsersList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'slips' | 'special_services' | 'item_history'>('slips')

  // Search in item history
  const [itemHistoryQuery, setItemHistoryQuery] = useState('')

  // Dialog State
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Dialog for Return of Special Service
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnTargetSlip, setReturnTargetSlip] = useState<PackingSlip | null>(null)
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0])
  const [returnNfe, setReturnNfe] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [isProcessingReturn, setIsProcessingReturn] = useState(false)

  // Photo upload URL helper state for active editing item
  const [photoInputIndex, setPhotoInputIndex] = useState<number | null>(null)
  const [photoUrlInput, setPhotoUrlInput] = useState('')

  // Form State matching FSGQ 8.5-22
  const [formData, setFormData] = useState({
    number: 1001,
    issue_date: new Date().toISOString().split('T')[0],
    issue_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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
    movement_reason: 'Uso interno/produção' as MovementReason | string,
    movement_reason_other: '',
    special_service_type: 'Pintura' as SpecialServiceType | string,
    special_service_status: 'N/A',
    status: 'Finalized' as 'Draft' | 'Finalized' | 'Cancelled',
  })

  const [items, setItems] = useState<PackingSlipItem[]>([{ ...EMPTY_ITEM, item: 1 }])

  const canManage = ['Manager', 'QCC', 'Consultor', 'Apontador'].includes(user?.role || '')

  const loadData = async () => {
    try {
      setLoading(true)
      const [slipsData, osData, uData] = await Promise.all([
        getPackingSlips(selectedCompanyId),
        getServiceOrders(
          'all',
          selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
        ),
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

  const handleOpenCreate = async (prefill?: Partial<typeof formData>) => {
    setEditingId(null)
    setFieldErrors({})
    const effectiveCompany =
      selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''
    const nextNum = await getNextPackingSlipNumber(effectiveCompany)

    const now = new Date()
    const nowIsoDate = now.toISOString().split('T')[0]
    const nowTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    setFormData({
      number: nextNum,
      issue_date: nowIsoDate,
      issue_time: nowTime,
      type: prefill?.type || 'Entrada',
      recipient_origin: prefill?.recipient_origin || '',
      origin_location: prefill?.origin_location || '',
      destination_location: prefill?.destination_location || '',
      delivery_responsible: user?.name || '',
      responsible_id: user?.id || '',
      os_id: prefill?.os_id || '',
      oc_number: 'N/A',
      nfe_number: 'N/A',
      doc_non_official: 'N/A',
      cm_number: 'N/A',
      contact_phone: '',
      warehouse_responsible: user?.name || '',
      cq_pcp_responsible: '',
      sector: 'Almoxarifado',
      requester: '',
      in_charge: '',
      movement_reason: prefill?.movement_reason || 'Uso interno/produção',
      movement_reason_other: '',
      special_service_type: 'Pintura',
      special_service_status:
        prefill?.movement_reason === 'Serviço Especial' ? 'Aguardando retorno' : 'N/A',
      status: 'Finalized',
    })
    setItems([{ ...EMPTY_ITEM, item: 1 }])
    setIsOpen(true)
  }

  const handleOpenEdit = async (slip: PackingSlip) => {
    setEditingId(slip.id)
    setFieldErrors({})
    try {
      const full = await getPackingSlip(slip.id)
      const dateVal = full.issue_date
        ? full.issue_date.split('T')[0]
        : new Date().toISOString().split('T')[0]
      const timeVal =
        full.issue_time ||
        (full.issue_date && full.issue_date.includes('T')
          ? new Date(full.issue_date).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '08:00')

      setFormData({
        number: full.number || 1001,
        issue_date: dateVal,
        issue_time: timeVal,
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
        movement_reason: full.movement_reason || 'Uso interno/produção',
        movement_reason_other: full.movement_reason_other || '',
        special_service_type: full.special_service_type || 'Pintura',
        special_service_status: full.special_service_status || 'N/A',
        status: full.status || 'Finalized',
      })
      setItems(
        full.items && full.items.length > 0
          ? full.items.map((it, idx) => ({
              ...EMPTY_ITEM,
              ...it,
              item: it.item || idx + 1,
              photos: it.photos || [],
            }))
          : [{ ...EMPTY_ITEM, item: 1 }],
      )
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

  const handleAddPhotoToItem = (itemIndex: number, url: string) => {
    if (!url.trim()) return
    setItems((prev) => {
      const copy = [...prev]
      const currentPhotos = copy[itemIndex].photos || []
      copy[itemIndex] = {
        ...copy[itemIndex],
        photos: [...currentPhotos, url.trim()],
      }
      return copy
    })
    setPhotoUrlInput('')
    setPhotoInputIndex(null)
  }

  const handleRemovePhotoFromItem = (itemIndex: number, photoIndex: number) => {
    setItems((prev) => {
      const copy = [...prev]
      const currentPhotos = copy[itemIndex].photos || []
      copy[itemIndex] = {
        ...copy[itemIndex],
        photos: currentPhotos.filter((_, i) => i !== photoIndex),
      }
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

    const isSpecialService = formData.movement_reason === 'Serviço Especial'
    const specialStatus = isSpecialService
      ? formData.special_service_status === 'Retornado'
        ? 'Retornado'
        : 'Aguardando retorno'
      : 'N/A'

    const payload: Partial<PackingSlip> = {
      ...formData,
      company_id: effectiveCompany,
      special_service_status: specialStatus,
      items: items.filter((i) => i.description.trim() !== ''),
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

  // Handle Register Return for Special Service
  const handleOpenRegisterReturn = (slip: PackingSlip) => {
    setReturnTargetSlip(slip)
    setReturnDate(new Date().toISOString().split('T')[0])
    setReturnNfe(slip.nfe_number !== 'N/A' ? slip.nfe_number || '' : '')
    setReturnNotes(
      `Retorno de ${slip.special_service_type || 'serviço especial'} ref. Romaneio Saída #${slip.number}`,
    )
    setReturnDialogOpen(true)
  }

  const handleConfirmReturn = async () => {
    if (!returnTargetSlip) return
    setIsProcessingReturn(true)

    try {
      const effectiveCompany =
        selectedCompanyId !== 'all' ? selectedCompanyId : returnTargetSlip.company_id || ''
      const nextNum = await getNextPackingSlipNumber(effectiveCompany)

      // Calculate days out
      const departureDate = new Date(returnTargetSlip.issue_date)
      const arrivalDate = new Date(returnDate)
      const diffTime = Math.max(0, arrivalDate.getTime() - departureDate.getTime())
      const daysOut = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)))

      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      // 1. Create Inbound Return Packing Slip
      const returnSlipItems = (returnTargetSlip.items || []).map((it) => ({
        ...it,
        observation:
          `Retorno de ${returnTargetSlip.special_service_type || 'serviço'}. ${it.observation || ''}`.trim(),
        has_invoice: true,
        invoice_evidence: returnNfe || 'NF de Retorno',
      }))

      const newInboundSlip = await createPackingSlip({
        number: nextNum,
        issue_date: returnDate,
        issue_time: nowTime,
        type: 'Entrada',
        company_id: effectiveCompany,
        recipient_origin: returnTargetSlip.origin_location || 'PSC Proserco',
        origin_location:
          returnTargetSlip.recipient_origin ||
          returnTargetSlip.destination_location ||
          'Fornecedor Externo',
        destination_location: returnTargetSlip.origin_location || 'Almoxarifado Central PSC',
        delivery_responsible: user?.name || returnTargetSlip.delivery_responsible || '',
        responsible_id: user?.id || returnTargetSlip.responsible_id || '',
        os_id: returnTargetSlip.os_id || '',
        nfe_number: returnNfe || 'N/A',
        oc_number: returnTargetSlip.oc_number || 'N/A',
        doc_non_official: returnTargetSlip.doc_non_official || 'N/A',
        cm_number: returnTargetSlip.cm_number || 'N/A',
        contact_phone: returnTargetSlip.contact_phone || '',
        warehouse_responsible: user?.name || '',
        cq_pcp_responsible: returnTargetSlip.cq_pcp_responsible || '',
        sector: returnTargetSlip.sector || 'Almoxarifado',
        requester: returnTargetSlip.requester || '',
        in_charge: user?.name || 'Encarregado do Almoxarifado',
        movement_reason: 'Serviço Especial',
        special_service_type: returnTargetSlip.special_service_type,
        special_service_status: 'Retornado',
        parent_slip_id: returnTargetSlip.id,
        return_date: returnDate,
        days_out: daysOut,
        status: 'Finalized',
        items: returnSlipItems,
      })

      // 2. Update origin outbound slip to "Retornado"
      await updatePackingSlip(returnTargetSlip.id, {
        special_service_status: 'Retornado',
        return_date: returnDate,
        returned_slip_id: newInboundSlip.id,
        days_out: daysOut,
      })

      toast({
        title: lang === 'pt' ? 'Retorno registrado com sucesso' : 'Return registered successfully',
        description:
          lang === 'pt'
            ? `Romaneio de Entrada #${newInboundSlip.number} gerado. Tempo fora: ${daysOut} dias.`
            : `Inbound slip #${newInboundSlip.number} created. Days out: ${daysOut}.`,
      })

      setReturnDialogOpen(false)
      setReturnTargetSlip(null)
      loadData()
    } catch (e) {
      console.error(e)
      toast({
        title: lang === 'pt' ? 'Erro ao registrar retorno' : 'Error registering return',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsProcessingReturn(false)
    }
  }

  // Calculate Special Services metrics
  const specialServiceSlips = useMemo(() => {
    return slips.filter(
      (s) =>
        s.type === 'Saída' &&
        (s.movement_reason === 'Serviço Especial' || s.special_service_status),
    )
  }, [slips])

  const openSpecialServices = useMemo(() => {
    return specialServiceSlips.filter(
      (s) => s.special_service_status === 'Aguardando retorno' || !s.return_date,
    )
  }, [specialServiceSlips])

  const returnedSpecialServices = useMemo(() => {
    return specialServiceSlips.filter(
      (s) => s.special_service_status === 'Retornado' || !!s.return_date,
    )
  }, [specialServiceSlips])

  // Average days out KPI
  const avgDaysOut = useMemo(() => {
    if (returnedSpecialServices.length === 0) return 0
    const total = returnedSpecialServices.reduce((acc, s) => acc + (s.days_out || 0), 0)
    return Math.round((total / returnedSpecialServices.length) * 10) / 10
  }, [returnedSpecialServices])

  // Calculate elapsed days for open slips
  const computeElapsedDays = (issueDateStr: string) => {
    const start = new Date(issueDateStr)
    const now = new Date()
    const diff = Math.max(0, now.getTime() - start.getTime())
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Item history search index
  const itemHistoryRecords = useMemo(() => {
    const list: Array<{
      slip: PackingSlip
      item: PackingSlipItem
      itemIndex: number
    }> = []

    slips.forEach((slip) => {
      ;(slip.items || []).forEach((it, idx) => {
        list.push({
          slip,
          item: it,
          itemIndex: idx + 1,
        })
      })
    })

    if (!itemHistoryQuery.trim()) return list

    const q = itemHistoryQuery.toLowerCase().trim()
    return list.filter(
      (entry) =>
        entry.item.description.toLowerCase().includes(q) ||
        (entry.item.observation || '').toLowerCase().includes(q) ||
        (entry.item.certificate_evidence || '').toLowerCase().includes(q) ||
        (entry.slip.recipient_origin || '').toLowerCase().includes(q) ||
        String(entry.slip.number).includes(q) ||
        (entry.slip.expand?.os_id?.number || '').toLowerCase().includes(q),
    )
  }, [slips, itemHistoryQuery])

  // Filtered slips for regular list
  const filteredSlips = slips.filter((slip) => {
    const matchesType = typeFilter === 'all' || slip.type === typeFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      String(slip.number).includes(q) ||
      (slip.recipient_origin || '').toLowerCase().includes(q) ||
      (slip.nfe_number || '').toLowerCase().includes(q) ||
      (slip.doc_non_official || '').toLowerCase().includes(q) ||
      (slip.oc_number || '').toLowerCase().includes(q) ||
      (slip.movement_reason || '').toLowerCase().includes(q) ||
      (slip.special_service_type || '').toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  // In charge label based on selected type
  const inChargeFieldLabel =
    formData.type === 'Saída'
      ? lang === 'pt'
        ? 'ENCARREGADO PELO RECEBIMENTO'
        : 'IN-CHARGE FOR RECEIVING'
      : lang === 'pt'
        ? 'ENCARREGADO'
        : 'IN-CHARGE'

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              FSGQ 8.5-22 - REV.02
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Onda C — Completo
            </span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">
            {lang === 'pt' ? 'Gestão de Romaneios' : 'Packing Slips Management'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'pt'
              ? 'Controle de Entrada e Saída, rastreabilidade de serviços especiais, evidências com fotos e histórico de itens.'
              : 'Inbound & outbound tracking, special services lead time, photo evidences and item history.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ContextualHelpButton variant="button" />

          {canManage && (
            <Button
              onClick={() => handleOpenCreate()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {lang === 'pt' ? '+ Novo Romaneio' : '+ New Packing Slip'}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards / Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {lang === 'pt' ? 'Total Romaneios' : 'Total Slips'}
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{slips.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {slips.filter((s) => s.type === 'Entrada').length} entradas •{' '}
            {slips.filter((s) => s.type === 'Saída').length} saídas
          </div>
        </Card>

        <Card className="glass border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {lang === 'pt' ? 'Em Serviço Especial' : 'In Special Service'}
            </span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {openSpecialServices.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {lang === 'pt' ? 'Aguardando retorno à fábrica' : 'Waiting return to factory'}
          </div>
        </Card>

        <Card className="glass border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {lang === 'pt' ? 'Lead Time Médio Fora' : 'Avg Lead Time Out'}
            </span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {avgDaysOut} <span className="text-sm font-normal text-muted-foreground">dias</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {lang === 'pt'
              ? `Baseado em ${returnedSpecialServices.length} retornos`
              : `Based on ${returnedSpecialServices.length} returns`}
          </div>
        </Card>

        <Card className="glass border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {lang === 'pt' ? 'Itens Rastreados' : 'Tracked Items'}
            </span>
            <History className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {itemHistoryRecords.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {lang === 'pt' ? 'Movimentações registradas' : 'Registered movements'}
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger
            value="slips"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            {lang === 'pt' ? 'Todos os Romaneios' : 'All Packing Slips'} ({slips.length})
          </TabsTrigger>
          <TabsTrigger
            value="special_services"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            {lang === 'pt' ? 'Itens Fora em Serviço Especial' : 'Out in Special Service'} (
            {openSpecialServices.length})
          </TabsTrigger>
          <TabsTrigger
            value="item_history"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            {lang === 'pt' ? 'Pesquisa do Histórico de Itens' : 'Item History Search'}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ALL PACKING SLIPS */}
        <TabsContent value="slips" className="space-y-4">
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

              const isOpenSpecial =
                slip.type === 'Saída' &&
                slip.movement_reason === 'Serviço Especial' &&
                slip.special_service_status === 'Aguardando retorno'

              const elapsedDays = isOpenSpecial ? computeElapsedDays(slip.issue_date) : 0
              const isOverdue = elapsedDays > 7

              const photoCount = (slip.items || []).reduce(
                (acc, it) => acc + (it.photos?.length || 0),
                0,
              )

              return (
                <Card
                  key={slip.id}
                  className="glass border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono text-primary">
                          ROM #{slip.number}
                        </span>
                        {photoCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1"
                          >
                            <Camera className="w-2.5 h-2.5" /> {photoCount}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={`font-semibold ${typeBadgeColor}`}>
                        {slip.type.toUpperCase()}
                      </Badge>
                    </div>

                    <CardTitle className="text-sm font-medium text-white line-clamp-1">
                      {slip.recipient_origin ||
                        (lang === 'pt' ? 'Destinatário N/A' : 'No recipient')}
                    </CardTitle>

                    {slip.movement_reason && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="text-white/60 font-semibold">Motivo:</span>
                        <span className="text-white">
                          {slip.movement_reason}
                          {slip.special_service_type ? ` (${slip.special_service_type})` : ''}
                        </span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs text-muted-foreground flex-1">
                    {/* Special Service Open Status Alert */}
                    {isOpenSpecial && (
                      <div
                        className={`p-2.5 rounded border ${isOverdue ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Aguardando Retorno
                          </span>
                          <span>{elapsedDays} dia(s) fora</span>
                        </div>
                        {isOverdue && (
                          <p className="text-[10px] text-rose-400 mt-1">
                            Atenção: Material fora há mais de 7 dias!
                          </p>
                        )}
                      </div>
                    )}

                    {slip.special_service_status === 'Retornado' && (
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Retornado em{' '}
                          {slip.return_date
                            ? new Date(slip.return_date).toLocaleDateString('pt-BR')
                            : 'OK'}
                        </span>
                        <span className="font-mono font-bold">
                          {slip.days_out !== undefined ? `${slip.days_out} dias` : ''}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">
                          {lang === 'pt' ? 'Data / Hora' : 'Issue Date/Time'}
                        </span>
                        <span className="text-white flex items-center gap-1 mt-0.5">
                          <CalendarIcon className="w-3 h-3 text-primary" />
                          {slip.issue_date
                            ? new Date(slip.issue_date).toLocaleDateString('pt-BR')
                            : 'N/A'}{' '}
                          {slip.issue_time || ''}
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
                          {slip.nfe_number !== 'N/A'
                            ? slip.nfe_number
                            : slip.doc_non_official || 'N/A'}
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

                  <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintPdf(slip)}
                        className="border-white/10 hover:bg-white/10 text-xs h-8"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        PDF
                      </Button>

                      {isOpenSpecial && canManage && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenRegisterReturn(slip)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Registrar Retorno
                        </Button>
                      )}
                    </div>

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
        </TabsContent>

        {/* TAB 2: SPECIAL SERVICES (Pintura, Galvanização, Tratamento Térmico) */}
        <TabsContent value="special_services" className="space-y-4">
          <Card className="glass border-white/10 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Controle de Itens Fora em Serviços Especiais
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Acompanhamento de peças enviadas para galvanização, pintura, tratamento térmico ou
                  terceiros. Alerta automático para itens fora há mais de 7 dias e cálculo de dias
                  corridos até o retorno.
                </p>
              </div>

              {canManage && (
                <Button
                  onClick={() =>
                    handleOpenCreate({
                      type: 'Saída',
                      movement_reason: 'Serviço Especial',
                    })
                  }
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Nova Saída p/ Serviço Especial
                </Button>
              )}
            </div>

            {/* List of open special services */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Itens em Aberto / Aguardando Retorno ({openSpecialServices.length})
              </h4>

              {openSpecialServices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-lg text-xs">
                  Nenhum item fora em serviço especial no momento. Todos foram retornados!
                </div>
              ) : (
                <div className="space-y-3">
                  {openSpecialServices.map((slip) => {
                    const elapsedDays = computeElapsedDays(slip.issue_date)
                    const isOverdue = elapsedDays > 7

                    return (
                      <div
                        key={slip.id}
                        className={`p-4 rounded-lg border transition-all ${isOverdue ? 'bg-rose-950/20 border-rose-500/40' : 'bg-amber-950/20 border-amber-500/30'}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-primary text-sm">
                                ROM Saída #{slip.number}
                              </span>
                              <Badge
                                className={
                                  isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                                }
                              >
                                {slip.special_service_type || 'Serviço Especial'}
                              </Badge>
                              {isOverdue && (
                                <Badge variant="destructive" className="animate-pulse">
                                  CRÍTICO: &gt; 7 DIAS
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                O.S.: <strong>{slip.expand?.os_id?.number || 'N/A'}</strong>
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-white mt-1">
                              {slip.recipient_origin || 'Prestador de Serviço'}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span>
                                Saída em:{' '}
                                <strong>
                                  {new Date(slip.issue_date).toLocaleDateString('pt-BR')}
                                </strong>
                              </span>
                              <span>
                                Destino: <strong>{slip.destination_location || 'N/A'}</strong>
                              </span>
                              <span>
                                NF-e Remessa: <strong>{slip.nfe_number || 'N/A'}</strong>
                              </span>
                            </div>

                            {/* Items list preview */}
                            <div className="mt-2 text-xs bg-black/30 p-2.5 rounded border border-white/5 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                Materiais em Processamento:
                              </span>
                              {(slip.items || []).map((it, idx) => (
                                <div
                                  key={idx}
                                  className="text-white/90 flex items-center justify-between text-[11px]"
                                >
                                  <span>
                                    • {it.quantity} {it.unit} - {it.description}
                                  </span>
                                  {it.observation && (
                                    <span className="text-muted-foreground italic text-[10px]">
                                      ({it.observation})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Tempo Fora Decorrido
                              </span>
                              <span
                                className={`text-2xl font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}
                              >
                                {elapsedDays} <span className="text-xs font-normal">dia(s)</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintPdf(slip)}
                                className="border-white/10 text-xs h-8"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1" />
                                PDF
                              </Button>

                              {canManage && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenRegisterReturn(slip)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  Registrar Retorno
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* History of returned special services */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-400">
                  Histórico de Serviços Especiais Finalizados ({returnedSpecialServices.length})
                </h4>

                <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-[10px] uppercase text-muted-foreground border-b border-white/10">
                      <tr>
                        <th className="p-2.5">ROM Saída</th>
                        <th className="p-2.5">Tipo de Serviço</th>
                        <th className="p-2.5">Prestador / Destino</th>
                        <th className="p-2.5">Data Saída</th>
                        <th className="p-2.5">Data Retorno</th>
                        <th className="p-2.5 text-center">Dias Fora</th>
                        <th className="p-2.5">ROM Entrada Vinculado</th>
                        <th className="p-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {returnedSpecialServices.map((s) => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-primary">#{s.number}</td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="text-[10px]">
                              {s.special_service_type || 'Serviço'}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-white font-medium">
                            {s.recipient_origin || s.destination_location}
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {new Date(s.issue_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {s.return_date
                              ? new Date(s.return_date).toLocaleDateString('pt-BR')
                              : 'OK'}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-400">
                            {s.days_out !== undefined ? `${s.days_out} dias` : '-'}
                          </td>
                          <td className="p-2.5 text-muted-foreground font-mono">
                            {s.returned_slip_id ? (
                              <span className="text-emerald-400 font-semibold">
                                ROM Entrada #{s.expand?.returned_slip_id?.number || 'Retorno'}
                              </span>
                            ) : (
                              'Registrado'
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintPdf(s)}
                              className="h-7 text-xs"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {returnedSpecialServices.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">
                            Nenhum registro de retorno finalizado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: ITEM HISTORY SEARCH */}
        <TabsContent value="item_history" className="space-y-4">
          <Card className="glass border-white/10 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Pesquisa do Histórico de Itens Movimentados
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Localize qualquer material ou código para verificar todas as entradas e saídas,
                  datas, quantidades, evidências fotográficas, O.S. vinculada e notas fiscais.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={itemHistoryQuery}
                  onChange={(e) => setItemHistoryQuery(e.target.value)}
                  placeholder="Pesquisar por material, flange, tubo, O.S...."
                  className="bg-black/30 border-white/10 text-white pl-9 text-xs"
                />
              </div>
            </div>

            <div className="mt-4 border border-white/10 rounded-lg overflow-hidden bg-black/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[10px] uppercase text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Material / Descrição</th>
                    <th className="p-2.5">Tipo & Romaneio</th>
                    <th className="p-2.5">Data / Hora</th>
                    <th className="p-2.5">Qtde / Un</th>
                    <th className="p-2.5">O.S. Vinculada</th>
                    <th className="p-2.5">Origem / Destino</th>
                    <th className="p-2.5">Verificações Técnicas</th>
                    <th className="p-2.5 text-center">Fotos</th>
                    <th className="p-2.5 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {itemHistoryRecords.map((entry, idx) => {
                    const s = entry.slip
                    const it = entry.item
                    const isEntrada = s.type === 'Entrada'

                    return (
                      <tr key={`${s.id}-${idx}`} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 max-w-[220px]">
                          <strong className="text-white block line-clamp-2">
                            {it.description}
                          </strong>
                          {it.observation && (
                            <span className="text-[11px] text-muted-foreground block line-clamp-1 italic">
                              Obs: {it.observation}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <Badge
                            variant="outline"
                            className={
                              isEntrada
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }
                          >
                            {s.type} #{s.number}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(s.issue_date).toLocaleDateString('pt-BR')} {s.issue_time || ''}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-white whitespace-nowrap">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {s.expand?.os_id?.number ? (
                            <span className="text-primary font-semibold">
                              #{s.expand.os_id.number}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="p-2.5 text-muted-foreground text-[11px] max-w-[160px] truncate">
                          {s.recipient_origin || s.destination_location || s.origin_location}
                        </td>
                        <td className="p-2.5 text-[10px] space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Mat. Prima:</span>
                            <span
                              className={
                                it.is_raw_material
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-muted-foreground'
                              }
                            >
                              {it.is_raw_material ? 'SIM' : 'NÃO'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Certificado:</span>
                            <span
                              className={
                                it.has_certificate
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-muted-foreground'
                              }
                            >
                              {it.has_certificate ? 'SIM' : 'NÃO'}
                            </span>
                          </div>
                          {isEntrada && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">NF-e:</span>
                              <span
                                className={
                                  it.has_invoice
                                    ? 'text-emerald-400 font-bold'
                                    : 'text-muted-foreground'
                                }
                              >
                                {it.has_invoice ? 'SIM' : 'NÃO'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {it.photos && it.photos.length > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Badge className="bg-blue-600 text-white text-[10px]">
                                <Camera className="w-2.5 h-2.5 mr-1" />
                                {it.photos.length}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintPdf(s)}
                            className="h-7 text-xs text-primary hover:text-white"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}

                  {itemHistoryRecords.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground text-xs">
                        Nenhum item encontrado para o critério digitado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Dialog Form FSGQ 8.5-22 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border-white/10 text-white">
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
                    ? 'Preencha os dados do romaneio de Entrada/Saída conforme standard ASME/ISO. Data e hora são automáticas.'
                    : 'Fill packing slip information according to ASME/ISO standards. Issue date and time are automatic.'}
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
                  TIPO DE ROMANEIO
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
                  DATA / HORA DE EMISSÃO (AUTOMÁTICAS)
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={formData.issue_date}
                    readOnly
                    className="bg-black/30 border-white/10 text-white h-9 cursor-not-allowed opacity-90 font-mono"
                  />
                  <Input
                    type="text"
                    value={formData.issue_time}
                    readOnly
                    className="bg-black/30 border-white/10 text-white h-9 w-20 cursor-not-allowed opacity-90 font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  MOTIVO DA {formData.type.toUpperCase()}
                </label>
                <Select
                  value={formData.movement_reason}
                  onValueChange={(val: any) =>
                    setFormData((p) => ({
                      ...p,
                      movement_reason: val,
                      special_service_status:
                        val === 'Serviço Especial' ? 'Aguardando retorno' : 'N/A',
                    }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Serviço Especial">
                      Serviço Especial (Pintura, Galvanização, etc.)
                    </SelectItem>
                    <SelectItem value="Uso interno/produção">Uso interno/produção</SelectItem>
                    <SelectItem value="Devolução ao estoque">Devolução ao estoque</SelectItem>
                    <SelectItem value="Garantia">Garantia / Reparo</SelectItem>
                    <SelectItem value="Outro">Outro (especificar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.movement_reason === 'Serviço Especial' && (
                <div>
                  <label className="text-[11px] font-semibold text-amber-400 mb-1 block">
                    TIPO DE SERVIÇO ESPECIAL
                  </label>
                  <Select
                    value={formData.special_service_type}
                    onValueChange={(val: any) =>
                      setFormData((p) => ({ ...p, special_service_type: val }))
                    }
                  >
                    <SelectTrigger className="bg-amber-950/30 border-amber-500/30 text-amber-200 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pintura">Pintura e Revestimento</SelectItem>
                      <SelectItem value="Galvanização">Galvanização a Fogo</SelectItem>
                      <SelectItem value="Tratamento Térmico">
                        Tratamento Térmico (Alívio de Tensões)
                      </SelectItem>
                      <SelectItem value="Usinagem externa">Usinagem externa</SelectItem>
                      <SelectItem value="Outro">Outro serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.movement_reason === 'Outro' && (
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    ESPECIFICAR MOTIVO
                  </label>
                  <Input
                    value={formData.movement_reason_other}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, movement_reason_other: e.target.value }))
                    }
                    placeholder="Descreva o motivo"
                    className="bg-black/30 border-white/10 text-white h-9"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  O.S. VINCULADA
                </label>
                <Select
                  value={formData.os_id || '_none'}
                  onValueChange={(val) =>
                    setFormData((p) => ({ ...p, os_id: val === '_none' ? '' : val }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-9">
                    <SelectValue placeholder="Selecione a O.S." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhuma / N/A</SelectItem>
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
                  placeholder="Ex: Unidade Galvanização / Fábrica Cliente"
                  className="bg-black/30 border-white/10 text-white h-9"
                />
              </div>
            </div>

            {/* Tabela de Itens Dinamicos com 3 perguntas e anexação de fotos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-heading font-bold text-sm text-primary uppercase tracking-wide">
                    Itens do Romaneio com Perguntas Técnicas e Evidências Fotográficas
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Responda às 3 perguntas técnicas para cada item e anexe fotos para comprovar o
                    estado físico.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="border-primary/40 text-primary hover:bg-primary/10 h-8 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-white/10 bg-white/5 space-y-3"
                  >
                    {/* Item row header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Item #{it.item}
                      </span>
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
                    </div>

                    {/* Quantity, Unit, Description and Observation */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Quantidade
                        </label>
                        <Input
                          type="number"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="bg-black/30 border-white/10 text-white h-8 text-xs text-center font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Unidade
                        </label>
                        <Select
                          value={it.unit || 'UN'}
                          onValueChange={(val) => handleItemChange(idx, 'unit', val)}
                        >
                          <SelectTrigger className="bg-black/30 border-white/10 text-white h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UN">UN</SelectItem>
                            <SelectItem value="PC">PC</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Descrição do Material
                        </label>
                        <Input
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Ex: Flange SA-105 Ø 8 polegadas"
                          className="bg-black/30 border-white/10 text-white h-8 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Observações
                        </label>
                        <Input
                          value={it.observation}
                          onChange={(e) => handleItemChange(idx, 'observation', e.target.value)}
                          placeholder="Observações do item"
                          className="bg-black/30 border-white/10 text-white h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* The 3 Questions: Matéria-prima? Certificado? Veio com Nota? */}
                    <div className="p-3 bg-black/30 rounded border border-white/5 space-y-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Perguntas Técnicas de Qualidade & Rastreabilidade (Sim / Não)
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Q1: É Matéria-prima? */}
                        <div className="p-2 rounded bg-white/5 border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-white">
                              É matéria-prima?
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={it.is_raw_material ? 'default' : 'outline'}
                                onClick={() => handleItemChange(idx, 'is_raw_material', true)}
                                className={`h-6 text-[10px] px-2 ${it.is_raw_material ? 'bg-emerald-600' : 'border-white/10'}`}
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!it.is_raw_material ? 'default' : 'outline'}
                                onClick={() => handleItemChange(idx, 'is_raw_material', false)}
                                className={`h-6 text-[10px] px-2 ${!it.is_raw_material ? 'bg-slate-700' : 'border-white/10'}`}
                              >
                                Não
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={it.raw_material_evidence || ''}
                            onChange={(e) =>
                              handleItemChange(idx, 'raw_material_evidence', e.target.value)
                            }
                            placeholder="Informação / evidência de MP"
                            className="bg-black/30 border-white/10 text-white h-7 text-[10px]"
                          />
                        </div>

                        {/* Q2: Tem certificado? */}
                        <div className="p-2 rounded bg-white/5 border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-white">
                              Tem certificado?
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={it.has_certificate ? 'default' : 'outline'}
                                onClick={() => handleItemChange(idx, 'has_certificate', true)}
                                className={`h-6 text-[10px] px-2 ${it.has_certificate ? 'bg-emerald-600' : 'border-white/10'}`}
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!it.has_certificate ? 'default' : 'outline'}
                                onClick={() => handleItemChange(idx, 'has_certificate', false)}
                                className={`h-6 text-[10px] px-2 ${!it.has_certificate ? 'bg-slate-700' : 'border-white/10'}`}
                              >
                                Não
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={it.certificate_evidence || ''}
                            onChange={(e) =>
                              handleItemChange(idx, 'certificate_evidence', e.target.value)
                            }
                            placeholder="Nº certificado / laudo CQ"
                            className="bg-black/30 border-white/10 text-white h-7 text-[10px]"
                          />
                        </div>

                        {/* Q3: Veio com nota? (Aplicável a Entrada) */}
                        <div className="p-2 rounded bg-white/5 border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-white">
                              {formData.type === 'Entrada'
                                ? 'Veio com nota?'
                                : 'Possui NF vinculada?'}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={it.has_invoice ? 'default' : 'outline'}
                                onClick={() => handleItemChange(idx, 'has_invoice', true)}
                                className={`h-6 text-[10px] px-2 ${it.has_invoice ? 'bg-emerald-600' : 'border-white/10'}`}
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!it.has_invoice ? 'default' : 'outline'}
                                onClick={() => handleItemChange(idx, 'has_invoice', false)}
                                className={`h-6 text-[10px] px-2 ${!it.has_invoice ? 'bg-slate-700' : 'border-white/10'}`}
                              >
                                Não
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={it.invoice_evidence || ''}
                            onChange={(e) =>
                              handleItemChange(idx, 'invoice_evidence', e.target.value)
                            }
                            placeholder="Nº da nota / chave NF-e"
                            className="bg-black/30 border-white/10 text-white h-7 text-[10px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Item Photos Section */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-white flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-primary" />
                          Fotos de Evidência do Estado Físico ({it.photos?.length || 0})
                        </span>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPhotoInputIndex(photoInputIndex === idx ? null : idx)
                            setPhotoUrlInput('')
                          }}
                          className="h-7 text-xs text-primary hover:text-white"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Foto
                        </Button>
                      </div>

                      {/* Photo URL Input Toggle */}
                      {photoInputIndex === idx && (
                        <div className="flex items-center gap-2 mb-2 p-2 rounded bg-black/40 border border-white/10">
                          <Input
                            value={photoUrlInput}
                            onChange={(e) => setPhotoUrlInput(e.target.value)}
                            placeholder="URL da imagem (ex: https://img.usecurling.com/p/400/300?q=steel+plate)"
                            className="bg-black/30 border-white/10 text-white h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddPhotoToItem(idx, photoUrlInput)}
                            className="bg-primary text-primary-foreground h-8 text-xs font-semibold"
                          >
                            Anexar
                          </Button>
                        </div>
                      )}

                      {/* Photo Thumbnails */}
                      {it.photos && it.photos.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {it.photos.map((pUrl, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative group w-16 h-16 rounded border border-white/20 overflow-hidden bg-black/40"
                            >
                              <img
                                src={pUrl}
                                alt={`Foto ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhotoFromItem(idx, pIdx)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          Nenhuma foto anexada a este item.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
                <Select
                  value={formData.sector || 'Almoxarifado'}
                  onValueChange={(val) => setFormData((p) => ({ ...p, sector: val }))}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                    <SelectItem value="Produção">Produção</SelectItem>
                    <SelectItem value="Qualidade">Qualidade (CQ)</SelectItem>
                    <SelectItem value="PCP">PCP</SelectItem>
                    <SelectItem value="Engenharia">Engenharia</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Logística">Logística</SelectItem>
                  </SelectContent>
                </Select>
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
                  {inChargeFieldLabel}
                </label>
                <Input
                  value={formData.in_charge}
                  onChange={(e) => setFormData((p) => ({ ...p, in_charge: e.target.value }))}
                  placeholder={
                    formData.type === 'Saída'
                      ? 'Quem recebe no destino (fora)'
                      : 'Nome do Encarregado'
                  }
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
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
            >
              {isSaving ? 'Salvando...' : 'Salvar Romaneio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Return Dialog for Special Service */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-bold text-emerald-400 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Registrar Retorno de Serviço Especial
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {returnTargetSlip && (
                <>
                  Romaneio Saída <strong>#{returnTargetSlip.number}</strong> (
                  {returnTargetSlip.special_service_type}) enviado para{' '}
                  {returnTargetSlip.recipient_origin}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Data do Retorno à Fábrica
              </label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="bg-black/30 border-white/10 text-white h-9 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Número da Nota Fiscal de Retorno (NF-e)
              </label>
              <Input
                value={returnNfe}
                onChange={(e) => setReturnNfe(e.target.value)}
                placeholder="Ex: NF-77301"
                className="bg-black/30 border-white/10 text-white h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Observações do Recebimento
              </label>
              <Input
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Ex: Retorno de pintura. Inspecionado pelo CQ."
                className="bg-black/30 border-white/10 text-white h-9"
              />
            </div>

            {returnTargetSlip && (
              <div className="p-3 rounded bg-white/5 border border-white/10 text-[11px] text-muted-foreground">
                <span className="block font-semibold text-white mb-1">Cálculo de Lead Time:</span>
                Saída em:{' '}
                <strong>{new Date(returnTargetSlip.issue_date).toLocaleDateString('pt-BR')}</strong>
                <br />
                Retorno em: <strong>{new Date(returnDate).toLocaleDateString('pt-BR')}</strong>
                <br />
                Tempo total fora:{' '}
                <strong>
                  {Math.max(
                    0,
                    Math.round(
                      (new Date(returnDate).getTime() -
                        new Date(returnTargetSlip.issue_date).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  )}{' '}
                  dia(s)
                </strong>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-white/10 pt-3">
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReturn}
              disabled={isProcessingReturn}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isProcessingReturn ? 'Gravando...' : 'Confirmar Retorno'}
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
