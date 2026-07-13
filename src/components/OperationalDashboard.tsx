import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getChecklists, getInteractions, type Checklist, type Interaction } from '@/services/api'
import { roleData } from '@/lib/role-data'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, AlertTriangle, ShieldCheck, Clock, ArrowRight } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

export function OperationalDashboard() {
  const { user } = useAuth()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])

  const loadData = async () => {
    try {
      const [clData, intData] = await Promise.all([
        getChecklists(user?.role),
        getInteractions(user?.role),
      ])
      setChecklists(clData)
      setInteractions(intData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('checklists', () => loadData())
  useRealtime('interactions', () => loadData())

  const pending = checklists.filter((c) => c.status === 'pending').length
  const completed = checklists.filter(
    (c) => c.status === 'completed' || c.approval_status === 'approved',
  ).length
  const critical = checklists.filter((c) => c.is_critical && c.status === 'pending').length
  const expired = checklists.filter(
    (c) => c.status === 'pending' && differenceInDays(new Date(c.due_date), new Date()) < 0,
  ).length

  const data = roleData[user?.role || '']
  const pendingItems = checklists.filter((c) => c.status === 'pending').slice(0, 5)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Bem-vindo, {user?.name}</h1>
        <p className="text-muted-foreground">
          Visao geral das suas responsabilidades como{' '}
          <strong className="text-primary">{user?.role}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
              <h3 className="text-3xl font-bold text-white">{pending}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ClipboardCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Concluidas</p>
              <h3 className="text-3xl font-bold text-emerald-500">{completed}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Criticos</p>
              <h3 className="text-3xl font-bold text-amber-500">{critical}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expirados</p>
              <h3 className="text-3xl font-bold text-rose-500">{expired}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg">Minhas Autoridades</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data?.authorities.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg">Minhas Responsabilidades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {pendingItems.map((item) => (
                <div key={item.id} className="p-3 flex items-start justify-between gap-2">
                  <p className="text-sm text-white line-clamp-2">{item.title}</p>
                  <span
                    className={`text-xs shrink-0 ${differenceInDays(new Date(item.due_date), new Date()) < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}
                  >
                    {format(new Date(item.due_date), 'dd/MM')}
                  </span>
                </div>
              ))}
              {pendingItems.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">Tudo em dia!</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg">Interacoes do Cargo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {interactions.map((int) => (
              <div key={int.id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary font-medium">{int.source_role}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-primary font-medium">{int.target_role}</span>
                </div>
                <p className="text-muted-foreground text-xs">{int.description}</p>
              </div>
            ))}
            {interactions.length === 0 && (
              <div className="text-center text-muted-foreground text-sm">
                Sem interacoes registradas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
