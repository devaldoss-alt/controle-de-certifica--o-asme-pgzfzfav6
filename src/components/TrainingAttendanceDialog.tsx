import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { getTeamMembers, type TeamMember } from '@/services/team'
import {
  saveAttendanceListFull,
  saveEffectivenessEvaluations,
  getAttendanceLists,
  getAttendanceListById,
  type TrainingAttendanceList,
  type TrainingParticipant,
  type TrainingEffectivenessEvaluation,
  type AttendanceListStatus,
  type ParticipantPresence,
  type EffectivenessResponse,
} from '@/services/training-attendance'
import { type TrainingPlanActionComputed } from '@/services/trainings'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  FileSignature,
  Plus,
  Trash2,
  CalendarDays,
  Award,
  Sparkles,
  Info,
  Building,
  HelpCircle,
  FileText,
  Search,
} from 'lucide-react'

interface ParticipantRowState {
  id?: string
  team_member?: string | null
  nome: string
  presenca: ParticipantPresence
  nota?: number | string
  aprovado?: boolean
  assinatura?: string
  department?: string
  role?: string
}

interface EvaluationRowState {
  id?: string
  participantId: string
  participantNome: string
  resposta: EffectivenessResponse
  comentario: string
  nome_avaliador: string
  data_avaliacao: string
  avaliadorId?: string
}

interface TrainingAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: TrainingPlanActionComputed | null
  companyId: string
  onSuccess: () => void
}

export function TrainingAttendanceDialog({
  open,
  onOpenChange,
  action,
  companyId,
  onSuccess,
}: TrainingAttendanceDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'attendance' | 'effectiveness'>('attendance')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Current list record if loaded
  const [existingList, setExistingList] = useState<TrainingAttendanceList | null>(null)

  // Header form fields
  const [tema, setTema] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [dataRealizacao, setDataRealizacao] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState<number | string>('')
  const [local, setLocal] = useState('')
  const [instrutor, setInstrutor] = useState('')
  const [status, setStatus] = useState<AttendanceListStatus>('realizada')
  const [programarNaAgenda, setProgramarNaAgenda] = useState(true)

  // Participants & Team
  const [participants, setParticipants] = useState<ParticipantRowState[]>([])
  const [teamList, setTeamList] = useState<TeamMember[]>([])
  const [teamSearch, setTeamSearch] = useState('')
  const [manualName, setManualName] = useState('')
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false)

  // Effectiveness evaluations (up to 5 per participant)
  const [evaluations, setEvaluations] = useState<EvaluationRowState[]>([])
  const [evalFilterParticipant, setEvalFilterParticipant] = useState<string>('all')

  // Load team members for this company
  useEffect(() => {
    if (!open || !companyId) return
    getTeamMembers({ companyId })
      .then((members) => setTeamList(members))
      .catch((e) => console.error('Failed to load team:', e))
  }, [open, companyId])

  // Initialize or fetch attendance list for this action
  useEffect(() => {
    if (!open || !action) return

    const initData = async () => {
      setLoading(true)
      try {
        const lists = await getAttendanceLists({ actionId: action.id, companyId })
        if (lists.length > 0) {
          const full = await getAttendanceListById(lists[0].id)
          if (full) {
            setExistingList(full.list)
            setTema(full.list.tema || action.action)
            setConteudo(full.list.conteudo_programatico || '')
            setDataRealizacao(
              full.list.data_realizacao
                ? full.list.data_realizacao.split('T')[0]
                : action.realized_date
                  ? action.realized_date.split('T')[0]
                  : new Date().toISOString().split('T')[0],
            )
            setCargaHoraria(
              full.list.carga_horaria !== undefined && full.list.carga_horaria !== null
                ? full.list.carga_horaria
                : action.ch_hours || '',
            )
            setLocal(full.list.local || 'Sala de Treinamento')
            setInstrutor(full.list.instrutor_instituicao || action.responsible || '')
            setStatus(full.list.status || 'realizada')
            setProgramarNaAgenda(full.list.programar_na_agenda ?? true)

            // Participants
            setParticipants(
              full.participants.map((p) => ({
                id: p.id,
                team_member: p.team_member,
                nome: p.nome,
                presenca: p.presenca,
                nota: p.nota ?? '',
                aprovado: p.aprovado ?? true,
                assinatura: p.assinatura || '',
                department: p.expand?.team_member?.department,
                role: p.expand?.team_member?.role,
              })),
            )

            // Evaluations
            setEvaluations(
              full.evaluations.map((ev) => ({
                id: ev.id,
                participantId: ev.participant,
                participantNome:
                  full.participants.find((p) => p.id === ev.participant)?.nome ||
                  ev.expand?.participant?.nome ||
                  'Participante',
                resposta: ev.resposta,
                comentario: ev.comentario || '',
                nome_avaliador: ev.nome_avaliador,
                data_avaliacao: ev.data_avaliacao ? ev.data_avaliacao.split('T')[0] : '',
                avaliadorId: ev.avaliador || undefined,
              })),
            )

            if (
              full.list.status === 'aguardando_avaliacao_eficacia' ||
              full.list.status === 'avaliacao_concluida'
            ) {
              // Stay on attendance or let user switch
            }
          }
        } else {
          // Fresh form seeded from the action
          setExistingList(null)
          setTema(action.action)
          setConteudo(action.notes || `Treinamento com foco em: ${action.action}`)
          setDataRealizacao(
            action.realized_date
              ? action.realized_date.split('T')[0]
              : new Date().toISOString().split('T')[0],
          )
          setCargaHoraria(action.ch_hours || '')
          setLocal('Sala de Treinamento / Operacional')
          setInstrutor(action.responsible || '')
          setStatus('realizada')
          setProgramarNaAgenda(true)
          setParticipants([])
          setEvaluations([])
          setActiveTab('attendance')
        }
      } catch (e) {
        console.error('Failed to init attendance dialog:', e)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [open, action, companyId])

  // Add team member to participants list
  const handleAddTeamMember = (member: TeamMember) => {
    if (participants.some((p) => p.team_member === member.id || p.nome === member.name)) {
      toast({
        title: 'Colaborador já adicionado',
        description: `${member.name} já está na lista de presença.`,
      })
      return
    }

    setParticipants((prev) => [
      ...prev,
      {
        team_member: member.id,
        nome: member.name,
        presenca: 'Presente',
        nota: 100,
        aprovado: true,
        assinatura: member.name,
        department: member.department,
        role: member.role,
      },
    ])
  }

  // Add manual non-registered participant
  const handleAddManualParticipant = () => {
    if (!manualName.trim()) return
    const trimmed = manualName.trim()
    if (participants.some((p) => p.nome.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: 'Nome já incluído',
        description: 'Já existe um participante com este nome na lista.',
      })
      return
    }

    setParticipants((prev) => [
      ...prev,
      {
        nome: trimmed,
        presenca: 'Presente',
        nota: 100,
        aprovado: true,
        assinatura: trimmed,
        department: 'Externo/Avulso',
        role: 'Participante',
      },
    ])
    setManualName('')
  }

  // Batch toggle presence
  const handleToggleAllPresence = (target: ParticipantPresence) => {
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        presenca: target,
        assinatura: target === 'Presente' ? p.assinatura || p.nome : '',
      })),
    )
  }

  // Batch sign present participants
  const handleBatchSign = () => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.presenca === 'Presente' ? { ...p, assinatura: p.assinatura || p.nome } : p,
      ),
    )
    toast({
      title: 'Assinaturas preenchidas',
      description: 'Nomes confirmados como assinatura digital para todos os presentes.',
    })
  }

  // Remove participant
  const handleRemoveParticipant = (index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index))
  }

  // Add evaluation row for a participant (limit up to 5 per participant)
  const handleAddEvaluation = (partId: string, partNome: string) => {
    const existingCount = evaluations.filter((ev) => ev.participantId === partId).length
    if (existingCount >= 5) {
      toast({
        title: 'Limite atingido',
        description: 'O FSGQ 7.2-3 permite até 5 avaliadores por participante.',
        variant: 'destructive',
      })
      return
    }

    const currentUserName = user?.name || 'Avaliador da Qualidade'
    const today = new Date().toISOString().split('T')[0]

    setEvaluations((prev) => [
      ...prev,
      {
        participantId: partId,
        participantNome: partNome,
        resposta: 'SIM',
        comentario: 'O colaborador demonstrou assimilação prática do conteúdo.',
        nome_avaliador: currentUserName,
        data_avaliacao: today,
        avaliadorId: user?.id,
      },
    ])
  }

  const handleRemoveEvaluation = (index: number) => {
    setEvaluations((prev) => prev.filter((_, i) => i !== index))
  }

  // Filtered team members for picker
  const filteredTeam = useMemo(() => {
    const q = teamSearch.toLowerCase().trim()
    return teamList.filter((m) => {
      const alreadyAdded = participants.some(
        (p) => p.team_member === m.id || p.nome.toLowerCase() === m.name.toLowerCase(),
      )
      if (alreadyAdded) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q)
      )
    })
  }, [teamList, teamSearch, participants])

  // Participants count
  const presentCount = participants.filter((p) => p.presenca === 'Presente').length
  const totalCount = participants.length

  // Save full attendance list
  const handleSaveAttendance = async () => {
    if (!action) return
    if (!tema.trim()) {
      toast({ title: 'Tema é obrigatório', variant: 'destructive' })
      return
    }
    if (!dataRealizacao) {
      toast({ title: 'Data de realização é obrigatória', variant: 'destructive' })
      return
    }
    if (participants.length === 0) {
      toast({
        title: 'Nenhum participante',
        description: 'Adicione pelo menos 1 colaborador na lista de presença.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const saved = await saveAttendanceListFull({
        listId: existingList?.id,
        actionId: action.id,
        companyId,
        tema,
        conteudoProgramatico: conteudo,
        dataRealizacao,
        cargaHoraria: cargaHoraria !== '' ? Number(cargaHoraria) : undefined,
        local,
        instrutorInstituicao: instrutor,
        status,
        programarNaAgenda,
        participants: participants.map((p) => ({
          id: p.id,
          team_member: p.team_member || null,
          nome: p.nome,
          presenca: p.presenca,
          nota: p.nota !== '' && p.nota !== undefined ? Number(p.nota) : undefined,
          aprovado: p.aprovado,
          assinatura: p.assinatura,
        })),
      })

      setExistingList(saved)
      toast({
        title: 'Lista de Presença salva com sucesso!',
        description:
          status === 'realizada' || status === 'aguardando_avaliacao_eficacia'
            ? 'Ação do plano atualizada (CH realizada, participantes e evento na Agenda).'
            : 'Rascunho gravado.',
      })
      onSuccess()
    } catch (e: any) {
      console.error('Save attendance error:', e)
      toast({
        title: 'Erro ao salvar Lista de Presença',
        description: e?.message || 'Falha na gravação dos dados.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Save evaluations
  const handleSaveEvaluations = async (markCompleted: boolean = false) => {
    if (!existingList?.id) {
      toast({
        title: 'Lista não salva',
        description: 'Salve a lista de presença antes de registrar a avaliação de eficácia.',
        variant: 'destructive',
      })
      return
    }

    if (evaluations.length === 0) {
      toast({
        title: 'Nenhuma avaliação',
        description: 'Adicione pelo menos 1 avaliação para os participantes.',
        variant: 'destructive',
      })
      return
    }

    // Verify all evaluations have valid participants
    for (const ev of evaluations) {
      if (!ev.participantId) {
        toast({
          title: 'Participante inválido na avaliação',
          variant: 'destructive',
        })
        return
      }
      if (!ev.nome_avaliador.trim()) {
        toast({
          title: 'Nome do avaliador é obrigatório',
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)
    try {
      await saveEffectivenessEvaluations({
        attendanceListId: existingList.id,
        evaluations: evaluations.map((ev) => ({
          id: ev.id,
          participant: ev.participantId,
          resposta: ev.resposta,
          comentario: ev.comentario,
          nome_avaliador: ev.nome_avaliador,
          data_avaliacao: ev.data_avaliacao || new Date().toISOString().split('T')[0],
          avaliador: ev.avaliadorId || user?.id || null,
        })),
        markCompleted,
      })

      toast({
        title: markCompleted
          ? 'Avaliação de Eficácia CONCLUÍDA!'
          : 'Avaliações de Eficácia salvas com sucesso!',
        description: markCompleted
          ? 'Status do treinamento no plano atualizado para OK.'
          : 'Registros salvos no FSGQ 7.2-3.',
      })

      if (markCompleted) {
        setStatus('avaliacao_concluida')
      }
      onSuccess()
    } catch (e: any) {
      console.error('Save evaluations error:', e)
      toast({
        title: 'Erro ao salvar eficácia',
        description: e?.message || 'Falha ao salvar avaliações.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Formatted planned effectiveness date (+60d)
  const calculatedEffectivenessDate = useMemo(() => {
    if (!dataRealizacao) return ''
    const d = new Date(dataRealizacao)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + 60)
    return d.toLocaleDateString('pt-BR')
  }, [dataRealizacao])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto glass border-white/10 p-6">
        <DialogHeader className="border-b border-white/10 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                <FileSignature className="w-3.5 h-3.5 mr-1" /> FSGQ 7.2-3 Rev.02
              </Badge>
              <Badge
                className={
                  status === 'avaliacao_concluida'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : status === 'aguardando_avaliacao_eficacia'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : status === 'realizada'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-white/10 text-muted-foreground'
                }
              >
                {status === 'avaliacao_concluida'
                  ? 'Avaliação Concluída'
                  : status === 'aguardando_avaliacao_eficacia'
                    ? 'Eficácia Pendente (+60d)'
                    : status === 'realizada'
                      ? 'Realizada'
                      : 'Rascunho'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Vínculo: {action?.action ? action.action.slice(0, 45) : 'Treinamento'}
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-white mt-1">
            Lista de Presença e Avaliação do Treinamento
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registro oficial digital conforme FSGQ 7.2-3. Controle de presença, carga horária e
            avaliação de eficácia de 60 dias.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Carregando dados da Lista de Presença...
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Tabs FSGQ 7.2-3: Presença e Realização vs Avaliação de Eficácia (+60d) */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'attendance' | 'effectiveness')}
            >
              <TabsList className="grid grid-cols-2 bg-black/40 border border-white/10">
                <TabsTrigger value="attendance" className="text-xs gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  1. Presença & Realização ({presentCount}/{totalCount} presentes)
                </TabsTrigger>
                <TabsTrigger
                  value="effectiveness"
                  className="text-xs gap-1.5 relative"
                  disabled={!existingList?.id}
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  2. Avaliação de Eficácia (+60d)
                  {evaluations.length > 0 && (
                    <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                      {evaluations.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: PRESENÇA E REALIZAÇÃO */}
              <TabsContent value="attendance" className="space-y-6 mt-4">
                {/* Header Information Grid */}
                <div className="p-4 rounded-lg bg-black/30 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary" /> Cabeçalho do Treinamento
                      (FSGQ 7.2-3)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Empresa:{' '}
                      <strong className="text-white">
                        {action?.expand?.company_id?.name || 'PSC'}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="md:col-span-2">
                      <Label className="text-xs text-white/80">Tema do Treinamento *</Label>
                      <Input
                        value={tema}
                        onChange={(e) => setTema(e.target.value)}
                        placeholder="Ex: TRATATIVA DA RNC 015-26 - CALIBRAÇÃO DE INSTRUMENTOS"
                        className="bg-black/40 border-white/10 text-white text-xs mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs text-white/80">Conteúdo Programático</Label>
                      <Textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        placeholder="Resumo dos tópicos abordados, normas, práticas operacionais..."
                        rows={2}
                        className="bg-black/40 border-white/10 text-white text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-white/80">Data de Realização *</Label>
                      <Input
                        type="date"
                        value={dataRealizacao}
                        onChange={(e) => setDataRealizacao(e.target.value)}
                        className="bg-black/40 border-white/10 text-white text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-white/80">Carga Horária (horas)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={cargaHoraria}
                        onChange={(e) => setCargaHoraria(e.target.value)}
                        placeholder="Ex: 2.0"
                        className="bg-black/40 border-white/10 text-white text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-white/80">Local de Realização</Label>
                      <Input
                        value={local}
                        onChange={(e) => setLocal(e.target.value)}
                        placeholder="Ex: Sala de Treinamento / Oficina PSC"
                        className="bg-black/40 border-white/10 text-white text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-white/80">Instrutor / Instituição</Label>
                      <Input
                        value={instrutor}
                        onChange={(e) => setInstrutor(e.target.value)}
                        placeholder="Ex: Roberta / SENAC / Instrutor Interno"
                        className="bg-black/40 border-white/10 text-white text-xs mt-1"
                      />
                    </div>
                  </div>

                  {/* FSGQ 7.2-3 Operational Status & Agenda reminder */}
                  <div className="p-3 rounded bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        Programação na Agenda Eletrônica (+60 dias)
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Conforme FSGQ 7.2-3: "Programar esta data na Agenda Eletrônica". Data
                        prevista:{' '}
                        <strong className="text-emerald-400">
                          {calculatedEffectivenessDate || 'Após preencher data'}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="progAgenda"
                          checked={programarNaAgenda}
                          onCheckedChange={(c) => setProgramarNaAgenda(!!c)}
                        />
                        <label
                          htmlFor="progAgenda"
                          className="cursor-pointer text-xs text-white/90"
                        >
                          Criar evento na Agenda
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-[11px] text-muted-foreground">Status Lista:</Label>
                        <Select
                          value={status}
                          onValueChange={(v) => setStatus(v as AttendanceListStatus)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-black/40 border-white/10 text-white w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="aguardando_avaliacao_eficacia">
                              Aguardando Eficácia
                            </SelectItem>
                            <SelectItem value="avaliacao_concluida">Avaliação Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        Participantes ({presentCount} presentes de {totalCount})
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Puxe colaboradores cadastrados da equipe ou digite novos nomes.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAllPresence('Presente')}
                        className="text-[11px] h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Todos Presentes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBatchSign}
                        className="text-[11px] h-7 border-white/10 text-white/80 hover:bg-white/10"
                      >
                        <FileSignature className="w-3 h-3 mr-1" /> Assinar Todos
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                        className="text-[11px] h-7 bg-primary text-white hover:bg-primary/90"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Puxar da Equipe
                      </Button>
                    </div>
                  </div>

                  {/* Team Members Drawer/Picker */}
                  {isTeamSelectorOpen && (
                    <div className="p-3 rounded-lg bg-black/40 border border-primary/30 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" /> Colaboradores da Equipe (
                          {action?.expand?.company_id?.name || 'PSC'})
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsTeamSelectorOpen(false)}
                          className="h-6 text-[10px] text-muted-foreground"
                        >
                          Fechar
                        </Button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                        <Input
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          placeholder="Buscar por colaborador, setor, cargo..."
                          className="h-7 text-xs pl-8 bg-black/50 border-white/10 text-white"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                        {filteredTeam.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2 text-center">
                            Nenhum outro colaborador disponível.
                          </p>
                        ) : (
                          filteredTeam.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-1.5 rounded bg-white/5 hover:bg-white/10 text-xs transition-colors"
                            >
                              <div>
                                <span className="font-semibold text-white">{member.name}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">
                                  {member.department || 'Geral'} • {member.role || 'Colaborador'}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddTeamMember(member)}
                                className="h-6 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                Adicionar
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual non-registered addition */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddManualParticipant()}
                      placeholder="Adicionar nome avulso / colaborador não cadastrado na equipe..."
                      className="h-8 text-xs bg-black/40 border-white/10 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddManualParticipant}
                      className="h-8 text-xs border-white/10 text-white hover:bg-white/10 shrink-0"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar Avulso
                    </Button>
                  </div>

                  {/* Participants Table */}
                  <div className="rounded-lg border border-white/10 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-black/50 text-[11px] uppercase">
                        <TableRow className="border-white/10">
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead className="text-white/80">COLABORADOR / NOME</TableHead>
                          <TableHead className="w-28 text-white/60">SETOR / CARGO</TableHead>
                          <TableHead className="w-32 text-center text-white/80">PRESENÇA</TableHead>
                          <TableHead className="w-20 text-center text-white/60">NOTA</TableHead>
                          <TableHead className="w-48 text-white/80">ASSINATURA DIGITAL</TableHead>
                          <TableHead className="w-12 text-center text-white/60"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground text-xs"
                            >
                              Nenhum participante adicionado ainda. Puxe da equipe acima ou digite
                              um nome avulso.
                            </TableCell>
                          </TableRow>
                        ) : (
                          participants.map((p, idx) => (
                            <TableRow
                              key={p.id || `p_${idx}`}
                              className="border-white/5 hover:bg-white/5 text-xs"
                            >
                              <TableCell className="text-center font-mono text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-semibold text-white">
                                {p.nome}
                                {!p.team_member && (
                                  <span className="text-[10px] text-muted-foreground ml-2 px-1 rounded bg-white/5">
                                    Avulso
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-[11px]">
                                {p.department || '—'} {p.role ? `• ${p.role}` : ''}
                              </TableCell>
                              <TableCell className="text-center">
                                <Select
                                  value={p.presenca}
                                  onValueChange={(val: ParticipantPresence) => {
                                    setParticipants((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              presenca: val,
                                              assinatura:
                                                val === 'Presente'
                                                  ? item.assinatura || item.nome
                                                  : '',
                                            }
                                          : item,
                                      ),
                                    )
                                  }}
                                >
                                  <SelectTrigger
                                    className={`h-7 text-xs font-semibold ${
                                      p.presenca === 'Presente'
                                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                        : 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                                    }`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Presente">Presente</SelectItem>
                                    <SelectItem value="Ausente">Ausente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={p.nota ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setParticipants((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, nota: val } : item,
                                      ),
                                    )
                                  }}
                                  disabled={p.presenca === 'Ausente'}
                                  placeholder="0-100"
                                  className="h-7 text-xs text-center bg-black/30 border-white/10 text-white"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={p.assinatura || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setParticipants((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, assinatura: val } : item,
                                      ),
                                    )
                                  }}
                                  disabled={p.presenca === 'Ausente'}
                                  placeholder="Confirmação digitada do nome..."
                                  className="h-7 text-xs bg-black/30 border-white/10 text-white font-mono"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveParticipant(idx)}
                                  className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: AVALIAÇÃO DE EFICÁCIA (+60 DIAS) */}
              <TabsContent value="effectiveness" className="space-y-6 mt-4">
                <div className="p-4 rounded-lg bg-black/30 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Avaliação de Eficácia do Treinamento (FSGQ 7.2-3)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Pergunta padrão FSGQ 7.2-3:{' '}
                        <strong className="text-white">
                          "O colaborador melhorou o desempenho?"
                        </strong>{' '}
                        (SIM / NÃO). Até 5 avaliadores por participante.
                      </p>
                    </div>

                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                      Data Prevista (+60d): {calculatedEffectivenessDate}
                    </Badge>
                  </div>

                  {/* Add Evaluation Shortcuts */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/80 font-semibold">
                      Avaliar colaborador:
                    </span>
                    {participants
                      .filter((p) => p.presenca === 'Presente')
                      .map((p) => (
                        <Button
                          key={p.id || p.nome}
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddEvaluation(p.id!, p.nome)}
                          disabled={!p.id}
                          className="h-7 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10 gap-1"
                        >
                          <Plus className="w-3 h-3" /> {p.nome.split(' ')[0]}
                        </Button>
                      ))}
                  </div>
                </div>

                {/* Evaluations List */}
                <div className="space-y-3">
                  {evaluations.length === 0 ? (
                    <div className="p-8 text-center rounded-lg bg-black/20 border border-white/5 space-y-2">
                      <Award className="w-8 h-8 text-muted-foreground opacity-30 mx-auto" />
                      <p className="text-sm font-semibold text-white">
                        Nenhuma avaliação de eficácia registrada ainda
                      </p>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Clique em "Avaliar colaborador" acima para registrar se o colaborador
                        melhorou o desempenho após 60 dias de prática.
                      </p>
                    </div>
                  ) : (
                    evaluations.map((ev, idx) => (
                      <div
                        key={ev.id || `ev_${idx}`}
                        className="p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {ev.participantNome}
                            </span>
                            <Badge
                              className={
                                ev.resposta === 'SIM'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }
                            >
                              Melhorou: {ev.resposta}
                            </Badge>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveEvaluation(idx)}
                            className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <Label className="text-[11px] text-white/70">
                              O colaborador melhorou o desempenho? *
                            </Label>
                            <Select
                              value={ev.resposta}
                              onValueChange={(val: EffectivenessResponse) => {
                                setEvaluations((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, resposta: val } : item,
                                  ),
                                )
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs bg-black/40 border-white/10 text-white mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SIM">SIM</SelectItem>
                                <SelectItem value="NÃO">NÃO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[11px] text-white/70">Nome do Avaliador *</Label>
                            <Input
                              value={ev.nome_avaliador}
                              onChange={(e) => {
                                const val = e.target.value
                                setEvaluations((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, nome_avaliador: val } : item,
                                  ),
                                )
                              }}
                              placeholder="Nome do avaliador"
                              className="h-8 text-xs bg-black/40 border-white/10 text-white mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] text-white/70">Data da Avaliação *</Label>
                            <Input
                              type="date"
                              value={ev.data_avaliacao}
                              onChange={(e) => {
                                const val = e.target.value
                                setEvaluations((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, data_avaliacao: val } : item,
                                  ),
                                )
                              }}
                              className="h-8 text-xs bg-black/40 border-white/10 text-white mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] text-white/70">
                              Comentário / Evidência Prática
                            </Label>
                            <Input
                              value={ev.comentario}
                              onChange={(e) => {
                                const val = e.target.value
                                setEvaluations((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, comentario: val } : item,
                                  ),
                                )
                              }}
                              placeholder="Observações do desempenho..."
                              className="h-8 text-xs bg-black/40 border-white/10 text-white mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Buttons for Evaluations */}
                {evaluations.length > 0 && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveEvaluations(false)}
                      disabled={saving}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      Salvar Avaliações
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveEvaluations(true)}
                      disabled={saving}
                      className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluir Avaliação de Eficácia
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="border-t border-white/10 pt-4 flex flex-row items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-white"
          >
            Fechar
          </Button>

          {activeTab === 'attendance' && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatus('rascunho')
                  setTimeout(handleSaveAttendance, 50)
                }}
                disabled={saving || loading}
                className="text-xs border-white/10 text-muted-foreground hover:text-white"
              >
                Salvar como Rascunho
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setStatus('realizada')
                  setTimeout(handleSaveAttendance, 50)
                }}
                disabled={saving || loading}
                className="text-xs bg-primary text-white hover:bg-primary/90 font-semibold gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Salvar Lista Realizada
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
