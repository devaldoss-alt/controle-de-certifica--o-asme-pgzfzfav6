import { useAuth } from '@/hooks/use-auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ManagerDashboard } from '@/components/ManagerDashboard'
import { OperationalDashboard } from '@/components/OperationalDashboard'
import { ManagerDashboardSkeleton } from '@/components/ManagerDashboardSkeleton'
import { OperationalDashboardSkeleton } from '@/components/OperationalDashboardSkeleton'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return user?.role === 'Manager' ? (
      <ManagerDashboardSkeleton />
    ) : (
      <OperationalDashboardSkeleton />
    )
  }

  return (
    <ErrorBoundary message="Erro ao carregar o dashboard. Tente recarregar a página.">
      {user?.role === 'Manager' ? <ManagerDashboard /> : <OperationalDashboard />}
    </ErrorBoundary>
  )
}
