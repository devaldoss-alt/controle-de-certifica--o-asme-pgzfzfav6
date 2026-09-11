import { useState, useEffect, useMemo } from 'react'
import { useCompany } from '@/hooks/use-company'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import type {
  Supplier,
  SupplierEvaluation,
  PurchaseQuote,
  SuppliesKPIsSummary,
  QualificationCriterion,
} from '@/services/suppliers'
import {
  CRITICAL_CATEGORIES,
  INITIAL_EVALUATION_QUESTIONS,
  REEVALUATION_QUESTIONS,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierEvaluations,
  saveSupplierEvaluation,
  getPurchaseQuotes,
  computeSuppliesKPIs,
  recalculateSuppliesKPIs,
} from '@/services/suppliers'
import { ContextualHelpButton } from '@/components/ContextualHelpButton'
import { QualifiedSuppliersListPrint } from '@/components/QualifiedSuppliersListPrint'
import { SupplierEvaluationForm } from '@/components/SupplierEvaluationForm'
import { PurchasePipelineTab } from '@/components/PurchasePipelineTab'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Building2,
  ShieldCheck,
  Award,
  RefreshCw,
  Clock,
  Printer,
  ChevronRight,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react'

export default function SuppliersPage() {
  const { companies, selectedCompanyId } = useCompany()
  const currentCompany = useMemo(() => {
    if (selectedCompanyId && selectedCompanyId !== 'all') {
      return companies.find((c) => c.id === selectedCompanyId)
    }
    return companies[0]
  }, [companies, selectedCompanyId])
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('suppliers')
  const [loading, setLoading] = useState(true)

  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([])
  const [quotes, setQuotes] = useState<PurchaseQuote[]>([])
  const [kpis, setKpis] = useState<SuppliesKPIsSummary>({
    incfGeneral: 0,
    criticalSuppliersTotal: 0,
    criticalSuppliersQualified: 0,
    pctCriticalQualified: 100,
    totalQuotes: 0,
    quotesWithMinThree: 0,
    pctQuotesWithMinThree: 100,
    totalDeliveredOrders: 0,
    delayedOrders: 0,
    pctDelayedOrders: 0,
    suppliersExceedingINCF: [],
  })

  // Filter & Search
  const [search, setSearch] = useState('')
  const [classificationFilter, setClassificationFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Supplier Dialog (Create / Edit)
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [classification, setClassification] = useState<Supplier['classification']>('Crítico')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [materialsDescription, setMaterialsDescription] = useState('')
  const [qualificationStatus, setQualificationStatus] =
    useState<Supplier['qualification_status']>('Em avaliação')
  const [qualificationCriteria, setQualificationCriteria] = useState<QualificationCriterion[]>([])
  const [isoCertified, setIsoCertified] = useState(false)
  const [isoCertNumber, setIsoCertNumber] = useState('')
  const [isoValidUntil, setIsoValidUntil] = useState('')
  const [technicalCerts, setTechnicalCerts] = useState('')
  const [qualificationNotes, setQualificationNotes] = useState('')

  // Evaluation Dialog (FSGQ 8.4-2 & 8.4-2.1)
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false)
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<Supplier | null>(null)
  const [evaluationType, setEvaluationType] = useState<
    'Inicial (FSGQ 8.4-2)' | 'Reavaliação (FSGQ 8.4-2.1)'
  >('Inicial (FSGQ 8.4-2)')

  // Fetch all data
  const loadData = async () => {
    try {
      setLoading(true)
      const cId = currentCompany?.id

      const [sups, evals, qts, kpiData] = await Promise.all([
        getSuppliers({ companyId: cId }),
        getSupplierEvaluations(undefined, cId),
        getPurchaseQuotes(cId),
        computeSuppliesKPIs(cId),
      ])

      setSuppliers(sups)
      setEvaluations(evals)
      setQuotes(qts)
      setKpis(kpiData)
    } catch (e) {
      console.error('Error loading supplies data:', e)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações de fornecedores.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCompany?.id])

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (classificationFilter !== 'all' && s.classification !== classificationFilter) return false
      if (statusFilter !== 'all' && s.qualification_status !== statusFilter) return false
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = s.name.toLowerCase().includes(query)
        const matchTrade = (s.trade_name || '').toLowerCase().includes(query)
        const matchCnpj = (s.cnpj || '').toLowerCase().includes(query)
        const matchContact = (s.contact_person || '').toLowerCase().includes(query)
        if (!matchName && !matchTrade && !matchCnpj && !matchContact) return false
      }
      return true
    })
  }, [suppliers, classificationFilter, statusFilter, search])

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setName('')
    setTradeName('')
    setCnpj('')
    setContactPerson('')
    setPhone('')
    setEmail('')
    setAddress('')
    setClassification('Crítico')
    setSelectedCategories([])
    setMaterialsDescription('')
    setQualificationStatus('Em avaliação')
    setQualificationCriteria([])
    setIsoCertified(false)
    setIsoCertNumber('')
    setIsoValidUntil('')
    setTechnicalCerts('')
    setQualificationNotes('')
    setIsSupplierDialogOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup)
    setName(sup.name)
    setTradeName(sup.trade_name || '')
    setCnpj(sup.cnpj || '')
    setContactPerson(sup.contact_person || '')
    setPhone(sup.phone || '')
    setEmail(sup.email || '')
    setAddress(sup.address || '')
    setClassification(sup.classification)
    setSelectedCategories(sup.critical_categories || [])
    setMaterialsDescription(sup.materials_services_description || '')
    setQualificationStatus(sup.qualification_status)
    setQualificationCriteria(sup.qualification_criteria || [])
    setIsoCertified(!!sup.iso9001_certified)
    setIsoCertNumber(sup.iso9001_cert_number || '')
    setIsoValidUntil(sup.iso9001_valid_until ? sup.iso9001_valid_until.split('T')[0] : '')
    setTechnicalCerts(sup.technical_certificates_info || '')
    setQualificationNotes(sup.qualification_notes || '')
    setIsSupplierDialogOpen(true)
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  const toggleCriterion = (crit: QualificationCriterion) => {
    setQualificationCriteria((prev) =>
      prev.includes(crit) ? prev.filter((c) => c !== crit) : [...prev, crit],
    )
  }

  // Save Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Razão Social é obrigatória', variant: 'destructive' })
      return
    }

    try {
      setIsSubmitting(true)
      const data: Partial<Supplier> = {
        name,
        trade_name: tradeName,
        cnpj,
        contact_person: contactPerson,
        phone,
        email,
        address,
        company_id: currentCompany?.id || 'a631bv695rr4gef',
        classification,
        critical_categories: selectedCategories,
        materials_services_description: materialsDescription,
        qualification_status: qualificationStatus,
        qualification_criteria: qualificationCriteria,
        iso9001_certified: isoCertified,
        iso9001_cert_number: isoCertNumber,
        iso9001_valid_until: isoValidUntil || undefined,
        technical_certificates_info: technicalCerts,
        qualification_notes: qualificationNotes,
        qualified_by: user?.id,
      }

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, data)
        toast({ title: 'Fornecedor atualizado com sucesso' })
      } else {
        await createSupplier(data)
        toast({
          title: 'Fornecedor cadastrado com sucesso',
          description: isoCertified
            ? 'Qualificação automática por ISO 9001 registrada conforme PSGQ 8.4.'
            : undefined,
        })
      }

      setIsSupplierDialogOpen(false)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar fornecedor',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Supplier
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return
    try {
      await deleteSupplier(id)
      toast({ title: 'Fornecedor removido com sucesso' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message, variant: 'destructive' })
    }
  }

  // Open Evaluation Form
  const handleOpenEvaluation = (
    sup: Supplier,
    type: 'Inicial (FSGQ 8.4-2)' | 'Reavaliação (FSGQ 8.4-2.1)',
  ) => {
    setEvaluatingSupplier(sup)
    setEvaluationType(type)
    setIsEvaluationDialogOpen(true)
  }

  // Save Evaluation
  const handleSaveEvaluationForm = async (data: {
    evaluatorName: string
    observations: string
    actionPlan: string
    questions: any[]
  }) => {
    if (!evaluatingSupplier) return
    try {
      setIsSubmitting(true)
      const supINCF = kpis.suppliersExceedingINCF.find(
        (i) => i.supplierName.toLowerCase() === evaluatingSupplier.name.toLowerCase(),
      )?.incfRate

      await saveSupplierEvaluation(
        {
          supplier_id: evaluatingSupplier.id,
          company_id: currentCompany?.id || evaluatingSupplier.company_id,
          evaluation_type: evaluationType,
          evaluation_date: new Date().toISOString(),
          evaluator_name: data.evaluatorName,
          evaluator_id: user?.id,
          observations: data.observations,
          action_plan: data.actionPlan,
          incf_recorded: supINCF,
        },
        data.questions,
      )

      toast({
        title: 'Avaliação Registrada com Sucesso!',
        description: `Formulário ${evaluationType} processado. Status do fornecedor atualizado automaticamente.`,
      })
      setIsEvaluationDialogOpen(false)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar avaliação',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 uppercase text-[10px] tracking-wider font-bold"
            >
              PSGQ 8.4 • Aquisição
            </Badge>
            <span className="text-xs text-muted-foreground">• Rev. 03</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 mt-1">
            <Truck className="w-8 h-8 text-primary" /> Suprimentos — Qualificação de Fornecedores
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestão de fornecedores críticos e não críticos, esteira de compras (FSGQ 8.4-5/6/7),
            avaliação bienal e indicadores automáticos integrados à RNC.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ContextualHelpButton />
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-white/10 text-white hover:bg-white/5 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (Princípio de Ouro) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: INCF Geral & por Fornecedor (Consumido do RNC) */}
        <Card className="bg-card border-white/10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Indicador INCF (RNC)
              </span>
              <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-300">
                Meta &lt; 30%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
              {kpis.incfGeneral.toFixed(1)}%
              <span
                className={`text-xs font-normal ${kpis.incfGeneral < 30 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {kpis.incfGeneral < 30 ? 'Dentro do Limite' : 'Acima da Meta'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            <p className="line-clamp-2">
              Consumido automaticamente da Onda E1 RNC. {kpis.suppliersExceedingINCF.length}{' '}
              fornecedor(es) com desvios registrados.
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: % Fornecedores Críticos Qualificados */}
        <Card className="bg-card border-white/10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Críticos Qualificados
              </span>
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-300"
              >
                Meta 100%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
              {kpis.pctCriticalQualified}%
              <span className="text-xs font-normal text-muted-foreground">
                ({kpis.criticalSuppliersQualified}/{kpis.criticalSuppliersTotal})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            <p className="line-clamp-2">
              Critérios PSGQ 8.4: ISO 9001, calibração RBC, normas ASME ou FSGQ 8.4-2.
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: % Cotações com Mínimo 3 Fornecedores */}
        <Card className="bg-card border-white/10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Coleta de Preço (≥3)
              </span>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                Meta ≥ 90%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
              {kpis.pctQuotesWithMinThree}%
              <span className="text-xs font-normal text-muted-foreground">
                ({kpis.quotesWithMinThree}/{kpis.totalQuotes || 1})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            <p className="line-clamp-2">
              FSGQ 8.4-7: Cotações formalizadas com pelo menos 3 propostas concorrentes.
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Atrasos na Entrega */}
        <Card className="bg-card border-white/10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Atrasos de Entrega
              </span>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">
                Meta &lt; 10%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
              {kpis.pctDelayedOrders}%
              <span className="text-xs font-normal text-muted-foreground">
                ({kpis.delayedOrders}/{kpis.totalDeliveredOrders || 0})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            <p className="line-clamp-2">
              FSGQ 8.4-6: Acompanhamento de data prevista versus data de recebimento físico.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Banner de Alerta se houver fornecedores estourando INCF >= 30% */}
      {kpis.suppliersExceedingINCF.some((s) => s.limitExceeded) && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-4 flex items-start gap-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">
              Alerta de Não Conformidade em Fornecedores (INCF ≥ 30% ou Reincidência)
            </h4>
            <p className="text-xs text-rose-200/90">
              Conforme PSGQ 8.4 item 5.4: fornecedores com índice de não conformidade estourado
              devem ser notificados formalmente para abertura de plano de ação. Reincidências sem
              justificativa acarretam desqualificação.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {kpis.suppliersExceedingINCF
                .filter((s) => s.limitExceeded)
                .map((s, idx) => (
                  <Badge key={idx} variant="destructive" className="text-[10px] font-mono">
                    {s.supplierName}: INCF {s.incfRate}% ({s.nonConformityCount} RNCs de Fornecedor)
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-white/10 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger
            value="suppliers"
            className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Truck className="w-3.5 h-3.5" /> Fornecedores ({filteredSuppliers.length})
          </TabsTrigger>
          <TabsTrigger
            value="list-fsgq"
            className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Printer className="w-3.5 h-3.5" /> Lista Qualificados (FSGQ 8.4-4)
          </TabsTrigger>
          <TabsTrigger
            value="purchases"
            className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Esteira de Compras (FSGQ 8.4-7)
          </TabsTrigger>
          <TabsTrigger
            value="evaluations"
            className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Histórico de Avaliações ({evaluations.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Suppliers Directory */}
        <TabsContent value="suppliers" className="space-y-4">
          {/* Filters Bar */}
          <Card className="bg-card border-white/10">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
                    className="pl-9 bg-black/20 border-white/10 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <select
                    value={classificationFilter}
                    onChange={(e) => setClassificationFilter(e.target.value)}
                    className="w-full h-9 rounded-md bg-black/20 border border-white/10 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="all" className="bg-zinc-900 text-white">
                      Todas as Classificações
                    </option>
                    <option value="Crítico" className="bg-zinc-900 text-white">
                      Apenas Críticos
                    </option>
                    <option value="Não Crítico" className="bg-zinc-900 text-white">
                      Apenas Não Críticos
                    </option>
                  </select>
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
                    <option value="Qualificado" className="bg-zinc-900 text-white">
                      Qualificado
                    </option>
                    <option value="Em avaliação" className="bg-zinc-900 text-white">
                      Em avaliação
                    </option>
                    <option value="Em requalificação" className="bg-zinc-900 text-white">
                      Em requalificação
                    </option>
                    <option value="Desqualificado" className="bg-zinc-900 text-white">
                      Desqualificado
                    </option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card className="bg-card border-white/10">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" /> Cadastro de Fornecedores Homologados
              </CardTitle>
              <span className="text-xs text-muted-foreground">PSGQ 8.4 Itens 5.1 a 5.4</span>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Carregando fornecedores...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Truck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-white text-sm font-medium">Nenhum fornecedor encontrado</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Cadastre os fornecedores críticos e não críticos para compor a lista mestra do
                    SGQ.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenCreate}
                    className="bg-primary hover:bg-primary/90 text-white text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Cadastrar Primeiro Fornecedor
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 bg-white/5">
                        <TableHead className="text-xs text-white/70">
                          Razão Social / Fantasia
                        </TableHead>
                        <TableHead className="text-xs text-white/70">CNPJ & Contato</TableHead>
                        <TableHead className="text-xs text-white/70">Classificação</TableHead>
                        <TableHead className="text-xs text-white/70">
                          Critérios / ISO 9001
                        </TableHead>
                        <TableHead className="text-xs text-white/70">Status Qualificação</TableHead>
                        <TableHead className="text-xs text-white/70">
                          Próx. Reavaliação (2 Anos)
                        </TableHead>
                        <TableHead className="text-xs text-white/70 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((sup) => {
                        const incfItem = kpis.suppliersExceedingINCF.find(
                          (i) => i.supplierName.toLowerCase() === sup.name.toLowerCase(),
                        )

                        return (
                          <TableRow key={sup.id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="text-xs py-3 font-medium text-white">
                              <div>{sup.name}</div>
                              {sup.trade_name && (
                                <div className="text-[11px] text-muted-foreground">
                                  {sup.trade_name}
                                </div>
                              )}
                              {sup.critical_categories && sup.critical_categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sup.critical_categories.slice(0, 2).map((c, i) => (
                                    <span
                                      key={i}
                                      className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-muted-foreground"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                  {sup.critical_categories.length > 2 && (
                                    <span className="text-[9px] text-muted-foreground">
                                      +{sup.critical_categories.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-xs py-3 font-mono">
                              <div className="text-muted-foreground">{sup.cnpj || '—'}</div>
                              <div className="text-[11px] text-white/80">
                                {sup.contact_person || sup.phone || sup.email || '—'}
                              </div>
                              {incfItem && incfItem.limitExceeded && (
                                <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" /> INCF{' '}
                                  {incfItem.incfRate}% (Alerta)
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-xs py-3">
                              <Badge
                                className={`text-[10px] font-bold ${
                                  sup.classification === 'Crítico'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {sup.classification}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-xs py-3">
                              {sup.iso9001_certified ? (
                                <div className="space-y-0.5">
                                  <div className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <Award className="w-3.5 h-3.5 text-emerald-400" /> ISO 9001:{' '}
                                    {sup.iso9001_cert_number || 'Válida'}
                                  </div>
                                  {sup.iso9001_valid_until && (
                                    <div className="text-[10px] text-muted-foreground">
                                      Até{' '}
                                      {new Date(sup.iso9001_valid_until).toLocaleDateString(
                                        'pt-BR',
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-[11px]">
                                  {sup.qualification_criteria &&
                                  sup.qualification_criteria.length > 0
                                    ? sup.qualification_criteria[0]
                                    : 'A definir'}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-xs py-3">
                              <Badge
                                className={`text-[10px] ${
                                  sup.qualification_status === 'Qualificado'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : sup.qualification_status === 'Em avaliação'
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                      : sup.qualification_status === 'Em requalificação'
                                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {sup.qualification_status}
                              </Badge>
                              {sup.evaluation_score !== undefined && (
                                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                  Nota: {sup.evaluation_score.toFixed(1)} / 10
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-xs py-3 font-mono">
                              {sup.reevaluation_exempt ? (
                                <div
                                  className="text-sky-300 text-[10px] font-medium"
                                  title={sup.reevaluation_exempt_reason}
                                >
                                  Dispensado (ISO 9001)
                                </div>
                              ) : sup.next_reevaluation_date ? (
                                <div className="text-muted-foreground">
                                  {new Date(sup.next_reevaluation_date).toLocaleDateString('pt-BR')}
                                </div>
                              ) : (
                                '—'
                              )}
                            </TableCell>

                            <TableCell className="text-right py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botão Avaliar FSGQ 8.4-2 */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEvaluation(sup, 'Inicial (FSGQ 8.4-2)')}
                                  className="h-7 text-xs border-white/10 hover:bg-white/10 text-white"
                                  title="Aplicar Questionário de Qualificação FSGQ 8.4-2"
                                >
                                  <ClipboardList className="w-3.5 h-3.5 mr-1" /> Avaliar
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenEdit(sup)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(sup.id)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                                  title="Excluir"
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
        </TabsContent>

        {/* TAB 2: Printable Qualified List (FSGQ 8.4-4) */}
        <TabsContent value="list-fsgq">
          <QualifiedSuppliersListPrint
            suppliers={suppliers}
            companyName={currentCompany?.name || 'PSC Engenharia & Montagens'}
            companyLogo={currentCompany?.logo}
          />
        </TabsContent>

        {/* TAB 3: Purchasing Pipeline (FSGQ 8.4-5 / 8.4-6 / 8.4-7) */}
        <TabsContent value="purchases">
          <PurchasePipelineTab
            quotes={quotes}
            suppliers={suppliers}
            companyId={currentCompany?.id || 'a631bv695rr4gef'}
            onRefresh={loadData}
            loading={loading}
          />
        </TabsContent>

        {/* TAB 4: Evaluations History (FSGQ 8.4-2 & 8.4-2.1) */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card className="bg-card border-white/10">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base text-white font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> Histórico de Questionários de
                Avaliação & Reavaliação Bienal
              </CardTitle>
              <span className="text-xs text-muted-foreground">FSGQ 8.4-2 / FSGQ 8.4-2.1</span>
            </CardHeader>
            <CardContent className="p-0">
              {evaluations.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-white text-sm font-medium">
                    Nenhum questionário aplicado ainda
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Aplique o formulário digital FSGQ 8.4-2 na aba "Fornecedores" para qualificar
                    novos parceiros.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 bg-white/5">
                        <TableHead className="text-xs text-white/70">Data</TableHead>
                        <TableHead className="text-xs text-white/70">Fornecedor</TableHead>
                        <TableHead className="text-xs text-white/70">Tipo de Avaliação</TableHead>
                        <TableHead className="text-xs text-white/70">Avaliador</TableHead>
                        <TableHead className="text-xs text-white/70 text-center">
                          Nota Final
                        </TableHead>
                        <TableHead className="text-xs text-white/70">Resultado</TableHead>
                        <TableHead className="text-xs text-white/70">Próx. Reavaliação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluations.map((ev) => (
                        <TableRow key={ev.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="text-xs py-3 font-mono text-muted-foreground">
                            {new Date(ev.evaluation_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-xs py-3 font-medium text-white">
                            {ev.expand?.supplier_id?.name || 'Fornecedor'}
                          </TableCell>
                          <TableCell className="text-xs py-3">
                            <Badge
                              variant="outline"
                              className="text-[10px] border-primary/30 text-primary"
                            >
                              {ev.evaluation_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs py-3 text-muted-foreground">
                            {ev.evaluator_name}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-center font-mono font-bold text-white">
                            {ev.total_score.toFixed(1)} / 10.0
                          </TableCell>
                          <TableCell className="text-xs py-3">
                            <Badge
                              className={`text-[10px] ${
                                ev.result.includes('Aprovado')
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {ev.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs py-3 font-mono text-muted-foreground">
                            {ev.next_reevaluation_date
                              ? new Date(ev.next_reevaluation_date).toLocaleDateString('pt-BR')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: Create / Edit Supplier */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-white/10 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor (PSGQ 8.4)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre fornecedores críticos ou não críticos conforme requisitos do procedimento de
              Aquisição.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSupplier} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/80">Razão Social *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gerdau Aços Longos S.A."
                  required
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">Nome Fantasia</Label>
                <Input
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: Gerdau Aços Especiais"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-white/80">CNPJ</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="bg-black/40 border-white/10 text-white text-xs h-8 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">Pessoa de Contato</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Nome do contato comercial/técnico"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 0000-0000"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/80">E-mail Comercial/Técnico</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-xs text-white/80">Endereço / Cidade / UF</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número - Cidade/UF"
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>

            {/* Classificação: Crítico vs Não Crítico */}
            <div className="p-3 bg-black/20 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-white font-bold uppercase tracking-wider">
                    Classificação do Fornecedor (PSGQ 8.4 item 5.1) *
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Insumos/serviços que afetam diretamente a conformidade e qualidade final do
                    produto são Críticos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClassification('Crítico')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      classification === 'Crítico'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-black/40 text-muted-foreground hover:text-white'
                    }`}
                  >
                    Crítico
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassification('Não Crítico')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      classification === 'Não Crítico'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-black/40 text-muted-foreground hover:text-white'
                    }`}
                  >
                    Não Crítico
                  </button>
                </div>
              </div>

              {/* Categorias Críticas (item 5.3) */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] text-muted-foreground">
                  Materiais e Serviços Fornecidos (Selecione as categorias do PSGQ 8.4):
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {CRITICAL_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-left text-[11px] p-2 rounded border transition-all ${
                          isSelected
                            ? 'bg-primary/20 text-white border-primary/50 font-medium'
                            : 'bg-black/30 text-muted-foreground border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        />
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">
                  Descrição Livre do Escopo
                </Label>
                <Textarea
                  value={materialsDescription}
                  onChange={(e) => setMaterialsDescription(e.target.value)}
                  placeholder="Ex: Fornecimento de chapas de aço ASTM A36 / SA-516 Gr 70 com certificado de usina..."
                  className="bg-black/30 border-white/5 text-xs text-white min-h-[50px] mt-1"
                />
              </div>
            </div>

            {/* Qualificação Automática: ISO 9001 (PSGQ 8.4 item 5.3 a) */}
            <div className="p-3 bg-black/20 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Qualificação Automática — ISO 9001 (item 5.3 a)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Fornecedor possui certificação ISO 9001 válida? Garante qualificação e dispensa
                    de reavaliação.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isoCertified}
                    onChange={(e) => {
                      setIsoCertified(e.target.checked)
                      if (e.target.checked) {
                        setQualificationStatus('Qualificado')
                        if (!qualificationCriteria.includes('ISO 9001 válida')) {
                          setQualificationCriteria([...qualificationCriteria, 'ISO 9001 válida'])
                        }
                      }
                    }}
                    className="w-4 h-4 text-primary accent-primary rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">Possui ISO 9001</span>
                </label>
              </div>

              {isoCertified && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
                  <div>
                    <Label className="text-[11px] text-white/80">Nº do Certificado *</Label>
                    <Input
                      value={isoCertNumber}
                      onChange={(e) => setIsoCertNumber(e.target.value)}
                      placeholder="Ex: BR038921-2024 (Bureau Veritas)"
                      required={isoCertified}
                      className="bg-black/40 border-white/10 text-white text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-white/80">
                      Data de Validade do Certificado *
                    </Label>
                    <Input
                      type="date"
                      value={isoValidUntil}
                      onChange={(e) => setIsoValidUntil(e.target.value)}
                      required={isoCertified}
                      className="bg-black/40 border-white/10 text-white text-xs h-7"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Outros Critérios de Qualificação (item 5.3 b, c, d) */}
            <div className="space-y-2">
              <Label className="text-xs text-white/80">
                Outros Critérios de Qualificação Atendidos:
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Certificados do serviço/material (RBC/ASME)',
                  'Histórico satisfatório de fornecimento',
                  'Questionário FSGQ 8.4-2 (Nota ≥ 6,0)',
                  'Dispensa / Não Crítico',
                ].map((crit) => {
                  const isChecked = qualificationCriteria.includes(crit as any)
                  return (
                    <label
                      key={crit}
                      className="flex items-center gap-2 p-2 rounded bg-black/20 border border-white/5 text-xs text-muted-foreground cursor-pointer hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCriterion(crit as any)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span>{crit}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/80">Status de Qualificação</Label>
                <select
                  value={qualificationStatus}
                  onChange={(e) => setQualificationStatus(e.target.value as any)}
                  className="w-full h-8 rounded-md bg-black/40 border border-white/10 px-3 text-xs text-white"
                >
                  <option value="Em avaliação" className="bg-zinc-900 text-white">
                    Em avaliação
                  </option>
                  <option value="Qualificado" className="bg-zinc-900 text-white">
                    Qualificado
                  </option>
                  <option value="Em requalificação" className="bg-zinc-900 text-white">
                    Em requalificação
                  </option>
                  <option value="Desqualificado" className="bg-zinc-900 text-white">
                    Desqualificado
                  </option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-white/80">Observações de Qualificação</Label>
                <Input
                  value={qualificationNotes}
                  onChange={(e) => setQualificationNotes(e.target.value)}
                  placeholder="Notas adicionais sobre a homologação..."
                  className="bg-black/40 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSupplierDialogOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Digital Questionnaire FSGQ 8.4-2 & 8.4-2.1 */}
      <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {evaluationType.includes('Inicial')
                ? 'FSGQ 8.4-2 — QUESTIONÁRIO DE AVALIAÇÃO DE FORNECEDORES'
                : 'FSGQ 8.4-2.1 — REAVALIAÇÃO BIENAL DE FORNECEDORES'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Procedimento Geral PSGQ 8.4 Aquisição (Rev. 03). Preencha o questionário com pontuação
              2, 1 ou 0.
            </DialogDescription>
          </DialogHeader>

          {evaluatingSupplier && (
            <SupplierEvaluationForm
              evaluationType={evaluationType}
              supplierName={evaluatingSupplier.name}
              supplierId={evaluatingSupplier.id}
              initialQuestions={
                evaluationType.includes('Inicial')
                  ? INITIAL_EVALUATION_QUESTIONS
                  : REEVALUATION_QUESTIONS
              }
              incfCurrent={
                kpis.suppliersExceedingINCF.find(
                  (i) => i.supplierName.toLowerCase() === evaluatingSupplier.name.toLowerCase(),
                )?.incfRate
              }
              onSave={handleSaveEvaluationForm}
              onCancel={() => setIsEvaluationDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
