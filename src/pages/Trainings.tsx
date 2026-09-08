import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { getCompanies, type Company } from '@/services/companies'
import { getModulePermissions, type ModulePermission } from '@/services/module-permissions'
import {
  getTrainingPlanActions,
  deleteTrainingPlanAction,
  type TrainingPlanActionComputed,
  type TrainingDaysStatus,
} from '@/services/trainings'
import { TrainingImportDialog } from '@/components/TrainingImportDialog'
import { TrainingActionDialog, TrainingRealizeDialog } from '@/components/TrainingActionDialog'
import { TrainingAttendanceDialog } from '@/components/TrainingAttendanceDialog'
import { TrainingIndicatorsSection } from '@/components/TrainingIndicatorsSection'
import { getAttendanceLists, type TrainingAttendanceList } from '@/services/training-attendance'
import { ContextualHelpButton } from '@/components/ContextualHelpButton'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  GraduationCap,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Edit,
  Trash2,
  Building2,
  Calendar,
  Layers,
  Filter,
  Users,
  Award,
  BarChart3,
  TrendingUp,
} from 'lucide-react'

export default function TrainingPage() {
  const { user } = useAuth()
  const { selectedCompanyId, setSelectedCompanyId } = useCompany()
  const { toast } = useToast()

  const [actions, setActions] = useState<TrainingPlanActionComputed[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'plano' | 'indicadores'>('plano')

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState('all')
  const [responsibleFilter, setResponsibleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')

  // Permissions
  const [permissions, setPermissions] = useState<ModulePermission | null>(null)

  // Dialogs
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isRealizeModalOpen, setIsRealizeModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [actionToEdit, setActionToEdit] = useState<TrainingPlanActionComputed | null>(null)
  const [actionToRealize, setActionToRealize] = useState<TrainingPlanActionComputed | null>(null)
  const [actionForAttendance, setActionForAttendance] = useState<TrainingPlanActionComputed | null>(
    null,
  )

  // Map of attendance lists per action ID for fast status badge rendering
  const [attendanceListsMap, setAttendanceListsMap] = useState<
    Record<string, TrainingAttendanceList>
  >({})

  const isManagerOrDirector = user?.role === 'Manager' || user?.role === 'Director'
  const canEdit =
    isManagerOrDirector ||
    permissions?.can_edit ||
    user?.role === 'QCC' ||
    user?.role === 'Supervisor' ||
    user?.role === 'Apontador'
  const canCreate = isManagerOrDirector || permissions?.can_create || canEdit
  const canDelete = isManagerOrDirector || permissions?.can_delete

  // Load companies
  useEffect(() => {
    getCompanies()
      .then((res) => {
        setCompanies(res)
        // If no company selected or 'all', default to PSC or first available
        if (!selectedCompanyId || selectedCompanyId === 'all') {
          const psc = res.find((c) => c.name.toUpperCase().includes('PSC'))
          if (psc) {
            setSelectedCompanyId(psc.id)
          } else if (res.length > 0) {
            setSelectedCompanyId(res[0].id)
          }
        }
      })
      .catch((e) => console.error('Failed to load companies:', e))
  }, [])

  // Load permissions for current user role
  useEffect(() => {
    if (!user?.role) return
    getModulePermissions(selectedCompanyId)
      .then((perms) => {
        const found = perms.find((p) => p.role === user.role && p.module === 'Treinamentos')
        setPermissions(found || null)
      })
      .catch((e) => console.error(e))
  }, [user?.role, selectedCompanyId])

  // Load actions
  const loadActions = async () => {
    try {
      setLoading(true)
      const data = await getTrainingPlanActions({
        companyId: selectedCompanyId,
        year: selectedYear,
        search,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        origin: originFilter !== 'all' ? originFilter : undefined,
        responsible: responsibleFilter.trim() || undefined,
        statusDays: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setActions(data)

      // Also fetch attendance lists for this company to show visual status badges
      const lists = await getAttendanceLists({ companyId: selectedCompanyId })
      const map: Record<string, TrainingAttendanceList> = {}
      lists.forEach((l) => {
        if (l.training_plan_action && !map[l.training_plan_action]) {
          map[l.training_plan_action] = l
        }
      })
      setAttendanceListsMap(map)
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erro ao carregar treinamentos',
        description: 'Não foi possível carregar as ações do plano anual.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActions()
  }, [
    selectedCompanyId,
    selectedYear,
    search,
    typeFilter,
    originFilter,
    responsibleFilter,
    statusFilter,
  ])

  // Realtime subscription
  useRealtime('training_plan_actions', () => loadActions())
  useRealtime('training_attendance_lists', () => loadActions())
  useRealtime('training_effectiveness_evaluations', () => loadActions())

  // Additional audience filter in memory
  const filteredActions = useMemo(() => {
    if (audienceFilter === 'all') return actions
    return actions.filter((a) =>
      a.target_audience.toLowerCase().includes(audienceFilter.toLowerCase()),
    )
  }, [actions, audienceFilter])

  // Distinct audiences for filter dropdown
  const distinctAudiences = useMemo(() => {
    const set = new Set<string>()
    actions.forEach((a) => {
      if (a.target_audience) set.add(a.target_audience.trim())
    })
    return Array.from(set).sort()
  }, [actions])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = actions.length
    const realized = actions.filter((a) => !!a.realized_date).length
    const overdue = actions.filter((a) => a.status_days === 'Atrasado').length
    const pending = actions.filter((a) => !a.realized_date && a.status_days !== 'Atrasado').length
    const pctCompleted = total > 0 ? Math.round((realized / total) * 100) : 0
    const totalCH = actions.reduce((acc, a) => acc + (a.ch_total || 0), 0)

    return { total, realized, overdue, pending, pctCompleted, totalCH }
  }, [actions])

  const handleDelete = async (id: string, actionName: string) => {
    if (!confirm(`Deseja realmente excluir a ação "${actionName}" do plano de treinamento?`)) {
      return
    }
    try {
      await deleteTrainingPlanAction(id)
      toast({
        title: 'Ação removida com sucesso',
      })
      loadActions()
    } catch (e: any) {
      toast({
        title: 'Erro ao excluir',
        description: e?.message || 'Falha ao excluir ação',
        variant: 'destructive',
      })
    }
  }

  const downloadFullCsv = () => {
    const headers = [
      'AÇÃO',
      'PERIODICIDADE',
      'RESPONSÁVEL',
      'PÚBLICO-ALVO',
      'ORIGEM',
      'TIPO',
      'FORMA DE PROVER COMPETÊNCIA',
      'DATA PREVISTA',
      'DATA REALIZADA',
      'STATUS (DIAS)',
      'REQUER AVALIAÇÃO DE EFICÁCIA?',
      'CH REALIZADA (h)',
      'QTD. PARTICIPANTES',
      'CH DE TREINAMENTO',
      'AVALIAÇÃO EFICÁCIA PREVISTO (+60 dias)',
      'STATUS EFICÁCIA',
      'OBSERVAÇÕES',
    ]

    const rows = filteredActions.map((a) => [
      `"${(a.action || '').replace(/"/g, '""')}"`,
      a.periodicity || '',
      `"${(a.responsible || '').replace(/"/g, '""')}"`,
      `"${(a.target_audience || '').replace(/"/g, '""')}"`,
      a.origin || '',
      `"${a.type || ''}"`,
      `"${a.competence_form || ''}"`,
      a.planned_date ? new Date(a.planned_date).toLocaleDateString('pt-BR') : '',
      a.realized_date ? new Date(a.realized_date).toLocaleDateString('pt-BR') : '',
      a.status_days || '',
      a.requires_effectiveness_eval ? 'Sim' : 'Não',
      a.ch_hours !== undefined && a.ch_hours !== null ? String(a.ch_hours) : '',
      a.participants_count !== undefined && a.participants_count !== null
        ? String(a.participants_count)
        : '',
      a.ch_total !== undefined && a.ch_total !== null ? String(a.ch_total) : '',
      a.effectiveness_due_date
        ? new Date(a.effectiveness_due_date).toLocaleDateString('pt-BR')
        : '',
      a.effectiveness_status || 'Não aplicável',
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FSGQ_7.2-1_PLANO_DE_TREINAMENTO_REV03_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <GraduationCap className="w-3.5 h-3.5 mr-1" /> FSGQ 7.2-1 Rev.03
            </Badge>
            <span className="text-xs text-muted-foreground">Plano de Treinamento Anual</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">
            Plano de Treinamento e Competências
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Formulário oficial FSGQ 7.2-1 — Planejamento, realização, carga horária e eficácia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Company Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-md px-2 py-1">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="border-0 bg-transparent h-7 text-xs text-white focus:ring-0 focus:ring-offset-0 px-1 w-44">
                <SelectValue placeholder="Selecione empresa..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-md px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
            >
              <SelectTrigger className="border-0 bg-transparent h-7 text-xs text-white focus:ring-0 focus:ring-offset-0 px-1 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ContextualHelpButton subTab={activeTab} variant="button" />

          <Button
            variant="outline"
            size="sm"
            onClick={downloadFullCsv}
            className="text-xs border-white/10 hover:bg-white/10 gap-1.5 h-9"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="text-xs border-white/10 hover:bg-white/10 gap-1.5 h-9"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Importar Planilha
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setActionToEdit(null)
                setIsActionModalOpen(true)
              }}
              className="text-xs bg-primary text-white hover:bg-primary/90 gap-1.5 h-9 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Ação
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs: Plano de Treinamento vs Indicadores de Desempenho */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'plano' | 'indicadores')}
        className="w-full"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <TabsList className="bg-black/40 border border-white/10 p-1">
            <TabsTrigger
              value="plano"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Plano de Ações (FSGQ 7.2-1)
            </TabsTrigger>
            <TabsTrigger
              value="indicadores"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Indicadores de Treinamento (HHT • Eficácia • Plano)
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            {activeTab === 'plano'
              ? `${filteredActions.length} ações no plano anual`
              : 'Painel executivo de metas e horas de treinamento'}
          </span>
        </div>

        {/* Tab Content: INDICADORES */}
        <TabsContent value="indicadores" className="mt-6 space-y-6">
          <TrainingIndicatorsSection
            companyId={selectedCompanyId}
            year={selectedYear}
            canEdit={canEdit}
          />
        </TabsContent>

        {/* Tab Content: PLANO DE TREINAMENTO (Fase 1 e Fase 2 intactas) */}
        <TabsContent value="plano" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="glass border-white/10 p-3.5">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] uppercase font-semibold">Total Ações</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Plano {selectedYear} (
                {selectedCompany?.name ? selectedCompany.name.split(' ')[0] : 'Empresa'})
              </p>
            </Card>

            <Card className="glass border-white/10 p-3.5">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] uppercase font-semibold">Realizadas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.realized}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Treinamentos executados</p>
            </Card>

            <Card className="glass border-white/10 p-3.5">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] uppercase font-semibold">Atrasadas</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400">{stats.overdue}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Prazo vencido ou fora da data
              </p>
            </Card>

            <Card className="glass border-white/10 p-3.5">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] uppercase font-semibold">Pendentes</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Aguardando realização</p>
            </Card>

            <Card className="glass border-white/10 p-3.5">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] uppercase font-semibold">% Concluído</span>
                <Award className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.pctCompleted}%</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.pctCompleted)}%` }}
                />
              </div>
            </Card>

            <Card className="glass border-white/10 p-3.5">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] uppercase font-semibold">Total CH</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalCH.toFixed(0)} h</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Carga horária acumulada</p>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="glass border-white/10 p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por ação, responsável, público..."
                  className="pl-9 h-9 text-xs bg-black/30 border-white/10 text-white"
                />
              </div>

              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 text-xs bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Qualificação Pessoal-Sensibilização">
                      Qualificação/Sensibilização
                    </SelectItem>
                    <SelectItem value="Procedimentos-Instruções-Formulários">
                      Procedimentos/Instruções
                    </SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="h-9 text-xs bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Origens</SelectItem>
                    <SelectItem value="Interno">Interno</SelectItem>
                    <SelectItem value="Externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="OK">OK (No Prazo)</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                  <SelectTrigger className="h-9 text-xs bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Público-Alvo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Públicos</SelectItem>
                    {distinctAudiences.map((aud) => (
                      <SelectItem key={aud} value={aud}>
                        {aud}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Spreadsheet Table FSGQ 7.2-1 */}
          <Card className="glass border-white/10 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary">FSGQ 7.2-1</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-white">
                  Tabela do Plano Anual de Treinamentos ({filteredActions.length} itens listados)
                </span>
              </div>

              <span className="text-[11px] text-muted-foreground hidden md:inline">
                Clique em "Marcar Realização" para registrar presença, carga horária e data efetiva.
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[1400px]">
                  <TableHeader>
                    <TableRow className="border-white/10 bg-black/40 text-[11px] uppercase text-muted-foreground">
                      <TableHead className="w-12 text-center text-white/60">#</TableHead>
                      <TableHead className="min-w-[260px] text-white/80 font-bold">AÇÃO</TableHead>
                      <TableHead className="w-28 text-white/60">PERIODICIDADE</TableHead>
                      <TableHead className="w-32 text-white/60">RESPONSÁVEL</TableHead>
                      <TableHead className="w-32 text-white/60">PÚBLICO-ALVO</TableHead>
                      <TableHead className="w-24 text-white/60">ORIGEM</TableHead>
                      <TableHead className="w-36 text-white/60">TIPO</TableHead>
                      <TableHead className="w-32 text-white/60">COMPETÊNCIA</TableHead>
                      <TableHead className="w-28 text-center text-white/80 font-semibold">
                        PREVISTO
                      </TableHead>
                      <TableHead className="w-28 text-center text-white/80 font-semibold">
                        REALIZADO
                      </TableHead>
                      <TableHead className="w-24 text-center text-white/80 font-semibold">
                        STATUS
                      </TableHead>
                      <TableHead className="w-32 text-center text-white/80 font-semibold">
                        LISTA PRESENÇA
                      </TableHead>
                      <TableHead className="w-24 text-center text-white/60">EFICÁCIA?</TableHead>
                      <TableHead className="w-20 text-center text-white/60">CH (h)</TableHead>
                      <TableHead className="w-20 text-center text-white/60">PARTIC.</TableHead>
                      <TableHead className="w-24 text-center text-white/80 font-semibold">
                        CH TOTAL
                      </TableHead>
                      <TableHead className="w-28 text-center text-white/60">
                        EFICÁCIA (+60d)
                      </TableHead>
                      <TableHead className="w-28 text-center text-white/60">STATUS EFIC.</TableHead>
                      <TableHead className="w-24 text-right pr-4 text-white/60">AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                          Carregando plano de treinamentos...
                        </TableCell>
                      </TableRow>
                    ) : filteredActions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                          Nenhuma ação encontrada para os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActions.map((item, index) => {
                        const isRealized = !!item.realized_date
                        const statusDays = item.status_days

                        return (
                          <TableRow
                            key={item.id}
                            className="border-white/5 hover:bg-white/5 text-xs transition-colors"
                          >
                            <TableCell className="text-center text-muted-foreground font-mono">
                              {index + 1}
                            </TableCell>

                            {/* AÇÃO */}
                            <TableCell className="font-medium text-white max-w-[300px]">
                              <div className="font-semibold text-white/95 leading-tight">
                                {item.action}
                              </div>
                              {item.notes && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {item.notes}
                                </p>
                              )}
                            </TableCell>

                            {/* PERIODICIDADE */}
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {item.periodicity}
                            </TableCell>

                            {/* RESPONSÁVEL */}
                            <TableCell className="text-white/80 whitespace-nowrap font-medium">
                              {item.responsible}
                            </TableCell>

                            {/* PÚBLICO-ALVO */}
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[11px]">
                                {item.target_audience}
                              </span>
                            </TableCell>

                            {/* ORIGEM */}
                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  item.origin === 'Interno'
                                    ? 'border-blue-500/30 text-blue-400 bg-blue-500/5'
                                    : 'border-purple-500/30 text-purple-400 bg-purple-500/5'
                                }`}
                              >
                                {item.origin}
                              </Badge>
                            </TableCell>

                            {/* TIPO */}
                            <TableCell className="text-muted-foreground text-[11px] max-w-[150px] truncate">
                              {item.type}
                            </TableCell>

                            {/* COMPETÊNCIA */}
                            <TableCell className="text-muted-foreground text-[11px] whitespace-nowrap">
                              {item.competence_form}
                            </TableCell>

                            {/* PREVISTO */}
                            <TableCell className="text-center whitespace-nowrap font-mono text-white/80">
                              {item.planned_date
                                ? new Date(item.planned_date).toLocaleDateString('pt-BR')
                                : '—'}
                            </TableCell>

                            {/* REALIZADO */}
                            <TableCell className="text-center whitespace-nowrap font-mono">
                              {isRealized ? (
                                <span className="text-emerald-400 font-semibold">
                                  {new Date(item.realized_date!).toLocaleDateString('pt-BR')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">—</span>
                              )}
                            </TableCell>

                            {/* STATUS (DIAS) */}
                            <TableCell className="text-center whitespace-nowrap">
                              {statusDays === 'OK' ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                  OK
                                </Badge>
                              ) : statusDays === 'Atrasado' ? (
                                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px]">
                                  Atrasado
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px]">
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>

                            {/* LISTA DE PRESENÇA STATUS */}
                            <TableCell className="text-center whitespace-nowrap">
                              {(() => {
                                const att = attendanceListsMap[item.id]
                                if (!att) {
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-white/10 text-muted-foreground/60"
                                    >
                                      Sem lista
                                    </Badge>
                                  )
                                }
                                if (att.status === 'avaliacao_concluida') {
                                  return (
                                    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      Concluída
                                    </Badge>
                                  )
                                }
                                if (att.status === 'aguardando_avaliacao_eficacia') {
                                  return (
                                    <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                      Eficácia Pend.
                                    </Badge>
                                  )
                                }
                                if (att.status === 'realizada') {
                                  return (
                                    <Badge className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                      Realizada
                                    </Badge>
                                  )
                                }
                                return (
                                  <Badge className="text-[10px] bg-white/10 text-muted-foreground border border-white/20">
                                    Rascunho
                                  </Badge>
                                )
                              })()}
                            </TableCell>

                            {/* REQUER EFICÁCIA? */}
                            <TableCell className="text-center whitespace-nowrap text-muted-foreground">
                              {item.requires_effectiveness_eval ? 'Sim' : 'Não'}
                            </TableCell>

                            {/* CH (h) */}
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {item.ch_hours !== undefined && item.ch_hours !== null
                                ? `${item.ch_hours}h`
                                : '—'}
                            </TableCell>

                            {/* PARTICIPANTES */}
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {item.participants_count ?? '—'}
                            </TableCell>

                            {/* CH TOTAL */}
                            <TableCell className="text-center font-mono font-bold text-white">
                              {item.ch_total !== undefined && item.ch_total !== null
                                ? `${item.ch_total}h`
                                : '—'}
                            </TableCell>

                            {/* EFICÁCIA PREVISTO (+60 dias) */}
                            <TableCell className="text-center whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                              {item.effectiveness_due_date
                                ? new Date(item.effectiveness_due_date).toLocaleDateString('pt-BR')
                                : '—'}
                            </TableCell>

                            {/* STATUS EFICÁCIA */}
                            <TableCell className="text-center whitespace-nowrap">
                              {item.effectiveness_status === 'OK' ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                  OK
                                </Badge>
                              ) : item.effectiveness_status === 'Atrasado' ? (
                                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px]">
                                  Atrasado
                                </Badge>
                              ) : item.effectiveness_status === 'Pendente' ? (
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px]">
                                  Pendente
                                </Badge>
                              ) : (
                                <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-[10px]">
                                  Não aplicável
                                </Badge>
                              )}
                            </TableCell>

                            {/* AÇÕES */}
                            <TableCell className="text-right pr-4 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setActionForAttendance(item)
                                      setIsAttendanceModalOpen(true)
                                    }}
                                    className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                                    title="Abrir Lista de Presença e Avaliação digital (FSGQ 7.2-3)"
                                  >
                                    Lista de Presença
                                  </Button>
                                )}

                                {canEdit && !isRealized && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setActionToRealize(item)
                                      setIsRealizeModalOpen(true)
                                    }}
                                    className="h-7 px-2 text-[11px] border-white/10 text-muted-foreground hover:bg-white/10"
                                    title="Marcar realização rápida (data, CH e participantes)"
                                  >
                                    Realizar
                                  </Button>
                                )}

                                {canEdit && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setActionToEdit(item)
                                      setIsActionModalOpen(true)
                                    }}
                                    className="h-7 w-7 text-muted-foreground hover:text-white"
                                    title="Editar ação completa"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                )}

                                {canDelete && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(item.id, item.action)}
                                    className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                    title="Excluir ação"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <TrainingImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={loadActions}
        companies={companies}
        defaultCompanyId={selectedCompanyId}
        defaultYear={selectedYear}
      />

      {/* Create / Edit Dialog */}
      <TrainingActionDialog
        open={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        onSuccess={loadActions}
        actionToEdit={actionToEdit}
        defaultCompanyId={selectedCompanyId}
        defaultYear={selectedYear}
      />

      {/* Quick Realize Dialog */}
      <TrainingRealizeDialog
        open={isRealizeModalOpen}
        onOpenChange={setIsRealizeModalOpen}
        onSuccess={loadActions}
        action={actionToRealize}
      />

      {/* Full Digital Attendance List Dialog FSGQ 7.2-3 */}
      <TrainingAttendanceDialog
        open={isAttendanceModalOpen}
        onOpenChange={setIsAttendanceModalOpen}
        action={actionForAttendance}
        companyId={selectedCompanyId}
        onSuccess={loadActions}
      />
    </div>
  )
}
