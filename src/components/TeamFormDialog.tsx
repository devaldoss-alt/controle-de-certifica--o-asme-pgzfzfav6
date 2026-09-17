import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, X, Check, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTeamMembers, type TeamMember } from '@/services/team'

export interface TeamMemberFormData {
  name: string
  company_id: string
  department: string
  role: string
  is_indicator: boolean
  linked_operators?: string[]
}

interface CompanyOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: TeamMemberFormData) => Promise<void>
  editing?: TeamMember | null
  companies: CompanyOption[]
  defaultCompanyId?: string
  isSaving?: boolean
}

const EMPTY: TeamMemberFormData = {
  name: '',
  company_id: '',
  department: '',
  role: 'Colaborador',
  is_indicator: false,
  linked_operators: [],
}

function parseLinkedOperators(raw: string | string[] | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw))
    return raw
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean)
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed))
        return parsed
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean)
      return [trimmed]
    } catch {
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

export function TeamFormDialog({
  open,
  onOpenChange,
  onSave,
  editing,
  companies,
  defaultCompanyId,
  isSaving,
}: Props) {
  const [form, setForm] = useState<TeamMemberFormData>(EMPTY)
  const [companyMembers, setCompanyMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [operatorSearch, setOperatorSearch] = useState('')

  useEffect(() => {
    if (open) {
      setOperatorSearch('')
      if (editing) {
        setForm({
          name: editing.name || '',
          company_id: editing.company_id || '',
          department: editing.department || '',
          role: editing.role || 'Colaborador',
          is_indicator: !!editing.is_indicator,
          linked_operators: parseLinkedOperators(editing.linked_operators),
        })
      } else {
        setForm({
          ...EMPTY,
          company_id: defaultCompanyId || '',
        })
      }
    }
  }, [open, editing, defaultCompanyId])

  // Load collaborators of the selected company for linking
  useEffect(() => {
    let active = true
    if (open && form.company_id) {
      setLoadingMembers(true)
      getTeamMembers({ companyId: form.company_id })
        .then((list) => {
          if (active) {
            setCompanyMembers(list)
            setLoadingMembers(false)
          }
        })
        .catch(() => {
          if (active) setLoadingMembers(false)
        })
    } else {
      setCompanyMembers([])
      setLoadingMembers(false)
    }
    return () => {
      active = false
    }
  }, [open, form.company_id])

  const handleSave = async () => {
    if (!form.name.trim()) return
    await onSave({ ...form, name: form.name.trim() })
  }

  const toggleOperator = (memberId: string) => {
    setForm((prev) => {
      const current = prev.linked_operators || []
      const exists = current.includes(memberId)
      const next = exists ? current.filter((id) => id !== memberId) : [...current, memberId]
      return { ...prev, linked_operators: next }
    })
  }

  const removeOperator = (memberId: string) => {
    setForm((prev) => ({
      ...prev,
      linked_operators: (prev.linked_operators || []).filter((id) => id !== memberId),
    }))
  }

  // Filter available collaborators in the same company (exclude the member being edited)
  const availableOperators = companyMembers.filter((m) => {
    if (editing && m.id === editing.id) return false
    return true
  })

  const filteredOperators = availableOperators.filter((m) => {
    if (!operatorSearch.trim()) return true
    const q = operatorSearch.toLowerCase().trim()
    const nameMatch = (m.name || '').toLowerCase().includes(q)
    const deptMatch = (m.department || '').toLowerCase().includes(q)
    const roleMatch = (m.role || '').toLowerCase().includes(q)
    return nameMatch || deptMatch || roleMatch
  })

  // Selected operators list
  const selectedOperatorIds = form.linked_operators || []
  const selectedOperatorMembers = selectedOperatorIds
    .map((id) => companyMembers.find((m) => m.id === id || m.name === id))
    .filter(Boolean) as TeamMember[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editing ? 'Editar Colaborador' : 'Novo Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white/80 mb-1 block">Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-black/20 border-white/10 text-white"
              placeholder="Nome do colaborador"
            />
          </div>

          <div>
            <Label className="text-white/80 mb-1 block">Empresa</Label>
            <Select
              value={form.company_id}
              onValueChange={(v) => setForm((p) => ({ ...p, company_id: v }))}
            >
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
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
            <Label className="text-white/80 mb-1 block">Departamento</Label>
            <Input
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              className="bg-black/20 border-white/10 text-white"
              placeholder="Ex.: Produção, Qualidade, Compras..."
            />
          </div>

          <div>
            <Label className="text-white/80 mb-1 block">Cargo</Label>
            <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {[
                  'Colaborador',
                  'Engenheiro',
                  'Engineer',
                  'CertifyingEngineer',
                  'NDE',
                  'Designer',
                  'Inspetor',
                  'Inspector',
                  'AI',
                  'Supervisor',
                  'Analista',
                  'Técnico',
                  'Director',
                  'QCC',
                  'Welder',
                  'Apontador',
                  'Manager',
                  'Consultor',
                ].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={form.is_indicator}
              onCheckedChange={(c) => setForm((p) => ({ ...p, is_indicator: !!c }))}
            />
            <span className="text-sm text-white/80">
              Apontador (aparece na matriz de permissões de documentos)
            </span>
          </label>

          {/* Campo para vincular operadores ao apontador */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-white/90 text-sm font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Operadores Vinculados
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedOperatorIds.length} selecionado(s)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vincule operadores da mesma empresa para que o apontador possa visualizar e lançar
              tarefas em nome deles nos Checklists.
            </p>

            {/* Chips dos operadores selecionados */}
            {selectedOperatorIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-black/30 rounded-md border border-white/10 max-h-24 overflow-y-auto">
                {selectedOperatorIds.map((id) => {
                  const member = companyMembers.find((m) => m.id === id || m.name === id)
                  const label = member?.name || id
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs py-0.5 px-2 flex items-center gap-1"
                    >
                      <span className="truncate max-w-[180px]">{label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeOperator(id)
                        }}
                        className="hover:text-white rounded-full p-0.5 transition-colors"
                        title="Remover"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Campo de busca de operadores */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                placeholder={
                  !form.company_id
                    ? 'Selecione uma empresa primeiro...'
                    : 'Buscar operadores por nome, cargo ou setor...'
                }
                disabled={!form.company_id}
                className="bg-black/20 border-white/10 text-white pl-9 h-8 text-xs placeholder:text-muted-foreground"
              />
            </div>

            {/* Lista com scroll e seleção múltipla */}
            {!form.company_id ? (
              <p className="text-xs text-muted-foreground/80 italic py-2">
                Selecione a empresa acima para carregar os colaboradores disponíveis.
              </p>
            ) : loadingMembers ? (
              <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Carregando colaboradores...
              </div>
            ) : availableOperators.length === 0 ? (
              <p className="text-xs text-muted-foreground/80 italic py-2">
                Nenhum outro colaborador encontrado nesta empresa.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto border border-white/10 rounded-md bg-black/20 p-1 space-y-1">
                {filteredOperators.map((m) => {
                  const isSelected =
                    selectedOperatorIds.includes(m.id) || selectedOperatorIds.includes(m.name)
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleOperator(m.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-primary/20 text-white border border-primary/30'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-white/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="font-medium truncate">{m.name}</span>
                        {m.department && (
                          <span className="text-muted-foreground text-[10px] shrink-0">
                            ({m.department})
                          </span>
                        )}
                        {m.role && m.role !== 'Colaborador' && (
                          <span className="text-primary/70 text-[10px] shrink-0">• {m.role}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredOperators.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum colaborador encontrado para "{operatorSearch}".
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !form.name.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
