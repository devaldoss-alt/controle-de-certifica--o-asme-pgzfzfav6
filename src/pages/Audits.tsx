import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ClipboardList,
  BarChart2,
  Building2,
  Trash2,
  Edit,
} from 'lucide-react'
import { useCompany } from '@/hooks/use-company'
import { useAuth } from '@/hooks/use-auth'
import {
  AuditProgramItem,
  AuditChecklistSection,
  AuditFinding,
  AUDIT_PROCESS_LIST,
  getAuditPrograms,
  createAuditProgram,
  updateAuditProgram,
  deleteAuditProgram,
  getAuditChecklists,
  getAuditFindings,
  createAuditFinding,
  updateAuditFinding,
  deleteAuditFinding,
  getAuditTrafficLight,
} from '@/services/audits'
import { getCompanies, Company } from '@/services/companies'
import { getUsers, User } from '@/services/api'
import { getDocuments, DocumentRecord } from '@/services/documents'
import { AuditFormDialog } from '@/components/AuditFormDialog'
import { AuditFindingDialog } from '@/components/AuditFindingDialog'
import { AuditExecutionTab } from '@/components/AuditExecutionTab'
import { AuditReportTab } from '@/components/AuditReportTab'

export default function AuditsPage() {
  const { selectedCompanyId, companies: contextCompanies } = useCompany()
  const { user } = useAuth()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const [audits, setAudits] = useState<AuditProgramItem[]>([])
  const [activeAudit, setActiveAudit] = useState<AuditProgramItem | null>(null)
  const [checklistSections, setChecklistSections] = useState<AuditChecklistSection[]>([])
  const [findings, setFindings] = useState<AuditFinding[]>([])

  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)
  const [editingAudit, setEditingAudit] = useState<AuditProgramItem | null>(null)

  const [findingDialogOpen, setFindingDialogOpen] = useState(false)
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null)

  // Active view tab: 'program' | 'execution' | 'findings' | 'report' | 'dashboard'
  const [activeTab, setActiveTab] = useState<
    'program' | 'execution' | 'findings' | 'report' | 'dashboard'
  >('program')

  const loadData = async () => {
    try {
      setLoading(true)
      const [comps, usrs, docs] = await Promise.all([getCompanies(), getUsers(), getDocuments()])
      setCompanies(comps)
      setUsers(usrs)
      setDocuments(docs)

      const prog = await getAuditPrograms({
        year: selectedYear,
        companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        audit_type: selectedType !== 'all' ? selectedType : undefined,
        search,
      })
      setAudits(prog)

      if (activeAudit) {
        const refreshed = prog.find((p) => p.id === activeAudit.id)
        if (refreshed) {
          setActiveAudit(refreshed)
          await loadAuditDetails(refreshed.id)
        }
      }
    } catch (e) {
      console.error('Failed to load audit data:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadAuditDetails = async (auditId: string) => {
    try {
      const [chks, fnds] = await Promise.all([
        getAuditChecklists(auditId),
        getAuditFindings(auditId),
      ])
      setChecklistSections(chks)
      setFindings(fnds)
    } catch (e) {
      console.error('Failed to load audit details:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedYear, selectedCompanyId, selectedStatus, selectedType])

  const handleSelectAudit = async (
    audit: AuditProgramItem,
    tab: 'execution' | 'findings' | 'report',
  ) => {
    setActiveAudit(audit)
    await loadAuditDetails(audit.id)
    setActiveTab(tab)
  }

  const handleSaveAudit = async (data: Partial<AuditProgramItem>) => {
    if (editingAudit) {
      await updateAuditProgram(editingAudit.id, data)
    } else {
      await createAuditProgram(data)
    }
    await loadData()
  }

  const handleDeleteAudit = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta auditoria do programa?')) return
    await deleteAuditProgram(id)
    if (activeAudit?.id === id) {
      setActiveAudit(null)
      setActiveTab('program')
    }
    await loadData()
  }

  const handleSaveFinding = async (
    data: Partial<AuditFinding>,
    files?: File[],
    autoCreateRNC = false,
  ) => {
    if (!activeAudit) return
    if (editingFinding) {
      await updateAuditFinding(editingFinding.id, data, files)
    } else {
      await createAuditFinding(data, files, autoCreateRNC, {
        companyId: activeAudit.company_id,
        process: activeAudit.audit_scope,
      })
    }
    await loadAuditDetails(activeAudit.id)
  }

  const handleDeleteFinding = async (id: string) => {
    if (!confirm('Excluir este achado de auditoria?')) return
    await deleteAuditFinding(id)
    if (activeAudit) {
      await loadAuditDetails(activeAudit.id)
    }
  }

  // Dashboard Aggregates
  const totalAudits = audits.length
  const completedAudits = audits.filter((a) => a.status === 'Realizada').length
  const delayedAudits = audits.filter((a) => getAuditTrafficLight(a).isDelayed).length
  const executionPercent = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Auditorias Internas (ISO 9001 §9.2)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planejamento anual, execução sistemática de checklists e gestão de achados com vínculo
            direto ao módulo RNC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingAudit(null)
              setAuditDialogOpen(true)
            }}
            className="gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Nova Auditoria
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full space-y-6"
      >
        <TabsList className="bg-muted/60 p-1 flex-wrap h-auto">
          <TabsTrigger value="program" className="text-xs">
            Programa Anual
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs">
            Dashboard do Módulo
          </TabsTrigger>
          {activeAudit && (
            <>
              <TabsTrigger value="execution" className="text-xs flex items-center gap-1.5">
                <span>Execução: {activeAudit.audit_scope}</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1">
                  {activeAudit.status}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="findings" className="text-xs flex items-center gap-1.5">
                <span>Achados ({findings.length})</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="text-xs">
                Relatório da Auditoria
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* TAB 1: PROGRAMA ANUAL */}
        <TabsContent value="program" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-lg border">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Ano:</span>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
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
              <span className="text-xs font-semibold text-muted-foreground">Status:</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Planejada">Planejada</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Realizada">Realizada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Tipo:</span>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Interna">Interna</SelectItem>
                  <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="Preparatória de certificação">
                    Preparatória de certificação
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por escopo ou notas..."
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

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <span className="text-xs text-muted-foreground block font-medium">
                Auditorias no Ano
              </span>
              <span className="text-xl font-bold">{totalAudits}</span>
            </Card>
            <Card className="p-3">
              <span className="text-xs text-muted-foreground block font-medium">Realizadas</span>
              <span className="text-xl font-bold text-emerald-600">{completedAudits}</span>
            </Card>
            <Card className="p-3">
              <span className="text-xs text-muted-foreground block font-medium">
                Semáforo de Atraso
              </span>
              <span className="text-xl font-bold text-rose-600">{delayedAudits}</span>
            </Card>
            <Card className="p-3">
              <span className="text-xs text-muted-foreground block font-medium">
                % Execução do Programa
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">{executionPercent}%</span>
                <span className="text-[11px] text-muted-foreground">concluído</span>
              </div>
            </Card>
          </div>

          {/* Table / Grid */}
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-semibold">
                Grade de Auditorias — Ano {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {audits.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhuma auditoria programada para este ano ou filtro. Clique em "Nova Auditoria"
                  para iniciar o plano anual.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground border-b uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3">Semáforo</th>
                      <th className="p-3">Processo / Escopo</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Data Prevista</th>
                      <th className="p-3">Data Realizada</th>
                      <th className="p-3">Equipe Auditora</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {audits.map((item) => {
                      const light = getAuditTrafficLight(item)
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => handleSelectAudit(item, 'execution')}
                        >
                          {/* Traffic Light */}
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                light.color === 'red'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                  : light.color === 'green'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : light.color === 'yellow'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : light.color === 'gray'
                                        ? 'bg-slate-100 text-slate-700'
                                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              {light.label}
                            </span>
                          </td>

                          <td className="p-3 font-semibold text-foreground">
                            {item.audit_scope}
                            <div className="text-[10px] text-muted-foreground font-normal truncate max-w-xs">
                              {item.standard_ref?.slice(0, 2).join(', ')}
                              {item.standard_ref?.length > 2
                                ? ` (+${item.standard_ref.length - 2})`
                                : ''}
                            </div>
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {item.expand?.company_id?.name || 'PSC'}
                          </td>

                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {item.audit_type}
                            </Badge>
                          </td>

                          <td className="p-3 font-medium">
                            {item.planned_date
                              ? new Date(item.planned_date).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {item.realized_date
                              ? new Date(item.realized_date).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {item.expand?.auditor_ids?.map((a) => a.name).join(', ') || 'A definir'}
                          </td>

                          <td
                            className="p-3 text-right space-x-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setEditingAudit(item)
                                setAuditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                              onClick={() => handleDeleteAudit(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleSelectAudit(item, 'execution')}
                            >
                              <span>Auditar</span>
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DASHBOARD DO MÓDULO */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Execução Global</span>
                <BarChart2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-black text-primary mt-2">{executionPercent}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {completedAudits} de {totalAudits} auditorias realizadas no ano {selectedYear}
              </p>
            </Card>

            <Card className="p-4 bg-rose-50/50 border-rose-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800">Auditorias Atrasadas</span>
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-3xl font-black text-rose-700 mt-2">{delayedAudits}</p>
              <p className="text-xs text-rose-600 mt-1">Requerem reprogramação formal</p>
            </Card>

            <Card className="p-4 bg-emerald-50/50 border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">
                  Concluídas com Sucesso
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-700 mt-2">{completedAudits}</p>
              <p className="text-xs text-emerald-600 mt-1">Checklists e relatórios finalizados</p>
            </Card>

            <Card className="p-4 bg-amber-50/50 border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">Em Andamento</span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-700 mt-2">
                {audits.filter((a) => a.status === 'Em andamento').length}
              </p>
              <p className="text-xs text-amber-600 mt-1">Checklists sendo preenchidos</p>
            </Card>
          </div>

          {/* Process Distribution Matrix */}
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-semibold">
                Visão por Processo Auditado (21 Processos Oficiais SGQ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {AUDIT_PROCESS_LIST.map((proc) => {
                  const procAudits = audits.filter((a) => a.audit_scope === proc)
                  const hasDone = procAudits.some((a) => a.status === 'Realizada')
                  const hasDelayed = procAudits.some((a) => getAuditTrafficLight(a).isDelayed)

                  return (
                    <div
                      key={proc}
                      className={`p-2.5 rounded border text-xs flex flex-col justify-between h-20 transition-all ${
                        hasDone
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : hasDelayed
                            ? 'bg-rose-50/40 border-rose-300'
                            : procAudits.length > 0
                              ? 'bg-blue-50/40 border-blue-300'
                              : 'bg-muted/10 border-dashed text-muted-foreground'
                      }`}
                    >
                      <span className="font-semibold truncate">{proc}</span>
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span>{procAudits.length} aud.</span>
                        {hasDone && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0"
                          >
                            OK
                          </Badge>
                        )}
                        {hasDelayed && (
                          <Badge
                            variant="outline"
                            className="bg-rose-100 text-rose-800 text-[9px] px-1 py-0"
                          >
                            Atraso
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: EXECUÇÃO DO CHECKLIST */}
        {activeAudit && (
          <TabsContent value="execution">
            <AuditExecutionTab
              audit={activeAudit}
              checklistSections={checklistSections}
              availableDocuments={documents}
              onReload={() => loadAuditDetails(activeAudit.id)}
            />
          </TabsContent>
        )}

        {/* TAB 4: ACHADOS */}
        {activeAudit && (
          <TabsContent value="findings" className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-lg">
              <div>
                <h3 className="font-semibold text-sm">
                  Achados da Auditoria: {activeAudit.audit_scope}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Classifique as constatações (NCs, Observações, Oportunidades ou Pontos Fortes).
                  NCs podem gerar RNCs vinculadas automaticamente.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setEditingFinding(null)
                  setFindingDialogOpen(true)
                }}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Achado
              </Button>
            </div>

            {findings.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">Nenhum achado registrado até o momento.</p>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Novo Achado" para registrar uma Não Conformidade, Observação ou Ponto
                    Forte.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findings.map((finding) => (
                  <Card
                    key={finding.id}
                    className={`border text-xs ${
                      finding.type === 'Não Conformidade'
                        ? 'border-rose-200 bg-rose-50/20'
                        : finding.type === 'Observação'
                          ? 'border-amber-200 bg-amber-50/20'
                          : finding.type === 'Oportunidade de Melhoria'
                            ? 'border-blue-200 bg-blue-50/20'
                            : 'border-purple-200 bg-purple-50/20'
                    }`}
                  >
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                      <Badge
                        variant="outline"
                        className={
                          finding.type === 'Não Conformidade'
                            ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                            : finding.type === 'Observação'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : finding.type === 'Oportunidade de Melhoria'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-purple-100 text-purple-800 border-purple-300'
                        }
                      >
                        {finding.type}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingFinding(finding)
                            setFindingDialogOpen(true)
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFinding(finding.id)}
                          className="h-7 w-7 p-0 text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-2">
                      <p className="text-foreground leading-relaxed">{finding.description}</p>

                      {finding.linked_rnc_id && (
                        <div className="p-2 bg-rose-100/60 border border-rose-300 rounded text-[11px] text-rose-900 font-medium">
                          RNC Vinculada:{' '}
                          <a
                            href={`/rnc?search=${finding.linked_rnc_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-bold"
                          >
                            Abrir no Módulo RNC →
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                        <div>
                          <span>Responsável: </span>
                          <strong className="text-foreground">{finding.responsible || '—'}</strong>
                        </div>
                        <div>
                          <span>Prazo: </span>
                          <strong className="text-foreground">
                            {finding.deadline
                              ? new Date(finding.deadline).toLocaleDateString('pt-BR')
                              : '—'}
                          </strong>
                        </div>
                        <div>
                          <span>Status: </span>
                          <strong className="text-foreground">{finding.status}</strong>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* TAB 5: RELATÓRIO PRONTO PARA IMPRESSÃO */}
        {activeAudit && (
          <TabsContent value="report">
            <AuditReportTab
              audit={activeAudit}
              checklistSections={checklistSections}
              findings={findings}
              company={companies.find((c) => c.id === activeAudit.company_id)}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Program Item Dialog */}
      <AuditFormDialog
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
        onSave={handleSaveAudit}
        initialData={editingAudit}
        companies={companies}
        users={users}
        selectedCompanyId={selectedCompanyId !== 'all' ? selectedCompanyId : undefined}
      />

      {/* Finding Dialog */}
      {activeAudit && (
        <AuditFindingDialog
          open={findingDialogOpen}
          onOpenChange={setFindingDialogOpen}
          onSave={handleSaveFinding}
          initialData={editingFinding}
          audit={activeAudit}
        />
      )}
    </div>
  )
}
