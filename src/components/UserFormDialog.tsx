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
import { getCompanies, type Company } from '@/services/companies'
import { useI18n } from '@/hooks/use-i18n'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSaved?: () => void
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: Props) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [expiry, setExpiry] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      getCompanies()
        .then(setCompanies)
        .catch(() => {})
      setName(user?.name || '')
      setEmail(user?.email || '')
      setPassword('')
      setRole(user?.role || '')
      setExpiry(
        user?.qualification_expiry ? user.qualification_expiry.split(' ')[0].split('T')[0] : '',
      )
      setCompanyId(user?.primary_company_id || '')
      setError('')
    }
  }, [open, user])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (user) {
        await updateUser(user.id, {
          name,
          role,
          qualification_expiry: expiry || undefined,
          primary_company_id: companyId || undefined,
        })
      } else {
        if (!email || !password || !name || !role) {
          setError(t('user.errorRequired'))
          setLoading(false)
          return
        }
        if (password.length < 8) {
          setError(t('user.errorPassword'))
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
          primary_company_id: companyId || undefined,
        })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      setError(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{user ? t('user.edit') : t('user.new')}</DialogTitle>
          <DialogDescription>{user ? t('user.editDesc') : t('user.newDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">{t('user.name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">{t('user.email')}</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!user}
              className="bg-black/20 border-white/10 text-white disabled:opacity-50"
              type="email"
            />
          </div>
          {!user && (
            <div className="space-y-2">
              <Label className="text-white/80">{t('user.password')}</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/10 text-white"
                type="password"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">{t('user.role')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue />
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
              <Label className="text-white/80">{t('user.qualificationExpiry')}</Label>
              <Input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">{t('user.primaryCompany')}</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-white/10">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
