import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getChecklists, updateChecklistStatus, type Checklist } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { differenceInHours, differenceInDays, format } from 'date-fns'
import { AlertCircle, FileText, CheckCircle2, Lock, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const handleToggle = async (item: Checklist) => {
    if (isManager || item.locked) return
    try {
      const newStatus = item.status === 'pending' ? 'completed' : 'pending'
      await updateChecklistStatus(item.id, newStatus)
    } catch (e) {
      console.error('Update failed', e)
    }
  }

  const getDeadlineBadge = (item: Checklist) => {
    if (item.locked)
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
          <Lock className="w-3 h-3 mr-1" />
          Aprovado
        </Badge>
      )
    if (item.status === 'completed' && item.approval_status === 'pending')
      return (
        <Badge variant="outline" className="border-blue-500/30 text-blue-500">
          Aguard. Aprovacao
        </Badge>
      )
    if (item.approval_status === 'rejected')
      return (
        <Badge variant="destructive" className="bg-rose-500/20 text-rose-400">
          Rejeitado
        </Badge>
      )

    const hours = differenceInHours(new Date(item.due_date), new Date())
    if (hours < 0)
      return (
        <Badge variant="destructive" className="bg-rose-500/20 text-rose-400">
          Expirado
        </Badge>
      )
    if (hours <= 48)
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-500">
          Vence em {Math.round(hours)}h
        </Badge>
      )
    return (
      <Badge variant="outline" className="border-white/10 text-muted-foreground">
        {format(new Date(item.due_date), 'dd/MM/yyyy')}
      </Badge>
    )
  }

  const getCardStyle = (item: Checklist) => {
    if (item.locked) return 'border-emerald-500/20 bg-emerald-500/5'
    if (item.status === 'completed') return 'border-blue-500/20 bg-blue-500/5'
    if (item.approval_status === 'rejected') return 'border-rose-500/30 bg-rose-500/5'
    const hours = differenceInHours(new Date(item.due_date), new Date())
    if (hours < 0) return 'border-rose-500/30 bg-rose-500/5'
    if (hours <= 48) return 'border-amber-500/30 bg-amber-500/5'
    return 'border-white/5 bg-card/40'
  }

  const grouped = checklists.reduce(
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
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Checklists Operacionais</h1>
        <p className="text-muted-foreground">
          Controle rigoroso dos procedimentos da Qualidade ASME/NBIC.
        </p>
      </div>

      {Object.entries(grouped).map(([role, items]) => (
        <div key={role} className="space-y-4">
          {isManager && (
            <h2 className="text-xl font-heading font-semibold text-primary mt-8 mb-4 flex items-center gap-2">
              <div className="w-8 h-px bg-primary/30" />
              {role}
              <div className="flex-1 h-px bg-primary/10" />
            </h2>
          )}
          <div className="grid gap-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'transition-all duration-300 backdrop-blur-md',
                  getCardStyle(item),
                  item.locked && 'opacity-75',
                )}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="pt-1">
                    <Checkbox
                      checked={item.status === 'completed' || item.locked}
                      onCheckedChange={() => handleToggle(item)}
                      disabled={isManager || item.locked}
                      className={cn(
                        'w-6 h-6 rounded-md border-2',
                        item.locked
                          ? 'bg-emerald-500 border-emerald-500'
                          : item.status === 'completed'
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-muted-foreground',
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3
                        className={cn(
                          'font-medium text-base sm:text-lg',
                          item.locked ? 'text-muted-foreground' : 'text-white',
                          item.status === 'completed' && !item.locked && 'text-muted-foreground',
                        )}
                      >
                        {item.title}
                      </h3>
                      <div className="shrink-0 flex items-center gap-2">
                        {item.is_critical && !item.locked && (
                          <Badge variant="outline" className="border-rose-500/30 text-rose-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Critico
                          </Badge>
                        )}
                        {getDeadlineBadge(item)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded border border-white/5">
                        <FileText className="w-3 h-3" />
                        {item.mcq_ref}
                      </span>
                      {item.expand?.last_action_by && (
                        <span className="text-white/40">
                          Por: {item.expand.last_action_by.name}
                        </span>
                      )}
                    </div>
                    {item.approval_status === 'rejected' && item.rejection_comment && (
                      <div className="mt-2 p-2 rounded bg-rose-500/5 border border-rose-500/10 flex items-start gap-2">
                        <MessageSquare className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-400">{item.rejection_comment}</p>
                      </div>
                    )}
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
          <p>Nenhum checklist atribuido para o seu perfil no momento.</p>
        </div>
      )}
    </div>
  )
}
