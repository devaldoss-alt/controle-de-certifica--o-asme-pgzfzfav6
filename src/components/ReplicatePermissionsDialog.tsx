import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import { replicatePermissions } from '@/services/module-permissions'
import { ROLES, roleData } from '@/lib/role-data'

interface ReplicatePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId?: string
  onCompleted?: () => void
}

export function ReplicatePermissionsDialog({
  open,
  onOpenChange,
  companyId,
  onCompleted,
}: ReplicatePermissionsDialogProps) {
  const { user } = useAuth()
  const { lang } = useI18n()
  const { toast } = useToast()
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const [sourceRole, setSourceRole] = useState<string>('')
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [confirmStep, setConfirmStep] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Roles available for source & target
  const availableRoles = useMemo(() => {
    return (ROLES as readonly string[]).filter((r) => r !== 'Manager' && r !== 'Director')
  }, [])

  const targetRoleOptions = useMemo(() => {
    return availableRoles.filter((r) => r !== sourceRole)
  }, [availableRoles, sourceRole])

  const handleToggleTarget = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((id) => id !== role) : [...prev, role],
    )
  }

  const handleSelectAllTargets = () => {
    if (targetRoles.length === targetRoleOptions.length) {
      setTargetRoles([])
    } else {
      setTargetRoles([...targetRoleOptions])
    }
  }

  const handleReset = () => {
    setSourceRole('')
    setTargetRoles([])
    setConfirmStep(false)
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  const handleExecuteReplication = async () => {
    if (!sourceRole || targetRoles.length === 0) return

    setSubmitting(true)
    try {
      const res = await replicatePermissions({
        companyId,
        sourceRole,
        sourceLabel: sourceRole,
        targetRoles,
        targetLabels: targetRoles,
        replicatedByName: user?.name || user?.email || 'Gestor',
      })

      if (res.success) {
        toast({
          title: txt('Permissões replicadas com sucesso!', 'Permissions replicated successfully!'),
          description: txt(
            `As permissões de "${sourceRole}" foram copiadas para ${targetRoles.length} cargo(s).`,
            `Permissions from "${sourceRole}" were replicated to ${targetRoles.length} role(s).`,
          ),
        })
        handleClose()
        onCompleted?.()
      } else {
        toast({
          title: txt('Falha na replicação', 'Replication failed'),
          description:
            res.error ||
            txt('Não foi possível replicar as permissões.', 'Could not replicate permissions.'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: txt('Erro inesperado', 'Unexpected error'),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/20 text-white sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Copy className="w-5 h-5" />
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
              Onda F • Controle de Acesso
            </Badge>
          </div>
          <DialogTitle className="text-lg font-heading">
            {txt('Replicar Permissões entre Cargos', 'Replicate Role Permissions')}
          </DialogTitle>
          <DialogDescription className="text-xs text-white/70">
            {txt(
              'Copie rapidamente todas as regras de visualização e edição de um cargo modelo para outro(s) sem precisar marcar módulo por módulo.',
              'Quickly copy all view and edit rules from a template role to other role(s) without toggling each module manually.',
            )}
          </DialogDescription>
        </DialogHeader>

        {!confirmStep ? (
          <div className="space-y-4 py-2">
            {/* Step 1: Select Source Role */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-white/90">
                1. {txt('Selecione o Cargo de Origem (Modelo):', 'Select Source Role (Template):')}
              </Label>
              <Select
                value={sourceRole}
                onValueChange={(v) => {
                  setSourceRole(v)
                  setTargetRoles([])
                }}
              >
                <SelectTrigger className="h-9 bg-black/40 border-white/15 text-xs text-white">
                  <SelectValue
                    placeholder={txt('Escolha o cargo de origem...', 'Choose source role...')}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">
                      {role} {roleData[role] ? `— ${roleData[role].objetivo.slice(0, 45)}...` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Target Roles */}
            {sourceRole && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-white/90">
                    2. {txt('Selecione o(s) Cargo(s) de Destino:', 'Select Destination Role(s):')}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllTargets}
                    className="h-6 text-[10px] text-primary hover:text-primary/80"
                  >
                    {targetRoles.length === targetRoleOptions.length
                      ? txt('Desmarcar Todos', 'Deselect All')
                      : txt('Selecionar Todos', 'Select All')}
                  </Button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-black/30 border border-white/10">
                  {targetRoleOptions.map((role) => {
                    const checked = targetRoles.includes(role)
                    return (
                      <label
                        key={role}
                        className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-primary/20 border border-primary/40 text-white'
                            : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggleTarget(role)}
                          />
                          <span className="font-medium">{role}</span>
                        </div>
                        <span className="text-[10px] text-white/50 max-w-[200px] truncate">
                          {roleData[role]?.objetivo || ''}
                        </span>
                      </label>
                    )
                  })}
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>
                    {targetRoles.length} {txt('cargo(s) selecionado(s)', 'role(s) selected')}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-xs text-white/70"
              >
                {txt('Cancelar', 'Cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!sourceRole || targetRoles.length === 0}
                onClick={() => setConfirmStep(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
              >
                <span>{txt('Continuar', 'Continue')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Confirmation Step with Safety Warning */
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {txt(
                    'Atenção: Ação de Substituição de Permissões',
                    'Warning: Permission Overwrite Action',
                  )}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-amber-200/90">
                {txt(
                  'As permissões atuais dos cargos destino serão substituídas integralmente pelas regras do cargo de origem. Esta alteração entra em vigor imediatamente para todos os usuários destes cargos.',
                  'Current permissions for destination roles will be entirely replaced by the source template. This change takes effect immediately for all users in those roles.',
                )}
              </p>
            </div>

            {/* Visual Summary */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  {txt('Origem (Modelo)', 'Source (Template)')}
                </span>
                <Badge className="bg-primary/30 text-white border-primary/40 text-xs">
                  {sourceRole}
                </Badge>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  {txt('Destinos afetados', 'Affected Destinations')} ({targetRoles.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {targetRoles.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="border-white/20 text-xs text-white"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmStep(false)}
                disabled={submitting}
                className="text-xs text-white/70"
              >
                {txt('Voltar', 'Back')}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submitting}
                onClick={handleExecuteReplication}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {txt('Replicando...', 'Replicating...')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {txt('Confirmar e Replicar', 'Confirm and Replicate')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
