import { useState, useMemo } from 'react'
import type { PurchaseQuote, PurchaseQuoteProposal, Supplier } from '@/services/suppliers'
import { createPurchaseQuote, updatePurchaseQuote, deletePurchaseQuote } from '@/services/suppliers'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  DollarSign,
  FileCheck,
  Calendar,
  Truck,
  Trash2,
  ShieldCheck,
  Building2,
} from 'lucide-react'

interface PurchasePipelineTabProps {
  quotes: PurchaseQuote[]
  suppliers: Supplier[]
  companyId: string
  onRefresh: () => void
  loading?: boolean
}

export function PurchasePipelineTab({
  quotes,
  suppliers,
  companyId,
  onRefresh,
  loading = false,
}: PurchasePipelineTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingQuote, setEditingQuote] = useState<PurchaseQuote | null>(null)

  // Form State
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteTitle, setQuoteTitle] = useState('')
  const [itemsSummary, setItemsSummary] = useState('')
  const [deliveryExpectedDate, setDeliveryExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<PurchaseQuote['status']>('Em cotação')
  const [exceptionJustification, setExceptionJustification] = useState('')

  // Proposals (Mínimo 3 fornecedores conforme PSGQ 8.4)
  const [proposals, setProposals] = useState<PurchaseQuoteProposal[]>([
    {
      supplier: '',
      price: 0,
      deadlineDays: 7,
      isSelected: true,
      isCritical: false,
      isQualified: false,
    },
    {
      supplier: '',
      price: 0,
      deadlineDays: 10,
      isSelected: false,
      isCritical: false,
      isQualified: false,
    },
    {
      supplier: '',
      price: 0,
      deadlineDays: 15,
      isSelected: false,
      isCritical: false,
      isQualified: false,
    },
  ])

  // Receive Dialog
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [selectedQuoteForReceive, setSelectedQuoteForReceive] = useState<PurchaseQuote | null>(null)
  const [actualReceiveDate, setActualReceiveDate] = useState(new Date().toISOString().split('T')[0])

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false
      if (search.trim()) {
        const s = search.toLowerCase()
        const matchNum = q.quote_number.toLowerCase().includes(s)
        const matchTitle = q.title.toLowerCase().includes(s)
        const matchSup = (q.selected_supplier_name || '').toLowerCase().includes(s)
        if (!matchNum && !matchTitle && !matchSup) return false
      }
      return true
    })
  }, [quotes, statusFilter, search])

  const handleOpenCreate = () => {
    setEditingQuote(null)
    const nextNum = `RCP-2026/${String(quotes.length + 1).padStart(3, '0')}`
    setQuoteNumber(nextNum)
    setQuoteTitle('')
    setItemsSummary('')
    setDeliveryExpectedDate('')
    setNotes('')
    setStatus('Em cotação')
    setExceptionJustification('')
    setProposals([
      {
        supplier: '',
        price: 0,
        deadlineDays: 5,
        isSelected: true,
        isCritical: false,
        isQualified: false,
      },
      {
        supplier: '',
        price: 0,
        deadlineDays: 7,
        isSelected: false,
        isCritical: false,
        isQualified: false,
      },
      {
        supplier: '',
        price: 0,
        deadlineDays: 10,
        isSelected: false,
        isCritical: false,
        isQualified: false,
      },
    ])
    setIsDialogOpen(true)
  }

  const handleAddProposalRow = () => {
    setProposals((p) => [
      ...p,
      {
        supplier: '',
        price: 0,
        deadlineDays: 7,
        isSelected: false,
        isCritical: false,
        isQualified: false,
      },
    ])
  }

  const handleRemoveProposalRow = (idx: number) => {
    if (proposals.length <= 1) return
    setProposals((p) => p.filter((_, i) => i !== idx))
  }

  const handleProposalChange = (idx: number, field: keyof PurchaseQuoteProposal, val: any) => {
    setProposals((prev) => {
      const copy = [...prev]
      if (field === 'isSelected' && val === true) {
        // Only one proposal can be selected
        copy.forEach((item, i) => {
          item.isSelected = i === idx
        })
      } else {
        copy[idx] = { ...copy[idx], [field]: val }
      }

      // If supplier changed, look up if critical/qualified
      if (field === 'supplier') {
        const supMatch = suppliers.find(
          (s) =>
            s.name.toLowerCase() === String(val).toLowerCase() ||
            (s.trade_name && s.trade_name.toLowerCase() === String(val).toLowerCase()),
        )
        if (supMatch) {
          copy[idx].supplierId = supMatch.id
          copy[idx].isCritical = supMatch.classification === 'Crítico'
          copy[idx].isQualified = supMatch.qualification_status === 'Qualificado'
        }
      }
      return copy
    })
  }

  const selectedProposal = proposals.find((p) => p.isSelected)
  const isSelectedSupplierUnqualifiedCritical =
    selectedProposal && selectedProposal.isCritical && !selectedProposal.isQualified

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quoteTitle.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' })
      return
    }

    try {
      setIsSubmitting(true)
      const validProposals = proposals.filter((p) => p.supplier.trim() !== '')

      if (validProposals.length === 0) {
        toast({ title: 'Adicione pelo menos um fornecedor cotado', variant: 'destructive' })
        return
      }

      if (editingQuote) {
        await updatePurchaseQuote(
          editingQuote.id,
          {
            title: quoteTitle,
            items_summary: itemsSummary,
            delivery_expected_date: deliveryExpectedDate || undefined,
            notes,
            status,
            exception_justification: exceptionJustification,
          },
          validProposals,
        )
        toast({ title: 'Cotação / Pedido atualizado com sucesso' })
      } else {
        await createPurchaseQuote(
          {
            quote_number: quoteNumber,
            title: quoteTitle,
            company_id: companyId,
            items_summary: itemsSummary,
            delivery_expected_date: deliveryExpectedDate || undefined,
            notes,
            status,
            exception_justification: exceptionJustification,
          },
          validProposals,
        )
        toast({
          title: 'Resumo de Coleta de Preço (FSGQ 8.4-7) Criado',
          description: `${validProposals.length} cotações registradas. Indicadores de Suprimentos atualizados automaticamente.`,
        })
      }

      setIsDialogOpen(false)
      onRefresh()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar cotação',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenReceive = (quote: PurchaseQuote) => {
    setSelectedQuoteForReceive(quote)
    setActualReceiveDate(new Date().toISOString().split('T')[0])
    setReceiveDialogOpen(true)
  }

  const handleConfirmReceive = async () => {
    if (!selectedQuoteForReceive) return
    try {
      await updatePurchaseQuote(selectedQuoteForReceive.id, {
        status: 'Entregue',
        delivery_actual_date: actualReceiveDate,
      })
      toast({
        title: 'Recebimento Concluído com Sucesso!',
        description:
          'Status atualizado para Entregue. O módulo Almoxarifado / CQ foi sincronizado.',
      })
      setReceiveDialogOpen(false)
      onRefresh()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar recebimento',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta cotação/pedido?')) return
    try {
      await deletePurchaseQuote(id)
      toast({ title: 'Cotação removida' })
      onRefresh()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
        <div>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Esteira Formal de Compras (PSGQ 8.4
            item 5.5)
          </h3>
          <p className="text-xs text-muted-foreground">
            Requisição (FSGQ 8.4-5) → Cotação mín. 3 fornecedores → Resumo de Coleta de Preço (FSGQ
            8.4-7) → Pedido & Acompanhamento (FSGQ 8.4-6)
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Nova Coleta de Preço (FSGQ 8.4-7)
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="bg-card border-white/10">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, título ou fornecedor selecionado..."
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
                <option value="Em cotação" className="bg-zinc-900 text-white">
                  Em cotação
                </option>
                <option value="Resumo Aprovado" className="bg-zinc-900 text-white">
                  Resumo Aprovado
                </option>
                <option value="Pedido Emitido" className="bg-zinc-900 text-white">
                  Pedido Emitido
                </option>
                <option value="Entregue" className="bg-zinc-900 text-white">
                  Entregue
                </option>
                <option value="Cancelado" className="bg-zinc-900 text-white">
                  Cancelado
                </option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card className="bg-card border-white/10">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" /> Histórico de Cotações & Ordens de Compra
            ({filteredQuotes.length})
          </CardTitle>
          <span className="text-xs text-muted-foreground">PSGQ 8.4 Aquisição</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Carregando cotações...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-white text-sm font-medium">Nenhuma coleta de preço registrada</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Registre uma nova coleta de preço com o mínimo de 3 fornecedores para alimentar o
                indicador de Suprimentos.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenCreate}
                className="border-white/10 text-white text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Iniciar Coleta Agora
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/5">
                    <TableHead className="text-xs text-white/70">Código FSGQ 8.4-7</TableHead>
                    <TableHead className="text-xs text-white/70">Descrição / Escopo</TableHead>
                    <TableHead className="text-xs text-white/70 text-center">Nº Cotações</TableHead>
                    <TableHead className="text-xs text-white/70">Fornecedor Escolhido</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Valor Total</TableHead>
                    <TableHead className="text-xs text-white/70">Prazo / Entrega</TableHead>
                    <TableHead className="text-xs text-white/70">Status</TableHead>
                    <TableHead className="text-xs text-white/70 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((q) => {
                    const isMinThree = q.has_min_three_quotes || q.quote_count >= 3
                    const isDelivered = q.status === 'Entregue'
                    const isDelayed =
                      q.delivery_status === 'Atrasado' ||
                      (q.delivery_actual_date &&
                        q.delivery_expected_date &&
                        new Date(q.delivery_actual_date) > new Date(q.delivery_expected_date))

                    return (
                      <TableRow key={q.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="text-xs py-3 font-mono">
                          <div className="font-bold text-primary">{q.quote_number}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(q.created).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs py-3">
                          <div className="font-medium text-white">{q.title}</div>
                          {q.items_summary && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                              {q.items_summary}
                            </div>
                          )}
                          {q.exception_justification && (
                            <div className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Exceção:{' '}
                              {q.exception_justification}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-center py-3">
                          <Badge
                            className={`text-[10px] font-mono ${
                              isMinThree
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {q.quote_count || 1} cotação(ões) {isMinThree ? '✓ (≥ 3)' : '⚠️ (< 3)'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs py-3">
                          <div className="font-medium text-white">
                            {q.selected_supplier_name || '—'}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {q.selected_supplier_is_critical && (
                              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] py-0 px-1">
                                Crítico
                              </Badge>
                            )}
                            {q.selected_supplier_is_qualified === false ? (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] py-0 px-1">
                                Não Qualificado (Exceção)
                              </Badge>
                            ) : q.selected_supplier_is_qualified === true ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] py-0 px-1">
                                Qualificado
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-right py-3 font-mono font-bold text-white">
                          {q.total_amount
                            ? `R$ ${q.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </TableCell>

                        <TableCell className="text-xs py-3 font-mono">
                          {q.delivery_expected_date && (
                            <div className="text-muted-foreground text-[11px]">
                              Prev: {new Date(q.delivery_expected_date).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {q.delivery_actual_date && (
                            <div
                              className={`text-[11px] font-semibold ${isDelayed ? 'text-rose-400' : 'text-emerald-400'}`}
                            >
                              Entr: {new Date(q.delivery_actual_date).toLocaleDateString('pt-BR')}{' '}
                              {isDelayed && '(Atraso)'}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-xs py-3">
                          <Badge
                            className={`text-[10px] ${
                              q.status === 'Entregue'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : q.status === 'Pedido Emitido'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  : q.status === 'Resumo Aprovado'
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                    : q.status === 'Cancelado'
                                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {q.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {q.status !== 'Entregue' && q.status !== 'Cancelado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReceive(q)}
                                className="h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Receber
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(q.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

      {/* Dialog: Create Quote (FSGQ 8.4-7 Resumo Coleta de Preço) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" /> FSGQ 8.4-7 — RESUMO DE COLETA DE PREÇO
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Conforme PSGQ 8.4 item 5.5: cotação com mínimo de 3 fornecedores para suprimentos e
              serviços.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuote} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-white/80">Código da Coleta *</Label>
                <Input
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  required
                  className="bg-black/40 border-white/10 text-white font-mono text-xs h-8"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs text-white/80">Título / Objeto da Compra *</Label>
                <Input
                  value={quoteTitle}
                  onChange={(e) => setQuoteTitle(e.target.value)}
                  placeholder="Ex: Aquisição de Chapas SA-516 Gr 70"
                  required
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/80">
                Descrição Detalhada dos Itens / Especificações
              </Label>
              <Textarea
                value={itemsSummary}
                onChange={(e) => setItemsSummary(e.target.value)}
                placeholder="Ex: 4 Chapas de aço carbono 1/2 pol x 2400 x 6000 mm com certificado de corrida..."
                className="bg-black/40 border-white/10 text-white text-xs min-h-[60px]"
              />
            </div>

            {/* Proposals Section (Minimum 3 Providers) */}
            <div className="space-y-2 border border-white/10 rounded-xl p-3 bg-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Propostas Recebidas ({proposals.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    O PSGQ 8.4 exige o mínimo de 3 cotações. Marque a proposta vencedora.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProposalRow}
                  className="h-7 text-xs border-white/10 text-white gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Fornecedor
                </Button>
              </div>

              <div className="space-y-2 pt-1">
                {proposals.map((prop, idx) => {
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center transition-all ${
                        prop.isSelected
                          ? 'bg-primary/10 border-primary/50'
                          : 'bg-black/30 border-white/5'
                      }`}
                    >
                      <div className="sm:col-span-1 flex items-center justify-center">
                        <label
                          className="flex flex-col items-center cursor-pointer"
                          title="Marcar como Escolhido"
                        >
                          <input
                            type="radio"
                            name="winnerProposal"
                            checked={prop.isSelected}
                            onChange={() => handleProposalChange(idx, 'isSelected', true)}
                            className="w-4 h-4 text-primary accent-primary cursor-pointer"
                          />
                          <span className="text-[9px] text-muted-foreground mt-0.5">Vencedor</span>
                        </label>
                      </div>

                      <div className="sm:col-span-4">
                        <Label className="text-[10px] text-muted-foreground">
                          Fornecedor Cotado *
                        </Label>
                        <Input
                          value={prop.supplier}
                          onChange={(e) => handleProposalChange(idx, 'supplier', e.target.value)}
                          placeholder="Nome da empresa..."
                          list="suppliers-datalist"
                          className="bg-black/40 border-white/10 text-white text-xs h-7 mt-0.5"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">
                          Preço Total (R$) *
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={prop.price || ''}
                          onChange={(e) =>
                            handleProposalChange(idx, 'price', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0,00"
                          className="bg-black/40 border-white/10 text-white text-xs h-7 mt-0.5 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Prazo (Dias)</Label>
                        <Input
                          type="number"
                          value={prop.deadlineDays || ''}
                          onChange={(e) =>
                            handleProposalChange(idx, 'deadlineDays', parseInt(e.target.value) || 0)
                          }
                          className="bg-black/40 border-white/10 text-white text-xs h-7 mt-0.5 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Classificação</Label>
                        <div className="flex gap-1 mt-1">
                          {prop.isCritical && (
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] py-0 px-1">
                              Crítico
                            </Badge>
                          )}
                          {prop.isQualified ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] py-0 px-1">
                              Qualificado
                            </Badge>
                          ) : (
                            <Badge className="bg-white/10 text-muted-foreground text-[9px] py-0 px-1">
                              Geral
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProposalRow(idx)}
                          disabled={proposals.length <= 1}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* DataList for autocomplete of existing suppliers */}
              <datalist id="suppliers-datalist">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.classification} • {s.qualification_status}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Warning if selected supplier is critical and not qualified (Rule: Don't lock, register exception) */}
            {isSelectedSupplierUnqualifiedCritical && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Aviso: Fornecedor crítico não qualificado selecionado
                </div>
                <p className="text-[11px] text-amber-300/90">
                  O PSGQ 8.4 permite aquisição emergencial ou pontual mediante justificativa
                  registrada. O sistema não trava o processo, mas registrará a exceção formalmente.
                </p>
                <div>
                  <Label className="text-[11px] text-white">Justificativa da Exceção *</Label>
                  <Input
                    value={exceptionJustification}
                    onChange={(e) => setExceptionJustification(e.target.value)}
                    placeholder="Ex: Fornecedor único disponível para o prazo urgente da OS-2024-001..."
                    required
                    className="bg-black/40 border-amber-500/40 text-white text-xs h-7 mt-1"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/80">
                  Previsão de Entrega (FSGQ 8.4-6 Acompanhamento)
                </Label>
                <Input
                  type="date"
                  value={deliveryExpectedDate}
                  onChange={(e) => setDeliveryExpectedDate(e.target.value)}
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">Status da Esteira</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-8 rounded-md bg-black/40 border border-white/10 px-3 text-xs text-white"
                >
                  <option value="Em cotação" className="bg-zinc-900 text-white">
                    Em cotação
                  </option>
                  <option value="Resumo Aprovado" className="bg-zinc-900 text-white">
                    Resumo Aprovado
                  </option>
                  <option value="Pedido Emitido" className="bg-zinc-900 text-white">
                    Pedido Emitido
                  </option>
                  <option value="Entregue" className="bg-zinc-900 text-white">
                    Entregue
                  </option>
                  <option value="Cancelado" className="bg-zinc-900 text-white">
                    Cancelado
                  </option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/80">Observações Gerais da Ordem de Compra</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condições comerciais, frete FOB/CIF, termo de garantia..."
                className="bg-black/40 border-white/10 text-white text-xs h-8"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Coleta de Preço (FSGQ 8.4-7)'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Confirmar Recebimento de Compra
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Atualize a data real de recebimento para acompanhamento do prazo (FSGQ 8.4-6) e
              integração com CQ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 bg-black/30 rounded-lg border border-white/5 space-y-1 text-xs">
              <div className="text-white font-medium">{selectedQuoteForReceive?.title}</div>
              <div className="text-muted-foreground">
                Fornecedor: {selectedQuoteForReceive?.selected_supplier_name}
              </div>
              {selectedQuoteForReceive?.delivery_expected_date && (
                <div className="text-sky-300 font-mono">
                  Data Prevista:{' '}
                  {new Date(selectedQuoteForReceive.delivery_expected_date).toLocaleDateString(
                    'pt-BR',
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-white/80">Data Real de Entrega / Recebimento</Label>
              <Input
                type="date"
                value={actualReceiveDate}
                onChange={(e) => setActualReceiveDate(e.target.value)}
                className="bg-black/40 border-white/10 text-white text-xs h-8 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReceiveDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReceive}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
