import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  GraduationCap,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Briefcase,
  HelpCircle,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import {
  getCollaboratorFullProfile,
  type FullCollaboratorProfileData,
} from '@/services/collaborator-profile'
import { safeFormatDate } from '@/lib/safe-data'

interface CollaboratorProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMemberId?: string
  collaboratorName?: string
  companyId?: string
}

export function CollaboratorProfileDialog({
  open,
  onOpenChange,
  teamMemberId,
  collaboratorName,
  companyId,
}: CollaboratorProfileDialogProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FullCollaboratorProfileData | null>(null)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    if (!open) return
    let isMounted = true
    setLoading(true)

    getCollaboratorFullProfile({ teamMemberId, name: collaboratorName, companyId })
      .then((profile) => {
        if (isMounted) setData(profile)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, teamMemberId, collaboratorName, companyId])

  const formatSeconds = (sec?: number) => {
    if (!sec || sec <= 0) return '0 min'
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remMins = mins % 60
      return `${hours}h ${remMins}m`
    }
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto glass border-white/10 text-white p-6">
        <DialogHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {data?.name?.charAt(0).toUpperCase() ||
                    collaboratorName?.charAt(0).toUpperCase() ||
                    'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  {data?.name || collaboratorName || 'Ficha do Colaborador'}
                  {data?.isIndicator && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
                      Apontador
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    {data?.role || 'Colaborador'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {data?.companyName || 'Empresa'} • {data?.department || 'Departamento'}
                  </span>
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 text-xs">
              Onda D — Ficha Individual
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto animate-pulse text-primary opacity-60" />
            <p className="text-sm">Carregando histórico do colaborador...</p>
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-muted-foreground">
            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum dado encontrado para este colaborador.</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> HHT Acumulado
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data.metrics.totalTrainingHours}h
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Presencial + Leituras</p>
              </Card>

              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Treinamentos
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data.metrics.totalTrainingsAttended}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {data.metrics.totalTrainingsMissed > 0
                    ? `${data.metrics.totalTrainingsMissed} ausência(s)`
                    : '100% frequência'}
                </p>
              </Card>

              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" /> Eficácia Prática
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-white">
                    {data.metrics.effectivenessApprovedCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{' '}
                    {data.metrics.effectivenessApprovedCount +
                      data.metrics.effectivenessDisapprovedCount +
                      data.metrics.effectivenessPendingCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {data.metrics.effectivenessPendingCount > 0
                    ? `${data.metrics.effectivenessPendingCount} em avaliação`
                    : 'Todas avaliadas'}
                </p>
              </Card>

              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Procedimentos Lidos
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data.metrics.documentsReadCount}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {data.metrics.quizzesApprovedCount} prova(s) aprovada(s)
                </p>
              </Card>
            </div>

            {/* Tabs for Details */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-black/30 border border-white/10 p-1 flex flex-wrap h-auto gap-1">
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                >
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                  Treinamentos Realizados ({data.attendances.length})
                </TabsTrigger>
                <TabsTrigger
                  value="matrix"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Matriz Previsto × Realizado ({data.plannedMatrix.length})
                </TabsTrigger>
                <TabsTrigger
                  value="readings"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Leituras & Provas ({data.readingSessions.length + data.quizAttempts.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Treinamentos Realizados */}
              <TabsContent value="summary" className="space-y-4 pt-3">
                <Card className="glass border-white/5">
                  <CardHeader className="py-3 px-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                      <span>Histórico de Treinamentos e Avaliações de Eficácia (+60d)</span>
                      <Badge variant="outline" className="border-white/10 text-white/70 text-xs">
                        {data.attendances.length} registro(s)
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead className="text-xs text-white/60">
                              Ação / Treinamento
                            </TableHead>
                            <TableHead className="text-xs text-white/60">Data</TableHead>
                            <TableHead className="text-xs text-white/60">Carga Horária</TableHead>
                            <TableHead className="text-xs text-white/60">Presença</TableHead>
                            <TableHead className="text-xs text-white/60">Nota / Prova</TableHead>
                            <TableHead className="text-xs text-white/60">Eficácia (+60d)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.attendances.map((att, i) => (
                            <TableRow key={att.participantId || i} className="border-white/5">
                              <TableCell className="text-xs font-medium text-white max-w-xs">
                                <div>{att.actionTitle}</div>
                                {att.instructorName && (
                                  <div className="text-[11px] text-muted-foreground">
                                    Instrutor: {att.instructorName}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-white/70">
                                {safeFormatDate(att.date)}
                              </TableCell>
                              <TableCell className="text-xs text-white/70">
                                {att.chHours}h
                              </TableCell>
                              <TableCell className="text-xs">
                                {att.presence === 'Presente' ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                    Presente
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
                                    {att.presence}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-white/80">
                                {typeof att.score === 'number' && att.score > 0 ? (
                                  <span className="font-semibold text-emerald-400">
                                    {att.score}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {att.effectivenessResponse === 'SIM' ? (
                                  <div className="space-y-0.5">
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] flex items-center gap-1 w-fit">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      Eficaz (SIM)
                                    </Badge>
                                    {att.effectivenessComment && (
                                      <p
                                        className="text-[10px] text-muted-foreground line-clamp-1 italic"
                                        title={att.effectivenessComment}
                                      >
                                        "{att.effectivenessComment}"
                                      </p>
                                    )}
                                  </div>
                                ) : att.effectivenessResponse === 'NÃO' ? (
                                  <div className="space-y-0.5">
                                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] flex items-center gap-1 w-fit">
                                      <XCircle className="w-3 h-3 text-rose-400" />
                                      Não Eficaz
                                    </Badge>
                                    {att.effectivenessComment && (
                                      <p
                                        className="text-[10px] text-muted-foreground line-clamp-1 italic"
                                        title={att.effectivenessComment}
                                      >
                                        "{att.effectivenessComment}"
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/30 text-amber-400 text-[10px] flex items-center gap-1 w-fit"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    Pendente (+60d)
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {data.attendances.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                          Nenhum treinamento registrado em lista de presença para este colaborador.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Matriz Colaborador x Treinamentos do Plano */}
              <TabsContent value="matrix" className="space-y-4 pt-3">
                <Card className="glass border-white/5">
                  <CardHeader className="py-3 px-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                      <span>Matriz de Competências: Previsto vs. Realizado</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Ações cadastradas no Plano Anual FSGQ 7.2-1
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead className="text-xs text-white/60">Ação do Plano</TableHead>
                            <TableHead className="text-xs text-white/60">Tipo</TableHead>
                            <TableHead className="text-xs text-white/60">Data Prevista</TableHead>
                            <TableHead className="text-xs text-white/60">Carga</TableHead>
                            <TableHead className="text-xs text-white/60">
                              Status da Matriz
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.plannedMatrix.map((item) => (
                            <TableRow key={item.actionId} className="border-white/5">
                              <TableCell className="text-xs font-medium text-white max-w-sm">
                                {item.actionTitle}
                              </TableCell>
                              <TableCell className="text-xs text-white/70">
                                <Badge
                                  variant="outline"
                                  className="border-white/10 text-white/70 text-[10px]"
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-white/70">
                                {safeFormatDate(item.plannedDate)}
                              </TableCell>
                              <TableCell className="text-xs text-white/70">
                                {item.chHours}h
                              </TableCell>
                              <TableCell className="text-xs">
                                {item.participated ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Realizado (Presente)
                                  </Badge>
                                ) : item.status === 'Concluído' ? (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] flex items-center gap-1 w-fit">
                                    Turma Realizada
                                  </Badge>
                                ) : item.status === 'Atrasado' ? (
                                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] flex items-center gap-1 w-fit">
                                    Atrasado no Plano
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/30 text-amber-400 text-[10px] flex items-center gap-1 w-fit"
                                  >
                                    Programado
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Leituras de Procedimentos e Provas */}
              <TabsContent value="readings" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sessões de leitura rastreada */}
                  <Card className="glass border-white/5">
                    <CardHeader className="py-3 px-4 border-b border-white/5">
                      <CardTitle className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        Sessões de Leitura Rastreada ({data.readingSessions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10">
                              <TableHead className="text-[11px] text-white/60">Documento</TableHead>
                              <TableHead className="text-[11px] text-white/60">Duração</TableHead>
                              <TableHead className="text-[11px] text-white/60">Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.readingSessions.map((s) => (
                              <TableRow key={s.id} className="border-white/5">
                                <TableCell
                                  className="text-xs font-medium text-white max-w-[180px] truncate"
                                  title={s.expand?.document_id?.title || s.notes}
                                >
                                  {s.expand?.document_id?.code
                                    ? `${s.expand.document_id.code} — `
                                    : ''}
                                  {s.expand?.document_id?.title || 'Procedimento SGQ'}
                                </TableCell>
                                <TableCell className="text-xs text-white/80">
                                  {formatSeconds(s.duration_seconds)}
                                  {s.abandoned && (
                                    <span className="text-[10px] text-amber-400 ml-1">
                                      (expirou)
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-white/60">
                                  {safeFormatDate(s.started_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {data.readingSessions.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground text-xs">
                            Nenhuma leitura rastreada registrada ainda.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Provas de leitura */}
                  <Card className="glass border-white/5">
                    <CardHeader className="py-3 px-4 border-b border-white/5">
                      <CardTitle className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        Provas de Eficácia Realizadas ({data.quizAttempts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10">
                              <TableHead className="text-[11px] text-white/60">Avaliação</TableHead>
                              <TableHead className="text-[11px] text-white/60">Nota</TableHead>
                              <TableHead className="text-[11px] text-white/60">Situação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.quizAttempts.map((q) => (
                              <TableRow key={q.id} className="border-white/5">
                                <TableCell
                                  className="text-xs font-medium text-white max-w-[180px] truncate"
                                  title={q.expand?.quiz_id?.title || q.expand?.document_id?.title}
                                >
                                  {q.expand?.document_id?.title ||
                                    q.expand?.quiz_id?.title ||
                                    'Prova de Procedimento'}
                                </TableCell>
                                <TableCell className="text-xs font-bold">
                                  <span
                                    className={q.approved ? 'text-emerald-400' : 'text-rose-400'}
                                  >
                                    {q.score_percent}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {q.approved ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                      Aprovado
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
                                      Reprovado
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {data.quizAttempts.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground text-xs">
                            Nenhuma prova de leitura realizada até o momento.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
