import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { getChecklists } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { safeDifferenceInHours, safeDifferenceInDays } from '@/lib/safe-data'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Bell, AlertTriangle, Info, ShieldAlert } from 'lucide-react'

interface NotificationItem {
  type: 'error' | 'warning' | 'info'
  message: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const loadData = async () => {
    try {
      const isManager = user?.role === 'Manager'
      const checklists = await getChecklists(isManager ? undefined : user?.role)
      const items: NotificationItem[] = []

      if (isManager) {
        const pending = checklists.filter(
          (c) => c.status === 'completed' && c.approval_status === 'pending',
        ).length
        if (pending > 0) {
          items.push({
            type: 'info',
            message: t('notification.tasksAwaiting').replace('{n}', String(pending)),
          })
        }
      }

      checklists.forEach((c) => {
        if (c.status === 'pending' && c.due_date) {
          const hours = safeDifferenceInHours(c.due_date)
          if (hours < 0) {
            items.push({
              type: 'error',
              message: t('notification.taskExpired').replace('{title}', c.title),
            })
          } else if (hours <= 48) {
            items.push({
              type: 'warning',
              message: t('notification.taskDueIn')
                .replace('{title}', c.title)
                .replace('{hours}', String(Math.round(hours))),
            })
          }
        }
      })

      if (user?.qualification_expiry) {
        const days = safeDifferenceInDays(user.qualification_expiry)
        if (days < 0) {
          items.push({ type: 'error', message: t('notification.qualificationExpired') })
        } else if (days <= 30) {
          items.push({
            type: 'warning',
            message: t('notification.qualificationExpiring').replace('{days}', String(days)),
          })
        }
      }

      setNotifications(items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('checklists', () => loadData())

  const iconMap = { error: ShieldAlert, warning: AlertTriangle, info: Info }
  const colorMap = { error: 'text-rose-500', warning: 'text-amber-500', info: 'text-blue-500' }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative text-muted-foreground hover:text-primary transition-colors">
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background text-[10px] flex items-center justify-center text-white font-bold">
              {notifications.length}
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
          notifications.map((n, i) => {
            const Icon = iconMap[n.type]
            return (
              <DropdownMenuItem key={i} className="gap-3 p-3 cursor-default">
                <Icon className={`w-4 h-4 shrink-0 ${colorMap[n.type]}`} />
                <span className="text-sm text-foreground">{n.message}</span>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
