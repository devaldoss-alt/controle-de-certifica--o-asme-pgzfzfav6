import { useAuth } from '@/hooks/use-auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ManagerDashboard } from '@/components/ManagerDashboard'
import { OperationalDashboard } from '@/components/OperationalDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <ErrorBoundary message="Erro ao carregar o dashboard.">
      {user?.role === 'Manager' ? <ManagerDashboard /> : <OperationalDashboard />}
    </ErrorBoundary>
  )
}
