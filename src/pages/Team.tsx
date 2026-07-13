import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, getChecklists } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

export default function Team() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, { total: number; completed: number }>>({})

  const loadData = async () => {
    try {
      const usersData = await getUsers()
      setUsers(usersData)
      const checklists = await getChecklists()

      const newStats: Record<string, { total: number; completed: number }> = {}
      usersData.forEach((u) => (newStats[u.role] = { total: 0, completed: 0 }))

      checklists.forEach((c) => {
        if (newStats[c.role_assigned]) {
          newStats[c.role_assigned].total++
          if (c.status === 'completed') newStats[c.role_assigned].completed++
        }
      })
      setStats(newStats)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('checklists', () => loadData())

  if (user?.role !== 'Manager') {
    return (
      <div className="p-8 text-center text-rose-500">
        Acesso negado. Apenas gerentes podem visualizar esta página.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Visão da Equipe</h1>
        <p className="text-muted-foreground">
          Monitore o nível de conformidade de cada departamento e colaborador.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const roleStats = stats[u.role] || { total: 0, completed: 0 }
          const percentage =
            roleStats.total === 0 ? 100 : Math.round((roleStats.completed / roleStats.total) * 100)

          return (
            <Card key={u.id} className="glass border-white/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-card text-primary text-lg">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-white">{u.name}</CardTitle>
                    <p className="text-sm text-primary">{u.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conformidade (Tarefas)</span>
                    <span className="font-medium text-white">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2 bg-white/5" />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {roleStats.completed} de {roleStats.total} concluídas
                  </p>
                </div>
                {u.qualification_expiry && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Validade da Qualificação</p>
                    <p className="text-sm font-medium text-amber-500">
                      {new Date(u.qualification_expiry).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
