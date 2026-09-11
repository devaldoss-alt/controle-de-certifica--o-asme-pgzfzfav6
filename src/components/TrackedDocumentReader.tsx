import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, BookOpen, Award, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import {
  startReadingSession,
  finishReadingSession,
  getQuizForDocument,
  type ReadingSession,
  type DocumentQuiz,
} from '@/services/document-reading-quiz'

interface TrackedDocumentReaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    title: string
    code?: string
    prefix?: string
    content?: string
    category?: string
    sector?: string
    revision?: string
    company_id?: string
  } | null
  currentUserId?: string
  currentUserName?: string
  currentUserRole?: string
  teamMemberId?: string
  companyId?: string
  onTakeQuiz?: (quiz: DocumentQuiz) => void
}

export function TrackedDocumentReader({
  open,
  onOpenChange,
  document,
  currentUserId,
  currentUserName,
  currentUserRole,
  teamMemberId,
  companyId,
  onTakeQuiz,
}: TrackedDocumentReaderProps) {
  const [seconds, setSeconds] = useState(0)
  const [session, setSession] = useState<ReadingSession | null>(null)
  const [quiz, setQuiz] = useState<DocumentQuiz | null>(null)
  const timerRef = useRef<any>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Start reading session and timer when opened
  useEffect(() => {
    if (!open || !document?.id) {
      setSeconds(0)
      setSession(null)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const start = new Date()
    startTimeRef.current = start
    setSeconds(0)

    // Start timer interval
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    // Register session in backend
    startReadingSession({
      documentId: document.id,
      teamMemberId: teamMemberId,
      userId: currentUserId,
      readerName: currentUserName || 'Colaborador',
      readerRole: currentUserRole || 'Colaborador',
      companyId: companyId || document.company_id,
    }).then((created) => {
      if (created) setSession(created)
    })

    // Check if document has an active quiz
    getQuizForDocument(document.id).then((foundQuiz) => {
      setQuiz(foundQuiz)
    })

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [open, document?.id])

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleClose = async (explicitCompleted = false) => {
    if (session && startTimeRef.current) {
      await finishReadingSession(session.id, startTimeRef.current, explicitCompleted)
    }
    onOpenChange(false)
  }

  const handleCompleteAndQuiz = async () => {
    if (session && startTimeRef.current) {
      await finishReadingSession(session.id, startTimeRef.current, true)
    }
    onOpenChange(false)
    if (quiz && onTakeQuiz) {
      onTakeQuiz(quiz)
    }
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose(false)}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col glass border-white/10 text-white p-0 overflow-hidden">
        {/* Sticky Header with tracked timer and procedure info */}
        <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                {document.prefix || 'DOC'} {document.code ? `• ${document.code}` : ''}
              </Badge>
              {document.revision && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Rev. {document.revision}
                </span>
              )}
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 text-[10px]"
              >
                Leitura Rastreada Ativa
              </Badge>
            </div>
            <h2 className="text-base font-heading font-bold text-white line-clamp-1">
              {document.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Reading Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="text-right">
                <span className="text-xs font-mono font-bold">{formatTimer(seconds)}</span>
                <span className="block text-[9px] text-emerald-400/80 uppercase tracking-wider">
                  Tempo Lido
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleClose(false)}
              className="border-white/10 text-muted-foreground hover:text-white h-8 text-xs"
            >
              Fechar
            </Button>
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {document.content ? (
            <div
              className="prose prose-invert max-w-none text-white/90 leading-relaxed text-sm"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          ) : (
            <Card className="glass border-white/5 p-8 text-center space-y-3">
              <FileText className="w-12 h-12 text-primary/40 mx-auto" />
              <p className="text-sm font-semibold text-white">
                Procedimento Técnico Registrado no SGQ
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Este procedimento está aprovado e homologado na Lista Mestra oficial da empresa. Sua
                leitura está sendo cronometrada e registrada como comprovação de capacitação.
              </p>
            </Card>
          )}

          {/* Banner about quiz & training accreditation */}
          {quiz && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-3 mt-6">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-white">
                    Prova de Leitura e Eficácia Disponível
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nota mínima exigida:{' '}
                  <strong className="text-white">{quiz.min_score_percent}%</strong>. Ao ser
                  aprovado, o treinamento alimenta automaticamente seus indicadores de HHT e %
                  Eficácia.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleCompleteAndQuiz}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
              >
                Concluir Leitura e Fazer Prova
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Leitor: <strong className="text-white">{currentUserName || 'Colaborador'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleClose(true)}
              className="border-white/10 text-white hover:bg-white/10 h-7 text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Marcar como Lido
            </Button>
            {quiz && (
              <Button
                size="sm"
                onClick={handleCompleteAndQuiz}
                className="bg-emerald-600 text-white hover:bg-emerald-500 h-7 text-xs"
              >
                <Award className="w-3.5 h-3.5 mr-1" />
                Fazer Prova ({quiz.min_score_percent}%)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
