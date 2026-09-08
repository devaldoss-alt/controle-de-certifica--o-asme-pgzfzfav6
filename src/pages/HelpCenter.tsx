import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  CheckSquare,
  Briefcase,
  Boxes,
  Users,
  BarChart3,
  Building2,
  X,
  FileText,
} from 'lucide-react'
import { getAllHelpTopics, getAllHelpTopicsWithSubtabs, type HelpTopic } from '@/lib/help-content'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useI18n } from '@/hooks/use-i18n'

const GROUP_ORDER = [
  { id: 'home', title: 'Início', icon: Layers, desc: 'Visão executiva e controle geral' },
  {
    id: 'quality',
    title: 'Qualidade',
    icon: CheckSquare,
    desc: 'Checklists, documentos, aprovações e qualificações',
  },
  {
    id: 'operation',
    title: 'Operação',
    icon: Briefcase,
    desc: 'Ordens de serviço, PCP, agenda e expedição',
  },
  {
    id: 'materials',
    title: 'Materiais',
    icon: Boxes,
    desc: 'Almoxarifado, touch, requisições e compras',
  },
  {
    id: 'people',
    title: 'Pessoas',
    icon: Users,
    desc: 'Treinamentos, plano anual e gestão da equipe',
  },
  { id: 'management', title: 'Gestão', icon: BarChart3, desc: 'Indicadores, RNCs e notificações' },
  {
    id: 'administration',
    title: 'Administração',
    icon: Building2,
    desc: 'Empresas, certificações e controle de acesso',
  },
]

export default function HelpCenter() {
  const { lang } = useI18n()
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null)

  const allTopics = useMemo(() => getAllHelpTopics(), [])
  const allTopicsWithSubtabs = useMemo(() => getAllHelpTopicsWithSubtabs(), [])

  // Filtragem por busca e por grupo
  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase()

    let pool = q ? allTopicsWithSubtabs : allTopics

    if (selectedGroup !== 'all') {
      pool = pool.filter((t) => t.groupId === selectedGroup)
    }

    if (!q) return pool

    return pool.filter((topic) => {
      const matchTitle = topic.title.toLowerCase().includes(q)
      const matchSummary = topic.summary.toLowerCase().includes(q)
      const matchSubtitle = (topic.subtitle || '').toLowerCase().includes(q)
      const matchFeatures = topic.features.some(
        (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
      )
      const matchSteps = topic.steps.some(
        (s) => s.title.toLowerCase().includes(q) || s.instruction.toLowerCase().includes(q),
      )
      const matchTags = (topic.tags || []).some((tag) => tag.toLowerCase().includes(q))

      return matchTitle || matchSummary || matchSubtitle || matchFeatures || matchSteps || matchTags
    })
  }, [allTopics, allTopicsWithSubtabs, search, selectedGroup])

  // Agrupa os tópicos resultantes pelos 7 grupos
  const groupedResults = useMemo(() => {
    const map: Record<string, HelpTopic[]> = {}
    filteredTopics.forEach((topic) => {
      if (!map[topic.groupId]) {
        map[topic.groupId] = []
      }
      map[topic.groupId].push(topic)
    })
    return map
  }, [filteredTopics])

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-card p-6 md:p-10 border border-primary/20 shadow-elevation">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            Central de Tutoriais UQualiHub
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white tracking-tight">
            Como podemos ajudar você hoje?
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Consulte os tutoriais passo a passo de cada recurso do sistema antes de recorrer ao
            suporte. Encontre respostas imediatas sobre checklists, almoxarifado, treinamentos e
            muito mais.
          </p>

          {/* Search Bar no Hero */}
          <div className="relative mt-4 pt-2 max-w-2xl">
            <Search className="w-5 h-5 absolute left-3.5 top-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquise por recurso (ex: checklist, almoxarifado, retirada, eficácia, romaneio)..."
              className="pl-11 pr-10 py-6 text-sm bg-black/40 border-white/20 text-white rounded-xl placeholder:text-muted-foreground/70 focus-visible:ring-primary shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-5 -translate-y-1/2 text-muted-foreground hover:text-white"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs pelos 7 grupos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <Button
          variant={selectedGroup === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedGroup('all')}
          className={`text-xs rounded-full shrink-0 ${
            selectedGroup === 'all'
              ? 'bg-primary text-white'
              : 'border-white/10 text-muted-foreground hover:text-white'
          }`}
        >
          Todos os Recursos ({allTopics.length})
        </Button>
        {GROUP_ORDER.map((grp) => {
          const Icon = grp.icon
          const count = allTopics.filter((t) => t.groupId === grp.id).length
          return (
            <Button
              key={grp.id}
              variant={selectedGroup === grp.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup(grp.id)}
              className={`text-xs rounded-full shrink-0 gap-1.5 ${
                selectedGroup === grp.id
                  ? 'bg-primary text-white'
                  : 'border-white/10 text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {grp.title} ({count})
            </Button>
          )
        })}
      </div>

      {/* Grid de Grupos e Cards */}
      <div className="space-y-10">
        {GROUP_ORDER.map((grp) => {
          const topics = groupedResults[grp.id]
          if (!topics || topics.length === 0) return null
          const Icon = grp.icon

          return (
            <div key={grp.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      {grp.title}
                      <span className="text-xs font-normal text-muted-foreground font-sans">
                        ({topics.length} {topics.length === 1 ? 'tutorial' : 'tutoriais'})
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">{grp.desc}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <Card
                    key={topic.id}
                    onClick={() => setActiveTopic(topic)}
                    className="glass border-white/5 hover:border-primary/40 hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <CardHeader className="p-5 pb-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="border-white/10 text-muted-foreground text-[10px]"
                        >
                          {topic.groupTitle}
                        </Badge>
                        {topic.subTab && (
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            Aba {topic.subTab}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-heading font-semibold text-white group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{topic.title}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </CardTitle>
                      {topic.subtitle && (
                        <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                          {topic.subtitle}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      <p className="text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed">
                        {topic.summary}
                      </p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {topic.steps.length} passos
                        </span>
                        <span className="text-primary font-medium group-hover:underline">
                          Ver passo a passo →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {filteredTopics.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-card/30 rounded-xl border border-white/5 p-8">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-lg font-semibold text-white">Nenhum tutorial encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Não encontramos resultados para "{search}". Tente buscar por palavras mais gerais como
              "checklist", "almoxarifado", "treinamentos" ou "documentos".
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedGroup('all')
              }}
              className="border-white/10 text-white"
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Modal com Passo a Passo Completo do Tópico Selecionado */}
      <Dialog open={!!activeTopic} onOpenChange={(v) => !v && setActiveTopic(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-white/10 text-foreground p-6 sm:p-8">
          {activeTopic && (
            <div className="space-y-6">
              <DialogHeader className="text-left space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                    {activeTopic.groupTitle}
                  </Badge>
                  {activeTopic.subTab && (
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                      Aba {activeTopic.subTab}
                    </Badge>
                  )}
                </div>

                <DialogTitle className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary shrink-0" />
                  {activeTopic.title}
                </DialogTitle>

                {activeTopic.subtitle && (
                  <DialogDescription className="text-sm text-muted-foreground">
                    {activeTopic.subtitle}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* O que a tela faz */}
              <div className="rounded-xl p-4 bg-primary/5 border border-primary/20 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> O que esta tela faz
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{activeTopic.summary}</p>
              </div>

              {/* Recursos Principais */}
              {activeTopic.features.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recursos e Botões da Tela
                  </h4>
                  <div className="grid gap-2.5">
                    {activeTopic.features.map((f) => (
                      <div
                        key={f.name}
                        className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {f.name}
                          </span>
                          {f.badge && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-primary/30 text-primary"
                            >
                              {f.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                          {f.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px w-full bg-white/10" />

              {/* Passo a Passo Numerado */}
              {activeTopic.steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Passo a Passo da(s) Tarefa(s) Principal(is)
                  </h4>
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
                          <h5 className="text-xs font-semibold text-white">{st.title}</h5>
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

              {/* Link para navegar diretamente até a tela */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTopic(null)}
                  className="border-white/10 text-muted-foreground"
                >
                  Fechar
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                >
                  <Link to={activeTopic.path} onClick={() => setActiveTopic(null)}>
                    Ir para esta tela
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
