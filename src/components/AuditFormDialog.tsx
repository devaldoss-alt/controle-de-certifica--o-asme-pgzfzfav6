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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react'
import {
  AuditProgramItem,
  AuditType,
  AuditStatus,
  AUDIT_TYPES,
  AUDIT_STATUSES,
  AUDIT_STANDARDS,
  AUDIT_PROCESS_LIST,
  validateAuditorConflict,
} from '@/services/audits'
import { Company } from '@/services/companies'
import { User } from '@/services/api'

interface AuditFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<AuditProgramItem>) => Promise<void>
  initialData?: AuditProgramItem | null
  companies: Company[]
  users: User[]
  selectedCompanyId?: string
}

export const AuditFormDialog: React.FC<AuditFormDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  companies,
  users,
  selectedCompanyId,
}) => {
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState<number>(currentYear)
  const [companyId, setCompanyId] = useState<string>('')
  const [auditScope, setAuditScope] = useState<string>(AUDIT_PROCESS_LIST[0])
  const [auditType, setAuditType] = useState<AuditType>('Interna')
  const [standardRef, setStandardRef] = useState<string[]>(['ISO 9001 §9 Avaliação de Desempenho'])
  const [plannedDate, setPlannedDate] = useState<string>('')
  const [realizedDate, setRealizedDate] = useState<string>('')
  const [auditorIds, setAuditorIds] = useState<string[]>([])
  const [status, setStatus] = useState<AuditStatus>('Planejada')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setYear(initialData.year || currentYear)
      setCompanyId(initialData.company_id || '')
      setAuditScope(initialData.audit_scope || AUDIT_PROCESS_LIST[0])
      setAuditType(initialData.audit_type || 'Interna')
      setStandardRef(
        Array.isArray(initialData.standard_ref) && initialData.standard_ref.length > 0
          ? initialData.standard_ref
          : ['ISO 9001 §9 Avaliação de Desempenho'],
      )
      setPlannedDate(initialData.planned_date ? initialData.planned_date.split('T')[0] : '')
      setRealizedDate(initialData.realized_date ? initialData.realized_date.split('T')[0] : '')
      setAuditorIds(initialData.auditor_ids || [])
      setStatus(initialData.status || 'Planejada')
      setNotes(initialData.notes || '')
    } else {
      setYear(currentYear)
      setCompanyId(
        selectedCompanyId && selectedCompanyId !== 'all'
          ? selectedCompanyId
          : companies[0]?.id || '',
      )
      setAuditScope(AUDIT_PROCESS_LIST[0])
      setAuditType('Interna')
      setStandardRef(['ISO 9001 §9 Avaliação de Desempenho'])
      setPlannedDate(new Date().toISOString().split('T')[0])
      setRealizedDate('')
      setAuditorIds([])
      setStatus('Planejada')
      setNotes('')
    }
  }, [initialData, open, selectedCompanyId, companies, currentYear])

  // Check auditor conflict against audit scope
  useEffect(() => {
    if (auditorIds.length === 0 || !auditScope) {
      setConflictWarning(null)
      return
    }

    const conflicts: string[] = []
    auditorIds.forEach((audId) => {
      const u = users.find((user) => user.id === audId)
      if (u) {
        const check = validateAuditorConflict({ id: u.id, name: u.name, role: u.role }, auditScope)
        if (check.hasConflict && check.reason) {
          conflicts.push(check.reason)
        }
      }
    })

    if (conflicts.length > 0) {
      setConflictWarning(conflicts.join(' | '))
    } else {
      setConflictWarning(null)
    }
  }, [auditorIds, auditScope, users])

  const toggleStandard = (std: string) => {
    if (standardRef.includes(std)) {
      if (standardRef.length > 1) {
        setStandardRef(standardRef.filter((s) => s !== std))
      }
    } else {
      setStandardRef([...standardRef, std])
    }
  }

  const toggleAuditor = (userId: string) => {
    if (auditorIds.includes(userId)) {
      setAuditorIds(auditorIds.filter((id) => id !== userId))
    } else {
      setAuditorIds([...auditorIds, userId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !auditScope || !plannedDate) {
      return
    }

    try {
      setSaving(true)
      await onSave({
        year: Number(year),
        company_id: companyId,
        audit_scope: auditScope,
        audit_type: auditType,
        standard_ref: standardRef,
        planned_date: plannedDate ? new Date(plannedDate).toISOString() : new Date().toISOString(),
        realized_date: realizedDate ? new Date(realizedDate).toISOString() : undefined,
        auditor_ids: auditorIds,
        status,
        notes,
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
            {initialData ? 'Editar Auditoria' : 'Planejar Nova Auditoria (ISO 9001 §9.2)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Conflict Alert (ISO 9001 §9.2.2 Rule) */}
          {conflictWarning && (
            <Alert variant="destructive" className="border-rose-500 bg-rose-50 text-rose-900">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <AlertTitle className="font-semibold text-rose-800">
                Atenção à Regra de Independência (ISO 9001 §9.2)
              </AlertTitle>
              <AlertDescription className="text-xs text-rose-700">
                {conflictWarning}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="year">Ano do Programa *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
              />
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
              <Label htmlFor="audit_type">Tipo de Auditoria *</Label>
              <Select
                value={auditType}
                onValueChange={(v) => setAuditType(v as AuditType)}
                required
              >
                <SelectTrigger id="audit_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="process">Processo / Área Auditada (Escopo) *</Label>
              <Select value={auditScope} onValueChange={setAuditScope} required>
                <SelectTrigger id="process">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {AUDIT_PROCESS_LIST.map((proc) => (
                    <SelectItem key={proc} value={proc}>
                      {proc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Lista oficial dos 21 processos do SGQ/RNC.
              </p>
            </div>

            <div>
              <Label htmlFor="status">Status da Auditoria *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AuditStatus)} required>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIT_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="plannedDate">Data Prevista *</Label>
              <Input
                id="plannedDate"
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="realizedDate">Data Realizada</Label>
              <Input
                id="realizedDate"
                type="date"
                value={realizedDate}
                onChange={(e) => setRealizedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Standards Multi-select */}
          <div>
            <Label className="block mb-1.5 font-medium">Normas e Requisitos Aplicáveis</Label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border rounded-md bg-muted/20">
              {AUDIT_STANDARDS.map((std) => {
                const selected = standardRef.includes(std)
                return (
                  <Badge
                    key={std}
                    variant={selected ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs py-1 px-2 transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                    onClick={() => toggleStandard(std)}
                  >
                    {selected ? <Check className="w-3 h-3 mr-1" /> : null}
                    {std}
                  </Badge>
                )
              })}
            </div>
          </div>

          {/* Auditors Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Equipe Auditora</Label>
              <span className="text-[11px] text-muted-foreground">
                Regra ISO: Auditor não pode auditar o próprio setor
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 border rounded-md bg-muted/20">
              {users.map((u) => {
                const selected = auditorIds.includes(u.id)
                const conflict = validateAuditorConflict(
                  { id: u.id, name: u.name, role: u.role },
                  auditScope,
                )
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleAuditor(u.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs border transition-all ${
                      selected
                        ? 'bg-primary/10 border-primary text-primary font-medium'
                        : 'border-transparent hover:bg-muted/60 text-foreground'
                    } ${conflict.hasConflict ? 'border-amber-400 bg-amber-50/50' : ''}`}
                  >
                    <div className="truncate mr-1">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {u.role || 'Usuário'}
                      </p>
                    </div>
                    {conflict.hasConflict && (
                      <span title={conflict.reason} className="shrink-0 inline-flex">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Objetivos e Notas Gerais</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Verificar eficácia das ações corretivas do ciclo anterior e adequação aos requisitos da norma..."
              rows={2}
            />
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
              {saving ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Auditoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
