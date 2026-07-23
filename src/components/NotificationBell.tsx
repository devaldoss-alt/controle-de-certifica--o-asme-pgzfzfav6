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
    navigate('/approvals')
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
