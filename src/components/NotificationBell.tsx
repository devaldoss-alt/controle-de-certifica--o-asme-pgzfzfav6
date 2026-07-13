import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getChecklists } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Bell, AlertTriangle, Clock, Info, ShieldAlert } from 'lucide-react'
import { differenceInHours, differenceInDays } from 'date-fns'

interface NotificationItem {
  type: 'error' | 'warning' | 'info'
  message: string
}

export function NotificationBell() {
  const { user } = useAuth()
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
          items.push({ type: 'info', message: `${pending} tarefa(s) aguardando aprovacao` })
        }
      }

      checklists.forEach((c) => {
        if (c.status === 'pending' && c.due_date) {
          const hours = differenceInHours(new Date(c.due_date), new Date())
          if (hours < 0) {
            items.push({ type: 'error', message: `"${c.title}" esta expirado` })
          } else if (hours <= 48) {
            items.push({ type: 'warning', message: `"${c.title}" vence em ${Math.round(hours)}h` })
          }
        }
      })

      if (user?.qualification_expiry) {
        const days = differenceInDays(new Date(user.qualification_expiry), new Date())
        if (days < 0) {
          items.push({ type: 'error', message: 'Sua qualificacao esta expirada' })
        } else if (days <= 30) {
          items.push({ type: 'warning', message: `Sua qualificacao expira em ${days} dias` })
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
            Sem notificacoes no momento.
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
