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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Plus, Calendar, Trash2 } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import {
  getHistory,
  createHistory,
  deleteHistory,
  type IndicatorHistory,
} from '@/services/indicator-history'
import { safeFormatDate } from '@/lib/safe-data'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  indicatorId: string
  indicatorTitle: string
  canEdit: boolean
  onSaved?: () => void
}

export function IndicatorHistoryDialog({
  open,
  onOpenChange,
  indicatorId,
  indicatorTitle,
  canEdit,
  onSaved,
}: Props) {
  const { lang } = useI18n()
  const { toast } = useToast()
  const [history, setHistory] = useState<IndicatorHistory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [value, setValue] = useState('')
  const [periodDate, setPeriodDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const resetForm = () => {
    setValue('')
    setPeriodDate('')
    setNotes('')
    setFile(null)
    setFieldErrors({})
  }

  useEffect(() => {
    if (open) {
      getHistory(indicatorId).then(setHistory)
      setShowForm(false)
      resetForm()
    }
  }, [open, indicatorId])

  const handleSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!value.trim() || isNaN(parseFloat(value)))
      errors.value = txt('Valor numérico obrigatório', 'Numeric value required')
    if (!periodDate) errors.periodDate = txt('Data obrigatória', 'Date required')
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setFieldErrors({})
    const fd = new FormData()
    fd.append('indicator_id', indicatorId)
    fd.append('value', value)
    fd.append('period_date', periodDate)
    fd.append('notes', notes)
    if (file) fd.append('evidence', file)

    try {
      await createHistory(fd)
      toast({ title: txt('Medição registrada', 'Measurement recorded') })
      resetForm()
      setShowForm(false)
      getHistory(indicatorId).then(setHistory)
      onSaved?.()
    } catch (e) {
      const errs = extractFieldErrors(e)
      if (Object.keys(errs).length > 0) setFieldErrors(errs)
      toast({
        title: txt('Erro ao salvar', 'Error saving'),
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id)
      toast({ title: txt('Registro excluído', 'Record deleted') })
      getHistory(indicatorId).then(setHistory)
    } catch {
      toast({ title: txt('Erro', 'Error'), variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {txt('Histórico de Medições', 'Measurement History')}
          </DialogTitle>
          <DialogDescription>{indicatorTitle}</DialogDescription>
        </DialogHeader>

        {canEdit && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 w-fit"
          >
            <Plus className="w-4 h-4 mr-2" />
            {txt('Nova Medição', 'New Measurement')}
          </Button>
        )}

        {showForm && (
          <div className="space-y-4 p-4 rounded-lg bg-black/20 border border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/80">{txt('Valor *', 'Value *')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="0.00"
                />
                {fieldErrors.value && (
                  <p className="text-xs text-destructive">{fieldErrors.value}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">
                  {txt('Data de Referência *', 'Reference Date *')}
                </Label>
                <Input
                  type="date"
                  value={periodDate}
                  onChange={(e) => setPeriodDate(e.target.value)}
                  className="bg-black/20 border-white/10 text-white"
                />
                {fieldErrors.periodDate && (
                  <p className="text-xs text-destructive">{fieldErrors.periodDate}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">
                {txt('Evidência (PDF/Imagem)', 'Evidence (PDF/Image)')}
              </Label>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-white/20 hover:border-primary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : txt('Selecionar arquivo...', 'Select file...')}
                  </span>
                </div>
                <Input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">{txt('Observações', 'Notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-black/20 border-white/10 text-white min-h-16"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="border-white/10 text-white hover:bg-white/5"
              >
                {txt('Cancelar', 'Cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? '...' : txt('Registrar', 'Record')}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {txt('Nenhum registro encontrado', 'No records found')}
            </p>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5"
              >
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{h.value}</span>
                    <Badge variant="secondary" className="text-xs">
                      {safeFormatDate(h.period_date, 'dd/MM/yyyy')}
                    </Badge>
                  </div>
                  {h.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{h.notes}</p>
                  )}
                </div>
                {h.evidence && <FileText className="w-4 h-4 text-primary shrink-0" />}
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-rose-500 hover:text-rose-400 shrink-0"
                    onClick={() => handleDelete(h.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
