import { useState, useEffect, useMemo } from 'react'
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  User,
  ShieldAlert,
  Flame,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Sparkles,
  Award,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getImplementationChecklist,
  toggleItemDone,
  updateItemNotes,
  registerItemFailure,
  GOLDEN_RULES,
  ImplementationItem,
  PhaseGroup,
} from '@/services/implementation-checklist'
import { safeFormatDate } from '@/lib/safe-data'

export default function ImplementationChecklistPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<ImplementationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending' | 'failed'>('all')

  // Expanded cards state (defaults to open)
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  })

  // Failure modal state
  const [failureDialogOpen, setFailureDialogOpen] = useState(false)
  const [selectedItemForFailure, setSelectedItemForFailure] = useState<ImplementationItem | null>(
    null,
  )
  const [failureDescription, setFailureDescription] = useState('')
  const [submittingFailure, setSubmittingFailure] = useState(false)

  // Notes editing modal
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<ImplementationItem | null>(null)
  const [currentNotes, setCurrentNotes] = useState('')
  const [submittingNotes, setSubmittingNotes] = useState(false)

  const loadData = async () => {
    try {
      const data = await getImplementationChecklist()
      setItems(data)
    } catch (err) {
      console.error('Error loading checklist:', err)
      toast({
        title: 'Erro ao carregar roteiro',
        description: 'Não foi possível carregar os itens de implantação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Realtime updates
  useRealtime('implementation_checklist', () => {
    loadData()
  })

  const togglePhaseCollapse = (phaseId: number) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }))
  }

  // Handle toggle done
  const handleToggle = async (item: ImplementationItem) => {
    const userName = user?.name || user?.email || 'Gestor da Qualidade'
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                done: !i.done,
                done_by: !i.done ? userName : '',
                done_at: !i.done ? new Date().toISOString() : undefined,
              }
            : i,
        ),
      )

      await toggleItemDone(item, userName)
      toast({
        title: !item.done ? 'Item concluído ✅' : 'Item desmarcado',
        description: `"${item.item_key} - ${item.title}" atualizado com sucesso.`,
      })
    } catch (err) {
      console.error('Failed to toggle item:', err)
      toast({
        title: 'Erro ao atualizar item',
        description: 'Não foi possível salvar o estado no banco de dados.',
        variant: 'destructive',
      })
      loadData()
    }
  }

  // Handle failure registration dialog
  const openFailureModal = (item: ImplementationItem) => {
    setSelectedItemForFailure(item)
    setFailureDescription(item.failure_description || '')
    setFailureDialogOpen(true)
  }

  const handleSaveFailure = async () => {
    if (!selectedItemForFailure) return
    setSubmittingFailure(true)
    try {
      const isRegistering = failureDescription.trim().length > 0
      await registerItemFailure(
        selectedItemForFailure.id,
        isRegistering,
        isRegistering ? failureDescription : '',
      )
      toast({
        title: isRegistering ? 'Falha registrada ⚠️' : 'Registro de falha removido',
        description: `Item ${selectedItemForFailure.item_key} atualizado.`,
      })
      setFailureDialogOpen(false)
      loadData()
    } catch (err) {
      console.error('Error saving failure:', err)
      toast({
        title: 'Erro ao registrar falha',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingFailure(false)
    }
  }

  // Handle notes dialog
  const openNotesModal = (item: ImplementationItem) => {
    setSelectedItemForNotes(item)
    setCurrentNotes(item.notes || '')
    setNotesDialogOpen(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedItemForNotes) return
    setSubmittingNotes(true)
    try {
      await updateItemNotes(selectedItemForNotes.id, currentNotes)
      toast({
        title: 'Observações salvas',
        description: `Anotações do item ${selectedItemForNotes.item_key} gravadas.`,
      })
      setNotesDialogOpen(false)
      loadData()
    } catch (err) {
      console.error('Error saving notes:', err)
      toast({
        title: 'Erro ao salvar notas',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingNotes(false)
    }
  }

  // Overall metrics
  const totalItems = items.length
  const completedItems = items.filter((i) => i.done).length
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const failedItemsCount = items.filter((i) => i.failure_registered).length

  // Filtered items & phase grouping
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchKey = item.item_key.toLowerCase().includes(q)
        const matchHowTo = item.how_to?.toLowerCase().includes(q) || false
        const matchResult = item.expected_result?.toLowerCase().includes(q) || false
        if (!matchTitle && !matchKey && !matchHowTo && !matchResult) return false
      }

      // phase filter
      if (filterPhase !== 'all' && String(item.phase_id) !== filterPhase) {
        return false
      }

      // status filter
      if (filterStatus === 'done' && !item.done) return false
      if (filterStatus === 'pending' && item.done) return false
      if (filterStatus === 'failed' && !item.failure_registered) return false

      return true
    })
  }, [items, searchQuery, filterPhase, filterStatus])

  // Group by phase
  const phaseGroups: PhaseGroup[] = useMemo(() => {
    const map = new Map<number, PhaseGroup>()

    // Initialize all 8 phases
    const phaseTitles: Record<number, string> = {
      0: 'FASE 0 — Preparação (½ dia)',
      1: 'FASE 1 — Documentos (base de tudo)',
      2: 'FASE 2 — Checklists',
      3: 'FASE 3 — Treinamentos',
      4: 'FASE 4 — RNC (o coração — fazer com cuidado)',
      5: 'FASE 5 — Riscos e Auditorias',
      6: 'FASE 6 — Objetivos e Revisão pela Direção',
      7: 'FASE 7 — Semana de lançamento (segunda-feira dos colaboradores)',
    }

    Object.entries(phaseTitles).forEach(([pId, title]) => {
      const num = Number(pId)
      // All items in original list for this phase (for real phase progress)
      const allPhaseItems = items.filter((i) => i.phase_id === num)
      const completed = allPhaseItems.filter((i) => i.done).length
      const total = allPhaseItems.length
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0

      // Filtered items for display
      const displayedItems = filteredItems.filter((i) => i.phase_id === num)

      map.set(num, {
        phase_id: num,
        phase_title: title,
        items: displayedItems,
        completedCount: completed,
        totalCount: total,
        progressPercent: pct,
      })
    })

    return Array.from(map.values()).sort((a, b) => a.phase_id - b.phase_id)
  }, [items, filteredItems])

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                UQualiHub — Roteiro de Implementação e Homologação
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                  SGQ ISO 9001
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Roteiro de Implementação e Homologação — para execução pela Gestão da Qualidade
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allOpen = Object.values(expandedPhases).every(Boolean)
              const nextState: Record<number, boolean> = {}
              ;[0, 1, 2, 3, 4, 5, 6, 7].forEach((id) => {
                nextState[id] = !allOpen
              })
              setExpandedPhases(nextState)
            }}
            className="text-xs border-white/15 hover:bg-white/5"
          >
            {Object.values(expandedPhases).every(Boolean) ? 'Recolher Todas' : 'Expandir Todas'}
          </Button>
        </div>
      </div>

      {/* Intro Box */}
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-white">
              Como usar: a GQ percorre as fases em ordem. Cada item tem ✅ quando aprovado e ⚠️ para
              registrar falha (com data e descrição).
            </p>
            <p className="text-muted-foreground">
              Recomendo 2 a 4 blocos por semana — não é corrida, é implantação com evidência.
              Qualquer falha registrada deve ser compartilhada no chat em modo Agente para ajuste
              imediato da plataforma.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress Banner */}
      <Card className="bg-card/70 border-white/10 shadow-elevation">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Progresso Geral da Homologação
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-white">
                  {completedItems}/{totalItems}
                </span>
                <span className="text-base font-semibold text-primary">
                  itens — {overallProgress}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs py-1 px-2.5"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> {completedItems} Concluídos
              </Badge>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs py-1 px-2.5"
              >
                <ClockIcon className="w-3.5 h-3.5 mr-1" /> {totalItems - completedItems} Pendentes
              </Badge>
              {failedItemsCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs py-1 px-2.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {failedItemsCount} Falhas
                  Registradas
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Progress value={overallProgress} className="h-3 bg-white/5" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Fase 0 (Início)</span>
              <span>Fase 4 (RNCs)</span>
              <span>Fase 7 (Lançamento Operacional)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, tarefa ou resultado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/40 border-white/10 text-sm h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Phase Filter */}
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="bg-card/60 border border-white/10 rounded-md text-xs px-2.5 py-1.5 h-9 text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas as Fases (0 a 7)</option>
            <option value="0">Fase 0 — Preparação</option>
            <option value="1">Fase 1 — Documentos</option>
            <option value="2">Fase 2 — Checklists</option>
            <option value="3">Fase 3 — Treinamentos</option>
            <option value="4">Fase 4 — RNC</option>
            <option value="5">Fase 5 — Riscos e Auditorias</option>
            <option value="6">Fase 6 — Objetivos e Revisão</option>
            <option value="7">Fase 7 — Semana de Lançamento</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-card/60 border border-white/10 rounded-md text-xs px-2.5 py-1.5 h-9 text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Apenas Pendentes</option>
            <option value="done">Apenas Concluídos ✅</option>
            <option value="failed">Apenas com Falha ⚠️</option>
          </select>
        </div>
      </div>

      {/* Main Checklist Phases */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando roteiro de implantação...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {phaseGroups.map((phase) => {
            const isExpanded = !!expandedPhases[phase.phase_id]
            const isPhaseComplete =
              phase.totalCount > 0 && phase.completedCount === phase.totalCount

            return (
              <Card
                key={phase.phase_id}
                className={cn(
                  'border-white/10 bg-card/40 shadow-sm transition-all overflow-hidden',
                  isPhaseComplete ? 'border-emerald-500/30 bg-emerald-950/10' : '',
                )}
              >
                {/* Phase Header */}
                <div
                  onClick={() => togglePhaseCollapse(phase.phase_id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                        isPhaseComplete
                          ? 'bg-emerald-500 text-black'
                          : phase.completedCount > 0
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-white/10 text-muted-foreground',
                      )}
                    >
                      {isPhaseComplete ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        `F${phase.phase_id}`
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        {phase.phase_title}
                        {isPhaseComplete && (
                          <Badge className="bg-emerald-500 text-black font-semibold text-[10px] h-5">
                            Fase Concluída
                          </Badge>
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {phase.completedCount} de {phase.totalCount} itens aprovados (
                        {phase.progressPercent}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-28 sm:w-36 hidden sm:block">
                      <Progress
                        value={phase.progressPercent}
                        className={cn(
                          'h-2 bg-white/10',
                          isPhaseComplete ? '[&>div]:bg-emerald-500' : '',
                        )}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePhaseCollapse(phase.phase_id)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Phase Items List */}
                {isExpanded && (
                  <div className="border-t border-white/5 divide-y divide-white/5 bg-background/30">
                    {phase.items.length === 0 ? (
                      <div className="p-4 text-xs text-center text-muted-foreground">
                        Nenhum item encontrado com os filtros atuais.
                      </div>
                    ) : (
                      phase.items.map((item) => {
                        const hasFailure = !!item.failure_registered

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4',
                              item.done ? 'bg-emerald-950/10' : '',
                              hasFailure ? 'bg-rose-950/10' : '',
                              item.is_highlight ? 'border-l-4 border-amber-400' : '',
                            )}
                          >
                            {/* Checkbox and core details */}
                            <div className="flex items-start gap-3.5 flex-1">
                              <div className="pt-0.5">
                                <Checkbox
                                  id={`chk-${item.id}`}
                                  checked={item.done}
                                  onCheckedChange={() => handleToggle(item)}
                                  className="h-5 w-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 border-white/30"
                                />
                              </div>

                              <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-white">
                                    {item.item_key}
                                  </span>

                                  <label
                                    htmlFor={`chk-${item.id}`}
                                    className={cn(
                                      'font-semibold text-sm cursor-pointer hover:text-primary transition-colors',
                                      item.done
                                        ? 'line-through text-muted-foreground'
                                        : 'text-white',
                                    )}
                                  >
                                    {item.title}
                                  </label>

                                  {/* Special alert highlights for 4.1, 4.2 and 6.5 */}
                                  {item.item_key === '6.5' && (
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-semibold gap-1"
                                    >
                                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                                      Marco de Maturidade SGQ
                                    </Badge>
                                  )}

                                  {(item.item_key === '4.1' || item.item_key === '4.2') && (
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-xs font-semibold gap-1"
                                    >
                                      <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                                      Atenção na Importação
                                    </Badge>
                                  )}

                                  {hasFailure && (
                                    <Badge
                                      variant="outline"
                                      className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs font-semibold gap-1"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                                      Falha Registrada
                                    </Badge>
                                  )}
                                </div>

                                {/* Como fazer & Resultado Esperado */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                                  <div className="bg-white/5 rounded-md p-2.5 border border-white/5 space-y-0.5">
                                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-semibold block">
                                      🛠 Como fazer:
                                    </span>
                                    <p className="text-slate-200">{item.how_to}</p>
                                  </div>

                                  <div className="bg-white/5 rounded-md p-2.5 border border-white/5 space-y-0.5">
                                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-semibold block">
                                      🎯 Resultado esperado:
                                    </span>
                                    <p className="text-slate-200">{item.expected_result}</p>
                                  </div>
                                </div>

                                {/* Attention Alert Box if applicable */}
                                {item.attention_alert && (
                                  <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="font-semibold block text-amber-300">
                                        ATENÇÃO ESPECIAL:
                                      </strong>
                                      {item.attention_alert}
                                    </div>
                                  </div>
                                )}

                                {/* Registered failure note */}
                                {hasFailure && (
                                  <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold flex items-center gap-1.5 text-rose-300">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Falha em {safeFormatDate(item.failure_date || item.updated)}
                                        :
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">
                                      {item.failure_description}
                                    </p>
                                  </div>
                                )}

                                {/* User Notes */}
                                {item.notes && (
                                  <div className="p-2 rounded bg-white/5 border border-white/5 text-xs text-muted-foreground italic">
                                    <strong>Notas:</strong> {item.notes}
                                  </div>
                                )}

                                {/* Metadata: who approved and when */}
                                {item.done && (
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-400 pt-0.5">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Aprovado por: <strong>{item.done_by || 'GQ'}</strong>
                                    </span>
                                    {item.done_at && (
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {safeFormatDate(item.done_at)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openNotesModal(item)}
                                className="h-8 text-xs px-2.5 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white gap-1.5"
                                title="Adicionar anotação interna"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Notas</span>
                              </Button>

                              <Button
                                variant={hasFailure ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => openFailureModal(item)}
                                className={cn(
                                  'h-8 text-xs px-2.5 gap-1.5',
                                  hasFailure
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
                                )}
                                title="Registrar falha para correção"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {hasFailure ? 'Editar Falha' : 'Registrar Falha'}
                                </span>
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* REGRAS DE OURO — Fixed Bottom Card */}
      <Card className="border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-card/70 to-card/90 shadow-elevation">
        <CardHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-amber-300">
                Regras de Ouro da Implementação
              </CardTitle>
              <CardDescription className="text-xs text-amber-200/70">
                Diretrizes fundamentais para a homologação segura da Gestão da Qualidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {GOLDEN_RULES.map((rule, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-card/60 border border-amber-500/20 text-xs text-slate-200 flex items-start gap-2.5"
              >
                <span className="font-bold text-amber-400 font-mono text-sm shrink-0">
                  {idx + 1}.
                </span>
                <p className="leading-relaxed">{rule.replace(/^[0-9]\.\s*/, '')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failure Registration Dialog */}
      <Dialog open={failureDialogOpen} onOpenChange={setFailureDialogOpen}>
        <DialogContent className="max-w-md bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              Registrar Falha — Item {selectedItemForFailure?.item_key}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedItemForFailure?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-amber-200">
              <strong>Regra de Ouro nº 3:</strong> Registrar toda falha assim: data, módulo, o que
              fez, o que esperava, o que aconteceu, print — e mandar pelo chat no modo Agente.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Descrição da falha identificada:
              </label>
              <Textarea
                rows={4}
                value={failureDescription}
                onChange={(e) => setFailureDescription(e.target.value)}
                placeholder="Ex.: 21/09 - Módulo Documentos - Ao clicar em publicar revisão 02, o status não alterou para pendente. Esperava que os leitores tivessem o status zerado."
                className="text-xs bg-background/50 border-white/10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedItemForFailure?.failure_registered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFailureDescription('')
                  setTimeout(() => handleSaveFailure(), 50)
                }}
                disabled={submittingFailure}
                className="text-rose-400 hover:text-rose-300 text-xs"
              >
                Limpar Falha
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFailureDialogOpen(false)}
              disabled={submittingFailure}
              className="text-xs border-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleSaveFailure}
              disabled={submittingFailure}
              className="text-xs"
            >
              {submittingFailure ? 'Gravando...' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-md bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileEdit className="w-5 h-5 text-primary" />
              Anotações Internas — {selectedItemForNotes?.item_key}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedItemForNotes?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Textarea
              rows={4}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Adicione anotações, evidências textuais ou observações da GQ..."
              className="text-xs bg-background/50 border-white/10"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNotesDialogOpen(false)}
              disabled={submittingNotes}
              className="text-xs border-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveNotes}
              disabled={submittingNotes}
              className="text-xs"
            >
              {submittingNotes ? 'Salvando...' : 'Salvar Notas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
