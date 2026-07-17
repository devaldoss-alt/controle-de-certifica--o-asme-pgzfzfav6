import { useCompany } from '@/hooks/use-company'
import { useI18n } from '@/hooks/use-i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2 } from 'lucide-react'

export function CompanySelector() {
  const { companies, selectedCompanyId, setSelectedCompanyId, availableCompanyIds } = useCompany()
  const { t } = useI18n()

  const availableCompanies = companies.filter((c) => availableCompanyIds.includes(c.id))

  if (availableCompanies.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground hidden sm:block" />
      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
        <SelectTrigger className="w-40 h-8 text-xs bg-black/20 border-white/10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('company.all')}</SelectItem>
          {availableCompanies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
