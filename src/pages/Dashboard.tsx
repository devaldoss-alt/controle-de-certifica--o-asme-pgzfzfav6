import { useAuth } from '@/hooks/use-auth'
import { ManagerDashboard } from '@/components/ManagerDashboard'
import { OperationalDashboard } from '@/components/OperationalDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  if (user?.role === 'Manager') {
    return <ManagerDashboard />
  }

  return <OperationalDashboard />
}
