import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getChecklists, Checklist } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const isManager = user?.role === 'Manager'

  const loadData = async () => {
    try {
      const data = await getChecklists(isManager ? undefined : user?.role)
      setChecklists(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('checklists', () => {
    loadData()
  })

  const pendingCount = checklists.filter((c) => c.status === 'pending').length
  const completedCount = checklists.filter((c) => c.status === 'completed').length
  const criticalCount = checklists.filter((c) => c.status === 'pending' && c.is_critical).length

  const expiredCount = checklists.filter(
    (c) => c.status === 'pending' && differenceInDays(new Date(c.due_date), new Date()) < 0,
  ).length

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Bem-vindo, {user?.name}</h1>
        <p className="text-muted-foreground">
          Visão geral das suas responsabilidades como{' '}
          <strong className="text-primary">{user?.role}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tarefas Pendentes</p>
              <h3 className="text-3xl font-bold text-white">{pendingCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ClipboardCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Itens Críticos</p>
              <h3 className="text-3xl font-bold text-amber-500">{criticalCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Itens Expirados</p>
              <h3 className="text-3xl font-bold text-rose-500">{expiredCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Concluídas</p>
              <h3 className="text-3xl font-bold text-emerald-500">{completedCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5 flex-1">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg">Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {checklists
                .filter((c) => c.status === 'pending')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .slice(0, 5)
                .map((item) => {
                  const days = differenceInDays(new Date(item.due_date), new Date())
                  const isExpired = days < 0
                  return (
                    <div
                      key={item.id}
                      className="p-4 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white mb-1 line-clamp-1">{item.title}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          Ref: {item.mcq_ref}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${isExpired ? 'bg-rose-500/10 text-rose-500' : days <= 7 ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-muted-foreground'}`}
                        >
                          {isExpired ? 'Expirado' : `${days} dias restantes`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              {checklists.filter((c) => c.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhuma tarefa pendente no momento.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {user?.qualification_expiry && (
          <Card className="glass border-white/5 h-min">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg">Status de Qualificação</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white">Renovação Pendente</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sua qualificação expirou em{' '}
                    {format(new Date(user.qualification_expiry), 'dd/MM/yyyy')}. O coordenador já
                    foi notificado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
