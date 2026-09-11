import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  MessageSquarePlus,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import { createUserFeedback, FeedbackType } from '@/services/user-feedback'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  screenPath: string
  screenName: string
}

export function FeedbackDialog({
  open,
  onOpenChange,
  screenPath,
  screenName,
}: FeedbackDialogProps) {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang } = useI18n()
  const { toast } = useToast()
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const [type, setType] = useState<FeedbackType>('sugestao')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast({
        title: txt('Comentário em branco', 'Blank comment'),
        description: txt(
          'Por favor, escreva sua mensagem antes de enviar.',
          'Please write your message before sending.',
        ),
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await createUserFeedback({
        userId: user?.id,
        userName: user?.name || user?.email || 'Usuário',
        userEmail: user?.email,
        screenPath,
        screenName,
        type,
        comment,
        companyId: selectedCompanyId,
      })

      if (result.success) {
        toast({
          title: txt('Comentário enviado!', 'Feedback sent!'),
          description: txt(
            'Sua mensagem foi enviada à gerência da qualidade com sucesso.',
            'Your message was sent to quality management successfully.',
          ),
        })
        setComment('')
        setType('sugestao')
        onOpenChange(false)
      } else {
        toast({
          title: txt('Não foi possível enviar', 'Could not send'),
          description: txt(
            result.error || 'Ocorreu uma instabilidade momentânea, tente novamente.',
            'A temporary issue occurred, please try again.',
          ),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: txt('Não foi possível enviar', 'Could not send'),
        description: txt(
          'Ocorreu uma falha inesperada, mas a sua tela não foi afetada.',
          'An unexpected error occurred, but your screen is safe.',
        ),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/20 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <MessageSquarePlus className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              {txt('Canal de Feedback & Melhoria', 'Feedback & Improvement Channel')}
            </span>
          </div>
          <DialogTitle className="text-lg font-heading">
            {txt('Comentar sobre esta tela', 'Comment on this screen')}
          </DialogTitle>
          <DialogDescription className="text-xs text-white/70">
            {txt('Tela atual:', 'Current screen:')}{' '}
            <strong className="text-white">{screenName}</strong>{' '}
            <span className="font-mono text-[11px] text-white/50">({screenPath})</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Feedback Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs text-white/80">
              {txt('Tipo de apontamento:', 'Feedback type:')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('sugestao')}
                className={`flex items-center gap-2 p-2 rounded-md border text-xs text-left transition-colors ${
                  type === 'sugestao'
                    ? 'border-primary bg-primary/20 text-white font-medium'
                    : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{txt('Sugestão', 'Suggestion')}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('problema')}
                className={`flex items-center gap-2 p-2 rounded-md border text-xs text-left transition-colors ${
                  type === 'problema'
                    ? 'border-rose-500 bg-rose-500/20 text-white font-medium'
                    : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/5'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{txt('Problema', 'Bug / Issue')}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('duvida')}
                className={`flex items-center gap-2 p-2 rounded-md border text-xs text-left transition-colors ${
                  type === 'duvida'
                    ? 'border-blue-500 bg-blue-500/20 text-white font-medium'
                    : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/5'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{txt('Dúvida', 'Question')}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('elogio')}
                className={`flex items-center gap-2 p-2 rounded-md border text-xs text-left transition-colors ${
                  type === 'elogio'
                    ? 'border-emerald-500 bg-emerald-500/20 text-white font-medium'
                    : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/5'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{txt('Elogio', 'Praise')}</span>
              </button>
            </div>
          </div>

          {/* Comment text */}
          <div className="space-y-1.5">
            <Label htmlFor="comment-text" className="text-xs text-white/80">
              {txt('Sua mensagem:', 'Your message:')}
            </Label>
            <Textarea
              id="comment-text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={txt(
                'Descreva sua sugestão, dúvida ou observe algum ponto que pode ser simplificado...',
                'Describe your suggestion, question, or observe something that could be improved...',
              )}
              className="min-h-[110px] bg-black/40 border-white/15 text-white text-xs placeholder:text-white/40 resize-none focus-visible:ring-primary"
              maxLength={1500}
            />
            <div className="flex justify-between items-center text-[10px] text-white/40">
              <span>
                {txt(
                  'Visível aos Gestores e Consultores da Qualidade',
                  'Visible to Quality Managers and Consultants',
                )}
              </span>
              <span>{comment.length}/1500</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-white/70 hover:text-white"
            >
              {txt('Cancelar', 'Cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !comment.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {txt('Enviando...', 'Sending...')}
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {txt('Enviar Comentário', 'Send Feedback')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
