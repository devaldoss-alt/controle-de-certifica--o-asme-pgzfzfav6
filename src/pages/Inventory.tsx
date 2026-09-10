import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getInventoryItems,
  releaseCQInspection,
  registerStockMovement,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  generateTrackingCode,
  type InventoryItem,
  type InventoryCategory,
  type MovementType,
} from '@/services/inventory'
import { getCompanies, type Company } from '@/services/companies'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import { getTeamMembers, type TeamMember } from '@/services/team'
import {
  getMaterialRequisitions,
  getPurchaseRequests,
  getItemPendingTotals,
  computeWarehouseIndicators,
  recalculateWarehouseIndicators,
  type MaterialRequisition,
  type PurchaseRequest,
  type WarehouseIndicatorsSummary,
} from '@/services/warehouse-phase2'

import { InventoryImportDialog } from '@/components/InventoryImportDialog'
import { TouchOrderForm } from '@/components/TouchOrderForm'
import { ContextualHelpButton } from '@/components/ContextualHelpButton'
import { WarehouseRequisitionsTab } from '@/components/WarehouseRequisitionsTab'
import { SuppliesPurchasesTab } from '@/components/SuppliesPurchasesTab'
import { WarehouseIndicatorsTab } from '@/components/WarehouseIndicatorsTab'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Boxes,
  Plus,
  Upload,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  MoreVertical,
  Package,
  Layers,
  Building2,
  Trash2,
  Edit,
  History,
  XCircle,
  Sparkles,
  ShoppingCart,
  BarChart3,
  Tablet,
} from 'lucide-react'
import { getStockMovements, type StockMovement } from '@/services/inventory'

const CATEGORIES: InventoryCategory[] = [
  'Insumo',
  'Consumível',
  'Gás-Cilindro',
  'Ferramenta',
  'Equipamento',
  'Outro',
]

export default function InventoryPage() {
  const { user } = useAuth()
  const { selectedCompanyId, companies: contextCompanies } = useCompany()
  const { toast } = useToast()

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'touch' | 'requisitions' | 'supplies' | 'indicators'
  >('catalog')

  // Data states
  const [items, setItems] = useState<InventoryItem[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([])
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([])
  const [pendingWithdrawalsByItem, setPendingWithdrawalsByItem] = useState<Record<string, number>>(
    {},
  )
  const [pendingPurchasesByItem, setPendingPurchasesByItem] = useState<Record<string, number>>({})
  const [indicatorsSummary, setIndicatorsSummary] = useState<WarehouseIndicatorsSummary | null>(
    null,
  )

  const [loading, setLoading] = useState(true)
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Filters for catalog tab
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lowStockFilter, setLowStockFilter] = useState(false)

  // Dialogs
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [isMovementOpen, setIsMovementOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isCQDialogOpen, setIsCQDialogOpen] = useState(false)

  // Selected item state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [movementsHistory, setMovementsHistory] = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    description: '',
    category: 'Insumo',
    unit: 'UN',
    unit_price: 0,
    current_stock: 0,
    minimum_stock: 0,
    location: 'Almoxarifado',
    requires_cq_inspection: false,
    is_consigned: false,
    supplier: '',
    is_controlled: false,
    notes: '',
  })

  // Stock movement state
  const [movementForm, setMovementForm] = useState<{
    movementType: MovementType
    quantity: number
    unitPrice: number
    notes: string
    osId: string
  }>({
    movementType: 'Entrada',
    quantity: 1,
    unitPrice: 0,
    notes: '',
    osId: '',
  })

  // CQ Inspection state
  const [cqAction, setCqAction] = useState<'Liberado' | 'Rejeitado'>('Liberado')
  const [cqNotes, setCqNotes] = useState('')
  const [isCQSubmitting, setIsCQSubmitting] = useState(false)

  const isQCC = user?.role === 'QCC' || user?.role === 'Manager' || user?.role === 'Director'
  const canEdit =
    user?.role === 'Manager' ||
    user?.role === 'QCC' ||
    user?.role === 'Supervisor' ||
    user?.role === 'Apontador'

  const effectiveCompanyId =
    selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : companies[0]?.id || ''

  const currentCompanyName = useMemo(() => {
    return (
      companies.find((c) => c.id === effectiveCompanyId)?.name ||
      contextCompanies.find((c) => c.id === effectiveCompanyId)?.name ||
      'PSC'
    )
  }, [companies, contextCompanies, effectiveCompanyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemList, compList, soList, teamList, reqList, purList, pendingTotals, indSummary] =
        await Promise.all([
          getInventoryItems({
            companyId: selectedCompanyId,
            search,
            category: categoryFilter,
            status: statusFilter,
            lowStockOnly: lowStockFilter,
          }),
          getCompanies(),
          getServiceOrders(
            'all',
            selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
          ),
          getTeamMembers(),
          getMaterialRequisitions({ companyId: selectedCompanyId }),
          getPurchaseRequests({ companyId: selectedCompanyId }),
          getItemPendingTotals(effectiveCompanyId),
          computeWarehouseIndicators(effectiveCompanyId),
        ])

      setItems(itemList)
      setCompanies(compList)
      setServiceOrders(soList)
      setTeamMembers(teamList)
      setRequisitions(reqList)
      setPurchases(purList)
      setPendingWithdrawalsByItem(pendingTotals.pendingWithdrawalsByItem)
      setPendingPurchasesByItem(pendingTotals.pendingPurchasesByItem)
      setIndicatorsSummary(indSummary)
    } catch (e) {
      console.error('Error loading inventory data:', e)
      toast({
        title: 'Erro ao carregar dados do almoxarifado',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId, search, categoryFilter, statusFilter, lowStockFilter])

  // Realtime subscriptions
  useRealtime('inventory_items', () => loadData())
  useRealtime('material_requisitions', () => loadData())
  useRealtime('purchase_requests', () => loadData())
  useRealtime('stock_movements', () => {
    if (isHistoryOpen && selectedItem) {
      loadHistory(selectedItem.id)
    }
    loadData()
  })

  // Metrics for catalog
  const metrics = useMemo(() => {
    const totalItems = items.length
    const lowStockCount = items.filter(
      (i) =>
        i.minimum_stock !== undefined &&
        i.minimum_stock !== null &&
        (i.current_stock ?? 0) <= i.minimum_stock,
    ).length
    const pendingCQCount = items.filter(
      (i) => i.requires_cq_inspection && i.inspection_status === 'Aguardando inspeção',
    ).length
    const controlledCount = items.filter((i) => i.is_controlled).length
    const totalValue = items.reduce(
      (acc, i) => acc + (i.current_stock ?? 0) * (i.unit_price ?? 0),
      0,
    )
    return { totalItems, lowStockCount, pendingCQCount, controlledCount, totalValue }
  }, [items])

  const pendingRequisitionsCount = useMemo(() => {
    return requisitions.filter((r) => r.status === 'pendente').length
  }, [requisitions])

  const pendingPurchasesCount = useMemo(() => {
    return purchases.filter((p) => p.status === 'pendente' || p.status === 'cotado').length
  }, [purchases])

  const handleRecalculateIndicators = async () => {
    if (!effectiveCompanyId) return
    try {
      setIsRecalculating(true)
      const res = await recalculateWarehouseIndicators({ companyId: effectiveCompanyId })
      if (res) {
        setIndicatorsSummary(res)
        toast({
          title: 'Indicadores atualizados com sucesso',
          description: 'Sincronizados com a matriz de indicadores da empresa.',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Erro ao recalcular indicadores',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleOpenItemForm = (item?: InventoryItem) => {
    if (item) {
      setSelectedItem(item)
      setFormData({
        description: item.description,
        category: item.category,
        unit: item.unit,
        unit_price: item.unit_price || 0,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock || 0,
        location: item.location || 'Almoxarifado',
        os_id: item.os_id,
        requires_cq_inspection: item.requires_cq_inspection,
        is_consigned: item.is_consigned,
        supplier: item.supplier || '',
        is_controlled: item.is_controlled,
        notes: item.notes || '',
      })
    } else {
      setSelectedItem(null)
      setFormData({
        description: '',
        category: 'Insumo',
        unit: 'UN',
        unit_price: 0,
        current_stock: 0,
        minimum_stock: 0,
        location: 'Almoxarifado',
        requires_cq_inspection: false,
        is_consigned: false,
        supplier: '',
        is_controlled: false,
        notes: '',
      })
    }
    setIsItemFormOpen(true)
  }

  const handleSaveItem = async () => {
    if (!formData.description?.trim()) {
      toast({ title: 'Descrição é obrigatória', variant: 'destructive' })
      return
    }

    const companyId =
      selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : companies[0]?.id

    if (!companyId) {
      toast({ title: 'Selecione uma empresa primeiro', variant: 'destructive' })
      return
    }

    try {
      if (selectedItem) {
        await updateInventoryItem(selectedItem.id, {
          ...formData,
        })
        toast({ title: 'Item atualizado com sucesso' })
      } else {
        const comp =
          companies.find((c) => c.id === companyId) ||
          contextCompanies.find((c) => c.id === companyId)
        const trackingCode = await generateTrackingCode(companyId, comp?.name)
        await createInventoryItem(
          {
            ...formData,
            company_id: companyId,
            tracking_code: trackingCode,
          },
          {
            responsibleId: user?.id,
            responsibleName: user?.name,
          },
        )
        toast({ title: 'Item cadastrado com sucesso' })
      }
      setIsItemFormOpen(false)
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar item',
        description: e?.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Deseja realmente remover o item "${item.description}"?`)) return
    try {
      await deleteInventoryItem(item.id)
      toast({ title: 'Item removido do estoque' })
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro ao remover item',
        description: e?.message,
        variant: 'destructive',
      })
    }
  }

  const handleOpenMovement = (item: InventoryItem, defaultType: MovementType = 'Entrada') => {
    setSelectedItem(item)
    setMovementForm({
      movementType: defaultType,
      quantity: 1,
      unitPrice: item.unit_price || 0,
      notes: '',
      osId: item.os_id || '',
    })
    setIsMovementOpen(true)
  }

  const handleSaveMovement = async () => {
    if (!selectedItem) return
    if (!movementForm.quantity || movementForm.quantity <= 0) {
      toast({ title: 'Quantidade deve ser maior que zero', variant: 'destructive' })
      return
    }

    try {
      await registerStockMovement({
        itemId: selectedItem.id,
        companyId: selectedItem.company_id,
        movementType: movementForm.movementType,
        quantity: movementForm.quantity,
        unitPrice: movementForm.unitPrice,
        responsibleId: user?.id,
        responsibleName: user?.name,
        osId: movementForm.osId || undefined,
        notes: movementForm.notes,
      })
      toast({ title: `Movimento de ${movementForm.movementType} registrado com sucesso` })
      setIsMovementOpen(false)
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro ao registrar movimento',
        description: e?.message,
        variant: 'destructive',
      })
    }
  }

  const loadHistory = async (itemId: string) => {
    try {
      setHistoryLoading(true)
      const res = await getStockMovements({ itemId })
      setMovementsHistory(res)
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleOpenHistory = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsHistoryOpen(true)
    loadHistory(item.id)
  }

  const handleOpenCQDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setCqAction('Liberado')
    setCqNotes('')
    setIsCQDialogOpen(true)
  }

  const handleConfirmCQ = async () => {
    if (!selectedItem || !user?.id) return
    try {
      setIsCQSubmitting(true)
      await releaseCQInspection(selectedItem.id, user.id, cqAction, cqNotes)
      toast({
        title: `Inspeção concluída: item marcado como ${cqAction}`,
      })
      setIsCQDialogOpen(false)
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro ao registrar inspeção CQ',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsCQSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Boxes className="w-7 h-7 text-primary" /> Almoxarifado & Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestão física, modo touch para chão de fábrica, requisição com trava CQ e controle de
            estoque mínimo inteligente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ContextualHelpButton subTab={activeTab} variant="button" />
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="border-white/10 hover:bg-white/10 text-white gap-1.5 text-xs sm:text-sm"
          >
            <Upload className="w-4 h-4" /> Importar Planilha
          </Button>
          {canEdit && (
            <Button
              onClick={() => handleOpenItemForm()}
              className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" /> Novo Item
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Fase 1 + Fase 2) */}
      <Tabs
        value={activeTab}
        onValueChange={(v: any) => setActiveTab(v)}
        className="w-full space-y-4"
      >
        <TabsList className="bg-card border border-white/10 p-1 w-full justify-start overflow-x-auto flex-nowrap h-auto gap-1">
          <TabsTrigger
            value="catalog"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm py-2 px-3 sm:px-4 gap-1.5 shrink-0"
          >
            <Package className="w-4 h-4" />
            Catálogo & Saldo
          </TabsTrigger>

          <TabsTrigger
            value="touch"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm py-2 px-3 sm:px-4 gap-1.5 shrink-0"
          >
            <Tablet className="w-4 h-4 text-amber-300" />
            Modo Touch (Solicitação)
          </TabsTrigger>

          <TabsTrigger
            value="requisitions"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm py-2 px-3 sm:px-4 gap-1.5 shrink-0 relative"
          >
            <Layers className="w-4 h-4" />
            Atendimento Almoxarifado
            {pendingRequisitionsCount > 0 && (
              <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-amber-500 text-black font-bold h-4">
                {pendingRequisitionsCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="supplies"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm py-2 px-3 sm:px-4 gap-1.5 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            Suprimentos & Compras
            {pendingPurchasesCount > 0 && (
              <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-blue-500 text-white font-bold h-4">
                {pendingPurchasesCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="indicators"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm py-2 px-3 sm:px-4 gap-1.5 shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            Indicadores & Estoque Mínimo
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CATALOG & INVENTORY (Fase 1 original mantida) */}
        <TabsContent value="catalog" className="space-y-4 m-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Itens em Catálogo</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics.totalItems}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-white/10 ${
                metrics.lowStockCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card'
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Estoque Baixo / Mínimo</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      metrics.lowStockCount > 0 ? 'text-amber-400' : 'text-white'
                    }`}
                  >
                    {metrics.lowStockCount}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    metrics.lowStockCount > 0
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-white/5 text-muted-foreground'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-white/10 ${
                metrics.pendingCQCount > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card'
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aguardando CQ</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      metrics.pendingCQCount > 0 ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {metrics.pendingCQCount}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    metrics.pendingCQCount > 0
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-muted-foreground'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Itens Controlados</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics.controlledCount}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Search Bar */}
          <Card className="bg-card border-white/10">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, rastreio (ex: PSC-EST-000001) ou fornecedor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Status CQ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status da Inspeção (Todos)</SelectItem>
                    <SelectItem value="Aguardando inspeção">Aguardando inspeção</SelectItem>
                    <SelectItem value="Liberado">Liberado CQ</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="Não aplicável">Não aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant={lowStockFilter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLowStockFilter(!lowStockFilter)}
                  className={`text-xs gap-1.5 ${
                    lowStockFilter
                      ? 'bg-amber-500 hover:bg-amber-600 text-black font-medium'
                      : 'border-white/10 text-muted-foreground hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Apenas Itens com Estoque Baixo / Mínimo
                </Button>

                {selectedCompanyId === 'all' && (
                  <Badge variant="outline" className="text-xs text-white/60 border-white/10">
                    <Building2 className="w-3 h-3 mr-1" /> Visão Consolidada (Todas as Empresas)
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Inventory Items Table */}
          <Card className="bg-card border-white/10">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-white font-medium flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Catálogo de Itens ({items.length})
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Empresa atual: <strong className="text-white">{currentCompanyName}</strong>
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  Carregando itens do almoxarifado...
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-white font-medium">Nenhum item cadastrado no almoxarifado</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Utilize o botão &quot;Importar Planilha&quot; para carregar os registros da
                    empresa ou adicione um novo item manualmente.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportOpen(true)}
                    className="border-white/10 text-white gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Importar Planilha Agora
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 bg-white/5">
                        <TableHead className="text-xs text-white/70">Rastreio</TableHead>
                        <TableHead className="text-xs text-white/70">Descrição</TableHead>
                        <TableHead className="text-xs text-white/70">Categoria</TableHead>
                        <TableHead className="text-xs text-white/70">Localização</TableHead>
                        <TableHead className="text-xs text-white/70 text-right">
                          Saldo Físico
                        </TableHead>
                        <TableHead className="text-xs text-white/70 text-right">
                          Est. Mín.
                        </TableHead>
                        <TableHead className="text-xs text-white/70">Inspeção CQ</TableHead>
                        <TableHead className="text-xs text-white/70">Atributos</TableHead>
                        <TableHead className="text-xs text-white/70 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const isLowStock =
                          item.minimum_stock !== undefined &&
                          item.minimum_stock !== null &&
                          (item.current_stock ?? 0) <= item.minimum_stock

                        return (
                          <TableRow
                            key={item.id}
                            className={`border-white/5 hover:bg-white/[0.02] ${
                              isLowStock ? 'bg-amber-500/[0.03]' : ''
                            }`}
                          >
                            <TableCell className="text-xs font-mono text-primary font-medium py-3">
                              {item.tracking_code || '—'}
                            </TableCell>

                            <TableCell className="text-xs text-white py-3">
                              <div className="font-medium">{item.description}</div>
                              {item.supplier && (
                                <div className="text-[11px] text-muted-foreground">
                                  Fornec: {item.supplier}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-[10px] text-muted-foreground/70 italic line-clamp-1">
                                  {item.notes}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground py-3">
                              <Badge
                                variant="outline"
                                className="border-white/10 text-white/80 font-normal"
                              >
                                {item.category}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground py-3">
                              {item.location || 'Almoxarifado'}
                            </TableCell>

                            <TableCell className="text-xs text-right py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <span
                                  className={`font-semibold text-sm ${
                                    isLowStock
                                      ? 'text-amber-400 flex items-center gap-1'
                                      : 'text-white'
                                  }`}
                                >
                                  {isLowStock && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                  {item.current_stock ?? 0}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {item.unit}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-right text-muted-foreground py-3">
                              {item.minimum_stock !== undefined && item.minimum_stock !== null
                                ? `${item.minimum_stock} ${item.unit}`
                                : '—'}
                            </TableCell>

                            <TableCell className="text-xs py-3">
                              {!item.requires_cq_inspection ? (
                                <span className="text-[11px] text-muted-foreground">
                                  Dispensada
                                </span>
                              ) : item.inspection_status === 'Liberado' ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" /> Liberado CQ
                                </Badge>
                              ) : item.inspection_status === 'Rejeitado' ? (
                                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 gap-1 text-[11px]">
                                  <XCircle className="w-3 h-3" /> Rejeitado
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1 text-[11px]">
                                    <Clock className="w-3 h-3" /> Aguardando CQ
                                  </Badge>
                                  {isQCC && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenCQDialog(item)}
                                      className="h-6 px-1.5 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary border-primary/40"
                                    >
                                      Liberar
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-xs py-3">
                              <div className="flex flex-wrap gap-1">
                                {item.is_controlled && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                                    Controlado
                                  </Badge>
                                )}
                                {item.is_consigned && (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                                    Consignado
                                  </Badge>
                                )}
                                {item.os_id && (
                                  <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px]">
                                    OS Vinculada
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-right py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenMovement(item, 'Entrada')}
                                  className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                                  title="Dar Entrada"
                                >
                                  <ArrowDownRight className="w-3.5 h-3.5" /> +
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenMovement(item, 'Saída')}
                                  className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
                                  title="Dar Baixa / Saída"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" /> -
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-card border-white/10"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleOpenHistory(item)}
                                      className="gap-2 text-xs"
                                    >
                                      <History className="w-3.5 h-3.5" /> Histórico de Movimentos
                                    </DropdownMenuItem>

                                    {isQCC && item.requires_cq_inspection && (
                                      <DropdownMenuItem
                                        onClick={() => handleOpenCQDialog(item)}
                                        className="gap-2 text-xs text-blue-400"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5" /> Avaliação CQ
                                      </DropdownMenuItem>
                                    )}

                                    {canEdit && (
                                      <DropdownMenuItem
                                        onClick={() => handleOpenItemForm(item)}
                                        className="gap-2 text-xs"
                                      >
                                        <Edit className="w-3.5 h-3.5" /> Editar Item
                                      </DropdownMenuItem>
                                    )}

                                    {user?.role === 'Manager' && (
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteItem(item)}
                                        className="gap-2 text-xs text-rose-400 focus:text-rose-400"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: TOUCH MODE (Solicitação Inteligente com +/- grandes) */}
        <TabsContent value="touch" className="m-0 pt-2">
          <TouchOrderForm
            companyId={effectiveCompanyId}
            companyName={currentCompanyName}
            inventoryItems={items}
            teamMembers={teamMembers}
            serviceOrders={serviceOrders}
            pendingPurchasesByItem={pendingPurchasesByItem}
            onOrderCreated={() => {
              loadData()
            }}
          />
        </TabsContent>

        {/* TAB 3: WAREHOUSE REQUISITIONS (Atendimento com Trava CQ) */}
        <TabsContent value="requisitions" className="m-0">
          <WarehouseRequisitionsTab
            requisitions={requisitions}
            inventoryItems={items}
            loading={loading}
            onRefresh={loadData}
            onOpenCQDialog={(item) => handleOpenCQDialog(item)}
          />
        </TabsContent>

        {/* TAB 4: SUPPLIES & PURCHASES (Fila de Compras e Recebimento com notificação) */}
        <TabsContent value="supplies" className="m-0">
          <SuppliesPurchasesTab purchases={purchases} loading={loading} onRefresh={loadData} />
        </TabsContent>

        {/* TAB 5: SMART MINIMUM STOCK & PERFORMANCE INDICATORS */}
        <TabsContent value="indicators" className="m-0">
          <WarehouseIndicatorsTab
            indicatorsSummary={indicatorsSummary}
            inventoryItems={items}
            pendingWithdrawalsByItem={pendingWithdrawalsByItem}
            pendingPurchasesByItem={pendingPurchasesByItem}
            onRecalculate={handleRecalculateIndicators}
            isRecalculating={isRecalculating}
          />
        </TabsContent>
      </Tabs>

      {/* Item Form Dialog (Create / Edit) */}
      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedItem ? 'Editar Item do Estoque' : 'Cadastrar Novo Item no Estoque'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Descrição do Produto / Material *</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Chapa Aço SA-516 Gr 70"
                className="bg-black/20 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v: any) => setFormData((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Unidade de Medida *</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, unit: e.target.value.toUpperCase() }))
                  }
                  placeholder="UN, KG, L, M, PAR..."
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Saldo Inicial</Label>
                <Input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, current_stock: parseFloat(e.target.value) || 0 }))
                  }
                  disabled={!!selectedItem}
                  className="bg-black/20 border-white/10 text-white disabled:opacity-50"
                />
                {selectedItem && (
                  <span className="text-[10px] text-muted-foreground">Ajuste via movimento</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Estoque Mínimo</Label>
                <Input
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, minimum_stock: parseFloat(e.target.value) || 0 }))
                  }
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Valor Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))
                  }
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Localização Física</Label>
                <Select
                  value={formData.location}
                  onValueChange={(v: any) => setFormData((p) => ({ ...p, location: v }))}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Almoxarifado">Almoxarifado Central</SelectItem>
                    <SelectItem value="Área Externa">Área Externa / Pátio</SelectItem>
                    <SelectItem value="Oficina">Oficina / Caldeiraria</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Fornecedor / Fabricante</Label>
                <Input
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, supplier: e.target.value }))}
                  placeholder="Ex: White Martins, Gerdau..."
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Ordem de Serviço (Opcional)</Label>
              <Select
                value={formData.os_id || '_none'}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, os_id: v === '_none' ? undefined : v }))
                }
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="Vincular a uma OS..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Sem vínculo a OS —</SelectItem>
                  {serviceOrders.map((os) => (
                    <SelectItem key={os.id} value={os.id}>
                      OS {os.number} - {os.client || 'Sem cliente'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checkboxes / Flags */}
            <div className="bg-black/20 p-3 rounded-md space-y-2.5 border border-white/5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="flag-req-cq"
                  checked={formData.requires_cq_inspection || false}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, requires_cq_inspection: e.target.checked }))
                  }
                  className="rounded border-white/20 bg-black/40 text-primary focus:ring-0"
                />
                <Label htmlFor="flag-req-cq" className="text-xs text-white cursor-pointer">
                  Requer Inspeção do CQ (material exige conferência de certificado e liberação pelo
                  QCC)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="flag-consigned"
                  checked={formData.is_consigned || false}
                  onChange={(e) => setFormData((p) => ({ ...p, is_consigned: e.target.checked }))}
                  className="rounded border-white/20 bg-black/40 text-primary focus:ring-0"
                />
                <Label htmlFor="flag-consigned" className="text-xs text-white cursor-pointer">
                  Material Consignado (pertence a fornecedor ou cliente)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="flag-controlled"
                  checked={formData.is_controlled || false}
                  onChange={(e) => setFormData((p) => ({ ...p, is_controlled: e.target.checked }))}
                  className="rounded border-white/20 bg-black/40 text-primary focus:ring-0"
                />
                <Label htmlFor="flag-controlled" className="text-xs text-white cursor-pointer">
                  Produto Controlado (ex: Acetona / Polícia Federal / Exército)
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Observações Técnicas</Label>
              <Input
                value={formData.notes || ''}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Ex: Armazenar sob refrigeração, corrida no laudo técnico..."
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsItemFormOpen(false)}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} className="bg-primary hover:bg-primary/90 text-white">
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
        <DialogContent className="max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Movimentação de Estoque</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2">
              <div className="bg-black/30 p-3 rounded border border-white/5 space-y-1">
                <p className="text-xs text-muted-foreground">Item Selecionado:</p>
                <p className="text-sm font-semibold text-white">{selectedItem.description}</p>
                <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                  <span>
                    Rastreio: <strong className="text-primary">{selectedItem.tracking_code}</strong>
                  </span>
                  <span>
                    Saldo Atual:{' '}
                    <strong className="text-white">
                      {selectedItem.current_stock} {selectedItem.unit}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Tipo de Movimento *</Label>
                <Select
                  value={movementForm.movementType}
                  onValueChange={(v: MovementType) =>
                    setMovementForm((p) => ({ ...p, movementType: v }))
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (Recebimento / Compra)</SelectItem>
                    <SelectItem value="Saída">Saída (Baixa operacional / Consumo)</SelectItem>
                    <SelectItem value="Ajuste">Ajuste de Inventário (Novo saldo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/80">
                    {movementForm.movementType === 'Ajuste' ? 'Novo Saldo Total *' : 'Quantidade *'}
                  </Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={movementForm.quantity}
                    onChange={(e) =>
                      setMovementForm((p) => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))
                    }
                    className="bg-black/20 border-white/10 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-white/80">Valor Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={movementForm.unitPrice}
                    onChange={(e) =>
                      setMovementForm((p) => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))
                    }
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">OS Destino (Opcional)</Label>
                <Select
                  value={movementForm.osId || '_none'}
                  onValueChange={(v) =>
                    setMovementForm((p) => ({ ...p, osId: v === '_none' ? '' : v }))
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Selecione a OS..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Nenhuma —</SelectItem>
                    {serviceOrders.map((os) => (
                      <SelectItem key={os.id} value={os.id}>
                        OS {os.number} - {os.client || 'Sem cliente'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Motivo / Observação</Label>
                <Input
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Ex: NF 12345, requisição do soldador Carlos..."
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMovementOpen(false)}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMovement}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Confirmar Movimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Movimentações
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-3">
              <div className="bg-black/20 p-2.5 rounded border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Item: </span>
                  <strong className="text-white">{selectedItem.description}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Rastreio: </span>
                  <strong className="text-primary font-mono">{selectedItem.tracking_code}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo Atual: </span>
                  <strong className="text-white">
                    {selectedItem.current_stock} {selectedItem.unit}
                  </strong>
                </div>
              </div>

              {historyLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Carregando extrato de movimentações...
                </div>
              ) : movementsHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum movimento registrado até o momento.
                </div>
              ) : (
                <div className="border border-white/10 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 bg-white/5">
                        <TableHead className="text-xs text-white/70">Data/Hora</TableHead>
                        <TableHead className="text-xs text-white/70">Tipo</TableHead>
                        <TableHead className="text-xs text-white/70 text-right">
                          Quantidade
                        </TableHead>
                        <TableHead className="text-xs text-white/70 text-right">
                          Saldo Resultante
                        </TableHead>
                        <TableHead className="text-xs text-white/70">Responsável</TableHead>
                        <TableHead className="text-xs text-white/70">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsHistory.map((m) => (
                        <TableRow key={m.id} className="border-white/5">
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {new Date(m.movement_date || m.created).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <Badge
                              className={`text-[10px] ${
                                m.movement_type === 'Entrada'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : m.movement_type === 'Saída'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {m.movement_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono text-white py-2">
                            {m.movement_type === 'Saída' ? `-${m.quantity}` : `+${m.quantity}`}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono text-white font-medium py-2">
                            {m.balance_after !== undefined ? m.balance_after : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {m.responsible_name || 'Sistema'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {m.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryOpen(false)}
              className="border-white/10 text-muted-foreground"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CQ Inspection Clearance Dialog */}
      <Dialog open={isCQDialogOpen} onOpenChange={setIsCQDialogOpen}>
        <DialogContent className="max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Inspeção e Liberação CQ (QCC)
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2">
              <div className="bg-black/30 p-3 rounded border border-white/5 space-y-1 text-xs">
                <p className="text-muted-foreground">Item em Análise:</p>
                <p className="text-sm font-semibold text-white">{selectedItem.description}</p>
                <p className="text-primary font-mono">{selectedItem.tracking_code}</p>
                {selectedItem.supplier && (
                  <p className="text-muted-foreground">Fornecedor: {selectedItem.supplier}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Decisão da Inspeção CQ *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={cqAction === 'Liberado' ? 'default' : 'outline'}
                    onClick={() => setCqAction('Liberado')}
                    className={`text-xs gap-1.5 ${
                      cqAction === 'Liberado'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium'
                        : 'border-white/10 text-muted-foreground'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Liberar Material
                  </Button>
                  <Button
                    type="button"
                    variant={cqAction === 'Rejeitado' ? 'default' : 'outline'}
                    onClick={() => setCqAction('Rejeitado')}
                    className={`text-xs gap-1.5 ${
                      cqAction === 'Rejeitado'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white font-medium'
                        : 'border-white/10 text-muted-foreground'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Rejeitar Material
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Parecer Técnico / Observações CQ</Label>
                <Input
                  value={cqNotes}
                  onChange={(e) => setCqNotes(e.target.value)}
                  placeholder="Ex: Certificado de corrida conferido conforme ASME Sec. II..."
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>

              <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20 text-xs text-blue-300">
                O usuário <strong>{user?.name || 'QCC'}</strong> será registrado como responsável
                pela liberação técnica.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCQDialogOpen(false)}
              disabled={isCQSubmitting}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCQ}
              disabled={isCQSubmitting}
              className={
                cqAction === 'Liberado'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
            >
              Confirmar Parecer CQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spreadsheet Importer Modal */}
      <InventoryImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => loadData()}
        companies={companies}
        defaultCompanyId={selectedCompanyId !== 'all' ? selectedCompanyId : companies[0]?.id}
      />
    </div>
  )
}
