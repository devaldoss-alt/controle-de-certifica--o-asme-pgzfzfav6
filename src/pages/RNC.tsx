import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getNonConformities,
  createNonConformity,
  updateNonConformity,
  deleteNonConformity,
  generateRNCNumber,
  type NonConformity,
} from '@/services/rnc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  UserCheck,
  Building2,
  Filter,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/safe-data'
import { cn } from '@/lib/utils'

const SEVERITY_COLORS: Record<string, string> = {
  Leve: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Médio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Grave: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Crítico: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  'Em Andamento': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Fechada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Cancelada: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const EMPTY_FORM = {
  number: '',
  date: new Date().toISOString().split('T')[0],
  process: 'Soldagem',
  severity: 'Médio' as NonConformity['severity'],
  description: '',
  immediate_action: '',
  root_cause_analysis: '',
  corrective_action: '',
  deadline: '',
  responsible: '',
  status: 'Em Andamento' as NonConformity['status'],
  effectiveness_verification: '',
  verification_date: '',
  verifier: '',
}

export default function RNCPage() {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang } = useI18n()
  const { toast } = useToast()

  const [ncs, setNcs] = useState<NonConformity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterProcess, setFilterProcess] = useState('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [detailDoc, setDetailDoc] = useState<NonConformity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const canEdit = ['Manager', 'QCC', 'Inspector', 'Consultor'].includes(user?.role || '')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getNonConformities({
        companyId: selectedCompanyId,
        status: filterStatus,
        severity: filterSeverity,
        process: filterProcess,
        search,
      })
      setNcs(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId, filterStatus, filterSeverity, filterProcess, search])

  useRealtime('non_conformities', () => loadData())

  const openNew = async () => {
    setEditingId(null)
    const nextNum = await generateRNCNumber(selectedCompanyId)
    setFormData({
      ...EMPTY_FORM,
      number: nextNum,
      date: new Date().toISOString().split('T')[0],
    })
    setDialogOpen(true)
  }

  const openEdit = (nc: NonConformity) => {
    setEditingId(nc.id)
    setFormData({
      number: nc.number,
      date: nc.date ? nc.date.split('T')[0] : new Date().toISOString().split('T')[0],
      process: nc.process,
      severity: nc.severity,
      description: nc.description,
      immediate_action: nc.immediate_action || '',
      root_cause_analysis: nc.root_cause_analysis || '',
      corrective_action: nc.corrective_action || '',
      deadline: nc.deadline ? nc.deadline.split('T')[0] : '',
      responsible: nc.responsible || '',
      status: nc.status,
      effectiveness_verification: nc.effectiveness_verification || '',
      verification_date: nc.verification_date ? nc.verification_date.split('T')[0] : '',
      verifier: nc.verifier || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.number || !formData.description || !formData.process) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o Número, Processo e Descrição da Não Conformidade.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const company_id =
        selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''
      const payload: Partial<NonConformity> = {
        ...formData,
        company_id: company_id || undefined,
      }

      if (editingId) {
        await updateNonConformity(editingId, payload)
        toast({ title: 'RNC atualizada com sucesso' })
      } else {
        await createNonConformity(payload)
        toast({ title: 'RNC registrada com sucesso' })
      }
      setDialogOpen(false)
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar RNC',
        description: e?.message || 'Falha de comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNonConformity(id)
      toast({ title: 'RNC excluída' })
      setDetailDoc(null)
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e?.message, variant: 'destructive' })
    }
  }

  // Dashboard calculations
  const stats = useMemo(() => {
    const total = ncs.length
    const closed = ncs.filter((n) => n.status === 'Fechada').length
    const pending = ncs.filter((n) => n.status === 'Em Andamento').length
    const cancelled = ncs.filter((n) => n.status === 'Cancelada').length

    const bySeverity: Record<string, number> = { Leve: 0, Médio: 0, Grave: 0, Crítico: 0 }
    const byProcess: Record<string, number> = {}

    ncs.forEach((n) => {
      if (bySeverity[n.severity] !== undefined) {
        bySeverity[n.severity]++
      }
      const proc = n.process || 'Outros'
      byProcess[proc] = (byProcess[proc] || 0) + 1
    })

    return { total, closed, pending, cancelled, bySeverity, byProcess }
  }, [ncs])

  const uniqueProcesses = useMemo(() => {
    const set = new Set<string>()
    ncs.forEach((n) => {
      if (n.process) set.add(n.process)
    })
    return Array.from(set).sort()
  }, [ncs])

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> SGQ — FSGQ 8.7
            </Badge>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">
            Controle de Não Conformidades (RNC)
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestão do formulário FSGQ 8.7-2 e do livro de registros FSGQ 8.7-1
          </p>
        </div>

        {canEdit && (
          <Button
            onClick={openNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova RNC
          </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-black/30 border border-white/10 p-1 rounded-lg">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Livro RNC (FSGQ 8.7-1)
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard RNC
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: List / Control */}
        <TabsContent value="list" className="space-y-4">
          <Card className="glass border-white/10">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por número, processo, responsável ou descrição..."
                    className="bg-black/20 border-white/10 text-white pl-9"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white w-36 h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: Todos</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Fechada">Fechada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white w-36 h-9">
                    <SelectValue placeholder="Grau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Grau: Todos</SelectItem>
                    <SelectItem value="Leve">Leve</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Grave">Grave</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterProcess} onValueChange={setFilterProcess}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white w-40 h-9">
                    <SelectValue placeholder="Processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Processo: Todos</SelectItem>
                    {uniqueProcesses.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-xs text-white/60">Número</TableHead>
                      <TableHead className="text-xs text-white/60">Data</TableHead>
                      <TableHead className="text-xs text-white/60">Processo</TableHead>
                      <TableHead className="text-xs text-white/60">Grau</TableHead>
                      <TableHead className="text-xs text-white/60">Descrição</TableHead>
                      <TableHead className="text-xs text-white/60">Responsável</TableHead>
                      <TableHead className="text-xs text-white/60">Prazo</TableHead>
                      <TableHead className="text-xs text-white/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ncs.map((nc) => (
                      <TableRow
                        key={nc.id}
                        className="border-white/5 cursor-pointer hover:bg-white/5"
                        onClick={() => setDetailDoc(nc)}
                      >
                        <TableCell className="text-xs font-mono text-primary font-bold">
                          {nc.number}
                        </TableCell>
                        <TableCell className="text-xs text-white/80">
                          {safeFormatDate(nc.date, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-xs text-white/80 font-medium">
                          {nc.process}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', SEVERITY_COLORS[nc.severity])}
                          >
                            {nc.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-white/90 max-w-64 truncate">
                          {nc.description}
                        </TableCell>
                        <TableCell className="text-xs text-white/80">
                          {nc.responsible || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-white/80">
                          {safeFormatDate(nc.deadline, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', STATUS_COLORS[nc.status])}
                          >
                            {nc.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {ncs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhuma Não Conformidade registrada para este filtro.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Dashboard (Replica da aba DASHBOARD da planilha FSGQ 8.7-1) */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Indicator Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total de RNCs</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Em Andamento</p>
                  <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">RNCs Fechadas</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.closed}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Taxa de Eficácia</p>
                  <h3 className="text-2xl font-bold text-blue-400 mt-1">
                    {stats.total > 0 ? `${Math.round((stats.closed / stats.total) * 100)}%` : '0%'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: RNCs por Grau de Desvio */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-base text-white">RNCs por Grau de Desvio</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Distribuição pelo nível de severidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.bySeverity).map(([severity, count]) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={severity} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{severity}</span>
                        <span className="text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            severity === 'Leve'
                              ? 'bg-slate-400'
                              : severity === 'Médio'
                                ? 'bg-amber-400'
                                : severity === 'Grave'
                                  ? 'bg-orange-500'
                                  : 'bg-rose-500',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Chart 2: RNCs por Processo */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-base text-white">RNCs por Processo</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Origem dos desvios identificados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(stats.byProcess).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhum dado por processo registrado.
                  </p>
                ) : (
                  Object.entries(stats.byProcess).map(([process, count]) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                    return (
                      <div key={process} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white font-medium">{process}</span>
                          <span className="text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* RNC Form Dialog (FSGQ 8.7-2) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              {editingId ? 'Editar RNC' : 'Nova Relatório de Não Conformidade (FSGQ 8.7-2)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os campos para registro, análise de causa raiz e ações corretivas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-white/80 text-xs mb-1 block">Número da RNC</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="bg-black/20 border-white/10 text-white font-mono text-sm"
                  placeholder="RNC-001/2024"
                />
              </div>

              <div>
                <Label className="text-white/80 text-xs mb-1 block">Data de Ocorrência</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-black/20 border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <Label className="text-white/80 text-xs mb-1 block">Processo Envolvido</Label>
                <Input
                  value={formData.process}
                  onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                  placeholder="Ex: Soldagem, Usinagem, CQ"
                  className="bg-black/20 border-white/10 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80 text-xs mb-1 block">
                  Grau de Desvio (Severidade)
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v: NonConformity['severity']) =>
                    setFormData({ ...formData, severity: v })
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leve">Leve</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Grave">Grave</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white/80 text-xs mb-1 block">Status Atual</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: NonConformity['status']) =>
                    setFormData({ ...formData, status: v })
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Fechada">Fechada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white/80 text-xs mb-1 block">
                Descrição Detalhada da Não Conformidade *
              </Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o desvio encontrado, equipamento/OS afetada e evidências..."
                className="bg-black/20 border-white/10 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80 text-xs mb-1 block">
                  Ação Imediata (Disposição / Segregação)
                </Label>
                <Textarea
                  rows={2}
                  value={formData.immediate_action}
                  onChange={(e) => setFormData({ ...formData, immediate_action: e.target.value })}
                  placeholder="Ação tomada para conter o problema imediatamente..."
                  className="bg-black/20 border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <Label className="text-white/80 text-xs mb-1 block">
                  Análise de Causa Raiz (Ishikawa / 5 Porquês)
                </Label>
                <Textarea
                  rows={2}
                  value={formData.root_cause_analysis}
                  onChange={(e) =>
                    setFormData({ ...formData, root_cause_analysis: e.target.value })
                  }
                  placeholder="Causa identificada por que a falha ocorreu..."
                  className="bg-black/20 border-white/10 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/80 text-xs mb-1 block">Ação Corretiva Proposta</Label>
              <Textarea
                rows={2}
                value={formData.corrective_action}
                onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                placeholder="Ação preventiva/corretiva permanente para evitar reincidência..."
                className="bg-black/20 border-white/10 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80 text-xs mb-1 block">Prazo de Conclusão</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-black/20 border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <Label className="text-white/80 text-xs mb-1 block">Responsável pela Ação</Label>
                <Input
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="bg-black/20 border-white/10 text-white text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-black/30 border border-white/10 rounded-lg space-y-3">
              <Label className="text-xs font-semibold text-primary block">
                Verificação de Eficácia
              </Label>
              <Textarea
                rows={2}
                value={formData.effectiveness_verification}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveness_verification: e.target.value })
                }
                placeholder="Resultado da re-inspeção ou auditoria para atestar a eficácia..."
                className="bg-black/20 border-white/10 text-white text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/80 text-xs mb-1 block">Data da Verificação</Label>
                  <Input
                    type="date"
                    value={formData.verification_date}
                    onChange={(e) =>
                      setFormData({ ...formData, verification_date: e.target.value })
                    }
                    className="bg-black/20 border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/80 text-xs mb-1 block">
                    Verificador (CQ / Audit)
                  </Label>
                  <Input
                    value={formData.verifier}
                    onChange={(e) => setFormData({ ...formData, verifier: e.target.value })}
                    placeholder="Nome do inspetor"
                    className="bg-black/20 border-white/10 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? 'Salvando...' : 'Salvar RNC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDoc} onOpenChange={(v) => !v && setDetailDoc(null)}>
        <DialogContent className="max-w-2xl bg-card border-white/10">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white font-mono text-lg text-primary flex items-center gap-2">
                {detailDoc?.number}
              </DialogTitle>
              {detailDoc && (
                <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[detailDoc.status])}>
                  {detailDoc.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {detailDoc && (
            <div className="space-y-4 text-sm text-white/90">
              <div className="grid grid-cols-2 gap-3 text-xs bg-black/20 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-muted-foreground">Data:</span>{' '}
                  <span className="text-white font-medium">
                    {safeFormatDate(detailDoc.date, 'dd/MM/yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Processo:</span>{' '}
                  <span className="text-white font-medium">{detailDoc.process}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Grau de Desvio:</span>{' '}
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] ml-1', SEVERITY_COLORS[detailDoc.severity])}
                  >
                    {detailDoc.severity}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Responsável:</span>{' '}
                  <span className="text-white font-medium">{detailDoc.responsible || '—'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Descrição do Desvio
                </h4>
                <p className="bg-black/30 p-3 rounded border border-white/5 text-xs text-white/90">
                  {detailDoc.description}
                </p>
              </div>

              {detailDoc.immediate_action && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Ação Imediata
                  </h4>
                  <p className="bg-black/30 p-3 rounded border border-white/5 text-xs text-white/90">
                    {detailDoc.immediate_action}
                  </p>
                </div>
              )}

              {detailDoc.root_cause_analysis && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Análise de Causa Raiz
                  </h4>
                  <p className="bg-black/30 p-3 rounded border border-white/5 text-xs text-white/90">
                    {detailDoc.root_cause_analysis}
                  </p>
                </div>
              )}

              {detailDoc.corrective_action && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Ação Corretiva
                  </h4>
                  <p className="bg-black/30 p-3 rounded border border-white/5 text-xs text-white/90">
                    {detailDoc.corrective_action}
                  </p>
                </div>
              )}

              {detailDoc.effectiveness_verification && (
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase mb-1">
                    Verificação de Eficácia
                  </h4>
                  <p className="bg-emerald-500/10 p-3 rounded border border-emerald-500/20 text-xs text-emerald-300">
                    {detailDoc.effectiveness_verification}
                  </p>
                  {detailDoc.verifier && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Verificado por {detailDoc.verifier} em{' '}
                      {safeFormatDate(detailDoc.verification_date, 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {canEdit && detailDoc && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  openEdit(detailDoc)
                  setDetailDoc(null)
                }}
                className="border-white/10 text-muted-foreground hover:text-primary"
              >
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </Button>
              <Button variant="destructive" onClick={() => setDeleteTarget(detailDoc.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório de Não Conformidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de RNC? Esta ação não poderá ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
