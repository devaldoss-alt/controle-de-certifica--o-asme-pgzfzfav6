import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import useRealtime from '@/hooks/use-realtime'
import { getNotifications, markAsRead, type Notification } from '@/services/notifications'
import { safeFormatDate } from '@/lib/safe-data'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadNotifications = async () => {
    if (!user?.id) return
    try {
      const data = await getNotifications(user.id, 20)
      setNotifications(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user?.id])
  useRealtime('notifications', () => loadNotifications())

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      )
    }

    const msgLower = (notification.message || '').toLowerCase()

    // 1. Notificações de treinamento / eficácia devem abrir o módulo Treinamentos
    if (
      msgLower.includes('treinamento') ||
      msgLower.includes('avaliação de eficácia') ||
      msgLower.includes('capacitação') ||
      msgLower.includes('lista de presença')
    ) {
      navigate('/trainings')
      return
    }

    // 2. Notificações de Não Conformidade (RNC)
    if (
      msgLower.includes('rnc') ||
      msgLower.includes('não conformidade') ||
      msgLower.includes('nao conformidade')
    ) {
      navigate('/rnc')
      return
    }

    // 3. Notificações de Almoxarifado / Estoque / Compras
    if (
      msgLower.includes('almoxarifado') ||
      msgLower.includes('retirada') ||
      msgLower.includes('estoque') ||
      msgLower.includes('compra') ||
      msgLower.includes('requisição de material')
    ) {
      navigate('/inventory')
      return
    }

    // 4. Alert de prazo com OS
    if (notification.service_order_id && !notification.checklist_id) {
      navigate('/service-orders')
      return
    }

    // 5. Notificações vinculadas a checklists
    if (notification.checklist_id) {
      if (user?.role === 'Manager' || user?.role === 'QCC') {
        navigate(`/approvals?checklistId=${notification.checklist_id}`)
      } else {
        navigate(`/checklists?checklistId=${notification.checklist_id}`)
      }
      return
    }

    // Fallback padrão seguro
    navigate('/trainings')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative text-muted-foreground hover:text-primary transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background text-[10px] flex items-center justify-center text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto bg-popover border-white/10"
      >
        {notifications.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">
            {t('notification.noNotifications')}
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onSelect={() => handleClick(n)}
              className={cn('gap-3 p-3 cursor-pointer', !n.read && 'bg-primary/5')}
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm text-foreground', !n.read && 'font-bold')}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {safeFormatDate(n.created, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0" />}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
