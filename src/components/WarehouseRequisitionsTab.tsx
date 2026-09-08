import { useState, useMemo } from 'react'
import type { MaterialRequisition, MaterialRequisitionStatus } from '@/services/warehouse-phase2'
import { updateMaterialRequisitionStatus } from '@/services/warehouse-phase2'
import type { InventoryItem } from '@/services/inventory'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import {
  Search,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  Download,
  AlertTriangle,
  Layers,
  User,
} from 'lucide-react'

interface WarehouseRequisitionsTabProps {
  requisitions: MaterialRequisition[]
  inventoryItems: InventoryItem[]
  loading?: boolean
  onRefresh: () => void
  onOpenCQDialog?: (item: InventoryItem) => void
}

export function WarehouseRequisitionsTab({
  requisitions,
  inventoryItems,
  loading,
  onRefresh,
  onOpenCQDialog,
}: WarehouseRequisitionsTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [osFilter, setOsFilter] = useState<string>('all')

  // Cancel dialog state
  const [cancelRequisition, setCancelRequisition] = useState<MaterialRequisition | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Map inventory items by id for quick lookup of CQ status and stock
  const itemsMap = useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventoryItems.forEach((i) => map.set(i.id, i))
    return map
  }, [inventoryItems])

  // Unique OS list from requisitions
  const osList = useMemo(() => {
    const set = new Set<string>()
    requisitions.forEach((r) => {
      if (r.expand?.os_id?.number) set.add(r.expand.os_id.number)
    })
    return Array.from(set)
  }, [requisitions])

  // Filtered list
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (osFilter !== 'all' && r.expand?.os_id?.number !== osFilter) return false
      if (search.trim()) {
        const s = search.trim().toLowerCase()
        const desc = r.expand?.item_id?.description?.toLowerCase() || ''
        const reqName = r.requester_name.toLowerCase()
        const osNum = r.expand?.os_id?.number?.toLowerCase() || ''
        const code = r.expand?.item_id?.tracking_code?.toLowerCase() || ''
        if (!desc.includes(s) && !reqName.includes(s) && !osNum.includes(s) && !code.includes(s)) {
          return false
        }
      }
      return true
    })
  }, [requisitions, statusFilter, osFilter, search])

  // Status counters
  const counts = useMemo(() => {
    return {
      pendente: requisitions.filter((r) => r.status === 'pendente').length,
      em_separacao: requisitions.filter((r) => r.status === 'em_separacao').length,
      retirado: requisitions.filter((r) => r.status === 'retirado').length,
      cancelado: requisitions.filter((r) => r.status === 'cancelado').length,
    }
  }, [requisitions])

  const handleStartSeparation = async (req: MaterialRequisition) => {
    try {
      setIsProcessing(true)
      await updateMaterialRequisitionStatus({
        requisitionId: req.id,
        newStatus: 'em_separacao',
        userId: user?.id,
        userName: user?.name || 'Almoxarife',
      })
      toast({
        title: 'Status atualizado: Em Separação',
        description: `Almoxarifado iniciou a separação do pedido #${req.id.slice(-6).toUpperCase()}.`,
      })
      onRefresh()
    } catch (e: any) {
      toast({
        title: 'Erro ao iniciar separação',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmCheckout = async (req: MaterialRequisition) => {
    const item = itemsMap.get(req.item_id) || req.expand?.item_id

    // Check inspection lock
    if (item?.requires_cq_inspection && item?.inspection_status !== 'Liberado') {
      toast({
        title: '⚠️ Saída Bloqueada pelo CQ',
        description: `O item "${item.description}" requer aprovação do Controle de Qualidade (status: ${item.inspection_status || 'Aguardando inspeção'}). Liberação pelo QCC é obrigatória.`,
        variant: 'destructive',
      })
      return
    }

    try {
      setIsProcessing(true)
      await updateMaterialRequisitionStatus({
        requisitionId: req.id,
        newStatus: 'retirado',
        userId: user?.id,
        userName: user?.name || 'Almoxarife',
      })
      toast({
        title: '✅ Retirada Confirmada!',
        description: `Baixa de ${req.quantity} unidade(s) efetuada no saldo do estoque com sucesso.`,
      })
      onRefresh()
    } catch (e: any) {
      toast({
        title: 'Erro ao confirmar retirada',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelRequisition) return
    if (!cancelReason.trim()) {
      toast({ title: 'Informe o motivo do cancelamento', variant: 'destructive' })
      return
    }

    try {
      setIsProcessing(true)
      await updateMaterialRequisitionStatus({
        requisitionId: cancelRequisition.id,
        newStatus: 'cancelado',
        userId: user?.id,
        userName: user?.name,
        cancelReason: cancelReason.trim(),
      })
      toast({
        title: 'Pedido cancelado',
        description: `Requisição #${cancelRequisition.id.slice(-6).toUpperCase()} cancelada com motivo registrado.`,
      })
      setCancelRequisition(null)
      setCancelReason('')
      onRefresh()
    } catch (e: any) {
      toast({
        title: 'Erro ao cancelar requisição',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredRequisitions.length === 0) {
      toast({ title: 'Nenhum dado para exportar', variant: 'destructive' })
      return
    }

    const headers = [
      'ID',
      'Data Criacao',
      'Item',
      'Codigo Rastreio',
      'Quantidade',
      'Unidade',
      'Solicitante',
      'Cargo/Setor',
      'OS',
      'Equipamento',
      'Status',
      'Separado Por',
      'Data Retirada',
      'Motivo Cancelamento',
    ]

    const rows = filteredRequisitions.map((r) => {
      const item = itemsMap.get(r.item_id) || r.expand?.item_id
      return [
        r.id,
        new Date(r.created).toLocaleString('pt-BR'),
        `"${(item?.description || '').replace(/"/g, '""')}"`,
        item?.tracking_code || '',
        r.quantity,
        item?.unit || 'UN',
        `"${(r.requester_name || '').replace(/"/g, '""')}"`,
        `"${(r.requester_role || '').replace(/"/g, '""')}"`,
        r.expand?.os_id?.number || '',
        `"${(r.tool_equipment || '').replace(/"/g, '""')}"`,
        r.status,
        `"${(r.separated_by_name || '').replace(/"/g, '""')}"`,
        r.confirmation_date ? new Date(r.confirmation_date).toLocaleString('pt-BR') : '',
        `"${(r.cancel_reason || '').replace(/"/g, '""')}"`,
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `requisicoes_almoxarifado_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Quick Status KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <span className="text-xs text-muted-foreground">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{counts.pendente}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Aguardando separação</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'em_separacao' ? 'all' : 'em_separacao')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'em_separacao'
              ? 'bg-blue-500/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Em Separação</span>
            <PackageCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-400 mt-1">{counts.em_separacao}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Sendo conferido na bancada</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'retirado' ? 'all' : 'retirado')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'retirado'
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
              : 'bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Retirados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{counts.retirado}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Baixa confirmada</p>
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
            <span className="text-xs text-muted-foreground">Cancelados</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">{counts.cancelado}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Estornados/recusados</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card border-white/10">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por item, solicitante, OS ou rastreio..."
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
                  Todos os Status
                </option>
                <option value="pendente" className="bg-zinc-900 text-white">
                  Pendente
                </option>
                <option value="em_separacao" className="bg-zinc-900 text-white">
                  Em Separação
                </option>
                <option value="retirado" className="bg-zinc-900 text-white">
                  Retirado
                </option>
                <option value="cancelado" className="bg-zinc-900 text-white">
                  Cancelado
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={osFilter}
                onChange={(e) => setOsFilter(e.target.value)}
                className="w-full h-9 rounded-md bg-black/20 border border-white/10 px-3 text-xs text-white focus:outline-none"
              >
                <option value="all" className="bg-zinc-900 text-white">
                  Todas as OS
                </option>
                {osList.map((os) => (
                  <option key={os} value={os} className="bg-zinc-900 text-white">
                    OS {os}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 border-white/10 text-muted-foreground hover:text-white shrink-0 text-xs gap-1"
                title="Exportar CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Requisitions Table */}
      <Card className="bg-card border-white/10">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Fila de Atendimento do Almoxarifado (
            {filteredRequisitions.length})
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {counts.pendente} pendente(s) requerem atenção
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Carregando requisições de retirada...
            </div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <PackageCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-white font-medium text-sm">
                Nenhuma requisição de retirada encontrada
              </p>
              <p className="text-xs text-muted-foreground">
                Novos pedidos feitos no modo touch ou pela produção aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/5">
                    <TableHead className="text-xs text-white/70">Código / Data</TableHead>
                    <TableHead className="text-xs text-white/70">Material Requisitado</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Qtd</TableHead>
                    <TableHead className="text-xs text-white/70">Solicitante</TableHead>
                    <TableHead className="text-xs text-white/70">OS / Destino</TableHead>
                    <TableHead className="text-xs text-white/70">CQ / Trava</TableHead>
                    <TableHead className="text-xs text-white/70">Status</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">
                      Ações Almoxarifado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequisitions.map((req) => {
                    const item = itemsMap.get(req.item_id) || req.expand?.item_id
                    const isCQBlocked =
                      item?.requires_cq_inspection && item?.inspection_status !== 'Liberado'

                    return (
                      <TableRow
                        key={req.id}
                        className={`border-white/5 hover:bg-white/[0.02] ${
                          req.status === 'pendente'
                            ? 'bg-amber-500/[0.03]'
                            : req.status === 'em_separacao'
                              ? 'bg-blue-500/[0.03]'
                              : ''
                        }`}
                      >
                        {/* ID / Date */}
                        <TableCell className="text-xs py-3 font-mono">
                          <div className="font-bold text-primary">
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

                        {/* Material */}
                        <TableCell className="text-xs py-3">
                          <div className="font-medium text-white">
                            {item?.description || 'Item não encontrado'}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-primary/80">
                              {item?.tracking_code || '—'}
                            </span>
                            <span>•</span>
                            <span>
                              Saldo Físico: {item?.current_stock ?? '—'} {item?.unit || 'UN'}
                            </span>
                          </div>
                          {req.notes && (
                            <div className="text-[10px] text-muted-foreground italic mt-0.5">
                              Obs: {req.notes}
                            </div>
                          )}
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-xs text-right py-3 font-mono font-bold text-white">
                          <span className="text-sm">{req.quantity}</span>{' '}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {item?.unit || 'UN'}
                          </span>
                        </TableCell>

                        {/* Requester */}
                        <TableCell className="text-xs py-3">
                          <div className="font-medium text-white flex items-center gap-1">
                            <User className="w-3 h-3 text-primary/70" />
                            {req.requester_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {req.requester_role || 'Colaborador'}
                          </div>
                        </TableCell>

                        {/* OS / Equipment */}
                        <TableCell className="text-xs py-3">
                          {req.expand?.os_id ? (
                            <div>
                              <Badge className="bg-white/10 text-white border-white/20 text-[10px]">
                                OS {req.expand.os_id.number}
                              </Badge>
                              {req.tool_equipment && (
                                <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                                  Equip: {req.tool_equipment}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {req.tool_equipment || 'Uso Geral'}
                            </span>
                          )}
                        </TableCell>

                        {/* CQ Lock Status */}
                        <TableCell className="text-xs py-3">
                          {!item?.requires_cq_inspection ? (
                            <span className="text-[11px] text-muted-foreground">Dispensada</span>
                          ) : item.inspection_status === 'Liberado' ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Liberado
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 text-[10px] gap-1 font-semibold">
                                <ShieldAlert className="w-3 h-3" /> Bloqueado CQ
                              </Badge>
                              {onOpenCQDialog && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => onOpenCQDialog(item)}
                                    className="text-[10px] text-primary underline hover:text-primary/80"
                                  >
                                    Avaliar no CQ
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-xs py-3">
                          {req.status === 'pendente' && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] gap-1">
                              <Clock className="w-3 h-3" /> Pendente
                            </Badge>
                          )}
                          {req.status === 'em_separacao' && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] gap-1">
                              <PackageCheck className="w-3 h-3" /> Em Separação
                            </Badge>
                          )}
                          {req.status === 'retirado' && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Retirado
                            </Badge>
                          )}
                          {req.status === 'cancelado' && (
                            <div className="space-y-0.5">
                              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] gap-1">
                                <XCircle className="w-3 h-3" /> Cancelado
                              </Badge>
                              {req.cancel_reason && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                  {req.cancel_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {req.status === 'pendente' && (
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleStartSeparation(req)}
                                className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                              >
                                <PackageCheck className="w-3.5 h-3.5" /> Separar
                              </Button>
                            )}

                            {(req.status === 'pendente' || req.status === 'em_separacao') && (
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleConfirmCheckout(req)}
                                className={`h-7 px-2.5 text-xs gap-1 font-medium ${
                                  isCQBlocked
                                    ? 'bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                                title={
                                  isCQBlocked
                                    ? 'Retirada bloqueada até liberação do CQ'
                                    : 'Confirmar entrega física e dar baixa no estoque'
                                }
                              >
                                {isCQBlocked ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                                    Trava CQ
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Confirmar Retirada
                                  </>
                                )}
                              </Button>
                            )}

                            {(req.status === 'pendente' || req.status === 'em_separacao') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isProcessing}
                                onClick={() => {
                                  setCancelRequisition(req)
                                  setCancelReason('')
                                }}
                                className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                title="Cancelar Pedido"
                              >
                                Cancelar
                              </Button>
                            )}

                            {req.status === 'retirado' && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                Entregue{' '}
                                {req.confirmation_date
                                  ? new Date(req.confirmation_date).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                            )}
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

      {/* Cancel Requisition Dialog */}
      <Dialog
        open={!!cancelRequisition}
        onOpenChange={(open) => !open && setCancelRequisition(null)}
      >
        <DialogContent className="max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Cancelar Requisição de Retirada
            </DialogTitle>
          </DialogHeader>

          {cancelRequisition && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Você está prestes a cancelar a requisição{' '}
                <strong className="text-white">
                  #{cancelRequisition.id.slice(-6).toUpperCase()}
                </strong>{' '}
                para <strong className="text-white">{cancelRequisition.requester_name}</strong>.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/90">Motivo do Cancelamento *</Label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Item avariado, cancelado pelo encarregado, OS pausada..."
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelRequisition(null)}
              className="border-white/10 text-muted-foreground"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={isProcessing}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
