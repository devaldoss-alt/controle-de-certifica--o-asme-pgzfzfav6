import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getCompanies, type Company } from '@/services/companies'
import { getAllocations, type UserAllocation } from '@/services/allocations'

interface CompanyContextType {
  companies: Company[]
  allocations: UserAllocation[]
  selectedCompanyId: string | 'all'
  setSelectedCompanyId: (id: string | 'all') => void
  availableCompanyIds: string[]
  isGentiUser: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (!context) throw new Error('useCompany must be used within a CompanyProvider')
  return context
}

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [allocations, setAllocations] = useState<UserAllocation[]>([])
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | 'all'>('all')
  const [isGentiUser, setIsGentiUser] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const loadData = async () => {
      try {
        const [compData, allocData] = await Promise.all([getCompanies(), getAllocations(user.id)])
        setCompanies(compData)
        setAllocations(allocData)

        const genti = compData.find((c) => c.name.toLowerCase().includes('genti'))
        const hasGenti =
          allocData.some((a) => a.company_id === genti?.id) || user.primary_company_id === genti?.id
        setIsGentiUser(!!hasGenti && (user.role === 'Manager' || user.role === 'QCC'))

        const saved = localStorage.getItem('selected-company')
        if (saved && (saved === 'all' || compData.some((c) => c.id === saved))) {
          setSelectedCompanyIdState(saved)
        } else if (user.primary_company_id) {
          setSelectedCompanyIdState(user.primary_company_id)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
  }, [user?.id])

  const setSelectedCompanyId = (id: string | 'all') => {
    setSelectedCompanyIdState(id)
    localStorage.setItem('selected-company', id)
  }

  const availableCompanyIds = [
    ...allocations.map((a) => a.company_id),
    ...(user?.primary_company_id ? [user.primary_company_id] : []),
  ]

  return (
    <CompanyContext.Provider
      value={{
        companies,
        allocations,
        selectedCompanyId,
        setSelectedCompanyId,
        availableCompanyIds,
        isGentiUser,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}
