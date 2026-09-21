import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, LanguageToggle, useI18n } from '@/hooks/use-i18n'
import { useNavGroups } from '@/hooks/use-nav-links'
import { LogOut, PanelLeftClose, PanelLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const navLabelMap: Record<string, { pt: string; en: string }> = {
  'nav.masterList': { pt: 'Lista Mestra', en: 'Master List' },
  'nav.notifications': { pt: 'Notificações', en: 'Notifications' },
  'nav.packingSlips': { pt: 'Romaneios', en: 'Packing Slips' },
  'nav.calendar': { pt: 'Agenda', en: 'Calendar' },
  'nav.accessControl': { pt: 'Controle de Acesso', en: 'Access Control' },
  'nav.implantacao': { pt: 'Implantação', en: 'Implementation' },
  'nav.help': { pt: 'Ajuda', en: 'Help' },
}

const groupLabelMap: Record<string, { pt: string; en: string }> = {
  'nav.group.overview': { pt: 'Visão Geral', en: 'Overview' },
  'nav.group.production': { pt: 'Produção e Campo', en: 'Production & Field' },
  'nav.group.materials': { pt: 'Materiais e Estoque', en: 'Materials & Stock' },
  'nav.group.dms': { pt: 'Controle Documental', en: 'Document Control' },
  'nav.group.people': { pt: 'Pessoas e Treinamentos', en: 'People & Trainings' },
  'nav.group.analytics': { pt: 'Indicadores e Gestão', en: 'Analytics & Management' },
  'nav.group.system': { pt: 'Sistema e Suporte', en: 'System & Support' },
}

export default function Sidebar() {
  const { signOut } = useAuth()
  const location = useLocation()
  const { lang } = useI18n()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('uqualihub_sidebar_collapsed')
      return saved === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('uqualihub_sidebar_collapsed', String(collapsed))
    } catch {
      /* intentionally ignored */
    }
  }, [collapsed])

  const groups = useNavGroups()

  const { t } = useI18n()

  const getLinkLabel = (name: string) => {
    if (navLabelMap[name]) return lang === 'pt' ? navLabelMap[name].pt : navLabelMap[name].en
    const translated = t(name)
    return translated !== name ? translated : name
  }

  const getGroupLabel = (key: string) => {
    if (groupLabelMap[key]) return lang === 'pt' ? groupLabelMap[key].pt : groupLabelMap[key].en
    const translated = t(key)
    return translated !== key ? translated : key
  }

  // Identifica o grupo que contém a rota atual
  const activeGroupId = groups.find((g) =>
    g.links.some((l) => {
      if (l.path === '/') return location.pathname === '/'
      return location.pathname === l.path || location.pathname.startsWith(l.path + '/')
    }),
  )?.id

  // Estado de grupos expandidos (objeto com id: boolean)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Inicializa abrindo o grupo ativo (ou todos caso queira, mas a regra pede manter o ativo aberto)
    const initial: Record<string, boolean> = {}
    groups.forEach((g) => {
      // Se tiver grupo ativo, ele fica aberto; por padrão, também podemos deixar os outros abertos inicialmente ou apenas o ativo
      initial[g.id] = g.id === activeGroupId
    })
    // Se nenhum grupo estiver ativo, deixa o primeiro aberto como fallback
    if (activeGroupId && initial[activeGroupId] === undefined) {
      initial[activeGroupId] = true
    }
    return initial
  })

  // Garante que o grupo da página atualmente ativa fica sempre aberto ao navegar / carregar
  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => {
        if (prev[activeGroupId]) return prev
        return { ...prev, [activeGroupId]: true }
      })
    }
  }, [activeGroupId])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'glass hidden md:flex flex-col h-full shrink-0 shadow-elevation relative z-10 transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        {/* Header com botão de toggle */}
        <div
          className={cn(
            'p-4 border-b border-white/5 flex items-center justify-between',
            collapsed ? 'flex-col gap-2 p-3' : '',
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
              Q
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-xl tracking-wider text-primary truncate">
                QualiHub
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 shrink-0"
            title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>

        {/* Links dos 7 grupos */}
        <div className="p-3 flex-1 space-y-2 overflow-y-auto">
          {groups.map((group) => {
            const groupTitle = getGroupLabel(group.titleKey)
            const isOpen = openGroups[group.id] ?? false
            const isGroupActive = group.id === activeGroupId

            return (
              <div key={group.id} className="space-y-1">
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full flex justify-center py-1 cursor-default">
                        <div
                          className={cn(
                            'w-6 h-0.5 rounded-full transition-colors',
                            isGroupActive ? 'bg-primary' : 'bg-white/20',
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{groupTitle}</TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors select-none text-left',
                      isGroupActive
                        ? 'text-primary font-bold hover:bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                    )}
                  >
                    <span className="truncate">
                      <BilingualText k={group.titleKey} />
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-transform duration-200',
                        isOpen ? 'rotate-180' : 'rotate-0',
                      )}
                    />
                  </button>
                )}

                {/* Subitens: no modo colapsado exibe todos para acesso rápido via tooltip; no modo expandido respeita isOpen */}
                {(collapsed || isOpen) && (
                  <div className="space-y-1">
                    {group.links.map((link) => {
                      const isActive =
                        link.path === '/'
                          ? location.pathname === '/'
                          : location.pathname === link.path ||
                            location.pathname.startsWith(link.path + '/')
                      const labelText = getLinkLabel(link.name)

                      if (collapsed) {
                        return (
                          <Tooltip key={link.path}>
                            <TooltipTrigger asChild>
                              <Link
                                to={link.path}
                                className={cn(
                                  'flex items-center justify-center w-full h-10 rounded-md transition-colors font-medium',
                                  isActive
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                                )}
                              >
                                <link.icon className="w-4 h-4 shrink-0" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {labelText}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm',
                            isActive
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                          )}
                        >
                          <link.icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{labelText}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {!collapsed && <LanguageToggle />}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center justify-center w-full h-10 rounded-md transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{lang === 'pt' ? 'Sair' : 'Logout'}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md transition-colors font-medium text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <BilingualText k="nav.logout" />
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
