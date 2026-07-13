import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, getChecklists, type User, type Checklist } from '@/services/api'
import { generateComplianceReport } from '@/services/reports'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { UserFormDialog } from '@/components/UserFormDialog'
import { UserPlus, FileDown, Pencil, ShieldCheck } from 'lucide-react'
import { differenceInDays } from 'date-fns'

export default function Team() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const loadData = async () => {
    try {
      const [uData, clData] = await Promise.all([getUsers(), getChecklists()])
      setUsers(uData)
      setChecklists(clData)
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
        Acesso negado. Apenas gerentes podem visualizar esta pagina.
      </div>
    )
  }

  const handleNewUser = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }
  const handleEditUser = (u: User) => {
    setEditingUser(u)
    setDialogOpen(true)
  }

  const roleStats = (role: string) => {
    const items = checklists.filter((c) => c.role_assigned === role)
    const done = items.filter(
      (c) => c.status === 'completed' || c.approval_status === 'approved',
    ).length
    return { total: items.length, done }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Visao da Equipe</h1>
          <p className="text-muted-foreground">
            Monitore a conformidade de cada colaborador e cargo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateComplianceReport(checklists, users)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar Relatorio
          </Button>
          <Button
            onClick={handleNewUser}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const s = roleStats(u.role)
          const pct = s.total === 0 ? 100 : Math.round((s.done / s.total) * 100)
          const days = u.qualification_expiry
            ? differenceInDays(new Date(u.qualification_expiry), new Date())
            : null
          return (
            <Card key={u.id} className="glass border-white/5">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditUser(u)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conformidade</span>
                    <span className="font-medium text-white">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2 bg-white/5" />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {s.done} de {s.total} concluidas
                  </p>
                </div>
                {days !== null && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                    <ShieldCheck
                      className={`w-4 h-4 ${days < 0 ? 'text-rose-500' : days <= 30 ? 'text-amber-500' : 'text-emerald-500'}`}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Qualificacao</p>
                      <p
                        className={`text-sm font-medium ${days < 0 ? 'text-rose-500' : days <= 30 ? 'text-amber-500' : 'text-emerald-500'}`}
                      >
                        {days < 0 ? 'Expirada' : `${days} dias restantes`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSaved={loadData}
      />
    </div>
  )
}
