import { useState, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Lightbulb,
  Info,
} from 'lucide-react'
import { getHelpTopic, HELP_CONTENT, type HelpTopic } from '@/lib/help-content'
import { useI18n } from '@/hooks/use-i18n'

interface ContextualHelpButtonProps {
  /** Sub-aba opcional para telas com navegação interna (ex: 'touch', 'requisitions', 'plano') */
  subTab?: string
  className?: string
  variant?: 'header' | 'button' | 'floating'
}

export function ContextualHelpButton({
  subTab,
  className = '',
  variant = 'header',
}: ContextualHelpButtonProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { lang } = useI18n()

  const topic: HelpTopic = useMemo(() => {
    return getHelpTopic(location.pathname, subTab)
  }, [location.pathname, subTab])

  // Sub-abas disponíveis nesta rota para alternar dentro do painel
  const relatedSubtopics = useMemo(() => {
    return Object.entries(HELP_CONTENT)
      .filter(([k]) => k.startsWith(location.pathname + '#'))
      .map(([, top]) => top)
  }, [location.pathname])

  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null)

  // Ao abrir o Sheet, reinicia com o tópico contextual da tela
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedTopic(topic)
    }
    setOpen(nextOpen)
  }

  const activeTopic = selectedTopic || topic

  return (
    <>
      {variant === 'header' ? (
        <button
          onClick={() => handleOpenChange(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 border border-white/10 hover:border-primary/30 transition-all ${className}`}
          title={lang === 'pt' ? 'Ajuda desta tela' : 'Help for this screen'}
          aria-label="Abrir ajuda contextual"
        >
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Ajuda</span>
        </button>
      ) : variant === 'floating' ? (
        <button
          onClick={() => handleOpenChange(true)}
          className={`fixed bottom-5 right-5 z-40 flex items-center justify-center w-11 h-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all ring-2 ring-primary/20 ${className}`}
          title={lang === 'pt' ? 'Ajuda desta tela' : 'Help for this screen'}
          aria-label="Abrir ajuda contextual"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
          className={`gap-1.5 text-xs border-white/10 text-muted-foreground hover:text-primary ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span>{lang === 'pt' ? 'Como Funciona' : 'How it Works'}</span>
        </Button>
      )}

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-white/10 z-50 text-foreground"
        >
          {/* Header do Sheet */}
          <div className="p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-primary/30 text-primary text-[11px] gap-1">
                <Layers className="w-3 h-3" />
                {activeTopic.groupTitle}
              </Badge>
              {activeTopic.subTab && (
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  Aba: {activeTopic.subTab}
                </Badge>
              )}
            </div>

            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                {activeTopic.title}
              </SheetTitle>
              {activeTopic.subtitle && (
                <SheetDescription className="text-xs text-muted-foreground font-medium">
                  {activeTopic.subtitle}
                </SheetDescription>
              )}
            </SheetHeader>

            {/* Sub-abas caso a rota tenha sub-tópicos (ex: Almoxarifado, Treinamentos) */}
            {relatedSubtopics.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">
                  Guias específicos por aba:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedTopic(topic)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      activeTopic.id === topic.id
                        ? 'bg-primary text-white font-medium'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                    }`}
                  >
                    Visão Geral
                  </button>
                  {relatedSubtopics.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedTopic(sub)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        activeTopic.id === sub.id
                          ? 'bg-primary text-white font-medium'
                          : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                      }`}
                    >
                      {sub.subTab?.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo com Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* O que a tela faz (Resumo direto) */}
            <div className="rounded-xl p-4 bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>O que esta tela faz</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{activeTopic.summary}</p>
            </div>

            {/* O que cada recurso / botão significa */}
            {activeTopic.features.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Recursos e Botões Principais
                </h3>

                <div className="grid gap-2.5">
                  {activeTopic.features.map((feat) => (
                    <div
                      key={feat.name}
                      className="p-3 rounded-lg bg-card/60 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feat.name}
                        </span>
                        {feat.badge && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-primary/30 text-primary"
                          >
                            {feat.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px w-full bg-white/10" />

            {/* Passo a passo numerado da tarefa principal */}
            {activeTopic.steps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Passo a Passo da Tarefa Principal
                </h3>

                <div className="space-y-3">
                  {activeTopic.steps.map((st) => (
                    <div
                      key={st.step}
                      className="flex items-start gap-3 p-3.5 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {st.step}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-xs font-semibold text-white">{st.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {st.instruction}
                        </p>
                        {st.tip && (
                          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                            <span>{st.tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer do Sheet */}
          <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Precisa do guia completo de todas as telas?
            </span>
            <Button
              asChild
              variant="default"
              size="sm"
              onClick={() => setOpen(false)}
              className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-white"
            >
              <Link to="/help">
                <BookOpen className="w-3.5 h-3.5" />
                Central de Tutoriais
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
