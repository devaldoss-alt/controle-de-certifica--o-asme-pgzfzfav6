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
import { Plus, Trash2, Calendar, Target, ListPlus } from 'lucide-react'
import {
  QualityObjective,
  ObjectiveActionItem,
  OBJECTIVE_PROCESS_LIST,
  MetricType,
  ObjectiveStatus,
} from '@/services/quality-objectives'
import { Company } from '@/services/companies'
import { User } from '@/services/api'

interface ObjectiveFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objective?: QualityObjective | null
  companies: Company[]
  users: User[]
  selectedCompanyId?: string
  currentYear: number
  onSave: (data: Partial<QualityObjective>) => Promise<void>
}

export function ObjectiveFormDialog({
  open,
  onOpenChange,
  objective,
  companies,
  users,
  selectedCompanyId,
  currentYear,
  onSave,
}: ObjectiveFormDialogProps) {
  const [saving, setSaving] = useState(false)

  const [companyId, setCompanyId] = useState('')
  const [year, setYear] = useState(currentYear)
  const [objectiveText, setObjectiveText] = useState('')
  const [process, setProcess] = useState<string>('SGQ')
  const [indicator, setIndicator] = useState('')
  const [metricType, setMetricType] = useState<MetricType>('percentual')
  const [targetValue, setTargetValue] = useState<number>(100)
  const [baseline, setBaseline] = useState<string>('')
  const [currentValue, setCurrentValue] = useState<string>('')
  const [responsibleId, setResponsibleId] = useState<string>('none')
  const [deadline, setDeadline] = useState<string>('')
  const [status, setStatus] = useState<ObjectiveStatus>('Planejado')
  const [notes, setNotes] = useState('')

  // Action plan list
  const [actionPlan, setActionPlan] = useState<ObjectiveActionItem[]>([])
  const [newActionDesc, setNewActionDesc] = useState('')
  const [newActionResp, setNewActionResp] = useState('')
  const [newActionDeadline, setNewActionDeadline] = useState('')

  useEffect(() => {
    if (objective) {
      setCompanyId(objective.company_id || '')
      setYear(objective.year || currentYear)
      setObjectiveText(objective.objective || '')
      setProcess(objective.process || 'SGQ')
      setIndicator(objective.indicator || '')
      setMetricType(objective.metric_type || 'percentual')
      setTargetValue(objective.target_value ?? 100)
      setBaseline(
        objective.baseline !== null && objective.baseline !== undefined
          ? String(objective.baseline)
          : '',
      )
      setCurrentValue(
        objective.current_value !== null && objective.current_value !== undefined
          ? String(objective.current_value)
          : '',
      )
      setResponsibleId(objective.responsible_id || 'none')
      setDeadline(objective.deadline ? objective.deadline.split('T')[0] : '')
      setStatus(objective.status || 'Planejado')
      setNotes(objective.notes || '')

      if (objective.action_plan) {
        if (Array.isArray(objective.action_plan)) {
          setActionPlan(objective.action_plan)
        } else if (typeof objective.action_plan === 'string') {
          try {
            setActionPlan(JSON.parse(objective.action_plan))
          } catch {
            setActionPlan([])
          }
        }
      } else {
        setActionPlan([])
      }
    } else {
      const defaultCompany =
        selectedCompanyId && selectedCompanyId !== 'all'
          ? selectedCompanyId
          : companies[0]?.id || ''
      setCompanyId(defaultCompany)
      setYear(currentYear)
      setObjectiveText('')
      setProcess('SGQ')
      setIndicator('')
      setMetricType('percentual')
      setTargetValue(100)
      setBaseline('')
      setCurrentValue('')
      setResponsibleId('none')
      setDeadline('')
      setStatus('Planejado')
      setNotes('')
      setActionPlan([])
    }
  }, [objective, open, selectedCompanyId, companies, currentYear])

  const handleAddAction = () => {
    if (!newActionDesc.trim()) return
    const newItem: ObjectiveActionItem = {
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      description: newActionDesc.trim(),
      responsible: newActionResp.trim(),
      deadline: newActionDeadline,
      status: 'Aberta',
    }
    setActionPlan([...actionPlan, newItem])
    setNewActionDesc('')
    setNewActionResp('')
    setNewActionDeadline('')
  }

  const handleRemoveAction = (id: string) => {
    setActionPlan(actionPlan.filter((a) => a.id !== id))
  }

  const handleUpdateActionStatus = (
    id: string,
    st: 'Aberta' | 'Em andamento' | 'Concluída' | 'Cancelada',
  ) => {
    setActionPlan(actionPlan.map((a) => (a.id === id ? { ...a, status: st } : a)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!objectiveText.trim() || !indicator.trim() || !companyId) {
      alert('Preencha os campos obrigatórios: Empresa, Objetivo e Indicador.')
      return
    }

    try {
      setSaving(true)
      const payload: Partial<QualityObjective> = {
        company_id: companyId,
        year: Number(year),
        objective: objectiveText.trim(),
        process,
        indicator: indicator.trim(),
        metric_type: metricType,
        target_value: Number(targetValue),
        baseline: baseline !== '' ? Number(baseline) : null,
        current_value: currentValue !== '' ? Number(currentValue) : null,
        responsible_id: responsibleId !== 'none' ? responsibleId : null,
        deadline: deadline || null,
        status,
        action_plan: actionPlan,
        notes: notes.trim() || null,
      }
      await onSave(payload)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error saving objective:', err)
      alert('Erro ao salvar objetivo da qualidade: ' + (err.message || 'Verifique os dados.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-primary" />
            {objective
              ? 'Editar Objetivo da Qualidade (§6.2)'
              : 'Novo Objetivo da Qualidade (ISO 9001 §6.2)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Company & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
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
              <Label className="text-xs">Ano *</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Processo SGQ (FSGQ 8.7-1) *</Label>
              <Select value={process} onValueChange={setProcess}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {OBJECTIVE_PROCESS_LIST.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Objective Statement */}
          <div>
            <Label className="text-xs">Descrição do Objetivo da Qualidade *</Label>
            <Textarea
              placeholder="Ex.: Reduzir o índice de retrabalho no setor de caldeiraria e solda em 20%..."
              value={objectiveText}
              onChange={(e) => setObjectiveText(e.target.value)}
              className="text-xs mt-1 min-h-[60px]"
              required
            />
          </div>

          {/* Indicator & Metric */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Indicador / KPI Vinculado *</Label>
              <Input
                placeholder="Ex.: % de Retrabalho, IRPI, INCF, Lead Time..."
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Tipo de Métrica *</Label>
              <Select value={metricType} onValueChange={(v) => setMetricType(v as MetricType)}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="número">Número (unidades)</SelectItem>
                  <SelectItem value="dias">Dias (prazo)</SelectItem>
                  <SelectItem value="custo">Custo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Meta Prevista *</Label>
              <Input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="h-8 text-xs mt-1 font-bold text-primary"
                required
              />
            </div>
          </div>

          {/* Baseline, Current & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Linha de Base (Baseline)</Label>
              <Input
                type="number"
                step="any"
                placeholder="Valor anterior"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Valor Atual (Acompanhamento)</Label>
              <Input
                type="number"
                step="any"
                placeholder="Realizado atual"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="h-8 text-xs mt-1 font-semibold"
              />
            </div>

            <div>
              <Label className="text-xs">Prazo Limite (Deadline)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Status do Objetivo</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ObjectiveStatus)}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejado">Planejado</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Atingido">Atingido</SelectItem>
                  <SelectItem value="Não atingido">Não atingido</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsible & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Responsável pelo Objetivo</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.role ? `(${u.role})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Observações / Método de Medição</Label>
              <Input
                placeholder="Fórmula de cálculo, fonte dos dados..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          {/* Plano de Ação por Objetivo (§6.2.2 - O que será feito, recursos, quem, quando) */}
          <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                <ListPlus className="w-4 h-4 text-primary" />
                Plano de Ação para o Objetivo (ISO 9001 §6.2.2)
              </span>
              <span className="text-[11px] text-muted-foreground">
                {actionPlan.length} ação(ões) cadastradas
              </span>
            </div>

            {/* Existing Actions List */}
            {actionPlan.length > 0 && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {actionPlan.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-2 p-2 bg-background border rounded text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{action.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>Resp: {action.responsible || '—'}</span>
                        <span>Prazo: {action.deadline || '—'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Select
                        value={action.status}
                        onValueChange={(v) => handleUpdateActionStatus(action.id, v as any)}
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
                        onClick={() => handleRemoveAction(action.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add action row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t">
              <div className="sm:col-span-6">
                <Input
                  placeholder="O que será feito (ação prática)..."
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

          <DialogFooter className="pt-2">
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
              {saving ? 'Salvando...' : 'Salvar Objetivo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
