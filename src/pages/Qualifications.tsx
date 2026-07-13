import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, type User } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, AlertTriangle, ShieldAlert, GraduationCap } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

export default function Qualifications() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const isManager = user?.role === 'Manager'

  const loadData = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())

  const getStatus = (expiry?: string) => {
    if (!expiry)
      return {
        color: 'text-muted-foreground',
        bg: 'bg-white/5',
        icon: ShieldCheck,
        label: 'Sem data',
        days: null,
      }
    const days = differenceInDays(new Date(expiry), new Date())
    if (days < 0)
      return {
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        icon: ShieldAlert,
        label: 'Expirada',
        days,
      }
    if (days <= 30)
      return {
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        icon: AlertTriangle,
        label: 'Expira em breve',
        days,
      }
    return {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      icon: ShieldCheck,
      label: 'Valida',
      days,
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          Qualificacoes e Treinamentos
        </h1>
        <p className="text-muted-foreground">
          Acompanhamento de validade de certificacoes e continuidade de soldadores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const st = getStatus(u.qualification_expiry)
          const Icon = st.icon
          const isWelder = u.role === 'Welder'
          return (
            <Card key={u.id} className="glass border-white/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-card text-primary text-lg">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white">{u.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-primary">{u.role}</p>
                      {isWelder && (
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Continuidade
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg ${st.bg} flex items-center gap-3`}>
                  <Icon className={`w-8 h-8 ${st.color}`} />
                  <div>
                    <p className={`text-sm font-medium ${st.color}`}>{st.label}</p>
                    {u.qualification_expiry ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(u.qualification_expiry), 'dd/MM/yyyy')}
                        {st.days !== null && st.days >= 0 && ` - ${st.days} dias`}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Nao registrada</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Nenhum usuario encontrado.</p>
        </div>
      )}
    </div>
  )
}
