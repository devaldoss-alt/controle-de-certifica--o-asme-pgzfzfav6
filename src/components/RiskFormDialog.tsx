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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RiskRegisterItem,
  RiskType,
  TreatmentStatus,
  RiskStatus,
  RISK_TYPES,
  RISK_PROCESS_LIST,
  RISK_CAUSE_CATEGORIES,
  TREATMENT_STATUSES,
  RISK_STATUSES,
  calculateRiskLevelAndGrade,
} from '@/services/risks'
import { Company } from '@/services/companies'

interface RiskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<RiskRegisterItem>) => Promise<void>
  initialData?: RiskRegisterItem | null
  companies: Company[]
  selectedCompanyId?: string
}

export const RiskFormDialog: React.FC<RiskFormDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  companies,
  selectedCompanyId,
}) => {
  const [companyId, setCompanyId] = useState('')
  const [process, setProcess] = useState<string>(RISK_PROCESS_LIST[0])
  const [type, setType] = useState<RiskType>('Risco')
  const [description, setDescription] = useState('')
  const [causeCategory, setCauseCategory] = useState<string>(RISK_CAUSE_CATEGORIES[0])
  const [probability, setProbability] = useState<number>(3)
  const [impact, setImpact] = useState<number>(3)
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [treatmentResponsible, setTreatmentResponsible] = useState('')
  const [treatmentDeadline, setTreatmentDeadline] = useState('')
  const [treatmentStatus, setTreatmentStatus] = useState<TreatmentStatus>('Planejado')
  const [status, setStatus] = useState<RiskStatus>('Ativo')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setCompanyId(initialData.company_id || '')
      setProcess(initialData.process || RISK_PROCESS_LIST[0])
      setType(initialData.type || 'Risco')
      setDescription(initialData.description || '')
      setCauseCategory(initialData.cause_category || RISK_CAUSE_CATEGORIES[0])
      setProbability(initialData.probability || 3)
      setImpact(initialData.impact || 3)
      setTreatmentPlan(initialData.treatment_plan || '')
      setTreatmentResponsible(initialData.treatment_responsible || '')
      setTreatmentDeadline(
        initialData.treatment_deadline ? initialData.treatment_deadline.split('T')[0] : '',
      )
      setTreatmentStatus(initialData.treatment_status || 'Planejado')
      setStatus(initialData.status || 'Ativo')
    } else {
      setCompanyId(
        selectedCompanyId && selectedCompanyId !== 'all'
          ? selectedCompanyId
          : companies[0]?.id || '',
      )
      setProcess(RISK_PROCESS_LIST[0])
      setType('Risco')
      setDescription('')
      setCauseCategory(RISK_CAUSE_CATEGORIES[0])
      setProbability(3)
      setImpact(3)
      setTreatmentPlan('')
      setTreatmentResponsible('')
      setTreatmentDeadline('')
      setTreatmentStatus('Planejado')
      setStatus('Ativo')
    }
  }, [initialData, open, selectedCompanyId, companies])

  const calculated = calculateRiskLevelAndGrade(probability, impact)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !process || !description.trim()) return

    try {
      setSaving(true)
      await onSave({
        company_id: companyId,
        process,
        type,
        description,
        cause_category: causeCategory,
        probability: Number(probability),
        impact: Number(impact),
        risk_level: calculated.level,
        risk_grade: calculated.grade,
        treatment_plan: treatmentPlan,
        treatment_responsible: treatmentResponsible,
        treatment_deadline: treatmentDeadline
          ? new Date(treatmentDeadline).toISOString()
          : undefined,
        treatment_status: treatmentStatus,
        status,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? `Editar ${type === 'Risco' ? 'Risco' : 'Oportunidade'}`
              : 'Cadastrar Risco ou Oportunidade (ISO 9001 §6.1)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="risk-type">Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as RiskType)}>
                <SelectTrigger id="risk-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
                <SelectTrigger id="company">
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
              <Label htmlFor="process">Processo do SGQ *</Label>
              <Select value={process} onValueChange={setProcess} required>
                <SelectTrigger id="process">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {RISK_PROCESS_LIST.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="desc">
              Descrição do {type === 'Risco' ? 'Risco' : 'da Oportunidade'} *
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o evento incerto, sua causa potencial e o efeito esperado nos objetivos da qualidade..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cause_cat">Categoria da Causa</Label>
              <Select value={causeCategory} onValueChange={setCauseCategory}>
                <SelectTrigger id="cause_cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CAUSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status do Registro</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Probability & Impact Matrix Calculation */}
          <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avaliação Qualitativa (Matriz 5×5)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label htmlFor="prob">Probabilidade (1 a 5):</Label>
                  <span className="font-bold">{probability}</span>
                </div>
                <Select
                  value={String(probability)}
                  onValueChange={(v) => setProbability(Number(v))}
                >
                  <SelectTrigger id="prob">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Rara / Improvável</SelectItem>
                    <SelectItem value="2">2 - Rara / Pouco Provável</SelectItem>
                    <SelectItem value="3">3 - Possível / Moderada</SelectItem>
                    <SelectItem value="4">4 - Provável / Frequente</SelectItem>
                    <SelectItem value="5">5 - Muito Provável / Quase Certo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label htmlFor="imp">Impacto no SGQ (1 a 5):</Label>
                  <span className="font-bold">{impact}</span>
                </div>
                <Select value={String(impact)} onValueChange={(v) => setImpact(Number(v))}>
                  <SelectTrigger id="imp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Insignificante / Mínimo</SelectItem>
                    <SelectItem value="2">2 - Baixo / Pequeno desvio</SelectItem>
                    <SelectItem value="3">3 - Moderado / Requer correção</SelectItem>
                    <SelectItem value="4">4 - Alto / RNC Grave ou atraso</SelectItem>
                    <SelectItem value="5">5 - Crítico / Reclamação ou Não-certificação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calculated Level Banner */}
            <div
              className={`p-3 rounded-md border flex items-center justify-between ${calculated.colorClass}`}
            >
              <div>
                <span className="text-xs block font-medium">Nível de Risco Calculado:</span>
                <span className="text-sm font-bold">
                  {probability} × {impact} = Nível {calculated.level}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs block font-medium">Classificação:</span>
                <span className="text-sm font-black uppercase tracking-wide">
                  {calculated.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Treatment Plan Section */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plano de Tratamento / Mitigação / Aproveitamento
            </h4>

            <div>
              <Label htmlFor="treatment">Ação de Tratamento</Label>
              <Textarea
                id="treatment"
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Descreva as ações preventivas, controles operacionais ou melhorias para tratar este risco/oportunidade..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="resp">Responsável pela Ação</Label>
                <Input
                  id="resp"
                  value={treatmentResponsible}
                  onChange={(e) => setTreatmentResponsible(e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <Label htmlFor="t_deadline">Prazo de Conclusão</Label>
                <Input
                  id="t_deadline"
                  type="date"
                  value={treatmentDeadline}
                  onChange={(e) => setTreatmentDeadline(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="t_status">Status do Tratamento</Label>
                <Select
                  value={treatmentStatus}
                  onValueChange={(v) => setTreatmentStatus(v as TreatmentStatus)}
                >
                  <SelectTrigger id="t_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Gravando...' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
