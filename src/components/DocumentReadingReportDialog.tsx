import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Users,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  Percent,
} from 'lucide-react'
import {
  getDocumentReadingMetrics,
  getDocumentReadingSessions,
  getAttemptsForDocument,
  type DocumentReadingMetrics,
  type ReadingSession,
  type QuizAttempt,
} from '@/services/document-reading-quiz'
import { safeFormatDate } from '@/lib/safe-data'

interface DocumentReadingReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    title: string
    code?: string
    prefix?: string
  } | null
}

export function DocumentReadingReportDialog({
  open,
  onOpenChange,
  document,
}: DocumentReadingReportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<DocumentReadingMetrics | null>(null)
  const [sessions, setSessions] = useState<ReadingSession[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [activeTab, setActiveTab] = useState('sessions')

  useEffect(() => {
    if (!open || !document?.id) return
    let isMounted = true
    setLoading(true)

    Promise.all([
      getDocumentReadingMetrics(document.id),
      getDocumentReadingSessions(document.id),
      getAttemptsForDocument(document.id),
    ])
      .then(([m, s, a]) => {
        if (isMounted) {
          setMetrics(m)
          setSessions(s)
          setAttempts(a)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, document?.id])

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

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-white/10 text-white p-6">
        <DialogHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <DialogTitle className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Relatório de Leitura Rastreada & Provas (GQ)
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                {document.prefix ? `${document.prefix} • ` : ''}
                {document.code ? `${document.code} — ` : ''}
                {document.title}
              </DialogDescription>
            </div>

            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              Auditoria SGQ 7.2
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Carregando métricas de leitura e avaliações...
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Top KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Leitores Únicos
                </p>
                <p className="text-2xl font-bold text-white mt-1">{metrics?.total_readers || 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {metrics?.total_sessions || 0} sessões registradas
                </p>
              </Card>

              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo Médio
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatSeconds(metrics?.avg_reading_time_seconds)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Por sessão concluída</p>
              </Card>

              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" /> Provas Feitas
                </p>
                <p className="text-2xl font-bold text-white mt-1">{metrics?.total_attempts || 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {metrics?.approved_attempts || 0} aprovação(ões)
                </p>
              </Card>

              <Card className="glass border-white/5 bg-black/20 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" /> Taxa de Aprovação
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {metrics?.approval_rate_percent || 0}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Meta: ≥ 70%</p>
              </Card>
            </div>

            {/* Tabs for detailed listings */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-black/30 border border-white/10 p-1">
                <TabsTrigger
                  value="sessions"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Sessões de Leitura ({sessions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="attempts"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                >
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Provas Realizadas ({attempts.length})
                </TabsTrigger>
              </TabsList>

              {/* Sessions Table */}
              <TabsContent value="sessions" className="space-y-3 pt-2">
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-black/50 text-[11px]">
                      <TableRow className="border-white/10">
                        <TableHead className="text-white/80">COLABORADOR / LEITOR</TableHead>
                        <TableHead className="text-white/60">CARGO / SETOR</TableHead>
                        <TableHead className="text-white/80">TEMPO DE LEITURA</TableHead>
                        <TableHead className="text-white/60">DATA / HORÁRIO</TableHead>
                        <TableHead className="text-right text-white/60">SITUAÇÃO</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s) => (
                        <TableRow key={s.id} className="border-white/5 text-xs">
                          <TableCell className="font-semibold text-white">
                            {s.reader_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[11px]">
                            {s.reader_role || 'Colaborador'}
                          </TableCell>
                          <TableCell className="font-mono text-white/90">
                            {formatSeconds(s.duration_seconds)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[11px]">
                            {safeFormatDate(s.started_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.abandoned ? (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                Sessão Longa (&gt;2h)
                              </Badge>
                            ) : s.completed ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                Concluído
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-white/10 text-white/60 text-[10px]"
                              >
                                Em Aberto
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {sessions.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground text-xs"
                          >
                            Nenhum registro de leitura capturado para este documento ainda.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Attempts Table */}
              <TabsContent value="attempts" className="space-y-3 pt-2">
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-black/50 text-[11px]">
                      <TableRow className="border-white/10">
                        <TableHead className="text-white/80">COLABORADOR</TableHead>
                        <TableHead className="w-20 text-center text-white/80">TENTATIVA</TableHead>
                        <TableHead className="w-28 text-center text-white/80">NOTA</TableHead>
                        <TableHead className="w-32 text-center text-white/80">RESULTADO</TableHead>
                        <TableHead className="text-muted-foreground text-[11px]">DATA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((a) => (
                        <TableRow key={a.id} className="border-white/5 text-xs">
                          <TableCell className="font-semibold text-white">
                            {a.collaborator_name}
                            <div className="text-[10px] text-muted-foreground">
                              {a.collaborator_role || 'Colaborador'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            #{a.attempt_number}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            <span className={a.approved ? 'text-emerald-400' : 'text-rose-400'}>
                              {a.score_percent}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {a.approved ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                Aprovado
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
                                Reprovado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[11px]">
                            {safeFormatDate(a.created)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {attempts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground text-xs"
                          >
                            Nenhuma prova realizada para este documento ainda.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5 text-xs"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
