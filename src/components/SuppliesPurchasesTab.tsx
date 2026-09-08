import { useState, useMemo } from 'react'
import type { PurchaseRequest, PurchaseRequestStatus } from '@/services/warehouse-phase2'
import { updatePurchaseRequestStatus } from '@/services/warehouse-phase2'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  PackageCheck,
  XCircle,
  Truck,
  ArrowRight,
  User,
  Building2,
  AlertTriangle,
} from 'lucide-react'

interface SuppliesPurchasesTabProps {
  purchases: PurchaseRequest[]
  loading?: boolean
  onRefresh: () => void
}

export function SuppliesPurchasesTab({ purchases, loading, onRefresh }: SuppliesPurchasesTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Action dialogs
  const [activeRequest, setActiveRequest] = useState<PurchaseRequest | null>(null)
  const [actionType, setActionType] = useState<
    'cotado' | 'comprado' | 'recebido' | 'cancelado' | null
  >(null)
  const [supplierInput, setSupplierInput] = useState('')
  const [unitPriceInput, setUnitPriceInput] = useState<number>(0)
  const [cancelReasonInput, setCancelReasonInput] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const counts = useMemo(() => {
    return {
      pendente: purchases.filter((p) => p.status === 'pendente').length,
      cotado: purchases.filter((p) => p.status === 'cotado').length,
      comprado: purchases.filter((p) => p.status === 'comprado').length,
      recebido: purchases.filter((p) => p.status === 'recebido').length,
      cancelado: purchases.filter((p) => p.status === 'cancelado').length,
    }
  }, [purchases])

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search.trim()) {
        const s = search.trim().toLowerCase()
        const desc = p.item_description.toLowerCase()
        const req = p.requester_name.toLowerCase()
        const sup = (p.supplier || '').toLowerCase()
        const os = p.expand?.os_id?.number?.toLowerCase() || ''
        if (!desc.includes(s) && !req.includes(s) && !sup.includes(s) && !os.includes(s)) {
          return false
        }
      }
      return true
    })
  }, [purchases, statusFilter, search])

  const handleOpenAction = (
    req: PurchaseRequest,
    type: 'cotado' | 'comprado' | 'recebido' | 'cancelado',
  ) => {
    setActiveRequest(req)
    setActionType(type)
    setSupplierInput(req.supplier || '')
    setUnitPriceInput(req.estimated_unit_price || 0)
    setCancelReasonInput('')
    setActionNotes('')
  }

  const handleConfirmAction = async () => {
    if (!activeRequest || !actionType) return

    setIsProcessing(true)
    try {
      await updatePurchaseRequestStatus({
        requestId: activeRequest.id,
        newStatus: actionType,
        supplier: supplierInput || undefined,
        estimatedUnitPrice: unitPriceInput || undefined,
        userId: user?.id,
        userName: user?.name,
        cancelReason: cancelReasonInput || undefined,
        notes: actionNotes || undefined,
      })

      if (actionType === 'recebido') {
        toast({
          title: '📦 Material Recebido no Almoxarifado!',
          description: `Entrada automática registrada no catálogo e no histórico de estoque. O solicitante original (${activeRequest.requester_name}) foi notificado.`,
        })
      } else {
        toast({
          title: `Status atualizado: ${actionType.toUpperCase()}`,
          description: `Solicitação #${activeRequest.id.slice(-6).toUpperCase()} avançou no fluxo de Suprimentos.`,
        })
      }

      setActiveRequest(null)
      setActionType(null)
      onRefresh()
    } catch (e: any) {
      toast({
        title: 'Erro ao atualizar solicitação',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Supplies Status Pipeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'pendente'
              ? 'bg-amber-500/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pendente</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400 mt-1">{counts.pendente}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Novo pedido</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'cotado' ? 'all' : 'cotado')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'cotado'
              ? 'bg-blue-500/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cotado</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-400 mt-1">{counts.cotado}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Em cotação</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'comprado' ? 'all' : 'comprado')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'comprado'
              ? 'bg-purple-500/20 border-purple-500/50 shadow-md ring-1 ring-purple-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Comprado</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-400 mt-1">{counts.comprado}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Aguardando entrega</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'recebido' ? 'all' : 'recebido')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'recebido'
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Recebido</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1">{counts.recebido}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Entrou no estoque</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'cancelado' ? 'all' : 'cancelado')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'cancelado'
              ? 'bg-rose-500/20 border-rose-500/50 shadow-md ring-1 ring-rose-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cancelado</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 mt-1">{counts.cancelado}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Cancelado/rejeitado</p>
        </button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-white/10">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descrição, fornecedor, solicitante ou OS..."
                className="pl-9 bg-black/20 border-white/10 text-white text-xs sm:text-sm"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-md bg-black/20 border border-white/10 px-3 text-xs text-white focus:outline-none"
              >
                <option value="all" className="bg-zinc-900 text-white">
                  Todos os Status de Compra
                </option>
                <option value="pendente" className="bg-zinc-900 text-white">
                  Pendente
                </option>
                <option value="cotado" className="bg-zinc-900 text-white">
                  Cotado
                </option>
                <option value="comprado" className="bg-zinc-900 text-white">
                  Comprado
                </option>
                <option value="recebido" className="bg-zinc-900 text-white">
                  Recebido
                </option>
                <option value="cancelado" className="bg-zinc-900 text-white">
                  Cancelado
                </option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="bg-card border-white/10">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Fila de Suprimentos & Compras (
            {filteredPurchases.length})
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {counts.pendente + counts.cotado + counts.comprado} pedido(s) em andamento
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Carregando solicitações de compra...
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-white font-medium text-sm">
                Nenhuma solicitação de compra encontrada
              </p>
              <p className="text-xs text-muted-foreground">
                Pedidos de itens sem estoque suficiente ou novos materiais são direcionados para cá.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/5">
                    <TableHead className="text-xs text-white/70">Código / Data</TableHead>
                    <TableHead className="text-xs text-white/70">Item Solicitado</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Qtd</TableHead>
                    <TableHead className="text-xs text-white/70">Solicitante</TableHead>
                    <TableHead className="text-xs text-white/70">OS</TableHead>
                    <TableHead className="text-xs text-white/70">Fornecedor / Preço</TableHead>
                    <TableHead className="text-xs text-white/70">Status</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">
                      Ações Suprimentos
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((req) => (
                    <TableRow key={req.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="text-xs py-3 font-mono">
                        <div className="font-bold text-amber-400">
                          #{req.id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(req.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-3">
                        <div className="font-medium text-white">{req.item_description}</div>
                        {req.item_id && (
                          <div className="text-[10px] text-primary/80 font-mono">
                            Item vinculado ao catálogo
                          </div>
                        )}
                        {req.notes && (
                          <div className="text-[10px] text-muted-foreground italic truncate max-w-xs">
                            {req.notes}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-right py-3 font-mono font-bold text-white">
                        <span className="text-sm">{req.quantity}</span>{' '}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {req.unit || 'UN'}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs py-3">
                        <div className="font-medium text-white flex items-center gap-1">
                          <User className="w-3 h-3 text-primary/70" />
                          {req.requester_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {req.requester_role || 'Colaborador'}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-3">
                        {req.expand?.os_id ? (
                          <Badge className="bg-white/10 text-white border-white/20 text-[10px]">
                            OS {req.expand.os_id.number}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs py-3">
                        {req.supplier ? (
                          <div>
                            <span className="font-medium text-white">{req.supplier}</span>
                            {req.estimated_unit_price !== undefined &&
                              req.estimated_unit_price > 0 && (
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  R$ {req.estimated_unit_price.toFixed(2)}/un
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Não definido
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs py-3">
                        {req.status === 'pendente' && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] gap-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                        {req.status === 'cotado' && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] gap-1">
                            <DollarSign className="w-3 h-3" /> Cotado
                          </Badge>
                        )}
                        {req.status === 'comprado' && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] gap-1">
                            <Truck className="w-3 h-3" /> Comprado
                          </Badge>
                        )}
                        {req.status === 'recebido' && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Recebido
                          </Badge>
                        )}
                        {req.status === 'cancelado' && (
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] gap-1">
                            <XCircle className="w-3 h-3" /> Cancelado
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {req.status === 'pendente' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAction(req, 'cotado')}
                              className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                            >
                              <DollarSign className="w-3 h-3" /> Cotar
                            </Button>
                          )}

                          {req.status === 'cotado' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAction(req, 'comprado')}
                              className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                            >
                              <Truck className="w-3 h-3" /> Comprar
                            </Button>
                          )}

                          {req.status === 'comprado' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAction(req, 'recebido')}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-medium"
                            >
                              <PackageCheck className="w-3 h-3" /> Receber Material
                            </Button>
                          )}

                          {req.status !== 'recebido' && req.status !== 'cancelado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAction(req, 'cancelado')}
                              className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for Advancing Status (Cotado, Comprado, Recebido, Cancelado) */}
      <Dialog open={!!activeRequest} onOpenChange={(open) => !open && setActiveRequest(null)}>
        <DialogContent className="max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {actionType === 'cotado' && <DollarSign className="w-5 h-5 text-blue-400" />}
              {actionType === 'comprado' && <Truck className="w-5 h-5 text-purple-400" />}
              {actionType === 'recebido' && <PackageCheck className="w-5 h-5 text-emerald-400" />}
              {actionType === 'cancelado' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              <span>
                {actionType === 'cotado' && 'Registrar Cotação de Preço'}
                {actionType === 'comprado' && 'Confirmar Compra do Pedido'}
                {actionType === 'recebido' && 'Receber Material no Almoxarifado'}
                {actionType === 'cancelado' && 'Cancelar Solicitação de Compra'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {activeRequest && (
            <div className="space-y-4 py-2">
              <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1 text-xs">
                <p className="text-muted-foreground">Item Solicitado:</p>
                <p className="text-sm font-bold text-white">{activeRequest.item_description}</p>
                <p className="text-primary font-mono">
                  Quantidade: {activeRequest.quantity} {activeRequest.unit || 'UN'}
                </p>
                <p className="text-muted-foreground">
                  Solicitante: <strong>{activeRequest.requester_name}</strong>
                </p>
              </div>

              {actionType !== 'cancelado' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/90">Fornecedor / Loja</Label>
                    <Input
                      value={supplierInput}
                      onChange={(e) => setSupplierInput(e.target.value)}
                      placeholder="Ex: White Martins, Gerdau, Loja do Mecânico..."
                      className="bg-black/20 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/90">Valor Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPriceInput}
                      onChange={(e) => setUnitPriceInput(parseFloat(e.target.value) || 0)}
                      className="bg-black/20 border-white/10 text-white font-mono"
                    />
                  </div>
                </>
              )}

              {actionType === 'recebido' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Efeitos Automáticos:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-200/90">
                    <li>Entrada no catálogo físico do almoxarifado</li>
                    <li>Registro de movimentação de estoque (Entrada)</li>
                    <li>Notificação ao solicitante: &quot;O item que você pediu chegou!&quot;</li>
                  </ul>
                </div>
              )}

              {actionType === 'cancelado' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/90">Motivo do Cancelamento *</Label>
                  <Input
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    placeholder="Ex: Preço acima do orçamento, item desnecessário..."
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Observações Adicionais</Label>
                <Input
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Ex: Previsão de entrega 3 dias, NF em anexo..."
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveRequest(null)}
              className="border-white/10 text-muted-foreground"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={
                actionType === 'recebido'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : actionType === 'cancelado'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
              }
            >
              {actionType === 'recebido' ? 'Confirmar Recebimento e Entrada' : 'Salvar Andamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
