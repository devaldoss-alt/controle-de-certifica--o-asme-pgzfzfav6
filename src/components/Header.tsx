import { Search, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { LanguageToggle } from '@/hooks/use-i18n'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/NotificationBell'
import { CompanySelector } from '@/components/CompanySelector'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-heading font-bold text-lg text-primary md:hidden">QualiHub</span>
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="bg-card/50 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <CompanySelector />
        <LanguageToggle />
        <NotificationBell />

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.role}</p>
          </div>
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
