import React, { useState } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Link as LinkIcon, Paperclip } from 'lucide-react'
import {
  AuditFinding,
  FindingType,
  FindingStatus,
  FINDING_TYPES,
  FINDING_STATUSES,
  AuditProgramItem,
} from '@/services/audits'

interface AuditFindingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<AuditFinding>, files?: File[], autoCreateRNC?: boolean) => Promise<void>
  initialData?: AuditFinding | null
  audit: AuditProgramItem
}

export const AuditFindingDialog: React.FC<AuditFindingDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  audit,
}) => {
  const [type, setType] = useState<FindingType>(initialData?.type || 'Não Conformidade')
  const [description, setDescription] = useState(initialData?.description || '')
  const [responsible, setResponsible] = useState(initialData?.responsible || '')
  const [deadline, setDeadline] = useState(
    initialData?.deadline ? initialData.deadline.split('T')[0] : '',
  )
  const [status, setStatus] = useState<FindingStatus>(initialData?.status || 'Aberto')
  const [autoCreateRNC, setAutoCreateRNC] = useState<boolean>(true)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (initialData) {
      setType(initialData.type)
      setDescription(initialData.description)
      setResponsible(initialData.responsible || '')
      setDeadline(initialData.deadline ? initialData.deadline.split('T')[0] : '')
      setStatus(initialData.status)
      setAutoCreateRNC(false)
      setEvidenceFiles([])
    } else {
      setType('Não Conformidade')
      setDescription('')
      setResponsible('')
      setDeadline('')
      setStatus('Aberto')
      setAutoCreateRNC(true)
      setEvidenceFiles([])
    }
  }, [initialData, open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    try {
      setSaving(true)
      await onSave(
        {
          audit_id: audit.id,
          type,
          description,
          responsible,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          status,
        },
        evidenceFiles,
        type === 'Não Conformidade' && autoCreateRNC && !initialData?.linked_rnc_id,
      )
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Achado de Auditoria' : 'Registrar Novo Achado de Auditoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="finding-type">Classificação do Achado *</Label>
            <Select value={type} onValueChange={(v) => setType(v as FindingType)}>
              <SelectTrigger id="finding-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINDING_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição Detalhada do Achado *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a evidência objetiva observada, o requisito e o impacto..."
              rows={4}
              required
            />
          </div>

          {/* Special trigger for Non Conformity -> Linked RNC */}
          {type === 'Não Conformidade' && !initialData?.linked_rnc_id && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4 text-rose-600" />
                  <label
                    htmlFor="chk-auto-rnc"
                    className="text-xs font-semibold text-rose-900 cursor-pointer"
                  >
                    Criar RNC vinculada automaticamente?
                  </label>
                </div>
                <input
                  id="chk-auto-rnc"
                  type="checkbox"
                  checked={autoCreateRNC}
                  onChange={(e) => setAutoCreateRNC(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-rose-700 leading-tight">
                Gera um novo registro na collection oficial <code>non_conformities</code> com origem
                "Auditorias" e estabelece o vínculo bidirecional entre o achado e a RNC.
              </p>
            </div>
          )}

          {initialData?.linked_rnc_id && (
            <Alert className="bg-slate-50 border-slate-200">
              <LinkIcon className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                Este achado já possui RNC vinculada no sistema (ID: {initialData.linked_rnc_id}).
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="responsible">Responsável pela Ação</Label>
              <Input
                id="responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Nome do colaborador"
              />
            </div>

            <div>
              <Label htmlFor="deadline">Prazo para Resolução</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="finding-status">Status do Achado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FindingStatus)}>
                <SelectTrigger id="finding-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINDING_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="evidence-file">Anexar Evidência</Label>
              <Input
                id="evidence-file"
                type="file"
                multiple
                onChange={handleFileChange}
                className="text-xs"
              />
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
              {saving ? 'Gravando...' : 'Salvar Achado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
