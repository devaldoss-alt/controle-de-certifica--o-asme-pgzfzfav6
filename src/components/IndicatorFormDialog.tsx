import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createIndicator, type IndicatorFormData } from '@/services/indicators'
import { getUsers, type User } from '@/services/api'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Loader2, Building2 } from 'lucide-react'

const PERIODS = ['Annual', 'Semestral', 'Monthly'] as const
const OPERATORS = ['≥', '>', '<', '≤', '='] as const
const RESULT_TYPES = ['Percentual', 'Numérico'] as const

export function IndicatorFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId, allocations, companies } = useCompany()
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const effectiveCompanyId =
    selectedCompanyId !== 'all'
      ? selectedCompanyId
      : user?.primary_company_id || (allocations.length > 0 ? allocations[0].company_id : '')

  const companyName = companies.find((c) => c.id === effectiveCompanyId)?.name || ''

  const [form, setForm] = useState<IndicatorFormData>({
    title: '',
    objective: '',
    formula_description: '',
    target_value: 0,
    unit: '%',
    period: 'Monthly',
    result_type: 'Percentual',
    verification_method: '',
    target_operator: '≥',
    responsible: undefined,
  })

  useEffect(() => {
    if (open) {
      getUsers()
        .then((data: User[]) => setUsers(data || []))
        .catch(() => {})
      setGeneralError('')
      setFieldErrors({})
      setForm({
        title: '',
        objective: '',
        formula_description: '',
        target_value: 0,
        unit: '%',
        period: 'Monthly',
        result_type: 'Percentual',
        verification_method: '',
        target_operator: '≥',
        responsible: undefined,
      })
    }
  }, [open])

  const isFormValid = form.title.trim() !== '' && !!form.responsible

  const handleSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!form.title.trim()) {
      errors.title = txt('Título é obrigatório', 'Title is required')
    }
    if (!form.responsible) {
      errors.responsible = txt('Responsável é obrigatório', 'Responsible is required')
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    if (!effectiveCompanyId) {
      setGeneralError(txt('Selecione uma empresa ativa', 'Select an active company'))
      return
    }
    setLoading(true)
    setGeneralError('')
    setFieldErrors({})
    try {
      await createIndicator({ ...form, company_id: effectiveCompanyId })
      toast({ title: txt('Indicador criado com sucesso', 'Indicator created successfully') })
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      const msg = e?.message || txt('Erro ao criar indicador', 'Error creating indicator')
      setGeneralError(msg)
    } finally {
      setLoading(false)
    }
  }

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {txt('Novo Indicador', 'New Indicator')}
          </DialogTitle>
          <DialogDescription>
            {txt('Cadastre um novo KPI para acompanhamento', 'Register a new KPI for tracking')}
          </DialogDescription>
        </DialogHeader>
        {companyName && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-white/80">{txt('Empresa:', 'Company:')}</span>
            <span className="text-sm text-white font-medium">{companyName}</span>
          </div>
        )}
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">{txt('Título *', 'Title *')}</Label>
            <Input
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value })
                clearFieldError('title')
              }}
              className="bg-black/20 border-white/10 text-white"
            />
            {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">{txt('Objetivo', 'Objective')}</Label>
            <Input
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">
              {txt('Fórmula / Descrição', 'Formula / Description')}
            </Label>
            <Input
              value={form.formula_description}
              onChange={(e) => setForm({ ...form, formula_description: e.target.value })}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">
              {txt('Método de Verificação', 'Verification Method')}
            </Label>
            <Input
              value={form.verification_method}
              onChange={(e) => setForm({ ...form, verification_method: e.target.value })}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Meta', 'Target')}</Label>
              <Input
                type="number"
                step="any"
                value={form.target_value}
                onChange={(e) =>
                  setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Operador', 'Operator')}</Label>
              <Select
                value={form.target_operator}
                onValueChange={(v) => setForm({ ...form, target_operator: v })}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10">
                  {OPERATORS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Unidade', 'Unit')}</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Tipo de Resultado', 'Result Type')}</Label>
              <Select
                value={form.result_type}
                onValueChange={(v) => setForm({ ...form, result_type: v })}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10">
                  {RESULT_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Período', 'Period')}</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10">
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Responsável *', 'Responsible *')}</Label>
              <Select
                value={form.responsible || 'none'}
                onValueChange={(v) => {
                  setForm({ ...form, responsible: v === 'none' ? undefined : v })
                  clearFieldError('responsible')
                }}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10">
                  <SelectItem value="none">—</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.responsible && (
                <p className="text-sm text-destructive">{fieldErrors.responsible}</p>
              )}
            </div>
          </div>
          {generalError && <p className="text-sm text-destructive">{generalError}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? '...' : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
