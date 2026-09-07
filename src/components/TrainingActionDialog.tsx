import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle2 } from 'lucide-react'
import {
  type TrainingPlanActionComputed,
  type TrainingPeriodicity,
  type TrainingOrigin,
  type TrainingType,
  type TrainingCompetenceForm,
  type TrainingEffectivenessStatus,
  createTrainingPlanAction,
  updateTrainingPlanAction,
  markActionRealized,
} from '@/services/trainings'

interface ActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  actionToEdit?: TrainingPlanActionComputed | null
  defaultCompanyId: string
  defaultYear: number
}

export function TrainingActionDialog({
  open,
  onOpenChange,
  onSuccess,
  actionToEdit,
  defaultCompanyId,
  defaultYear,
}: ActionDialogProps) {
  const [action, setAction] = useState('')
  const [periodicity, setPeriodicity] = useState<TrainingPeriodicity>('Pontual')
  const [responsible, setResponsible] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [origin, setOrigin] = useState<TrainingOrigin>('Interno')
  const [type, setType] = useState<TrainingType>('Procedimentos-Instruções-Formulários')
  const [competenceForm, setCompetenceForm] = useState<TrainingCompetenceForm>('Treinamento')
  const [plannedDate, setPlannedDate] = useState('')
  const [realizedDate, setRealizedDate] = useState('')
  const [requiresEffectiveness, setRequiresEffectiveness] = useState(true)
  const [chHours, setChHours] = useState<string>('')
  const [participantsCount, setParticipantsCount] = useState<string>('')
  const [effectivenessStatus, setEffectivenessStatus] =
    useState<TrainingEffectivenessStatus>('Pendente')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (actionToEdit) {
        setAction(actionToEdit.action || '')
        setPeriodicity(actionToEdit.periodicity || 'Pontual')
        setResponsible(actionToEdit.responsible || '')
        setTargetAudience(actionToEdit.target_audience || '')
        setOrigin(actionToEdit.origin || 'Interno')
        setType(actionToEdit.type || 'Procedimentos-Instruções-Formulários')
        setCompetenceForm(actionToEdit.competence_form || 'Treinamento')
        setPlannedDate(actionToEdit.planned_date ? actionToEdit.planned_date.substring(0, 10) : '')
        setRealizedDate(
          actionToEdit.realized_date ? actionToEdit.realized_date.substring(0, 10) : '',
        )
        setRequiresEffectiveness(actionToEdit.requires_effectiveness_eval ?? true)
        setChHours(
          actionToEdit.ch_hours !== undefined && actionToEdit.ch_hours !== null
            ? String(actionToEdit.ch_hours)
            : '',
        )
        setParticipantsCount(
          actionToEdit.participants_count !== undefined && actionToEdit.participants_count !== null
            ? String(actionToEdit.participants_count)
            : '',
        )
        setEffectivenessStatus(actionToEdit.effectiveness_status || 'Pendente')
        setNotes(actionToEdit.notes || '')
      } else {
        setAction('')
        setPeriodicity('Pontual')
        setResponsible('')
        setTargetAudience('TODOS')
        setOrigin('Interno')
        setType('Procedimentos-Instruções-Formulários')
        setCompetenceForm('Treinamento')
        setPlannedDate('')
        setRealizedDate('')
        setRequiresEffectiveness(true)
        setChHours('')
        setParticipantsCount('')
        setEffectivenessStatus('Pendente')
        setNotes('')
      }
      setError('')
    }
  }, [open, actionToEdit])

  const calculatedChTotal = () => {
    const ch = parseFloat(chHours.replace(',', '.'))
    const p = parseInt(participantsCount, 10)
    if (!isNaN(ch) && !isNaN(p)) {
      return (ch * p).toFixed(1)
    }
    return '0.0'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action.trim()) {
      setError('A descrição da AÇÃO é obrigatória.')
      return
    }
    if (!plannedDate) {
      setError('A Data Prevista é obrigatória.')
      return
    }
    if (!defaultCompanyId || defaultCompanyId === 'all') {
      setError('Selecione uma empresa válida no cabeçalho antes de cadastrar a ação.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const ch = chHours ? parseFloat(chHours.replace(',', '.')) : null
    const parts = participantsCount ? parseInt(participantsCount, 10) : null

    try {
      if (actionToEdit) {
        await updateTrainingPlanAction(actionToEdit.id, {
          action: action.trim(),
          periodicity,
          responsible: responsible.trim() || 'A Definir',
          target_audience: targetAudience.trim() || 'TODOS',
          origin,
          type,
          competence_form: competenceForm,
          planned_date: plannedDate,
          realized_date: realizedDate || null,
          requires_effectiveness_eval: requiresEffectiveness,
          ch_hours: ch,
          participants_count: parts,
          effectiveness_status: requiresEffectiveness ? effectivenessStatus : 'Não aplicável',
          notes: notes.trim(),
        })
      } else {
        await createTrainingPlanAction({
          company_id: defaultCompanyId,
          year: defaultYear,
          action: action.trim(),
          periodicity,
          responsible: responsible.trim() || 'A Definir',
          target_audience: targetAudience.trim() || 'TODOS',
          origin,
          type,
          competence_form: competenceForm,
          planned_date: plannedDate,
          realized_date: realizedDate || null,
          requires_effectiveness_eval: requiresEffectiveness,
          ch_hours: ch,
          participants_count: parts,
          effectiveness_status: requiresEffectiveness ? effectivenessStatus : 'Não aplicável',
          notes: notes.trim(),
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar ação do plano.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {actionToEdit
              ? 'Editar Ação do Plano de Treinamento (FSGQ 7.2-1)'
              : 'Nova Ação no Plano de Treinamento (FSGQ 7.2-1)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/80">AÇÃO (Nome / Tema do Treinamento) *</Label>
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Ex: TRATATIVA DA RNC 015-26 - CALIBRAÇÃO DE INSTRUMENTOS"
              className="bg-black/30 border-white/10 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Periodicidade</Label>
              <Select
                value={periodicity}
                onValueChange={(v) => setPeriodicity(v as TrainingPeriodicity)}
              >
                <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pontual">Pontual</SelectItem>
                  <SelectItem value="Diária/DSS">Diária/DSS</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Responsável</Label>
              <Input
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Ex: Fabiana, Devaldo, SENAC..."
                className="bg-black/30 border-white/10 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Público-Alvo</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: TODOS, CQ, Soldagem..."
                className="bg-black/30 border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Origem</Label>
              <Select value={origin} onValueChange={(v) => setOrigin(v as TrainingOrigin)}>
                <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interno">Interno</SelectItem>
                  <SelectItem value="Externo">Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as TrainingType)}>
                <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Qualificação Pessoal-Sensibilização">
                    Qualificação Pessoal-Sensibilização
                  </SelectItem>
                  <SelectItem value="Procedimentos-Instruções-Formulários">
                    Procedimentos-Instruções-Formulários
                  </SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Forma de Competência</Label>
              <Select
                value={competenceForm}
                onValueChange={(v) => setCompetenceForm(v as TrainingCompetenceForm)}
              >
                <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Treinamento">Treinamento</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Experiência">Experiência</SelectItem>
                  <SelectItem value="Empresa Parceira">Empresa Parceira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white/5 rounded-md border border-white/5">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Data Prevista *</Label>
              <Input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="bg-black/30 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Data Realizada (se concluído)</Label>
              <Input
                type="date"
                value={realizedDate}
                onChange={(e) => setRealizedDate(e.target.value)}
                className="bg-black/30 border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">CH Realizada (horas)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={chHours}
                onChange={(e) => setChHours(e.target.value)}
                placeholder="Ex: 4"
                className="bg-black/30 border-white/10 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Qtd. Participantes</Label>
              <Input
                type="number"
                min="0"
                value={participantsCount}
                onChange={(e) => setParticipantsCount(e.target.value)}
                placeholder="Ex: 10"
                className="bg-black/30 border-white/10 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">CH de Treinamento Total</Label>
              <div className="h-9 px-3 py-2 rounded-md bg-black/40 border border-white/10 text-primary font-mono font-bold text-xs flex items-center">
                {calculatedChTotal()} h
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-md border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-white font-medium">
                  Requer Avaliação de Eficácia?
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Gera automaticamente prazo de avaliação para +60 dias após a data realizada.
                </p>
              </div>
              <Checkbox
                checked={requiresEffectiveness}
                onCheckedChange={(c) => setRequiresEffectiveness(!!c)}
              />
            </div>

            {requiresEffectiveness && (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <Label className="text-xs text-white/80">Status da Avaliação de Eficácia</Label>
                <Select
                  value={effectivenessStatus}
                  onValueChange={(v) => setEffectivenessStatus(v as TrainingEffectivenessStatus)}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="OK">OK (Eficaz)</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Não aplicável">Não aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-white/80">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais, RNC vinculada, método de avaliação..."
              rows={2}
              className="bg-black/30 border-white/10 text-white text-xs"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Salvar Ação
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RealizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  action: TrainingPlanActionComputed | null
}

export function TrainingRealizeDialog({
  open,
  onOpenChange,
  onSuccess,
  action,
}: RealizeDialogProps) {
  const [realizedDate, setRealizedDate] = useState('')
  const [chHours, setChHours] = useState('')
  const [participantsCount, setParticipantsCount] = useState('')
  const [effectivenessStatus, setEffectivenessStatus] =
    useState<TrainingEffectivenessStatus>('Pendente')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && action) {
      const today = new Date().toISOString().substring(0, 10)
      setRealizedDate(action.realized_date ? action.realized_date.substring(0, 10) : today)
      setChHours(
        action.ch_hours !== undefined && action.ch_hours !== null ? String(action.ch_hours) : '4',
      )
      setParticipantsCount(
        action.participants_count !== undefined && action.participants_count !== null
          ? String(action.participants_count)
          : '5',
      )
      setEffectivenessStatus(
        action.effectiveness_status ||
          (action.requires_effectiveness_eval ? 'Pendente' : 'Não aplicável'),
      )
      setNotes(action.notes || '')
      setError('')
    }
  }, [open, action])

  const calculatedTotal = () => {
    const ch = parseFloat(chHours.replace(',', '.'))
    const p = parseInt(participantsCount, 10)
    if (!isNaN(ch) && !isNaN(p)) {
      return (ch * p).toFixed(1)
    }
    return '0.0'
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action) return
    if (!realizedDate) {
      setError('Data Realizada é obrigatória.')
      return
    }

    const ch = parseFloat(chHours.replace(',', '.'))
    const parts = parseInt(participantsCount, 10)

    if (isNaN(ch) || ch < 0) {
      setError('Carga horária inválida.')
      return
    }
    if (isNaN(parts) || parts < 0) {
      setError('Quantidade de participantes inválida.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await markActionRealized({
        id: action.id,
        realizedDate,
        chHours: ch,
        participantsCount: parts,
        effectivenessStatus,
        notes,
      })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar realização do treinamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Marcar Realização do Treinamento</DialogTitle>
        </DialogHeader>

        {action && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="p-3 bg-white/5 rounded-md border border-white/5">
              <span className="text-[10px] uppercase font-bold text-primary">AÇÃO</span>
              <p className="text-sm font-semibold text-white">{action.action}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>
                  Previsto:{' '}
                  {action.planned_date
                    ? new Date(action.planned_date).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
                <span>•</span>
                <span>Resp: {action.responsible}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Data Realizada *</Label>
              <Input
                type="date"
                value={realizedDate}
                onChange={(e) => setRealizedDate(e.target.value)}
                className="bg-black/30 border-white/10 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">CH Realizada (horas) *</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={chHours}
                  onChange={(e) => setChHours(e.target.value)}
                  className="bg-black/30 border-white/10 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Qtd. Participantes *</Label>
                <Input
                  type="number"
                  min="0"
                  value={participantsCount}
                  onChange={(e) => setParticipantsCount(e.target.value)}
                  className="bg-black/30 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 rounded bg-black/40 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/70">CH de Treinamento Total:</span>
              <span className="font-mono font-bold text-primary text-sm">
                {calculatedTotal()} horas
              </span>
            </div>

            <div className="p-2.5 rounded bg-white/5 border border-white/5 text-xs text-muted-foreground space-y-1">
              <p>
                • Avaliação de eficácia prevista (+60 dias):{' '}
                <strong className="text-white">
                  {realizedDate
                    ? new Date(
                        new Date(realizedDate).getTime() + 60 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString('pt-BR')
                    : '—'}
                </strong>
              </p>
              <p>
                • Requer eficácia:{' '}
                <strong className="text-white">
                  {action.requires_effectiveness_eval ? 'Sim' : 'Não'}
                </strong>
              </p>
            </div>

            {action.requires_effectiveness_eval && (
              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Status da Eficácia</Label>
                <Select
                  value={effectivenessStatus}
                  onValueChange={(v) => setEffectivenessStatus(v as TrainingEffectivenessStatus)}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="OK">OK (Eficaz)</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Não aplicável">Não aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Observações</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Treinamento ministrado com sucesso no galpão principal"
                className="bg-black/30 border-white/10 text-white text-xs"
              />
            </div>

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-white gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar Realização
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
