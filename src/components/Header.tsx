import { Search } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { LanguageToggle } from '@/hooks/use-i18n'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/NotificationBell'
import { CompanySelector } from '@/components/CompanySelector'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MobileNav } from '@/components/MobileNav'
import { ContextualHelpButton } from '@/components/ContextualHelpButton'
import { FeedbackDialog } from '@/components/FeedbackDialog'
import { FeedbackManagementDialog } from '@/components/FeedbackManagementDialog'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus, MessageSquare } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/hooks/use-i18n'

export function Header() {
  const { user } = useAuth()
  const location = useLocation()
  const { lang } = useI18n()
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)

  const getScreenName = (path: string): string => {
    if (path === '/' || path === '/dashboard') return 'Dashboard'
    if (path.startsWith('/indicators')) return 'Indicadores SGQ'
    if (path.startsWith('/rnc')) return 'Não Conformidades (RNC)'
    if (path.startsWith('/packing-slips')) return 'Romaneios & Serviços Especiais'
    if (path.startsWith('/trainings')) return 'Treinamentos & Matriz 360°'
    if (path.startsWith('/suppliers')) return 'Fornecedores & Suprimentos'
    if (path.startsWith('/inventory')) return 'Almoxarifado & Estoque'
    if (path.startsWith('/documents')) return 'Documentos (GED)'
    if (path.startsWith('/access-control')) return 'Controle de Acesso'
    if (path.startsWith('/team')) return 'Equipe & Colaboradores'
    if (path.startsWith('/checklists')) return 'Checklists de Inspeção'
    if (path.startsWith('/approvals')) return 'Aprovações Pendentes'
    if (path.startsWith('/companies')) return 'Empresas do Grupo'
    if (path.startsWith('/pcp')) return 'PCP / Capacidade'
    if (path.startsWith('/calendar')) return 'Calendário'
    if (path.startsWith('/help')) return 'Central de Ajuda'
    return 'UQualiHub'
  }

  const currentScreenName = getScreenName(location.pathname)

  const isManagerOrConsultant =
    user?.role === 'Manager' ||
    user?.role === 'Consultor' ||
    user?.role === 'Director' ||
    (Array.isArray(user?.role) &&
      (user?.role.includes('Manager') ||
        user?.role.includes('Consultor') ||
        user?.role.includes('Director'))) ||
    user?.email === 'devaldoss@gmail.com'
  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <MobileNav />
        <span className="font-heading font-bold text-lg text-primary md:hidden">QualiHub</span>
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={txt('Pesquisar...', 'Search...')}
            className="bg-card/50 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <CompanySelector />
        <LanguageToggle />
        <NotificationBell />

        {/* Manager/Consultor Feedbacks Central button */}
        {isManagerOrConsultant && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManagementOpen(true)}
                  className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="hidden xl:inline text-[11px] font-medium">
                    {txt('Feedbacks', 'Feedbacks')}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {txt(
                  'Gerenciar comentários e sugestões dos usuários',
                  'Manage user feedback and suggestions',
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Discrete "Comentar" button next to Help button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackOpen(true)}
                className="h-8 px-2.5 text-xs border-white/15 bg-white/5 hover:bg-white/15 text-white gap-1.5 font-medium transition-colors"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">{txt('Comentar', 'Comment')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {txt(
                `Comentar ou sugerir melhoria sobre ${currentScreenName}`,
                `Send comment or suggestion regarding ${currentScreenName}`,
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ContextualHelpButton variant="header" />

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

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        screenPath={location.pathname}
        screenName={currentScreenName}
      />

      {isManagerOrConsultant && (
        <FeedbackManagementDialog open={managementOpen} onOpenChange={setManagementOpen} />
      )}
    </header>
  )
}

export default Header
