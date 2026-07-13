import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { LayoutDashboard, CheckSquare, Users, LogOut, ClipboardCheck, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Checklists', path: '/checklists', icon: CheckSquare },
    { name: 'Qualificações', path: '/qualifications', icon: Award },
  ]

  if (user?.role === 'Manager') {
    links.push({ name: 'Aprovações', path: '/approvals', icon: ClipboardCheck })
    links.push({ name: 'Equipe', path: '/team', icon: Users })
  }

  return (
    <aside className="w-64 glass hidden md:flex flex-col h-full shrink-0 shadow-elevation relative z-10">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          P
        </div>
        <span className="font-heading font-bold text-xl tracking-wider text-primary">PROSERCO</span>
      </div>

      <div className="p-4 flex-1 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider px-2">
          Menu Principal
        </div>
        {links.map((link) => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md transition-colors font-medium text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
