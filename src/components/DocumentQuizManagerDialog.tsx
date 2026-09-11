import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sparkles,
  Plus,
  Trash2,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import {
  saveDocumentQuiz,
  generateQuizQuestionsWithAI,
  type DocumentQuiz,
  type QuizQuestion,
} from '@/services/document-reading-quiz'

interface DocumentQuizManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    title: string
    code?: string
    prefix?: string
    content?: string
    sector?: string
    category?: string
  } | null
  existingQuiz?: DocumentQuiz | null
  onSaved?: (quiz: DocumentQuiz) => void
}

export function DocumentQuizManagerDialog({
  open,
  onOpenChange,
  document,
  existingQuiz,
  onSaved,
}: DocumentQuizManagerDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minScorePercent, setMinScorePercent] = useState<number>(70)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15)
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generationSource, setGenerationSource] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !document) return

    if (existingQuiz) {
      setTitle(existingQuiz.title)
      setDescription(existingQuiz.description || '')
      setMinScorePercent(existingQuiz.min_score_percent ?? 70)
      setEstimatedMinutes(existingQuiz.estimated_minutes ?? 15)
      setStatus(existingQuiz.status || 'published')
      const parsed = Array.isArray(existingQuiz.questions)
        ? existingQuiz.questions
        : JSON.parse((existingQuiz.questions as string) || '[]')
      setQuestions(parsed)
      setGenerationSource(existingQuiz.generation_method || null)
    } else {
      setTitle(
        `Avaliação de Eficácia & Leitura — ${document.code || document.prefix || ''} ${document.title}`.trim(),
      )
      setDescription(
        `Comprovação de leitura e assimilação das diretrizes do procedimento ${document.title} para o SGQ.`,
      )
      setMinScorePercent(70)
      setEstimatedMinutes(15)
      setStatus('published')
      setQuestions([])
      setGenerationSource(null)
    }
  }, [open, document, existingQuiz])

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      explanation: '',
    }
    setQuestions((prev) => [...prev, newQ])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const newOpts = [...q.options]
        newOpts[optIndex] = value
        return { ...q, options: newOpts }
      }),
    )
  }

  const handleGenerateAI = async () => {
    if (!document) return
    setIsGeneratingAI(true)
    try {
      const result = await generateQuizQuestionsWithAI({
        title: document.title,
        code: document.code,
        content: document.content,
        sector: document.sector,
        category: document.category,
      })
      setQuestions(result.questions)
      setGenerationSource(result.source === 'ai' ? 'ai_generated' : 'hybrid')
    } catch (err) {
      console.error('handleGenerateAI error:', err)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSave = async () => {
    if (!document) return
    setIsSaving(true)
    try {
      const saved = await saveDocumentQuiz({
        id: existingQuiz?.id,
        document_id: document.id,
        title,
        description,
        min_score_percent: minScorePercent,
        estimated_minutes: estimatedMinutes,
        status,
        generation_method: (generationSource as any) || 'manual',
        questions,
      })
      if (onSaved) onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      console.error('handleSave error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto glass border-white/10 text-white p-6">
        <DialogHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <DialogTitle className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Configurar Prova de Leitura (GQ)
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                {document?.title} — Requisito de Treinamento e Eficácia ISO 9001 item 7.2
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-8 gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                {isGeneratingAI ? 'Gerando Questões com IA...' : 'Gerar com Assistente IA'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs text-white/80">Título da Prova *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Avaliação de Procedimento de Soldagem"
                className="h-8 text-xs bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-white/80">Nota Mínima Aprovável (%) *</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minScorePercent}
                  onChange={(e) => setMinScorePercent(Number(e.target.value))}
                  className="h-8 text-xs bg-black/40 border-white/10 text-white font-bold"
                />
                <span className="absolute right-3 top-2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-white/80">
              Descrição / Instruções para o Colaborador
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Instruções e critérios de pontuação..."
              className="text-xs bg-black/40 border-white/10 text-white resize-none"
            />
          </div>

          {/* Questions Header */}
          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                Questões Cadastradas ({questions.length})
              </span>
              {generationSource && (
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                  {generationSource === 'ai_generated' ? 'Assistente IA' : 'Revisado pela GQ'}
                </Badge>
              )}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddQuestion}
              className="border-white/10 text-white hover:bg-white/10 text-xs h-7"
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar Questão Manual
            </Button>
          </div>

          {/* Questions Editor */}
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <Card key={q.id || qIdx} className="glass border-white/10 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold text-primary">Questão {qIdx + 1}</Label>
                    <Input
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                      placeholder="Enunciado da pergunta sobre o procedimento..."
                      className="h-8 text-xs bg-black/50 border-white/10 text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="h-7 w-7 text-muted-foreground hover:text-rose-400 mt-5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* 4 Options with radio for correct answer */}
                <div className="space-y-2 pt-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Alternativas (marque a correta):
                  </Label>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correct_option_index === oIdx
                    return (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${q.id || qIdx}`}
                          checked={isCorrect}
                          onChange={() => handleUpdateQuestion(qIdx, 'correct_option_index', oIdx)}
                          className="h-4 w-4 accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-mono text-muted-foreground w-4 text-center">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <Input
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`Alternativa ${String.fromCharCode(65 + oIdx)}...`}
                          className={`h-7 text-xs bg-black/40 border-white/10 text-white flex-1 ${
                            isCorrect ? 'border-primary/50 text-emerald-300' : ''
                          }`}
                        />
                        {isCorrect && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                            Gabarito
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-primary" /> Justificativa Técnica /
                    Referência
                  </Label>
                  <Input
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                    placeholder="Ex: Atende ao item 7.2 da ISO 9001 e ASME Sec V Art 9."
                    className="h-7 text-xs bg-black/30 border-white/10 text-muted-foreground"
                  />
                </div>
              </Card>
            ))}

            {questions.length === 0 && (
              <div className="p-8 text-center rounded-lg bg-black/20 border border-white/5 space-y-3">
                <BookOpen className="w-8 h-8 text-muted-foreground opacity-30 mx-auto" />
                <p className="text-sm font-semibold text-white">Nenhuma questão cadastrada</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Você pode usar o botão <strong>"Gerar com Assistente IA"</strong> para criar
                  automaticamente perguntas a partir do conteúdo do documento, ou adicionar
                  perguntas manualmente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Badge variant="outline" className="border-white/10 text-xs text-white/70">
            {questions.length} questão(ões) • Mínimo {minScorePercent}%
          </Badge>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 text-muted-foreground hover:text-white text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving || questions.length === 0}
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4"
            >
              {isSaving ? 'Salvando...' : 'Publicar Prova de Leitura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
