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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

const PERIODS = ['Annual', 'Semestral', 'Monthly'] as const

export function IndicatorFormDialog({ open, onOpenChange, onSaved }: Props) {
  const { t } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId } = useCompany()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<IndicatorFormData>({
    title: '',
    formula_description: '',
    target_value: 0,
    unit: '%',
    period: 'Monthly',
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
        formula_description: '',
        target_value: 0,
        unit: '%',
        period: 'Monthly',
        responsible: undefined,
      })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError(t('common.required') || 'Title is required')
      return
    }
    const companyId = selectedCompanyId === 'all' ? '' : selectedCompanyId
    if (!companyId) {
      setError('Selecione uma empresa ativa')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createIndicator({
        ...form,
        company_id: companyId,
      })
      toast({ title: 'Indicador criado com sucesso' })
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar indicador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Novo Indicador
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo KPI para acompanhar metas de desempenho
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: ISC - Índice de Satisfação do Cliente"
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Fórmula / Descrição</Label>
            <Input
              value={form.formula_description}
              onChange={(e) => setForm({ ...form, formula_description: e.target.value })}
              placeholder="Ex: ISC = (Pontos Obtidos / Total Avaliados) x 100"
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">Meta (Target)</Label>
              <Input
                type="number"
                value={form.target_value}
                onChange={(e) =>
                  setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Unidade</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="%, h, pts"
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">Período</Label>
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
              <Label className="text-white/80">Responsável</Label>
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
