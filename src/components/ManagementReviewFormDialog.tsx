import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Presentation,
  CheckCircle2,
  Paperclip,
  Upload,
  UserCheck,
  ListPlus,
  FileText,
  DollarSign,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react'
import {
  ManagementReview,
  ReviewParticipant,
  ReviewActionItem,
  ReviewStatus,
  consolidateSGQData,
  ConsolidatedSGQSnapshot,
} from '@/services/management-review'
import { Company } from '@/services/companies'
import { User } from '@/services/api'
import pb from '@/lib/pocketbase/client'

interface ManagementReviewFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  review?: ManagementReview | null
  companies: Company[]
  users: User[]
  selectedCompanyId?: string
  currentYear: number
  onSave: (data: Partial<ManagementReview>, file?: File) => Promise<void>
}

export function ManagementReviewFormDialog({
  open,
  onOpenChange,
  review,
  companies,
  users,
  selectedCompanyId,
  currentYear,
  onSave,
}: ManagementReviewFormDialogProps) {
  const [saving, setSaving] = useState(false)
  const [consolidating, setConsolidating] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'inputs' | 'outputs' | 'actions' | 'minutes'>(
    'info',
  )

  // Basic info
  const [companyId, setCompanyId] = useState('')
  const [year, setYear] = useState<number>(currentYear)
  const [meetingDate, setMeetingDate] = useState('')
  const [status, setStatus] = useState<ReviewStatus>('Em preparação')

  // Participants
  const [participants, setParticipants] = useState<ReviewParticipant[]>([])
  const [newPartName, setNewPartName] = useState('')
  const [newPartRole, setNewPartRole] = useState('')

  // §9.3 Entradas
  const [inputPrevActions, setInputPrevActions] = useState('')
  const [inputContextChanges, setInputContextChanges] = useState('')
  const [inputCustomerSat, setInputCustomerSat] = useState('')
  const [inputQualityObj, setInputQualityObj] = useState('')
  const [inputProcessPerf, setInputProcessPerf] = useState('')
  const [inputNonconfCorr, setInputNonconfCorr] = useState('')
  const [inputMonitoringMeas, setInputMonitoringMeas] = useState('')
  const [inputAuditResults, setInputAuditResults] = useState('')
  const [inputSupplierPerf, setInputSupplierPerf] = useState('')
  const [inputResourcesAdequacy, setInputResourcesAdequacy] = useState('')
  const [inputRisksOpp, setInputRisksOpp] = useState('')
  const [inputImprovementOpp, setInputImprovementOpp] = useState('')

  // Snapshot
  const [snapshot, setSnapshot] = useState<ConsolidatedSGQSnapshot | null>(null)

  // §9.3 Saídas
  const [outputDecisions, setOutputDecisions] = useState('')
  const [outputQmsChanges, setOutputQmsChanges] = useState('')
  const [outputResourceNeeds, setOutputResourceNeeds] = useState('')

  // Minutes & file
  const [minutes, setMinutes] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

  // Actions
  const [actions, setActions] = useState<ReviewActionItem[]>([])
  const [newActionDesc, setNewActionDesc] = useState('')
  const [newActionResp, setNewActionResp] = useState('')
  const [newActionDeadline, setNewActionDeadline] = useState('')

  useEffect(() => {
    if (review) {
      setCompanyId(review.company_id || '')
      setYear(review.year || currentYear)
      setMeetingDate(review.meeting_date ? review.meeting_date.split('T')[0] : '')
      setStatus(review.status || 'Em preparação')

      // Participants
      if (review.participants) {
        if (Array.isArray(review.participants)) setParticipants(review.participants)
        else {
          try {
            setParticipants(JSON.parse(review.participants))
          } catch {
            setParticipants([])
          }
        }
      } else {
        setParticipants([])
      }

      // Inputs
      setInputPrevActions(review.input_previous_actions || '')
      setInputContextChanges(review.input_context_changes || '')
      setInputCustomerSat(review.input_customer_satisfaction || '')
      setInputQualityObj(review.input_quality_objectives || '')
      setInputProcessPerf(review.input_process_performance || '')
      setInputNonconfCorr(review.input_nonconformities_corrective || '')
      setInputMonitoringMeas(review.input_monitoring_measurement || '')
      setInputAuditResults(review.input_audit_results || '')
      setInputSupplierPerf(review.input_supplier_performance || '')
      setInputResourcesAdequacy(review.input_resources_adequacy || '')
      setInputRisksOpp(review.input_risks_opportunities || '')
      setInputImprovementOpp(review.input_improvement_opportunities || '')

      // Snapshot
      if (review.consolidated_data_snapshot) {
        if (typeof review.consolidated_data_snapshot === 'object') {
          setSnapshot(review.consolidated_data_snapshot as ConsolidatedSGQSnapshot)
        } else {
          try {
            setSnapshot(JSON.parse(review.consolidated_data_snapshot))
          } catch {
            setSnapshot(null)
          }
        }
      } else {
        setSnapshot(null)
      }

      // Outputs
      setOutputDecisions(review.output_improvement_decisions || '')
      setOutputQmsChanges(review.output_qms_changes || '')
      setOutputResourceNeeds(review.output_resource_needs || '')

      // Minutes
      setMinutes(review.minutes || '')
      setAttachmentFile(null)

      // Actions
      if (review.actions) {
        if (Array.isArray(review.actions)) setActions(review.actions)
        else {
          try {
            setActions(JSON.parse(review.actions))
          } catch {
            setActions([])
          }
        }
      } else {
        setActions([])
      }
    } else {
      const defaultComp =
        selectedCompanyId && selectedCompanyId !== 'all'
          ? selectedCompanyId
          : companies[0]?.id || ''
      setCompanyId(defaultComp)
      setYear(currentYear)
      setMeetingDate(new Date().toISOString().split('T')[0])
      setStatus('Em preparação')

      // Pre-fill default management roles as participants
      setParticipants([
        { name: 'Diretoria Executiva', role: 'Direção Geral', present: true },
        { name: 'Gestor da Qualidade', role: 'Representante da Direção (RD/GQ)', present: true },
        { name: 'Coordenação de CQ', role: 'Controle da Qualidade', present: true },
        { name: 'Supervisão de Produção', role: 'Operações / Fábrica', present: true },
      ])

      setInputPrevActions('')
      setInputContextChanges('')
      setInputCustomerSat('')
      setInputQualityObj('')
      setInputProcessPerf('')
      setInputNonconfCorr('')
      setInputMonitoringMeas('')
      setInputAuditResults('')
      setInputSupplierPerf('')
      setInputResourcesAdequacy('')
      setInputRisksOpp('')
      setInputImprovementOpp('')
      setSnapshot(null)
      setOutputDecisions('')
      setOutputQmsChanges('')
      setOutputResourceNeeds('')
      setMinutes('')
      setAttachmentFile(null)
      setActions([])
    }
  }, [review, open, selectedCompanyId, companies, currentYear])

  // Consolidated auto pre-fill
  const handleAutoConsolidate = async () => {
    try {
      setConsolidating(true)
      const res = await consolidateSGQData({
        year: Number(year),
        companyId: companyId !== 'all' ? companyId : undefined,
      })

      setSnapshot(res.snapshot)

      // Pre-fill empty or ask to overwrite
      setInputPrevActions(res.suggestedInputs.input_previous_actions || inputPrevActions)
      setInputContextChanges(res.suggestedInputs.input_context_changes || inputContextChanges)
      setInputCustomerSat(res.suggestedInputs.input_customer_satisfaction || inputCustomerSat)
      setInputQualityObj(res.suggestedInputs.input_quality_objectives || inputQualityObj)
      setInputProcessPerf(res.suggestedInputs.input_process_performance || inputProcessPerf)
      setInputNonconfCorr(res.suggestedInputs.input_nonconformities_corrective || inputNonconfCorr)
      setInputMonitoringMeas(
        res.suggestedInputs.input_monitoring_measurement || inputMonitoringMeas,
      )
      setInputAuditResults(res.suggestedInputs.input_audit_results || inputAuditResults)
      setInputSupplierPerf(res.suggestedInputs.input_supplier_performance || inputSupplierPerf)
      setInputResourcesAdequacy(
        res.suggestedInputs.input_resources_adequacy || inputResourcesAdequacy,
      )
      setInputRisksOpp(res.suggestedInputs.input_risks_opportunities || inputRisksOpp)
      setInputImprovementOpp(
        res.suggestedInputs.input_improvement_opportunities || inputImprovementOpp,
      )

      alert('Dados consolidados do SGQ pré-preenchidos com sucesso a partir dos módulos reais!')
      setActiveTab('inputs')
    } catch (err: any) {
      console.error('Consolidation error:', err)
      alert('Erro ao consolidar dados reais: ' + (err.message || 'Verifique conexão.'))
    } finally {
      setConsolidating(false)
    }
  }

  const handleAddParticipant = () => {
    if (!newPartName.trim()) return
    setParticipants([
      ...participants,
      {
        name: newPartName.trim(),
        role: newPartRole.trim() || 'Participante',
        present: true,
      },
    ])
    setNewPartName('')
    setNewPartRole('')
  }

  const handleRemoveParticipant = (idx: number) => {
    setParticipants(participants.filter((_, i) => i !== idx))
  }

  const handleToggleParticipantPresence = (idx: number) => {
    setParticipants(participants.map((p, i) => (i === idx ? { ...p, present: !p.present } : p)))
  }

  const handleAddAction = () => {
    if (!newActionDesc.trim()) return
    const item: ReviewActionItem = {
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      description: newActionDesc.trim(),
      responsible: newActionResp.trim(),
      deadline: newActionDeadline,
      status: 'Aberta',
    }
    setActions([...actions, item])
    setNewActionDesc('')
    setNewActionResp('')
    setNewActionDeadline('')
  }

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id))
  }

  const handleUpdateActionStatus = (
    id: string,
    st: 'Aberta' | 'Em andamento' | 'Concluída' | 'Cancelada',
  ) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, status: st } : a)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !meetingDate) {
      alert('Preencha os campos obrigatórios: Empresa e Data da Reunião.')
      return
    }

    try {
      setSaving(true)
      const payload: Partial<ManagementReview> = {
        company_id: companyId,
        year: Number(year),
        meeting_date: meetingDate,
        status,
        participants,
        input_previous_actions: inputPrevActions || null,
        input_context_changes: inputContextChanges || null,
        input_customer_satisfaction: inputCustomerSat || null,
        input_quality_objectives: inputQualityObj || null,
        input_process_performance: inputProcessPerf || null,
        input_nonconformities_corrective: inputNonconfCorr || null,
        input_monitoring_measurement: inputMonitoringMeas || null,
        input_audit_results: inputAuditResults || null,
        input_supplier_performance: inputSupplierPerf || null,
        input_resources_adequacy: inputResourcesAdequacy || null,
        input_risks_opportunities: inputRisksOpp || null,
        input_improvement_opportunities: inputImprovementOpp || null,
        consolidated_data_snapshot: snapshot,
        output_improvement_decisions: outputDecisions || null,
        output_qms_changes: outputQmsChanges || null,
        output_resource_needs: outputResourceNeeds || null,
        minutes: minutes || null,
        actions,
      }

      await onSave(payload, attachmentFile || undefined)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error saving review:', err)
      alert('Erro ao salvar Revisão pela Direção: ' + (err.message || 'Verifique os dados.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Presentation className="w-5 h-5 text-primary" />
              {review
                ? `Revisão pela Direção — Ano ${review.year}`
                : 'Nova Revisão pela Direção (ISO 9001 §9.3)'}
            </DialogTitle>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAutoConsolidate}
              disabled={consolidating}
              className="gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 h-7"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {consolidating ? 'Consolidando dados reais...' : 'Consolidação Automática (§9.3)'}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tabs navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-muted/60 p-1 flex-wrap h-auto">
              <TabsTrigger value="info" className="text-xs">
                1. Reunião & Participantes
              </TabsTrigger>
              <TabsTrigger value="inputs" className="text-xs">
                2. Entradas (§9.3)
              </TabsTrigger>
              <TabsTrigger value="outputs" className="text-xs">
                3. Saídas (§9.3)
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                4. Ações Decorrentes ({actions.length})
              </TabsTrigger>
              <TabsTrigger value="minutes" className="text-xs">
                5. Ata & Anexo
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BASIC INFO & PARTICIPANTS */}
            <TabsContent value="info" className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Empresa *</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Ano-Base *</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="h-8 text-xs mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Data da Reunião *</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="h-8 text-xs mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Status da Revisão</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ReviewStatus)}>
                  <SelectTrigger className="h-8 text-xs mt-1 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em preparação">Em preparação</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participants Section */}
              <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Participantes da Reunião (Direção, GQ, Supervisão)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {participants.length} participantes
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {participants.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-background border rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.present}
                          onChange={() => handleToggleParticipantPresence(idx)}
                          className="h-4 w-4 rounded"
                        />
                        <span className="font-medium text-foreground">{p.name}</span>
                        <span className="text-[11px] text-muted-foreground">({p.role})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-500 hover:text-rose-700"
                        onClick={() => handleRemoveParticipant(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t">
                  <div className="sm:col-span-6">
                    <Input
                      placeholder="Nome do participante..."
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Input
                      placeholder="Cargo / Área (ex. Diretor Industrial, Gestor GQ)..."
                      value={newPartRole}
                      onChange={(e) => setNewPartRole(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 w-full px-2 text-xs"
                      onClick={handleAddParticipant}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ENTRADAS §9.3 */}
            <TabsContent value="inputs" className="space-y-4 pt-2">
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  As 12 entradas oficiais do §9.3 da ISO 9001 são pré-preenchidas com dados reais de
                  RNCs, auditorias, riscos, treinamentos e indicadores. Você pode editar qualquer
                  item.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoConsolidate}
                  className="h-6 text-[10px] px-2 shrink-0 ml-2"
                >
                  Recarregar Dados Reais
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">
                    a) Situação das ações de revisões anteriores pela direção
                  </Label>
                  <Textarea
                    value={inputPrevActions}
                    onChange={(e) => setInputPrevActions(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    b) Mudanças no contexto interno/externo (§4.1) e partes interessadas (§4.2)
                  </Label>
                  <Textarea
                    value={inputContextChanges}
                    onChange={(e) => setInputContextChanges(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.1) Satisfação dos clientes e feedback de partes interessadas
                  </Label>
                  <Textarea
                    value={inputCustomerSat}
                    onChange={(e) => setInputCustomerSat(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.2) Grau de atendimento dos objetivos da qualidade (§6.2)
                  </Label>
                  <Textarea
                    value={inputQualityObj}
                    onChange={(e) => setInputQualityObj(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.3) Desempenho de processos e conformidade de produtos e serviços
                  </Label>
                  <Textarea
                    value={inputProcessPerf}
                    onChange={(e) => setInputProcessPerf(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.4) Não conformidades, ações corretivas e Custo da Não Qualidade (CNQ)
                  </Label>
                  <Textarea
                    value={inputNonconfCorr}
                    onChange={(e) => setInputNonconfCorr(e.target.value)}
                    className="text-xs mt-1 min-h-[70px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.5) Resultados de monitoramento e medição
                  </Label>
                  <Textarea
                    value={inputMonitoringMeas}
                    onChange={(e) => setInputMonitoringMeas(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.6) Resultados de auditorias internas e externas (§9.2)
                  </Label>
                  <Textarea
                    value={inputAuditResults}
                    onChange={(e) => setInputAuditResults(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    c.7) Desempenho de provedores externos / fornecedores (§8.4)
                  </Label>
                  <Textarea
                    value={inputSupplierPerf}
                    onChange={(e) => setInputSupplierPerf(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">d) Adequação dos recursos (§7.1)</Label>
                  <Textarea
                    value={inputResourcesAdequacy}
                    onChange={(e) => setInputResourcesAdequacy(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    e) Eficácia de ações tomadas para abordar riscos e oportunidades (§6.1)
                  </Label>
                  <Textarea
                    value={inputRisksOpp}
                    onChange={(e) => setInputRisksOpp(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    f) Oportunidades de melhoria contínua (§10)
                  </Label>
                  <Textarea
                    value={inputImprovementOpp}
                    onChange={(e) => setInputImprovementOpp(e.target.value)}
                    className="text-xs mt-1 min-h-[60px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SAÍDAS §9.3 */}
            <TabsContent value="outputs" className="space-y-4 pt-2">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">
                    1. Decisões e ações relacionadas a oportunidades de melhoria
                  </Label>
                  <Textarea
                    placeholder="Decisões tomadas pela alta direção sobre projetos de melhoria contínua..."
                    value={outputDecisions}
                    onChange={(e) => setOutputDecisions(e.target.value)}
                    className="text-xs mt-1 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    2. Qualquer necessidade de mudanças no Sistema de Gestão da Qualidade (SGQ)
                  </Label>
                  <Textarea
                    placeholder="Alterações na política da qualidade, revisão de procedimentos, organograma..."
                    value={outputQmsChanges}
                    onChange={(e) => setOutputQmsChanges(e.target.value)}
                    className="text-xs mt-1 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    3. Necessidades de recursos (investimentos, maquinários, pessoas, capacitações)
                  </Label>
                  <Textarea
                    placeholder="Aprovação de verbas, contratação de pessoal, aquisição de equipamentos de solda/calibração..."
                    value={outputResourceNeeds}
                    onChange={(e) => setOutputResourceNeeds(e.target.value)}
                    className="text-xs mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: AÇÕES DECORRENTES */}
            <TabsContent value="actions" className="space-y-4 pt-2">
              <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <ListPlus className="w-4 h-4 text-primary" />
                    Plano de Ações Deliberadas pela Direção
                  </span>
                  <span className="text-[11px] text-muted-foreground">{actions.length} ações</span>
                </div>

                {actions.length > 0 && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {actions.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between gap-2 p-2 bg-background border rounded text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{act.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                            <span>Resp: {act.responsible || '—'}</span>
                            <span>Prazo: {act.deadline || '—'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Select
                            value={act.status}
                            onValueChange={(v) => handleUpdateActionStatus(act.id, v as any)}
                          >
                            <SelectTrigger className="h-6 w-28 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Aberta">Aberta</SelectItem>
                              <SelectItem value="Em andamento">Em andamento</SelectItem>
                              <SelectItem value="Concluída">Concluída</SelectItem>
                              <SelectItem value="Cancelada">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-rose-500 hover:text-rose-700"
                            onClick={() => handleRemoveAction(act.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t">
                  <div className="sm:col-span-6">
                    <Input
                      placeholder="Descrição da ação deliberada..."
                      value={newActionDesc}
                      onChange={(e) => setNewActionDesc(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Responsável..."
                      value={newActionResp}
                      onChange={(e) => setNewActionResp(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="date"
                      value={newActionDeadline}
                      onChange={(e) => setNewActionDeadline(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 w-full px-2 text-xs"
                      onClick={handleAddAction}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: ATA E ANEXO */}
            <TabsContent value="minutes" className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-semibold">
                  Ata Formal da Reunião (Texto Estruturado)
                </Label>
                <Textarea
                  placeholder="Texto completo ou resumo executivo da ata da reunião de análise crítica pela direção..."
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="text-xs mt-1 min-h-[140px]"
                />
              </div>

              <div className="p-3 border rounded-lg bg-muted/10 space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-primary" />
                  Upload da Ata Assinada (PDF / Imagem opcional)
                </Label>
                <Input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="h-8 text-xs file:text-xs file:h-full"
                />
                {review?.attachment && (
                  <p className="text-[11px] text-muted-foreground">
                    Arquivo atual salvo no servidor:{' '}
                    <a
                      href={pb.files.getURL(review, review.attachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline font-medium"
                    >
                      Visualizar anexo atual
                    </a>
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="text-xs h-8">
              {saving ? 'Salvando...' : 'Salvar Revisão pela Direção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
