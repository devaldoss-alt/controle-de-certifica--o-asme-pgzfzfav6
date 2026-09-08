import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, LanguageToggle, useI18n } from '@/hooks/use-i18n'
import { useNavGroups } from '@/hooks/use-nav-links'
import { cn } from '@/lib/utils'

const navLabelMap: Record<string, { pt: string; en: string }> = {
  'nav.masterList': { pt: 'Lista Mestra', en: 'Master List' },
  'nav.notifications': { pt: 'Notificações', en: 'Notifications' },
  'nav.packingSlips': { pt: 'Romaneios', en: 'Packing Slips' },
  'nav.calendar': { pt: 'Agenda', en: 'Calendar' },
  'nav.accessControl': { pt: 'Controle de Acesso', en: 'Access Control' },
  'nav.help': { pt: 'Ajuda', en: 'Help' },
}

export function MobileNav() {
  const { signOut } = useAuth()
  const location = useLocation()
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const groups = useNavGroups()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
            Q
          </div>
          <span className="font-heading font-bold text-xl tracking-wider text-primary">
            QualiHub
          </span>
        </div>

        <div className="p-4 flex-1 space-y-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                <BilingualText k={group.titleKey} />
              </div>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = location.pathname === link.path
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm',
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                      )}
                    >
                      <link.icon className="w-4 h-4 shrink-0" />
                      {link.name === 'nav.indicators' ? (
                        <span>{lang === 'pt' ? 'Indicadores' : 'Indicators'}</span>
                      ) : navLabelMap[link.name] ? (
                        <span>
                          {lang === 'pt' ? navLabelMap[link.name].pt : navLabelMap[link.name].en}
                        </span>
                      ) : (
                        <BilingualText k={link.name} />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          <LanguageToggle />
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md transition-colors font-medium text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <BilingualText k="nav.logout" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
