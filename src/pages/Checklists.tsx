import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getChecklists, updateChecklistStatus, Checklist } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { differenceInDays, format } from 'date-fns'
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function Checklists() {
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
  useRealtime('checklists', () => loadData())

  const handleToggle = async (id: string, currentStatus: string) => {
    if (isManager) return // Mangers view only usually
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
      await updateChecklistStatus(id, newStatus)
    } catch (e) {
      console.error('Update failed', e)
    }
  }

  const getStatusColor = (date: string, status: string) => {
    if (status === 'completed') return 'border-emerald-500/20 bg-emerald-500/5'
    const days = differenceInDays(new Date(date), new Date())
    if (days < 0) return 'border-rose-500/30 bg-rose-500/5'
    if (days <= 7) return 'border-amber-500/30 bg-amber-500/5'
    return 'border-white/5 bg-card/40'
  }

  const getDeadlineBadge = (date: string, status: string) => {
    if (status === 'completed') {
      return (
        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
        </Badge>
      )
    }
    const days = differenceInDays(new Date(date), new Date())
    if (days < 0) {
      return (
        <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">
          Expirado ({Math.abs(days)}d)
        </Badge>
      )
    }
    if (days <= 7) {
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-500">
          Vence em {days}d
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-white/10 text-muted-foreground">
        {format(new Date(date), 'dd/MM/yyyy')}
      </Badge>
    )
  }

  const groupedChecklists = checklists.reduce(
    (acc, item) => {
      const role = item.role_assigned
      if (!acc[role]) acc[role] = []
      acc[role].push(item)
      return acc
    },
    {} as Record<string, Checklist[]>,
  )

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            Checklists Operacionais
          </h1>
          <p className="text-muted-foreground">Controle rigoroso dos procedimentos da Qualidade.</p>
        </div>
      </div>

      {Object.entries(groupedChecklists).map(([role, items]) => (
        <div key={role} className="space-y-4">
          {isManager && (
            <h2 className="text-xl font-heading font-semibold text-primary mt-8 mb-4 flex items-center gap-2">
              <div className="w-8 h-px bg-primary/30"></div>
              {role}
              <div className="flex-1 h-px bg-primary/10"></div>
            </h2>
          )}
          <div className="grid gap-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'transition-all duration-300 backdrop-blur-md',
                  getStatusColor(item.due_date, item.status),
                  item.status === 'completed' && 'opacity-75',
                )}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="pt-1">
                    <Checkbox
                      checked={item.status === 'completed'}
                      onCheckedChange={() => handleToggle(item.id, item.status)}
                      disabled={isManager}
                      className={cn(
                        'w-6 h-6 rounded-md border-2',
                        item.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground',
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3
                        className={cn(
                          'font-medium text-base sm:text-lg transition-colors',
                          item.status === 'completed'
                            ? 'text-muted-foreground line-through'
                            : 'text-white',
                        )}
                      >
                        {item.title}
                      </h3>
                      <div className="shrink-0 flex items-center gap-2">
                        {item.is_critical && item.status !== 'completed' && (
                          <Badge variant="outline" className="border-rose-500/30 text-rose-500">
                            <AlertCircle className="w-3 h-3 mr-1" /> Crítico
                          </Badge>
                        )}
                        {getDeadlineBadge(item.due_date, item.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded border border-white/5">
                        <FileText className="w-3 h-3" />
                        {item.mcq_ref}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {checklists.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Nenhum checklist atribuído para o seu perfil no momento.</p>
        </div>
      )}
    </div>
  )
}
