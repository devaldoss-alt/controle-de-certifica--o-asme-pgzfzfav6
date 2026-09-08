import { useState, useMemo } from 'react'
import type { InventoryItem } from '@/services/inventory'
import type { WarehouseIndicatorsSummary } from '@/services/warehouse-phase2'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  ShoppingCart,
  DollarSign,
} from 'lucide-react'

interface WarehouseIndicatorsTabProps {
  indicatorsSummary: WarehouseIndicatorsSummary | null
  inventoryItems: InventoryItem[]
  pendingWithdrawalsByItem: Record<string, number>
  pendingPurchasesByItem: Record<string, number>
  onRecalculate?: () => void
  isRecalculating?: boolean
}

export function WarehouseIndicatorsTab({
  indicatorsSummary,
  inventoryItems,
  pendingWithdrawalsByItem,
  pendingPurchasesByItem,
  onRecalculate,
  isRecalculating,
}: WarehouseIndicatorsTabProps) {
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'rupture' | 'pendingPurchases'>('all')

  // Stock items with smart projection (current_stock + pending purchases - pending withdrawals)
  const itemsWithProjection = useMemo(() => {
    return inventoryItems.map((item) => {
      const curStock = Number(item.current_stock ?? 0)
      const minStock = Number(item.minimum_stock ?? 0)
      const pendingPurchases = pendingPurchasesByItem[item.id] || 0
      const pendingWithdrawals = pendingWithdrawalsByItem[item.id] || 0

      // Smart projected balance
      const projectedBalance = curStock + pendingPurchases - pendingWithdrawals
      const isRupture = curStock <= 0 || (item.minimum_stock !== undefined && curStock <= minStock)
      const isProjectedSafe = projectedBalance > minStock

      return {
        ...item,
        curStock,
        minStock,
        pendingPurchases,
        pendingWithdrawals,
        projectedBalance,
        isRupture,
        isProjectedSafe,
      }
    })
  }, [inventoryItems, pendingPurchasesByItem, pendingWithdrawalsByItem])

  const filteredItems = useMemo(() => {
    return itemsWithProjection.filter((item) => {
      if (filterMode === 'rupture' && !item.isRupture) return false
      if (filterMode === 'pendingPurchases' && item.pendingPurchases <= 0) return false
      if (search.trim()) {
        const s = search.trim().toLowerCase()
        if (
          !item.description.toLowerCase().includes(s) &&
          !(item.tracking_code && item.tracking_code.toLowerCase().includes(s))
        ) {
          return false
        }
      }
      return true
    })
  }, [itemsWithProjection, filterMode, search])

  const ruptureCount = useMemo(() => {
    return itemsWithProjection.filter((i) => i.isRupture).length
  }, [itemsWithProjection])

  const withPendingPurchasesCount = useMemo(() => {
    return itemsWithProjection.filter((i) => i.pendingPurchases > 0).length
  }, [itemsWithProjection])

  return (
    <div className="space-y-6">
      {/* Indicator Overview Cards */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Indicadores de Desempenho do Almoxarifado
          </h2>
          <p className="text-xs text-muted-foreground">
            Sincronização contínua com FSGQ / ISO 9001 e histórico de medições.
          </p>
        </div>
        {onRecalculate && (
          <Button
            size="sm"
            variant="outline"
            disabled={isRecalculating}
            onClick={onRecalculate}
            className="border-white/10 text-white hover:bg-white/10 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Taxa de Atendimento */}
        <Card className="bg-card border-white/10">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Taxa de Atendimento do Almoxarifado
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              Meta ≥ 90%
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                {indicatorsSummary?.taxaAtendimento ?? 100}%
              </span>
              <span className="text-xs text-muted-foreground">
                {indicatorsSummary?.pedidosAtendidos ?? 0} de{' '}
                {indicatorsSummary?.pedidosTotais ?? 0} pedidos atendidos
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (indicatorsSummary?.taxaAtendimento ?? 100) >= 90
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, indicatorsSummary?.taxaAtendimento ?? 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Fórmula: (Pedidos de retirada atendidos ÷ Pedidos totais) × 100
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Itens em Ruptura */}
        <Card
          className={`border-white/10 ${
            ruptureCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card'
          }`}
        >
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Itens em Ruptura</span>
            <Badge
              className={`text-[10px] ${
                ruptureCount === 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              Meta = 0
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-3xl font-extrabold ${
                  ruptureCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {ruptureCount}
              </span>
              <span className="text-xs text-muted-foreground">itens críticos</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Itens com saldo zerado ou abaixo do estoque mínimo definido para a empresa.
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Valor Consumido por OS/Mês */}
        <Card className="bg-card border-white/10">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Valor Consumido por OS/Mês
            </span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
              Informativo Mensal
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                R${' '}
                {(indicatorsSummary?.valorConsumidoMes ?? 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-muted-foreground">mês atual</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Soma monetária de todas as baixas com Ordem de Serviço vinculada.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Minimum Stock & Pending Purchases Control Section */}
      <Card className="bg-card border-white/10">
        <CardHeader className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Controle Inteligente de Estoque Mínimo & Projeção com Pedidos em Aberto
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evita recompra duplicada: mostra{' '}
              <strong className="text-white">Saldo Físico + Pedidos de Compra Pendentes</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterMode === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterMode('all')}
              className={`h-8 text-xs ${filterMode === 'all' ? 'bg-primary text-white' : 'border-white/10 text-muted-foreground'}`}
            >
              Todos ({itemsWithProjection.length})
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'rupture' ? 'default' : 'outline'}
              onClick={() => setFilterMode('rupture')}
              className={`h-8 text-xs ${filterMode === 'rupture' ? 'bg-amber-500 hover:bg-amber-600 text-black font-semibold' : 'border-white/10 text-amber-400'}`}
            >
              Em Ruptura ({ruptureCount})
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'pendingPurchases' ? 'default' : 'outline'}
              onClick={() => setFilterMode('pendingPurchases')}
              className={`h-8 text-xs ${filterMode === 'pendingPurchases' ? 'bg-blue-600 text-white' : 'border-white/10 text-blue-400'}`}
            >
              Com Compras em Aberto ({withPendingPurchasesCount})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-3 border-b border-white/5">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar itens do catálogo por descrição ou rastreio..."
                className="pl-9 h-9 bg-black/20 border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/5">
                  <TableHead className="text-xs text-white/70">Código</TableHead>
                  <TableHead className="text-xs text-white/70">Descrição</TableHead>
                  <TableHead className="text-xs text-white/70 text-right">Saldo Físico</TableHead>
                  <TableHead className="text-xs text-white/70 text-right">Est. Mínimo</TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    Compras Pendentes (+)
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    Retiradas Pendentes (-)
                  </TableHead>
                  <TableHead className="text-xs text-white/70 text-right">
                    Saldo Projetado Total
                  </TableHead>
                  <TableHead className="text-xs text-white/70">Diagnóstico Inteligente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-xs py-3 font-mono text-primary font-medium">
                      {item.tracking_code || '—'}
                    </TableCell>

                    <TableCell className="text-xs py-3">
                      <div className="font-medium text-white">{item.description}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.category} • {item.location || 'Almoxarifado'}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-right py-3 font-mono font-bold">
                      <span className={item.isRupture ? 'text-amber-400' : 'text-white'}>
                        {item.curStock} {item.unit}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-right py-3 font-mono text-muted-foreground">
                      {item.minimum_stock !== undefined
                        ? `${item.minimum_stock} ${item.unit}`
                        : '—'}
                    </TableCell>

                    <TableCell className="text-xs text-right py-3 font-mono">
                      {item.pendingPurchases > 0 ? (
                        <span className="text-blue-400 font-bold">
                          +{item.pendingPurchases} {item.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-right py-3 font-mono">
                      {item.pendingWithdrawals > 0 ? (
                        <span className="text-amber-400 font-bold">
                          -{item.pendingWithdrawals} {item.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-right py-3 font-mono font-bold">
                      <span
                        className={
                          item.projectedBalance < item.minStock
                            ? 'text-rose-400'
                            : item.pendingPurchases > 0
                              ? 'text-emerald-400'
                              : 'text-white'
                        }
                      >
                        {item.projectedBalance} {item.unit}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs py-3">
                      {item.curStock <= item.minStock && item.pendingPurchases > 0 ? (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] gap-1">
                          <ShoppingCart className="w-3 h-3" /> Recompra Já Solicitada (+
                          {item.pendingPurchases})
                        </Badge>
                      ) : item.curStock <= item.minStock ? (
                        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Ruptura: Requer Compra
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Estoque Regular
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
