import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  Calendar,
} from 'lucide-react'
import { useCompany } from '@/hooks/use-company'
import {
  QualityObjectiveComputed,
  OBJECTIVE_PROCESS_LIST,
  getQualityObjectives,
  createQualityObjective,
  updateQualityObjective,
  deleteQualityObjective,
} from '@/services/quality-objectives'
import { getCompanies, Company } from '@/services/companies'
import { getUsers, User } from '@/services/api'
import { ObjectiveFormDialog } from '@/components/ObjectiveFormDialog'

export default function QualityObjectivesPage() {
  const { selectedCompanyId } = useCompany()
  const currentYear = new Date().getFullYear()

  const [objectives, setObjectives] = useState<QualityObjectiveComputed[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedProcess, setSelectedProcess] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingObjective, setEditingObjective] = useState<QualityObjectiveComputed | null>(null)

  // Expanded row details
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [comps, usrs, list] = await Promise.all([
        getCompanies(),
        getUsers(),
        getQualityObjectives({
          companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
          year: selectedYear,
          process: selectedProcess !== 'all' ? selectedProcess : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search,
        }),
      ])
      setCompanies(comps)
      setUsers(usrs)
      setObjectives(list)
    } catch (err) {
      console.error('Failed to load quality objectives:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId, selectedYear, selectedProcess, selectedStatus])

  const handleSaveObjective = async (data: any) => {
    if (editingObjective) {
      await updateQualityObjective(editingObjective.id, data)
    } else {
      await createQualityObjective(data)
    }
    await loadData()
  }

  const handleDeleteObjective = async (id: string) => {
    if (!confirm('Deseja excluir este objetivo da qualidade?')) return
    await deleteQualityObjective(id)
    await loadData()
  }

  const handleQuickUpdateCurrent = async (id: string, currentVal: number) => {
    await updateQualityObjective(id, { current_value: currentVal })
    await loadData()
  }

  // Dashboard Aggregates
  const totalCount = objectives.length
  const achievedCount = objectives.filter((o) => o.status === 'Atingido').length
  const inProgressCount = objectives.filter((o) => o.status === 'Em andamento').length
  const overdueCount = objectives.filter((o) => o.isOverdue).length
  const achievementRate = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            Objetivos da Qualidade (ISO 9001 §6.2)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planejamento estratégico e desdobramento dos objetivos nos 21 processos do SGQ, com
            metas mensuráveis, semáforo de atingimento e planos de ação práticos (§6.2.2).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingObjective(null)
              setDialogOpen(true)
            }}
            className="gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Novo Objetivo
          </Button>
        </div>
      </div>

      {/* KPI Cards / Top Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Atingimento Global</span>
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">{achievedCount}</span>
            <span className="text-sm font-semibold text-muted-foreground">
              de {totalCount} atingidos
            </span>
          </div>
          <div className="mt-2">
            <Progress value={achievementRate} className="h-2" />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              {achievementRate}% de eficácia nos objetivos
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Objetivos Atingidos</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-2">{achievedCount}</p>
          <p className="text-xs text-emerald-600 mt-1">Metas batidas no ciclo</p>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Em Andamento</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-700 mt-2">{inProgressCount}</p>
          <p className="text-xs text-blue-600 mt-1">Planos de ação em execução</p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Vencidos / Atrasados</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-rose-700 mt-2">{overdueCount}</p>
          <p className="text-xs text-rose-600 mt-1">Prazo expirado sem atingir meta</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground">Ano:</span>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground">Processo:</span>
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">Todos os 21 Processos</SelectItem>
              {OBJECTIVE_PROCESS_LIST.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Planejado">Planejado</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Atingido">Atingido</SelectItem>
              <SelectItem value="Não atingido">Não atingido</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por objetivo, indicador ou notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="pl-8 text-xs h-8"
          />
        </div>

        <Button size="sm" variant="secondary" onClick={loadData} className="h-8 text-xs">
          Filtrar
        </Button>
      </div>

      {/* Objectives Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Quadro de Objetivos da Qualidade — Ciclo {selectedYear} ({objectives.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {objectives.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum objetivo da qualidade cadastrado para este ano ou filtro. Clique em "Novo
              Objetivo" para estruturar as metas do SGQ.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Semáforo</th>
                  <th className="p-3">Processo</th>
                  <th className="p-3">Objetivo & Indicador</th>
                  <th className="p-3 text-center">Meta vs. Atual</th>
                  <th className="p-3">Progresso</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Prazo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {objectives.map((item) => {
                  const isExpanded = expandedId === item.id
                  const progressColor =
                    item.trafficLight === 'green'
                      ? 'bg-emerald-500'
                      : item.trafficLight === 'red'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-muted/20 transition-colors">
                        {/* Traffic light badge */}
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.trafficLight === 'green'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.trafficLight === 'red'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                  : item.trafficLight === 'gray'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {item.status === 'Atingido'
                              ? 'Atingido'
                              : item.isOverdue
                                ? 'Atrasado'
                                : `${item.achievementPercent}%`}
                          </span>
                        </td>

                        {/* Process */}
                        <td className="p-3 font-semibold whitespace-nowrap text-foreground">
                          {item.process}
                          {item.expand?.company_id && (
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {item.expand.company_id.name}
                            </span>
                          )}
                        </td>

                        {/* Objective description & Indicator */}
                        <td className="p-3 max-w-sm">
                          <p className="font-semibold text-foreground">{item.objective}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Indicador:{' '}
                            <span className="font-medium text-foreground">{item.indicator}</span>
                          </p>
                        </td>

                        {/* Target vs Current */}
                        <td className="p-3 text-center whitespace-nowrap font-mono">
                          <div className="font-bold text-foreground">
                            {item.current_value !== null && item.current_value !== undefined
                              ? item.current_value
                              : '—'}{' '}
                            / {item.target_value}
                            {item.metric_type === 'percentual' ? '%' : ''}
                          </div>
                          {item.baseline !== null && item.baseline !== undefined && (
                            <div className="text-[10px] text-muted-foreground">
                              Base: {item.baseline}
                            </div>
                          )}
                        </td>

                        {/* Progress Bar */}
                        <td className="p-3 min-w-[130px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                              <span>{item.achievementPercent}%</span>
                              <span>Meta: {item.target_value}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${progressColor}`}
                                style={{ width: `${Math.min(100, item.achievementPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Responsible */}
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {item.expand?.responsible_id?.name || '—'}
                        </td>

                        {/* Deadline */}
                        <td className="p-3 whitespace-nowrap">
                          {item.deadline ? (
                            <span
                              className={
                                item.isOverdue ? 'text-rose-600 font-bold' : 'text-muted-foreground'
                              }
                            >
                              {new Date(item.deadline).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.status === 'Atingido'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : item.status === 'Não atingido' || item.isOverdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : item.status === 'Em andamento'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : ''
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            >
                              <span>Plano ({item.actionsList.length})</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingObjective(item)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-600 hover:text-rose-700"
                              onClick={() => handleDeleteObjective(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Action Plan row */}
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={9} className="p-4 border-b">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-primary" />
                                  Plano de Ação para o Objetivo (ISO 9001 §6.2.2)
                                </h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => {
                                    setEditingObjective(item)
                                    setDialogOpen(true)
                                  }}
                                >
                                  Gerenciar Ações / Atualizar
                                </Button>
                              </div>

                              {item.actionsList.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                  Nenhuma ação detalhada para este objetivo ainda. Edite o objetivo
                                  para adicionar ações do §6.2.2.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {item.actionsList.map((action, idx) => (
                                    <div
                                      key={action.id || idx}
                                      className="p-2.5 bg-background border rounded-md text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground">
                                          Ação #{idx + 1}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] py-0">
                                          {action.status}
                                        </Badge>
                                      </div>
                                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                                        {action.description}
                                      </p>
                                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-muted">
                                        <span>Resp: {action.responsible || '—'}</span>
                                        <span>Prazo: {action.deadline || '—'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {item.notes && (
                                <div className="p-2 bg-muted/20 rounded text-[11px] text-muted-foreground">
                                  <strong>Método de Medição / Observações:</strong> {item.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ObjectiveFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        objective={editingObjective}
        companies={companies}
        users={users}
        selectedCompanyId={selectedCompanyId}
        currentYear={selectedYear}
        onSave={handleSaveObjective}
      />
    </div>
  )
}
