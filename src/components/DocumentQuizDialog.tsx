import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Award, CheckCircle2, XCircle, HelpCircle, Clock, RotateCcw, Sparkles } from 'lucide-react'
import {
  submitQuizAttempt,
  type DocumentQuiz,
  type QuizQuestion,
  type QuizAttempt,
} from '@/services/document-reading-quiz'

interface DocumentQuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: DocumentQuiz | null
  currentUserId?: string
  currentUserName?: string
  currentUserRole?: string
  teamMemberId?: string
  companyId?: string
  onQuizCompleted?: (attempt: QuizAttempt) => void
}

export function DocumentQuizDialog({
  open,
  onOpenChange,
  quiz,
  currentUserId,
  currentUserName,
  currentUserRole,
  teamMemberId,
  companyId,
  onQuizCompleted,
}: DocumentQuizDialogProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    scorePercent: number
    approved: boolean
    totalQuestions: number
    correctCount: number
    attempt?: QuizAttempt
  } | null>(null)

  const questions: QuizQuestion[] = quiz
    ? Array.isArray(quiz.questions)
      ? quiz.questions
      : JSON.parse((quiz.questions as string) || '[]')
    : []

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return // locked after submission
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!quiz) return
    setIsSubmitting(true)
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qid, idx]) => ({
        question_id: qid,
        selected_index: idx,
      }))

      const res = await submitQuizAttempt({
        quiz,
        answers: answersPayload,
        teamMemberId,
        userId: currentUserId,
        collaboratorName: currentUserName || 'Colaborador',
        collaboratorRole: currentUserRole || 'Colaborador',
        companyId,
      })

      setResult({
        scorePercent: res.scorePercent,
        approved: res.approved,
        totalQuestions: res.totalQuestions,
        correctCount: res.correctCount,
        attempt: res.attempt,
      })

      if (onQuizCompleted) onQuizCompleted(res.attempt)
    } catch (err) {
      console.error('handleSubmit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const allAnswered =
    questions.length > 0 && questions.every((q) => selectedAnswers[q.id] !== undefined)
  const minRequired = quiz?.min_score_percent ?? 70

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto glass border-white/10 text-white p-6">
        <DialogHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <DialogTitle className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                {quiz?.title || 'Prova de Procedimento & Eficácia'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                {quiz?.description ||
                  'Responda às questões para comprovar assimilação do conteúdo do documento.'}
              </DialogDescription>
            </div>

            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              Mínimo para aprovação: {minRequired}%
            </Badge>
          </div>
        </DialogHeader>

        {/* Result banner if already answered */}
        {result && (
          <div
            className={`p-4 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in ${
              result.approved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.approved ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {result.approved
                    ? 'APROVADO — Eficácia e Treinamento Comprovados!'
                    : 'REPROVADO — Nota Abaixo da Mínima Exigida'}
                </p>
                <p className="text-xs text-white/80 mt-0.5">
                  Você acertou {result.correctCount} de {result.totalQuestions} questões (
                  <strong>{result.scorePercent}%</strong> de aproveitamento. Mínimo: {minRequired}
                  %).
                </p>
                {result.approved && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Registro vinculado à sua Ficha do Colaborador e aos indicadores de
                    Treinamento.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!result.approved && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="border-white/20 text-white hover:bg-white/10 text-xs h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Tentar Novamente
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-white/10 text-white hover:bg-white/20 text-xs h-8"
              >
                Concluir
              </Button>
            </div>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-6 pt-2">
          {questions.map((q, idx) => {
            const selectedOpt = selectedAnswers[q.id]
            const isCorrect = selectedOpt === q.correct_option_index

            return (
              <Card key={q.id || idx} className="glass border-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-white leading-snug">
                    <span className="text-primary font-mono mr-1.5">Questão {idx + 1}.</span>
                    {q.question}
                  </h4>

                  {result && (
                    <Badge
                      className={`text-[10px] shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? 'Correta' : 'Incorreta'}
                    </Badge>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedOpt === oIdx
                    let optionStyle = 'border-white/10 hover:bg-white/5'

                    if (result) {
                      if (oIdx === q.correct_option_index) {
                        optionStyle =
                          'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold'
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      } else {
                        optionStyle = 'border-white/5 opacity-50'
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-primary bg-primary/10 text-white font-medium'
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`p-2.5 rounded-md border text-xs cursor-pointer flex items-center gap-3 transition-colors ${optionStyle}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground font-bold text-[10px]'
                              : 'border-white/30'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="flex-1">{opt}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Technical Explanation after submission */}
                {result && q.explanation && (
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] text-muted-foreground flex items-start gap-1.5 mt-2">
                    <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Fundamentação:</strong> {q.explanation}
                    </span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Footer controls */}
        {!result && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-muted-foreground">
              {Object.keys(selectedAnswers).length} de {questions.length} respondidas
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10 text-muted-foreground hover:text-white text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                disabled={!allAnswered || isSubmitting}
                onClick={handleSubmit}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4"
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Prova'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
