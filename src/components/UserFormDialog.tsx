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
import { ROLES } from '@/lib/role-data'
import { createUser, updateUser, type User } from '@/services/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSaved?: () => void
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [expiry, setExpiry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(user?.name || '')
      setEmail(user?.email || '')
      setPassword('')
      setRole(user?.role || '')
      setExpiry(
        user?.qualification_expiry ? user.qualification_expiry.split(' ')[0].split('T')[0] : '',
      )
      setError('')
    }
  }, [open, user])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (user) {
        await updateUser(user.id, { name, role, qualification_expiry: expiry || undefined })
      } else {
        if (!email || !password || !name || !role) {
          setError('Preencha todos os campos obrigatorios.')
          setLoading(false)
          return
        }
        if (password.length < 8) {
          setError('A senha deve ter no minimo 8 caracteres.')
          setLoading(false)
          return
        }
        await createUser({
          email,
          password,
          passwordConfirm: password,
          name,
          role,
          qualification_expiry: expiry || undefined,
        })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {user ? 'Editar Usuario' : 'Novo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'Atualize os dados do colaborador.'
              : 'Cadastre um novo colaborador no sistema.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!user}
              className="bg-black/20 border-white/10 text-white disabled:opacity-50"
              placeholder="email@psc.com"
              type="email"
            />
          </div>
          {!user && (
            <div className="space-y-2">
              <Label className="text-white/80">Senha</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/10 text-white"
                type="password"
                placeholder="Minimo 8 caracteres"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-white/80">Cargo</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-white/10">
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Validade da Qualificacao</Label>
            <Input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
