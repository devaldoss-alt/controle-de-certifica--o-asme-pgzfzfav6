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
import { useToast } from '@/components/ui/use-toast'
import { Plus } from 'lucide-react'

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
  const { t } = useI18n()
  const { lang } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId } = useCompany()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

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
      setError('')
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

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError(txt('Título é obrigatório', 'Title is required'))
      return
    }
    if (!form.responsible) {
      setError(txt('Responsável é obrigatório', 'Responsible is required'))
      return
    }
    const companyId = selectedCompanyId === 'all' ? '' : selectedCompanyId
    if (!companyId) {
      setError(txt('Selecione uma empresa ativa', 'Select an active company'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await createIndicator({ ...form, company_id: companyId })
      toast({ title: txt('Indicador criado com sucesso', 'Indicator created successfully') })
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      setError(e?.message || txt('Erro ao criar indicador', 'Error creating indicator'))
    } finally {
      setLoading(false)
    }
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
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">{txt('Título *', 'Title *')}</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-black/20 border-white/10 text-white"
            />
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
                onValueChange={(v) =>
                  setForm({ ...form, responsible: v === 'none' ? undefined : v })
                }
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
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? '...' : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
