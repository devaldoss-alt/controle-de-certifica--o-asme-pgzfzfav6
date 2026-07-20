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
import { Badge } from '@/components/ui/badge'
import { Building2, X, Plus } from 'lucide-react'
import { getCompanies, type Company } from '@/services/companies'
import {
  getAllAllocations,
  createAllocation,
  deleteAllocation,
  type UserAllocation,
} from '@/services/allocations'
import { useI18n } from '@/hooks/use-i18n'
import { localizedField } from '@/lib/i18n-content'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  userId: string
  userName: string
}

export function AllocationDialog({ open, onOpenChange, userId, userName }: Props) {
  const { t, lang } = useI18n()
  const [companies, setCompanies] = useState<Company[]>([])
  const [allocations, setAllocations] = useState<UserAllocation[]>([])

  const loadData = async () => {
    const [compData, allocData] = await Promise.all([getCompanies(), getAllAllocations()])
    setCompanies(compData)
    setAllocations(allocData.filter((a) => a.user_id === userId))
  }

  useEffect(() => {
    if (open && userId) loadData()
  }, [open, userId])

  const userCompanyIds = allocations.map((a) => a.company_id)
  const available = companies.filter((c) => !userCompanyIds.includes(c.id))

  const handleAdd = async (companyId: string) => {
    await createAllocation(userId, companyId)
    loadData()
  }

  const handleRemove = async (allocId: string) => {
    await deleteAllocation(allocId)
    loadData()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('company.allocations')} — {userName}
          </DialogTitle>
          <DialogDescription>{t('company.allocationsDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex flex-wrap gap-2">
            {allocations.map((a) => {
              const comp = companies.find((c) => c.id === a.company_id)
              return (
                <Badge
                  key={a.id}
                  variant="outline"
                  className="border-primary/20 text-primary pl-3 pr-1 py-1"
                >
                  <Building2 className="w-3 h-3 mr-1" />
                  {localizedField(comp?.name, comp?.name_en, lang) || '—'}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(a.id)}
                    className="h-5 w-5 ml-1 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )
            })}
            {allocations.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('company.noAllocations')}</p>
            )}
          </div>
          {available.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs text-muted-foreground mb-2">{t('company.addAllocation')}</p>
              <div className="flex flex-wrap gap-2">
                {available.map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(c.id)}
                    className="border-white/10 text-muted-foreground hover:text-primary h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {localizedField(c.name, c.name_en, lang)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-primary hover:bg-primary/90">
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
