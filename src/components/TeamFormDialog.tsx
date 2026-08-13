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
import { Loader2 } from 'lucide-react'
import type { TeamMember } from '@/services/team'

export interface TeamMemberFormData {
  name: string
  company_id: string
  department: string
  role: string
  is_indicator: boolean
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

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name || '',
          company_id: editing.company_id || '',
          department: editing.department || '',
          role: editing.role || 'Colaborador',
          is_indicator: !!editing.is_indicator,
        })
      } else {
        setForm({
          ...EMPTY,
          company_id: defaultCompanyId || '',
        })
      }
    }
  }, [open, editing, defaultCompanyId])

  const handleSave = async () => {
    if (!form.name.trim()) return
    await onSave({ ...form, name: form.name.trim() })
  }

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
            <Input
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="bg-black/20 border-white/10 text-white"
              placeholder="Colaborador"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={form.is_indicator}
              onCheckedChange={(c) => setForm((p) => ({ ...p, is_indicator: !!c }))}
            />
            <span className="text-sm text-white/80">
              Responsável por indicador (aparece na matriz de permissões de documentos)
            </span>
          </label>
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
