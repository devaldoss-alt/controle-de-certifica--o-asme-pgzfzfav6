import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import useRealtime from '@/hooks/use-realtime'
import { getNotifications, markAsRead, type Notification } from '@/services/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { safeFormatDate } from '@/lib/safe-data'
import { cn } from '@/lib/utils'

const typeIcon = (type: string) => {
  switch (type) {
    case 'approved':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'rejected':
      return <XCircle className="w-5 h-5 text-rose-500" />
    case 'deadline_alert':
      return <Clock className="w-5 h-5 text-amber-500" />
    default:
      return <Bell className="w-5 h-5 text-primary" />
  }
}

const typeLabel = (type: string) => {
  switch (type) {
    case 'submission':
      return 'Submissão'
    case 'approved':
      return 'Aprovado'
    case 'rejected':
      return 'Rejeitado'
    case 'deadline_alert':
      return 'Prazo'
    default:
      return type
  }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadData = async () => {
    if (!user?.id) return
    const data = await getNotifications(user.id, 100)
    setNotifications(data)
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('notifications', () => loadData())

  const handleRead = (n: Notification) => {
    if (!n.read) {
      markAsRead(n.id)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    }
    if (n.type === 'deadline_alert') navigate('/service-orders')
    else if (user?.role === 'Manager' || user?.role === 'QCC')
      navigate(`/approvals?checklistId=${n.checklist_id}`)
    else navigate(`/checklists?checklistId=${n.checklist_id}`)
  }

  const markAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markAsRead(n.id))
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllRead}
            className="border-white/10 text-muted-foreground hover:text-primary"
          >
            <CheckCheck className="w-4 h-4 mr-2" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card className="glass border-white/5">
            <CardContent className="py-16 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">Nenhuma notificação.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'glass border-white/5 cursor-pointer hover:border-primary/20 transition-colors',
                !n.read && 'border-primary/30 bg-primary/5',
              )}
              onClick={() => handleRead(n)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {typeIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {typeLabel(n.type)}
                    </Badge>
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <p className={cn('text-sm text-white/90', !n.read && 'font-medium')}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {safeFormatDate(n.created, 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {n.read && <CheckCheck className="w-4 h-4 text-muted-foreground/50" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
