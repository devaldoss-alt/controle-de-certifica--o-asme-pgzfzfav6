import { useState, useMemo } from 'react'
import type { InventoryItem } from '@/services/inventory'
import type { TeamMember } from '@/services/team'
import type { ServiceOrder } from '@/services/service-orders'
import { createMaterialRequisition, createPurchaseRequest } from '@/services/warehouse-phase2'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  ShoppingCart,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Briefcase,
  Layers,
  Wrench,
  Info,
} from 'lucide-react'

interface TouchOrderFormProps {
  companyId: string
  companyName?: string
  inventoryItems: InventoryItem[]
  teamMembers: TeamMember[]
  serviceOrders: ServiceOrder[]
  pendingPurchasesByItem: Record<string, number>
  onOrderCreated?: () => void
}

export function TouchOrderForm({
  companyId,
  companyName,
  inventoryItems,
  teamMembers,
  serviceOrders,
  pendingPurchasesByItem,
  onOrderCreated,
}: TouchOrderFormProps) {
  const { toast } = useToast()

  // Touch form state
  const [itemQuery, setItemQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [selectedRequesterId, setSelectedRequesterId] = useState<string>('')
  const [requesterSearch, setRequesterSearch] = useState('')
  const [selectedOsId, setSelectedOsId] = useState<string>('')
  const [toolEquipment, setToolEquipment] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<{
    type: 'requisition' | 'purchase'
    title: string
    description: string
  } | null>(null)

  // Filter inventory suggestions based on itemQuery
  const itemSuggestions = useMemo(() => {
    const q = itemQuery.trim().toLowerCase()
    if (!q) return inventoryItems.slice(0, 8)
    return inventoryItems
      .filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          (i.tracking_code && i.tracking_code.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [inventoryItems, itemQuery])

  // Filter team members by search
  const filteredTeamMembers = useMemo(() => {
    const q = requesterSearch.trim().toLowerCase()
    if (!q) return teamMembers.slice(0, 10)
    return teamMembers
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.department && m.department.toLowerCase().includes(q)) ||
          (m.role && m.role.toLowerCase().includes(q)),
      )
      .slice(0, 10)
  }, [teamMembers, requesterSearch])

  // Selected requester member object
  const selectedRequester = useMemo(() => {
    return teamMembers.find((m) => m.id === selectedRequesterId)
  }, [teamMembers, selectedRequesterId])

  // SMART ROUTING: Decide whether this order goes to Retirada or Compra
  const routingDecision = useMemo(() => {
    const requestedQty = Math.max(1, quantity || 1)
    if (!selectedItem) {
      // Inexistent item in catalog → Compra
      return {
        type: 'purchase' as const,
        label: 'Solicitação de Compra para Suprimentos',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: ShoppingCart,
        reason:
          'Item não cadastrado no catálogo. O pedido será encaminhado a Suprimentos para cotação e compra.',
        effectiveStock: 0,
        available: false,
      }
    }

    const curStock = Number(selectedItem.current_stock ?? 0)
    const pendingPurchases = pendingPurchasesByItem[selectedItem.id] || 0

    if (curStock >= requestedQty) {
      // Saldo suficiente → Retirada
      const isPendingCQ =
        selectedItem.requires_cq_inspection && selectedItem.inspection_status !== 'Liberado'
      return {
        type: 'requisition' as const,
        label: 'Requisição de Retirada Imediata',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CheckCircle2,
        reason: isPendingCQ
          ? 'Item com saldo físico disponível, porém requer liberação do CQ antes de retirar do almoxarifado.'
          : `Saldo disponível em estoque (${curStock} ${selectedItem.unit}). Pedido enviado ao Almoxarifado para separação imediata.`,
        effectiveStock: curStock,
        pendingPurchases,
        available: true,
        isPendingCQ,
      }
    } else {
      // Saldo insuficiente → Compra
      return {
        type: 'purchase' as const,
        label: 'Solicitação de Compra (Saldo Insuficiente)',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: ShoppingCart,
        reason: `Saldo insuficiente em estoque (disponível: ${curStock} ${selectedItem.unit}, solicitado: ${requestedQty}). Pedido encaminhado automaticamente para Suprimentos.`,
        effectiveStock: curStock,
        pendingPurchases,
        available: false,
      }
    }
  }, [selectedItem, quantity, pendingPurchasesByItem])

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setItemQuery(item.description)
  }

  const handleClearItem = () => {
    setSelectedItem(null)
    setItemQuery('')
  }

  const handleIncrementQty = (step = 1) => {
    setQuantity((prev) => Math.max(1, (prev || 0) + step))
  }

  const handleDecrementQty = (step = 1) => {
    setQuantity((prev) => Math.max(1, (prev || 1) - step))
  }

  const handleResetForm = () => {
    setSelectedItem(null)
    setItemQuery('')
    setQuantity(1)
    setSelectedRequesterId('')
    setRequesterSearch('')
    setSelectedOsId('')
    setToolEquipment('')
    setNotes('')
    setSubmittedResult(null)
  }

  const handleSubmit = async () => {
    const finalDesc = selectedItem ? selectedItem.description : itemQuery.trim()
    if (!finalDesc) {
      toast({
        title: 'Informe ou selecione a descrição do material',
        variant: 'destructive',
      })
      return
    }

    if (!selectedRequester && !requesterSearch.trim()) {
      toast({
        title: 'Selecione ou digite o solicitante (operador/responsável)',
        variant: 'destructive',
      })
      return
    }

    const requesterName = selectedRequester ? selectedRequester.name : requesterSearch.trim()
    const requesterRole = selectedRequester?.role || selectedRequester?.department || 'Operador'
    const requesterDept = selectedRequester?.department || ''

    setIsSubmitting(true)

    try {
      if (routingDecision.type === 'requisition' && selectedItem) {
        // Create Material Requisition
        const created = await createMaterialRequisition({
          item_id: selectedItem.id,
          company_id: companyId,
          quantity: quantity,
          os_id: selectedOsId || undefined,
          requester_id: selectedRequester?.id,
          requester_name: requesterName,
          requester_role: requesterRole,
          requester_company: companyName || '',
          tool_equipment: toolEquipment || undefined,
          notes: notes || undefined,
          status: 'pendente',
        })

        setSubmittedResult({
          type: 'requisition',
          title: 'Requisição de Retirada Criada!',
          description: `Pedido #${created.id.slice(-6).toUpperCase()} registrado no Almoxarifado para ${quantity} ${selectedItem.unit} de "${selectedItem.description}". Notificação disparada aos almoxarifes.`,
        })

        toast({
          title: 'Requisição de Retirada confirmada com sucesso',
          description: `Enviada para separação no Almoxarifado.`,
        })
      } else {
        // Create Purchase Request
        const created = await createPurchaseRequest({
          item_description: finalDesc,
          item_id: selectedItem?.id,
          company_id: companyId,
          quantity: quantity,
          unit: selectedItem?.unit || 'UN',
          os_id: selectedOsId || undefined,
          requester_id: selectedRequester?.id,
          requester_name: requesterName,
          requester_role: requesterRole,
          requester_company: companyName || '',
          notes: notes || undefined,
          status: 'pendente',
        })

        setSubmittedResult({
          type: 'purchase',
          title: 'Solicitação de Compra Criada!',
          description: `Pedido #${created.id.slice(-6).toUpperCase()} enviado para o painel de Suprimentos (${quantity}x "${finalDesc}"). O solicitante será avisado no recebimento.`,
        })

        toast({
          title: 'Solicitação de Compra registrada',
          description: `Encaminhada para cotação e compra pela equipe de Suprimentos.`,
        })
      }

      onOrderCreated?.()
    } catch (e: any) {
      console.error('Error submitting order:', e)
      toast({
        title: 'Erro ao enviar pedido',
        description: e?.message || 'Falha na comunicação com o servidor',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success Confirmation Screen
  if (submittedResult) {
    return (
      <Card className="bg-card border-white/10 text-center p-8 max-w-xl mx-auto my-6 shadow-2xl">
        <CardContent className="space-y-6 pt-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            {submittedResult.type === 'requisition' ? (
              <CheckCircle2 className="w-9 h-9" />
            ) : (
              <ShoppingCart className="w-9 h-9" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">{submittedResult.title}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {submittedResult.description}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={handleResetForm}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-medium gap-2 text-base px-6 py-6"
            >
              <RotateCcw className="w-5 h-5" /> Fazer Novo Pedido
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Intro banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 sm:p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Modo Touch — Requisição e Solicitação de Materiais
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            O sistema faz o <strong>roteamento automático</strong>: se o material tiver saldo em
            estoque, vira <strong>Requisição de Retirada</strong>; se faltar ou não existir no
            catálogo, vai direto para <strong>Solicitação de Compra</strong>.
          </p>
        </div>
      </div>

      {/* Touch Card 1: Item & Description */}
      <Card className="bg-card border-white/10 overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                Material / Insumo / Ferramenta
              </h3>
              <p className="text-xs text-muted-foreground">
                Busque no catálogo ou digite uma descrição nova
              </p>
            </div>
          </div>
          {selectedItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearItem}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Trocar item
            </Button>
          )}
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-muted-foreground" />
            <Input
              value={itemQuery}
              onChange={(e) => {
                setItemQuery(e.target.value)
                if (selectedItem && e.target.value !== selectedItem.description) {
                  setSelectedItem(null)
                }
              }}
              placeholder="Digite para buscar material ou novo item..."
              className="h-12 sm:h-14 pl-11 text-base bg-black/30 border-white/15 text-white placeholder:text-muted-foreground/70 rounded-xl"
            />
          </div>

          {/* Autocomplete / Suggested Items Grid */}
          {!selectedItem && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {itemQuery ? 'Itens encontrados no catálogo:' : 'Itens frequentes do almoxarifado:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {itemSuggestions.map((item) => {
                  const isLow =
                    item.minimum_stock !== undefined &&
                    (item.current_stock ?? 0) <= (item.minimum_stock ?? 0)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="p-3 text-left rounded-lg bg-black/20 hover:bg-primary/10 border border-white/5 hover:border-primary/40 transition-all flex items-start justify-between gap-2 group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="font-mono text-primary/80">{item.tracking_code}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <span
                            className={`text-xs font-bold ${
                              item.current_stock > 0
                                ? isLow
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.current_stock}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block">em estoque</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected Item Card */}
          {selectedItem && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                    {selectedItem.category}
                  </Badge>
                  <span className="text-xs font-mono text-primary font-bold">
                    {selectedItem.tracking_code}
                  </span>
                  {selectedItem.requires_cq_inspection && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        selectedItem.inspection_status === 'Liberado'
                          ? 'border-emerald-500/40 text-emerald-400'
                          : 'border-amber-500/40 text-amber-400'
                      }`}
                    >
                      {selectedItem.inspection_status === 'Liberado'
                        ? 'Liberado CQ'
                        : 'Aguardando CQ'}
                    </Badge>
                  )}
                </div>
                <h4 className="text-base font-bold text-white">{selectedItem.description}</h4>
                <p className="text-xs text-muted-foreground">
                  Local: <strong>{selectedItem.location || 'Almoxarifado'}</strong>
                  {selectedItem.supplier ? ` • Fornecedor: ${selectedItem.supplier}` : ''}
                </p>
              </div>

              <div className="bg-black/30 px-4 py-2.5 rounded-lg border border-white/5 text-right shrink-0">
                <p className="text-[11px] text-muted-foreground">Saldo Físico Atual</p>
                <p className="text-xl font-bold text-white">
                  {selectedItem.current_stock}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {selectedItem.unit}
                  </span>
                </p>
                {selectedItem.minimum_stock !== undefined && (
                  <p className="text-[10px] text-muted-foreground">
                    Mínimo: {selectedItem.minimum_stock} {selectedItem.unit}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Touch Card 2: Quantity (+/- Large Touch Buttons) */}
      <Card className="bg-card border-white/10 overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                Quantidade Solicitada
              </h3>
              <p className="text-xs text-muted-foreground">
                Ajuste facilmente nos botões de toque ou digite
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Unidade: <strong className="text-white">{selectedItem?.unit || 'UN'}</strong>
          </span>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDecrementQty(5)}
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl border-white/15 bg-black/30 hover:bg-white/10 text-white font-bold text-base active:scale-95 transition-transform"
              title="-5"
            >
              -5
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDecrementQty(1)}
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl border-white/15 bg-black/30 hover:bg-white/10 text-white font-bold text-xl active:scale-95 transition-transform"
              title="-1"
            >
              <Minus className="w-6 h-6" />
            </Button>

            <div className="w-32 sm:w-44 text-center">
              <Input
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                className="h-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold bg-black/40 border-primary/40 text-white font-mono rounded-xl focus:ring-primary"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleIncrementQty(1)}
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl border-white/15 bg-black/30 hover:bg-white/10 text-white font-bold text-xl active:scale-95 transition-transform"
              title="+1"
            >
              <Plus className="w-6 h-6" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleIncrementQty(5)}
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl border-white/15 bg-black/30 hover:bg-white/10 text-white font-bold text-base active:scale-95 transition-transform"
              title="+5"
            >
              +5
            </Button>
          </div>

          {/* Quick Pre-sets */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[1, 2, 5, 10, 20, 50].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={quantity === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuantity(preset)}
                className={`h-9 px-3 text-xs rounded-lg ${
                  quantity === preset
                    ? 'bg-primary text-white font-bold'
                    : 'border-white/10 bg-black/20 text-muted-foreground hover:text-white'
                }`}
              >
                {preset} {selectedItem?.unit || 'UN'}
              </Button>
            ))}
          </div>

          {/* Smart Decision Card Display */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              routingDecision.type === 'requisition'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  routingDecision.type === 'requisition'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <routingDecision.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Destino Automático:
                  </span>
                  <Badge className={`${routingDecision.badgeColor} text-xs font-semibold`}>
                    {routingDecision.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {routingDecision.reason}
                </p>
                {routingDecision.pendingPurchases > 0 && (
                  <p className="text-[11px] text-blue-300 flex items-center gap-1 pt-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Atenção: Já existem <strong>{routingDecision.pendingPurchases}</strong> unidades
                    deste item em pedidos de compra pendentes.
                  </p>
                )}
                {routingDecision.isPendingCQ && (
                  <p className="text-[11px] text-amber-300 flex items-center gap-1 pt-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Aviso: O CQ precisará liberar este item antes que o almoxarife confirme a saída.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Touch Card 3: Requester, OS and Equipment */}
      <Card className="bg-card border-white/10 overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                Solicitante e Destino Operacional
              </h3>
              <p className="text-xs text-muted-foreground">
                Selecione o operador e a Ordem de Serviço (OS)
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Solicitante Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Solicitante (Colaborador / Operador) *
            </Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={requesterSearch}
                onChange={(e) => {
                  setRequesterSearch(e.target.value)
                  if (selectedRequester && e.target.value !== selectedRequester.name) {
                    setSelectedRequesterId('')
                  }
                }}
                placeholder="Buscar colaborador da empresa..."
                className="pl-9 h-11 bg-black/30 border-white/10 text-white rounded-lg text-sm"
              />
            </div>

            {/* Quick collaborator tiles */}
            {!selectedRequester && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 pt-1">
                {filteredTeamMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedRequesterId(member.id)
                      setRequesterSearch(member.name)
                    }}
                    className="p-2 text-left rounded-lg bg-black/20 hover:bg-primary/10 border border-white/5 hover:border-primary/40 text-xs transition-colors"
                  >
                    <p className="font-semibold text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {member.department || member.role || 'Colaborador'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {selectedRequester && (
              <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Selecionado: </span>
                  <strong className="text-white">{selectedRequester.name}</strong>
                  <span className="text-muted-foreground">
                    {' '}
                    ({selectedRequester.department || selectedRequester.role || 'Colaborador'})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRequesterId('')
                    setRequesterSearch('')
                  }}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-white"
                >
                  Alterar
                </Button>
              </div>
            )}
          </div>

          {/* OS and Tool/Equipment grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" /> Ordem de Serviço (Opcional)
              </Label>
              <select
                value={selectedOsId}
                onChange={(e) => setSelectedOsId(e.target.value)}
                className="w-full h-11 rounded-lg bg-black/30 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="" className="bg-zinc-900 text-white">
                  — Nenhuma / Uso Geral Oficina —
                </option>
                {serviceOrders.map((os) => (
                  <option key={os.id} value={os.id} className="bg-zinc-900 text-white">
                    OS {os.number} - {os.client || 'Sem cliente'} ({os.equipment || 'Geral'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-primary" /> Ferramenta / Equipamento de Destino
              </Label>
              <Input
                value={toolEquipment}
                onChange={(e) => setToolEquipment(e.target.value)}
                placeholder="Ex: Máquina MIG-02, Torno Romi, Ponteira..."
                className="h-11 bg-black/30 border-white/10 text-white rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-white/80">Observações Adicionais</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Retirada urgente para turno da noite, aguardar conferência..."
              className="h-11 bg-black/30 border-white/10 text-white rounded-lg text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Action Button */}
      <div className="pt-2">
        <Button
          size="lg"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className={`w-full h-16 rounded-xl font-bold text-lg gap-2 shadow-xl active:scale-[0.99] transition-transform ${
            routingDecision.type === 'requisition'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {isSubmitting ? (
            'Processando pedido...'
          ) : (
            <>
              <Send className="w-5 h-5" />
              {routingDecision.type === 'requisition'
                ? `Confirmar Requisição de Retirada (${quantity}x)`
                : `Enviar Solicitação de Compra (${quantity}x)`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
