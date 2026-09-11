import React, { useState, useEffect, useMemo } from 'react'
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
  createChildRNC,
  RNC_PROCESS_LIST,
  RNC_ORIGINS,
  ROOT_CAUSE_CATEGORIES,
  type NonConformity,
  type RNCOrigin,
  type RNCActionType,
  type RNCSeverity,
  type RNCStatus,
  type RNCCorrectionType,
  type FiveWhyItem,
  type IshikawaData,
} from '@/services/rnc'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import { getCompanies, type Company } from '@/services/companies'
import { getAllowedModules } from '@/services/module-permissions'
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
  Building2,
  Filter,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldAlert,
  GitBranch,
  Paperclip,
  Check,
  XCircle,
  HelpCircle,
  Info,
  Calendar,
  Eye,
  FilePlus2,
  Lock,
  Upload,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/safe-data'
import { cn } from '@/lib/utils'
import {
  FiveWhysEditor,
  IshikawaDiagramEditor,
  CostOfQualityCalculator,
} from '@/components/RNCTools'
import pb from '@/lib/pocketbase/client'

const SEVERITY_COLORS: Record<string, string> = {
  Leve: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Médio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Grave: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Crítico: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Gravíssimo: 'bg-rose-600/20 text-rose-300 border-rose-500/40 font-bold',
}

const STATUS_COLORS: Record<string, string> = {
  Aberta: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Em Andamento': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Fechada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Cancelada: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const INITIAL_ISHIKAWA: IshikawaData = {
  metodo: [],
  maquina: [],
  mao_de_obra: [],
  material: [],
  meio_ambiente: [],
  medicao: [],
}

const INITIAL_FIVE_WHYS: FiveWhyItem[] = [
  { why: '1º Por quê: O que provocou o desvio diretamente?', answer: '' },
  { why: '2º Por quê: Por que a condição acima ocorreu?', answer: '' },
  { why: '3º Por quê: Por que a proteção/controle não detectou?', answer: '' },
]

export default function RNCPage() {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang } = useI18n()
  const { toast } = useToast()

  const [ncs, setNcs] = useState<NonConformity[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Filters (fiel ao FSGQ 8.7-1)
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterProcess, setFilterProcess] = useState<string>('all')
  const [filterOrigin, setFilterOrigin] = useState<string>('all')
  const [filterActionType, setFilterActionType] = useState<string>('all')

  // Form Modal & Step State (FSGQ 8.7-2)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeFormTab, setActiveFormTab] = useState<string>('sec1')
  const [isSaving, setIsSaving] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])

  // Detailed Modal
  const [detailDoc, setDetailDoc] = useState<NonConformity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isGeneratingChild, setIsGeneratingChild] = useState(false)

  // Form Data State mirroring FSGQ 8.7-2
  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    company_id: '',
    service_order_id: '',
    issuer: '',
    origin: 'Auditoria Interna' as RNCOrigin,
    action_type: 'Corretiva' as RNCActionType,
    process: 'CQ',
    severity: 'Médio' as RNCSeverity,
    status: 'Aberta' as RNCStatus,
    summary: '',
    deadline: '',
    parent_rnc_id: '',

    // Section 1
    description: '',
    involved_parties: '',
    responsible: '',
    supplier_name: '',

    // Section 2
    immediate_correction_type: 'Retrabalhar' as RNCCorrectionType,
    immediate_correction_other: '',
    immediate_action: '',
    cost_raw_material: 0,
    cost_supplies: 0,
    cost_services: 0,
    cost_total: 0,

    // Section 3
    reinspection_result: 'N/A' as 'Aprovado' | 'Não Aprovado' | 'N/A',
    reinspection_inspector: '',
    reinspection_date: '',
    reinspection_notes: '',

    // Section 4
    root_cause_category: 'Método / Procedimento',
    root_cause_details: '',
    root_cause_analysis: '',
    five_whys: INITIAL_FIVE_WHYS,
    ishikawa_data: INITIAL_ISHIKAWA,

    // Section 5
    corrective_action: '',
    action_plan: '',
    action_cost: 0,

    // Section 6
    risk_assessment: '',

    // Section 7
    effectiveness_target_date: '',
    is_effective: 'Pendente' as 'SIM' | 'NÃO' | 'Pendente',
    effectiveness_verification: '',
    verification_date: '',
    verifier: '',
  })

  // Role permissions
  const canManage = ['Manager', 'Director', 'QCC', 'Consultor', 'Supervisor'].includes(
    user?.role || '',
  )
  const canEmit = canManage || user?.role === 'Apontador' || user?.role === 'Inspector'

  const loadData = async () => {
    try {
      setLoading(true)
      const targetCompany = filterCompany !== 'all' ? filterCompany : selectedCompanyId
      const [ncList, orders, comps] = await Promise.all([
        getNonConformities({
          companyId: targetCompany,
          status: filterStatus,
          severity: filterSeverity,
          process: filterProcess,
          origin: filterOrigin,
          action_type: filterActionType,
          search,
        }),
        getServiceOrders(targetCompany !== 'all' ? targetCompany : undefined),
        getCompanies(),
      ])
      setNcs(ncList)
      setServiceOrders(orders)
      setCompanies(comps)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    selectedCompanyId,
    filterCompany,
    filterStatus,
    filterSeverity,
    filterProcess,
    filterOrigin,
    filterActionType,
    search,
  ])

  useRealtime('non_conformities', () => loadData())

  const openNew = async () => {
    setEditingId(null)
    const effectiveCompany =
      selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''
    const nextNum = await generateRNCNumber(effectiveCompany)

    setFormData({
      number: nextNum,
      date: new Date().toISOString().split('T')[0],
      company_id: effectiveCompany,
      service_order_id: '',
      issuer: user?.name || '',
      origin: 'Auditoria Interna',
      action_type: 'Corretiva',
      process: 'CQ',
      severity: 'Médio',
      status: 'Aberta',
      summary: '',
      deadline: '',
      parent_rnc_id: '',

      description: '',
      involved_parties: '',
      responsible: '',
      supplier_name: '',

      immediate_correction_type: 'Retrabalhar',
      immediate_correction_other: '',
      immediate_action: '',
      cost_raw_material: 0,
      cost_supplies: 0,
      cost_services: 0,
      cost_total: 0,

      reinspection_result: 'N/A',
      reinspection_inspector: '',
      reinspection_date: '',
      reinspection_notes: '',

      root_cause_category: 'Método / Procedimento',
      root_cause_details: '',
      root_cause_analysis: '',
      five_whys: INITIAL_FIVE_WHYS,
      ishikawa_data: INITIAL_ISHIKAWA,

      corrective_action: '',
      action_plan: '',
      action_cost: 0,

      risk_assessment: '',

      effectiveness_target_date: '',
      is_effective: 'Pendente',
      effectiveness_verification: '',
      verification_date: '',
      verifier: '',
    })

    setEvidenceFiles([])
    setActiveFormTab('sec1')
    setDialogOpen(true)
  }

  const openEdit = (nc: NonConformity) => {
    setEditingId(nc.id)

    let parsedWhys: FiveWhyItem[] = INITIAL_FIVE_WHYS
    if (nc.five_whys) {
      try {
        parsedWhys = typeof nc.five_whys === 'string' ? JSON.parse(nc.five_whys) : nc.five_whys
      } catch {
        parsedWhys = INITIAL_FIVE_WHYS
      }
    }

    let parsedIshikawa: IshikawaData = INITIAL_ISHIKAWA
    if (nc.ishikawa_data) {
      try {
        parsedIshikawa =
          typeof nc.ishikawa_data === 'string' ? JSON.parse(nc.ishikawa_data) : nc.ishikawa_data
      } catch {
        parsedIshikawa = INITIAL_ISHIKAWA
      }
    }

    setFormData({
      number: nc.number,
      date: nc.date ? nc.date.split('T')[0] : new Date().toISOString().split('T')[0],
      company_id: nc.company_id || '',
      service_order_id: nc.service_order_id || '',
      issuer: nc.issuer || '',
      origin: (nc.origin as RNCOrigin) || 'Auditoria Interna',
      action_type: (nc.action_type as RNCActionType) || 'Corretiva',
      process: nc.process || 'CQ',
      severity: nc.severity || 'Médio',
      status: nc.status || 'Aberta',
      summary: nc.summary || '',
      deadline: nc.deadline ? nc.deadline.split('T')[0] : '',
      parent_rnc_id: nc.parent_rnc_id || '',

      description: nc.description || '',
      involved_parties: nc.involved_parties || '',
      responsible: nc.responsible || '',
      supplier_name: nc.supplier_name || '',

      immediate_correction_type:
        (nc.immediate_correction_type as RNCCorrectionType) || 'Retrabalhar',
      immediate_correction_other: nc.immediate_correction_other || '',
      immediate_action: nc.immediate_action || '',
      cost_raw_material: nc.cost_raw_material || 0,
      cost_supplies: nc.cost_supplies || 0,
      cost_services: nc.cost_services || 0,
      cost_total: nc.cost_total || 0,

      reinspection_result: nc.reinspection_result || 'N/A',
      reinspection_inspector: nc.reinspection_inspector || '',
      reinspection_date: nc.reinspection_date ? nc.reinspection_date.split('T')[0] : '',
      reinspection_notes: nc.reinspection_notes || '',

      root_cause_category: nc.root_cause_category || 'Método / Procedimento',
      root_cause_details: nc.root_cause_details || '',
      root_cause_analysis: nc.root_cause_analysis || '',
      five_whys: parsedWhys,
      ishikawa_data: parsedIshikawa,

      corrective_action: nc.corrective_action || '',
      action_plan: nc.action_plan || '',
      action_cost: nc.action_cost || 0,

      risk_assessment: nc.risk_assessment || '',

      effectiveness_target_date: nc.effectiveness_target_date
        ? nc.effectiveness_target_date.split('T')[0]
        : '',
      is_effective: nc.is_effective || 'Pendente',
      effectiveness_verification: nc.effectiveness_verification || '',
      verification_date: nc.verification_date ? nc.verification_date.split('T')[0] : '',
      verifier: nc.verifier || '',
    })

    setEvidenceFiles([])
    setActiveFormTab('sec1')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.number.trim() || !formData.description.trim() || !formData.process) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o Número da RNC, o Processo envolvido e a Descrição da NC.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const company_id =
        formData.company_id ||
        (selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || '')

      const totalCost =
        (Number(formData.cost_raw_material) || 0) +
        (Number(formData.cost_supplies) || 0) +
        (Number(formData.cost_services) || 0)

      const payload: Partial<NonConformity> = {
        ...formData,
        company_id: company_id || undefined,
        service_order_id: formData.service_order_id || undefined,
        parent_rnc_id: formData.parent_rnc_id || undefined,
        cost_total: totalCost,
        five_whys: formData.five_whys,
        ishikawa_data: formData.ishikawa_data,
      }

      let saved: NonConformity
      if (editingId) {
        saved = await updateNonConformity(editingId, payload, evidenceFiles)
        toast({ title: 'RNC atualizada com sucesso!' })
      } else {
        saved = await createNonConformity(payload, evidenceFiles)
        toast({
          title: 'RNC registrada com sucesso!',
          description: `Nº ${saved.number} incluído no Livro FSGQ 8.7-1.`,
        })
      }

      // Check if effectiveness was set to 'NÃO' and ask/automate child RNC
      if (formData.is_effective === 'NÃO' && saved.status === 'Fechada') {
        try {
          const child = await createChildRNC(saved)
          toast({
            title: 'RNC Filha gerada automaticamente!',
            description: `Nova tratativa vinculada criada: ${child.number}`,
          })
        } catch (childErr) {
          console.warn('Falha ao abrir RNC filha:', childErr)
        }
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
      toast({ title: 'RNC excluída com sucesso' })
      setDetailDoc(null)
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e?.message, variant: 'destructive' })
    }
  }

  const handleManualCreateChild = async (parent: NonConformity) => {
    setIsGeneratingChild(true)
    try {
      const child = await createChildRNC(parent)
      toast({
        title: 'RNC Filha criada com sucesso!',
        description: `Registro ${child.number} vinculado à ${parent.number}.`,
      })
      loadData()
      setDetailDoc(child)
    } catch (e: any) {
      toast({
        title: 'Erro ao gerar RNC Filha',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingChild(false)
    }
  }

  // Dashboard Stats (Fiel às contagens e abas da planilha FSGQ 8.7-1)
  const stats = useMemo(() => {
    const total = ncs.length
    const open = ncs.filter((n) => n.status === 'Aberta').length
    const inProgress = ncs.filter((n) => n.status === 'Em Andamento').length
    const closed = ncs.filter((n) => n.status === 'Fechada').length
    const cancelled = ncs.filter((n) => n.status === 'Cancelada').length

    // Effectiveness: eficaz (SIM), ineficaz (NÃO), pendente
    const effective = ncs.filter((n) => n.is_effective === 'SIM').length
    const ineffective = ncs.filter((n) => n.is_effective === 'NÃO').length
    const effectiveRate =
      closed > 0 ? Math.round((effective / (effective + ineffective || 1)) * 100) : 0

    // Costs
    const totalCostOfNonQuality = ncs.reduce((acc, n) => acc + (Number(n.cost_total) || 0), 0)
    const totalActionCost = ncs.reduce((acc, n) => acc + (Number(n.action_cost) || 0), 0)

    // Severities
    const bySeverity: Record<string, number> = {
      Leve: 0,
      Médio: 0,
      Grave: 0,
      Crítico: 0,
      Gravíssimo: 0,
    }
    // Processes
    const byProcess: Record<string, number> = {}
    // Origins
    const byOrigin: Record<string, number> = {}
    // Action Type
    const byActionType: Record<string, number> = { Corretiva: 0, Preventiva: 0, 'N/A': 0 }

    ncs.forEach((n) => {
      const sev = n.severity || 'Médio'
      bySeverity[sev] = (bySeverity[sev] || 0) + 1

      const proc = n.process || 'Outros'
      byProcess[proc] = (byProcess[proc] || 0) + 1

      const orig = n.origin || 'Outro'
      byOrigin[orig] = (byOrigin[orig] || 0) + 1

      const act = n.action_type || 'Corretiva'
      byActionType[act] = (byActionType[act] || 0) + 1
    })

    return {
      total,
      open,
      inProgress,
      closed,
      cancelled,
      effective,
      ineffective,
      effectiveRate,
      totalCostOfNonQuality,
      totalActionCost,
      bySeverity,
      byProcess,
      byOrigin,
      byActionType,
    }
  }, [ncs])

  // Helpers for days left
  const calculateDaysLeft = (deadlineStr?: string) => {
    if (!deadlineStr) return null
    try {
      const deadline = new Date(deadlineStr).getTime()
      const now = new Date().getTime()
      const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
      return diff
    } catch {
      return null
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> SGQ — FSGQ 8.7
            </Badge>
            <Badge variant="outline" className="border-white/10 text-white/70">
              Rev. 06 / Rev. 04
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            >
              Alimentação Automática: IRPI & INCF
            </Badge>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Gestão de Não Conformidades (RNC)
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Módulo padronizado conforme formulários FSGQ 8.7-1 (Controle Geral) e FSGQ 8.7-2
            (Relatório Individual com 5 Por Quês e Ishikawa).
          </p>
        </div>

        {canEmit && (
          <Button
            onClick={openNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Emitir Nova RNC (FSGQ 8.7-2)
          </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Controle de RNCs (FSGQ 8.7-1)
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard & Indicadores (IRPI / INCF)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LIST / CONTROLE (FSGQ 8.7-1) */}
        <TabsContent value="list" className="space-y-4">
          <Card className="glass border-white/10">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" /> Filtros e Pesquisa
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Filtre por empresa, status, processo, severidade ou origem.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-white/10 text-white/70">
                  {ncs.length} registro(s) encontrado(s)
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="relative col-span-1 sm:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por Nº, resumo, emitente, fornecedor..."
                    className="bg-black/30 border-white/10 text-white pl-9 text-xs h-9"
                  />
                </div>

                {/* Company Filter (Multi-empresa PSC / KOALA / GENTI) */}
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs h-9">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Empresa: Todas</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: Todos</SelectItem>
                    <SelectItem value="Aberta">Aberta</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Fechada">Fechada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>

                {/* Process */}
                <Select value={filterProcess} onValueChange={setFilterProcess}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs h-9">
                    <SelectValue placeholder="Processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Processo: Todos</SelectItem>
                    {RNC_PROCESS_LIST.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Severity */}
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs h-9">
                    <SelectValue placeholder="Grau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Grau: Todos</SelectItem>
                    <SelectItem value="Leve">Leve</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Grave">Grave</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                    <SelectItem value="Gravíssimo">Gravíssimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table conforming to FSGQ 8.7-1 */}
              <div className="overflow-x-auto rounded-md border border-white/10">
                <Table>
                  <TableHeader className="bg-black/40">
                    <TableRow className="border-white/10">
                      <TableHead className="text-xs text-white/70 font-semibold">Nº RNC</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">Data</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">Empresa</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">OS</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">Origem</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">
                        Processo
                      </TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">Grau</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">
                        Resumo / Descrição
                      </TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">
                        Responsável
                      </TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">Prazo</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold">Status</TableHead>
                      <TableHead className="text-xs text-white/70 font-semibold text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ncs.map((nc) => {
                      const daysLeft = calculateDaysLeft(nc.deadline)
                      const isOverdue = daysLeft !== null && daysLeft < 0 && nc.status !== 'Fechada'

                      return (
                        <TableRow
                          key={nc.id}
                          className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setDetailDoc(nc)}
                        >
                          <TableCell className="text-xs font-mono font-bold text-primary whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {nc.parent_rnc_id && (
                                <span title="RNC Filha gerada por ineficácia">
                                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                                </span>
                              )}
                              {nc.number}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-white/80 whitespace-nowrap">
                            {safeFormatDate(nc.date, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="text-xs text-white/80 whitespace-nowrap">
                            {nc.expand?.company_id?.name?.split(' ')[0] || 'PSC'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-white/80 whitespace-nowrap">
                            {nc.expand?.service_order_id?.number || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-white/80 whitespace-nowrap">
                            {nc.origin || 'Auditoria'}
                          </TableCell>
                          <TableCell className="text-xs text-white/90 font-medium whitespace-nowrap">
                            {nc.process}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', SEVERITY_COLORS[nc.severity])}
                            >
                              {nc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-white/90 max-w-xs truncate">
                            {nc.summary || nc.description}
                          </TableCell>
                          <TableCell className="text-xs text-white/80 whitespace-nowrap">
                            {nc.responsible || nc.issuer || '—'}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {nc.deadline ? (
                              <div className="flex items-center gap-1">
                                <span
                                  className={cn(
                                    isOverdue ? 'text-rose-400 font-bold' : 'text-white/80',
                                  )}
                                >
                                  {safeFormatDate(nc.deadline, 'dd/MM/yyyy')}
                                </span>
                                {daysLeft !== null && nc.status !== 'Fechada' && (
                                  <span
                                    className={cn(
                                      'text-[10px] px-1 py-0.5 rounded',
                                      isOverdue
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : 'bg-white/10 text-white/60',
                                    )}
                                  >
                                    {isOverdue ? `${Math.abs(daysLeft)}d atraso` : `${daysLeft}d`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', STATUS_COLORS[nc.status])}
                            >
                              {nc.status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/60 hover:text-white"
                                onClick={() => setDetailDoc(nc)}
                                title="Visualizar formulário FSGQ 8.7-2"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-white/60 hover:text-amber-400"
                                  onClick={() => openEdit(nc)}
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {ncs.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">
                    Nenhuma Não Conformidade registrada para os filtros selecionados.
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Clique em "Emitir Nova RNC" para cadastrar o primeiro desvio no FSGQ 8.7-1.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DASHBOARD & INDICADORES (IRPI / INCF) */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Top Indicator Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Total Registrado
                  </p>
                  <h3 className="text-2xl font-bold text-white mt-1">{stats.total} RNCs</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stats.open} abertas • {stats.inProgress} em andamento
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <FileText className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Indicador IRPI (Reclamações)
                  </p>
                  <h3 className="text-2xl font-bold text-amber-400 mt-1">
                    {stats.byOrigin['Reclamação de Cliente'] || 0} pts
                  </h3>
                  <p className="text-[11px] text-amber-400/80 mt-0.5">Meta: &lt; 10 pts anuais</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Indicador INCF (Fornecedores)
                  </p>
                  <h3 className="text-2xl font-bold text-sky-400 mt-1">
                    {stats.byOrigin['Fornecedor'] || 0} desvios
                  </h3>
                  <p className="text-[11px] text-sky-400/80 mt-0.5">Limite aceitável &lt; 30%</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Custo Não Qualidade
                  </p>
                  <h3 className="text-xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(stats.totalCostOfNonQuality)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ações Corretivas: {formatCurrency(stats.totalActionCost)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By Severity */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">
                  RNCs por Grau de Desvio (Severidade)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Proporção de riscos segundo o formulário FSGQ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.bySeverity).map(([sev, count]) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={sev} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{sev}</span>
                        <span className="text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            sev === 'Leve'
                              ? 'bg-blue-400'
                              : sev === 'Médio'
                                ? 'bg-amber-400'
                                : sev === 'Grave'
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

            {/* By Origin */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">
                  RNCs por Origem da Notificação
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Origens padronizadas do FSGQ 8.7-1
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {RNC_ORIGINS.map((orig) => {
                  const count = stats.byOrigin[orig] || 0
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={orig} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{orig}</span>
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
                })}
              </CardContent>
            </Card>

            {/* By Process */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">
                  Top Processos Envolvidos
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Concentração por setor operacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Object.keys(stats.byProcess).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Nenhum processo registrado
                  </p>
                ) : (
                  Object.entries(stats.byProcess)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 7)
                    .map(([proc, count]) => {
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                      return (
                        <div key={proc} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white font-medium">{proc}</span>
                            <span className="text-muted-foreground">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-400 rounded-full transition-all"
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

      {/* FORM DIALOG FSGQ 8.7-2: RIGOROSAMENTE FIEL AO FORMULÁRIO DA EMPRESA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-white/10 p-6">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
                    {editingId ? 'Editar RNC' : 'FSGQ 8.7-2 — RELATÓRIO DE NÃO CONFORMIDADE'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Formulário oficial SGQ Rev. 04 • Empresa:{' '}
                    {companies.find((c) => c.id === formData.company_id)?.name || 'PSC'}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                {formData.number || 'RNC ---/--'}
              </Badge>
            </div>
          </DialogHeader>

          {/* CABEÇALHO DO FORMULÁRIO */}
          <div className="p-4 bg-black/30 border border-white/10 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
              Cabeçalho do Relatório (FSGQ 8.7-2)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Nº RNC Automático *</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="RNC 015-26"
                  className="bg-black/40 border-white/10 text-white font-mono text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Data de Abertura *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Status da RNC</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: RNCStatus) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aberta">Aberta</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Fechada">Fechada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">
                  Ordem de Serviço (OS)
                </Label>
                <Select
                  value={formData.service_order_id}
                  onValueChange={(v) => setFormData({ ...formData, service_order_id: v })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                    <SelectValue placeholder="Selecione a OS..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma / Não aplicável</SelectItem>
                    {serviceOrders.map((so) => (
                      <SelectItem key={so.id} value={so.id}>
                        {so.number} — {so.client || so.equipment || 'OS'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-[11px] text-white/70 block mb-1">
                  Origem da Notificação *
                </Label>
                <Select
                  value={formData.origin}
                  onValueChange={(v: RNCOrigin) => setFormData({ ...formData, origin: v })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RNC_ORIGINS.map((orig) => (
                      <SelectItem key={orig} value={orig}>
                        {orig}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Tipo de Ação</Label>
                <Select
                  value={formData.action_type}
                  onValueChange={(v: RNCActionType) => setFormData({ ...formData, action_type: v })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Processo Envolvido *</Label>
                <Select
                  value={formData.process}
                  onValueChange={(v) => setFormData({ ...formData, process: v })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RNC_PROCESS_LIST.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Grau de Desvio *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v: RNCSeverity) => setFormData({ ...formData, severity: v })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leve">Leve</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Grave">Grave</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                    <SelectItem value="Gravíssimo">Gravíssimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Emitente da RNC</Label>
                <Input
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="Nome do inspetor / emissor"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Prazo de Conclusão</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-[11px] text-white/70 block mb-1">Resumo Sucinto da NC</Label>
                <Input
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Ex: Porosidade na junta J-02"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>

            {formData.origin === 'Fornecedor' && (
              <div className="p-2.5 rounded bg-sky-500/10 border border-sky-500/20">
                <Label className="text-[11px] text-sky-300 block mb-1">
                  Nome do Fornecedor (Alimenta INCF de Fornecedores)
                </Label>
                <Input
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="Razão social ou nome fantasia do fornecedor..."
                  className="bg-black/40 border-sky-500/30 text-white text-xs h-8"
                />
              </div>
            )}
          </div>

          {/* SEÇÕES SEQUENCIAIS DO FORMULÁRIO (FSGQ 8.7-2) */}
          <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="space-y-4">
            <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 text-[11px]">
              <TabsTrigger
                value="sec1"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                1. Descrição
              </TabsTrigger>
              <TabsTrigger
                value="sec2"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                2. Correção & Custos
              </TabsTrigger>
              <TabsTrigger
                value="sec3"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                3. Reinspeção
              </TabsTrigger>
              <TabsTrigger
                value="sec4"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                4. Causa Raiz
              </TabsTrigger>
              <TabsTrigger
                value="sec5"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                5. Ação Corretiva
              </TabsTrigger>
              <TabsTrigger
                value="sec6"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                6. Riscos
              </TabsTrigger>
              <TabsTrigger
                value="sec7"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                7. Eficácia
              </TabsTrigger>
              <TabsTrigger
                value="sec8"
                className="data-[state=active]:bg-primary data-[state=active]:text-white py-1"
              >
                8. Evidências
              </TabsTrigger>
            </TabsList>

            {/* SEÇÃO 1: DESCRIÇÃO DA NC + ENVOLVIDOS */}
            <TabsContent value="sec1" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-white block mb-1">
                    Descrição Detalhada da Não Conformidade *
                  </Label>
                  <Textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva com clareza o desvio encontrado, o componente, lote ou ensaio realizado..."
                    className="bg-black/20 border-white/10 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Pessoas / Setores Envolvidos
                    </Label>
                    <Input
                      value={formData.involved_parties}
                      onChange={(e) =>
                        setFormData({ ...formData, involved_parties: e.target.value })
                      }
                      placeholder="Ex: Inspetores CQ, Equipe de Solda Turno 1"
                      className="bg-black/20 border-white/10 text-white text-xs h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Responsável pelo Tratamento
                    </Label>
                    <Input
                      value={formData.responsible}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      placeholder="Nome do responsável técnico pela RNC"
                      className="bg-black/20 border-white/10 text-white text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SEÇÃO 2: CORREÇÃO IMEDIATA + CUSTO DA NÃO QUALIDADE */}
            <TabsContent value="sec2" className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-white block mb-1">
                      Tipo de Correção Imediata (Disposição)
                    </Label>
                    <Select
                      value={formData.immediate_correction_type}
                      onValueChange={(v: RNCCorrectionType) =>
                        setFormData({ ...formData, immediate_correction_type: v })
                      }
                    >
                      <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Retrabalhar">Retrabalhar</SelectItem>
                        <SelectItem value="Reparar">Reparar</SelectItem>
                        <SelectItem value="Rejeitar-Sucatar">Rejeitar-Sucatar</SelectItem>
                        <SelectItem value="Concessão">Concessão</SelectItem>
                        <SelectItem value="Outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.immediate_correction_type === 'Outra' && (
                    <div>
                      <Label className="text-xs text-white/80 block mb-1">
                        Especificação da Outra Disposição
                      </Label>
                      <Input
                        value={formData.immediate_correction_other}
                        onChange={(e) =>
                          setFormData({ ...formData, immediate_correction_other: e.target.value })
                        }
                        placeholder="Descreva a disposição especial..."
                        className="bg-black/20 border-white/10 text-white text-xs h-8"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-white/80 block mb-1">
                    Descrição da Ação de Contenção / Imediata
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.immediate_action}
                    onChange={(e) => setFormData({ ...formData, immediate_action: e.target.value })}
                    placeholder="Ações para segregar, isolar ou conter imediatamente o desvio..."
                    className="bg-black/20 border-white/10 text-white text-xs"
                  />
                </div>

                {/* CALCULADOR AUTOMÁTICO DE CUSTOS FSGQ 8.7-2 */}
                <CostOfQualityCalculator
                  rawMaterial={formData.cost_raw_material}
                  supplies={formData.cost_supplies}
                  services={formData.cost_services}
                  onChange={({ rawMaterial, supplies, services }) =>
                    setFormData({
                      ...formData,
                      cost_raw_material: rawMaterial,
                      cost_supplies: supplies,
                      cost_services: services,
                      cost_total: rawMaterial + supplies + services,
                    })
                  }
                />
              </div>
            </TabsContent>

            {/* SEÇÃO 3: REINSPEÇÃO */}
            <TabsContent value="sec3" className="space-y-4">
              <div className="space-y-3 p-4 bg-black/20 border border-white/10 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-white block mb-1">
                      Resultado da Reinspeção
                    </Label>
                    <Select
                      value={formData.reinspection_result}
                      onValueChange={(v: 'Aprovado' | 'Não Aprovado' | 'N/A') =>
                        setFormData({ ...formData, reinspection_result: v })
                      }
                    >
                      <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                        <SelectItem value="Não Aprovado">Não Aprovado</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-white/80 block mb-1">Inspetor CQ</Label>
                    <Input
                      value={formData.reinspection_inspector}
                      onChange={(e) =>
                        setFormData({ ...formData, reinspection_inspector: e.target.value })
                      }
                      placeholder="Nome do inspetor que realizou a reinspeção"
                      className="bg-black/40 border-white/10 text-white text-xs h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-white/80 block mb-1">Data da Reinspeção</Label>
                    <Input
                      type="date"
                      value={formData.reinspection_date}
                      onChange={(e) =>
                        setFormData({ ...formData, reinspection_date: e.target.value })
                      }
                      className="bg-black/40 border-white/10 text-white text-xs h-8"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-white/80 block mb-1">
                    Parecer / Notas da Reinspeção
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.reinspection_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, reinspection_notes: e.target.value })
                    }
                    placeholder="Resultados dos ensaios (visual, LP, dimensional, estanqueidade)..."
                    className="bg-black/40 border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEÇÃO 4: CAUSA RAIZ COM 5 POR QUÊS E ISHIKAWA */}
            <TabsContent value="sec4" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-white block mb-1">
                      Categoria da Causa Raiz (9 Categorias do Formulário)
                    </Label>
                    <Select
                      value={formData.root_cause_category}
                      onValueChange={(v) => setFormData({ ...formData, root_cause_category: v })}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOT_CAUSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Detalhes da Causa Identificada
                    </Label>
                    <Input
                      value={formData.root_cause_details}
                      onChange={(e) =>
                        setFormData({ ...formData, root_cause_details: e.target.value })
                      }
                      placeholder="Resumo da causa raiz fundamental..."
                      className="bg-black/20 border-white/10 text-white text-xs h-8"
                    />
                  </div>
                </div>

                {/* FERRAMENTA DOS 5 POR QUÊS */}
                <FiveWhysEditor
                  whys={formData.five_whys}
                  onChange={(whys) => setFormData({ ...formData, five_whys: whys })}
                />

                {/* DIAGRAMA DE ISHIKAWA 6M */}
                <IshikawaDiagramEditor
                  data={formData.ishikawa_data}
                  onChange={(ishikawa_data) => setFormData({ ...formData, ishikawa_data })}
                />
              </div>
            </TabsContent>

            {/* SEÇÃO 5: AÇÃO CORRETIVA / PREVENTIVA */}
            <TabsContent value="sec5" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-white block mb-1">
                    Ação Corretiva / Preventiva Proposta
                  </Label>
                  <Textarea
                    rows={3}
                    value={formData.corrective_action}
                    onChange={(e) =>
                      setFormData({ ...formData, corrective_action: e.target.value })
                    }
                    placeholder="Ação sistêmica para eliminar a causa raiz e evitar que o desvio se repita..."
                    className="bg-black/20 border-white/10 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Plano de Ação (5W2H / Etapas)
                    </Label>
                    <Input
                      value={formData.action_plan}
                      onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
                      placeholder="Ex: Treinar inspetores e revisar instrução IT-CQ-02"
                      className="bg-black/20 border-white/10 text-white text-xs h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Custo Estimado da Ação (R$)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.action_cost || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          action_cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0,00"
                      className="bg-black/20 border-white/10 text-white text-xs h-8 font-mono"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SEÇÃO 6: AVALIAÇÃO DE RISCOS */}
            <TabsContent value="sec6" className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <Label className="text-xs font-semibold text-amber-200 uppercase">
                      Avaliação de Riscos e Oportunidades (Item 6 do FSGQ 8.7-2)
                    </Label>
                  </div>
                  <p className="text-[11px] text-amber-300/80 mb-2">
                    Avalie se esta não conformidade gera novos riscos aos projetos, à segurança ou
                    se aponta oportunidades de melhoria contínua para o SGQ.
                  </p>
                  <Textarea
                    rows={3}
                    value={formData.risk_assessment}
                    onChange={(e) => setFormData({ ...formData, risk_assessment: e.target.value })}
                    placeholder="Identifique se há impacto para os clientes, conformidade ASME/ISO ou processos correlatos..."
                    className="bg-black/30 border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEÇÃO 7: VERIFICAÇÃO DE EFICÁCIA (COM ABERTURA AUTOMÁTICA DE RNC FILHA) */}
            <TabsContent value="sec7" className="space-y-4">
              <div className="space-y-3 p-4 bg-black/30 border border-white/10 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-white block mb-1">
                      Data Prevista para Verificação
                    </Label>
                    <Input
                      type="date"
                      value={formData.effectiveness_target_date}
                      onChange={(e) =>
                        setFormData({ ...formData, effectiveness_target_date: e.target.value })
                      }
                      className="bg-black/40 border-white/10 text-white text-xs h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-white block mb-1">
                      A Ação Foi Eficaz? *
                    </Label>
                    <Select
                      value={formData.is_effective}
                      onValueChange={(v: 'SIM' | 'NÃO' | 'Pendente') =>
                        setFormData({ ...formData, is_effective: v })
                      }
                    >
                      <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente de Avaliação</SelectItem>
                        <SelectItem value="SIM">SIM — Eficaz (Conclui RNC)</SelectItem>
                        <SelectItem value="NÃO">NÃO — Ineficaz (Gera RNC Filha)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Auditor / Verificador
                    </Label>
                    <Input
                      value={formData.verifier}
                      onChange={(e) => setFormData({ ...formData, verifier: e.target.value })}
                      placeholder="Nome do auditor CQ / Consultor"
                      className="bg-black/40 border-white/10 text-white text-xs h-8"
                    />
                  </div>
                </div>

                {formData.is_effective === 'NÃO' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-300">
                        Regra de Ineficácia Ativada (FSGQ 8.7-2)
                      </h5>
                      <p className="text-[11px] text-rose-200/90 mt-0.5">
                        Ao salvar com resultado "NÃO", o UQualiHub abrirá automaticamente uma{' '}
                        <strong>nova RNC filha vinculada</strong> a esta, reiniciando o ciclo de
                        tratativa e garantindo conformidade com a auditoria ISO 9001.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-white/80 block mb-1">
                    Parecer Conclusivo da Verificação de Eficácia
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.effectiveness_verification}
                    onChange={(e) =>
                      setFormData({ ...formData, effectiveness_verification: e.target.value })
                    }
                    placeholder="Evidências apuradas na auditoria de acompanhamento..."
                    className="bg-black/40 border-white/10 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Data Real da Auditoria
                    </Label>
                    <Input
                      type="date"
                      value={formData.verification_date}
                      onChange={(e) =>
                        setFormData({ ...formData, verification_date: e.target.value })
                      }
                      className="bg-black/40 border-white/10 text-white text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SEÇÃO 8: EVIDÊNCIAS & ARQUIVOS */}
            <TabsContent value="sec8" className="space-y-4">
              <div className="space-y-3">
                <div className="border border-dashed border-white/20 rounded-lg p-6 text-center bg-black/20 hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-primary mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-white">
                    Anexar Evidências da Não Conformidade
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                    Fotos da peça afetada, relatórios de ensaio, certificados ou documentos (máx.
                    20MB cada)
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setEvidenceFiles(Array.from(e.target.files))
                      }
                    }}
                    className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/80">Arquivos prontos para envio:</Label>
                    {evidenceFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10 text-xs"
                      >
                        <span className="text-white truncate max-w-sm">{file.name}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
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
              className="bg-primary hover:bg-primary/90 font-semibold"
            >
              {isSaving ? 'Salvando RNC...' : editingId ? 'Atualizar RNC' : 'Salvar RNC no Livro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG — VISUALIZAÇÃO COMPLETA FSGQ 8.7-2 */}
      <Dialog open={!!detailDoc} onOpenChange={(v) => !v && setDetailDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10 p-6">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-primary">
                    {detailDoc?.number}
                  </span>
                  {detailDoc && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs', STATUS_COLORS[detailDoc.status])}
                    >
                      {detailDoc.status}
                    </Badge>
                  )}
                  {detailDoc?.is_effective && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        detailDoc.is_effective === 'SIM'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : detailDoc.is_effective === 'NÃO'
                            ? 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                            : 'border-white/10 text-white/60',
                      )}
                    >
                      Eficácia: {detailDoc.is_effective}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  FSGQ 8.7-2 Relatório de Não Conformidade • Aberta em{' '}
                  {safeFormatDate(detailDoc?.date, 'dd/MM/yyyy')}
                </p>
              </div>

              {detailDoc?.parent_rnc_id && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                  <GitBranch className="w-3 h-3 mr-1" /> Vinculada à RNC Pai
                </Badge>
              )}
            </div>
          </DialogHeader>

          {detailDoc && (
            <div className="space-y-5 text-sm text-white/90 py-2">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-black/25 p-3.5 rounded-lg border border-white/5">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Processo:</span>
                  <span className="text-white font-medium">{detailDoc.process}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Origem:</span>
                  <span className="text-white font-medium">{detailDoc.origin || 'Auditoria'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Grau:</span>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] mt-0.5', SEVERITY_COLORS[detailDoc.severity])}
                  >
                    {detailDoc.severity}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">OS Vinculada:</span>
                  <span className="text-white font-mono">
                    {detailDoc.expand?.service_order_id?.number || '—'}
                  </span>
                </div>
              </div>

              {/* 1. Descrição */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" /> 1. Descrição do Desvio
                </h4>
                <div className="bg-black/30 p-3 rounded-md border border-white/5 text-xs text-white/90 leading-relaxed">
                  {detailDoc.description}
                </div>
                {detailDoc.involved_parties && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    <strong>Envolvidos:</strong> {detailDoc.involved_parties} •{' '}
                    <strong>Responsável:</strong> {detailDoc.responsible || '—'}
                  </p>
                )}
              </div>

              {/* 2. Disposição & Custos */}
              {(detailDoc.immediate_action || detailDoc.cost_total) && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> 2. Correção Imediata &
                    Custos
                  </h4>
                  <div className="bg-black/30 p-3 rounded-md border border-white/5 space-y-2 text-xs">
                    {detailDoc.immediate_action && <p>{detailDoc.immediate_action}</p>}
                    <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[11px]">
                      <span className="text-muted-foreground">
                        Disposição: {detailDoc.immediate_correction_type || 'Retrabalho'}
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        Custo da Não Qualidade: {formatCurrency(detailDoc.cost_total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Reinspeção */}
              {detailDoc.reinspection_result && detailDoc.reinspection_result !== 'N/A' && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> 3. Reinspeção
                  </h4>
                  <div className="bg-black/30 p-3 rounded-md border border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Resultado: </span>
                      <span className="font-bold text-emerald-400">
                        {detailDoc.reinspection_result}
                      </span>
                      {detailDoc.reinspection_notes && (
                        <p className="text-white/80 mt-1">{detailDoc.reinspection_notes}</p>
                      )}
                    </div>
                    {detailDoc.reinspection_inspector && (
                      <span className="text-[11px] text-muted-foreground">
                        Por {detailDoc.reinspection_inspector} em{' '}
                        {safeFormatDate(detailDoc.reinspection_date, 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Causa Raiz */}
              {(detailDoc.root_cause_analysis || detailDoc.root_cause_details) && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> 4. Análise de Causa Raiz
                  </h4>
                  <div className="bg-black/30 p-3 rounded-md border border-white/5 text-xs space-y-1">
                    <p className="font-semibold text-amber-300">
                      Categoria: {detailDoc.root_cause_category || 'Geral'}
                    </p>
                    <p className="text-white/90">
                      {detailDoc.root_cause_details || detailDoc.root_cause_analysis}
                    </p>
                  </div>
                </div>
              )}

              {/* 5. Ação Corretiva */}
              {detailDoc.corrective_action && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> 5. Ação Corretiva
                  </h4>
                  <div className="bg-black/30 p-3 rounded-md border border-white/5 text-xs text-white/90">
                    <p>{detailDoc.corrective_action}</p>
                    {detailDoc.action_plan && (
                      <p className="text-muted-foreground mt-1">Plano: {detailDoc.action_plan}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Eficácia */}
              {detailDoc.effectiveness_verification && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> 7. Verificação de Eficácia
                  </h4>
                  <div className="bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20 text-xs text-emerald-200">
                    <p>{detailDoc.effectiveness_verification}</p>
                    {detailDoc.verifier && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Auditado por {detailDoc.verifier} em{' '}
                        {safeFormatDate(detailDoc.verification_date, 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Evidências anexadas */}
              {detailDoc.evidences && detailDoc.evidences.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-primary" /> Evidências Anexadas (
                    {detailDoc.evidences.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailDoc.evidences.map((fileName, idx) => {
                      const fileUrl = pb.files.getURL(detailDoc, fileName)
                      return (
                        <a
                          key={idx}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black/40 border border-white/10 hover:border-primary/40 text-xs text-primary hover:underline transition-colors"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-xs">{fileName}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-white/10 pt-4 flex-wrap gap-2">
            {canManage && detailDoc && (
              <>
                {detailDoc.is_effective === 'NÃO' && (
                  <Button
                    variant="outline"
                    onClick={() => handleManualCreateChild(detailDoc)}
                    disabled={isGeneratingChild}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
                  >
                    <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                    {isGeneratingChild ? 'Gerando Filha...' : 'Abrir RNC Filha'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    openEdit(detailDoc)
                    setDetailDoc(null)
                  }}
                  className="border-white/10 text-muted-foreground hover:text-primary text-xs"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar RNC
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(detailDoc.id)}
                  className="text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório de Não Conformidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta RNC? O número será arquivado e os indicadores
              IRPI/INCF serão recalculados automaticamente. Esta ação não poderá ser desfeita.
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
