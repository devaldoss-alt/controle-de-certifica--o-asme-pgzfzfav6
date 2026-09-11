import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  ThumbsUp,
  CheckCircle2,
  Clock,
  RotateCw,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import {
  getUserFeedbacks,
  updateFeedbackStatus,
  type UserFeedback,
  type FeedbackStatus,
  type FeedbackType,
} from '@/services/user-feedback'
import { safeFormatDate } from '@/lib/safe-data'
import { cn } from '@/lib/utils'

interface FeedbackManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackManagementDialog({ open, onOpenChange }: FeedbackManagementDialogProps) {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang } = useI18n()
  const { toast } = useToast()
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      const list = await getUserFeedbacks({
        companyId: selectedCompanyId,
        status: statusFilter,
        type: typeFilter,
      })
      setFeedbacks(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFeedbacks()
    }
  }, [open, selectedCompanyId, statusFilter, typeFilter])

  const handleUpdateStatus = async (fb: UserFeedback, newStatus: FeedbackStatus) => {
    try {
      const updated = await updateFeedbackStatus(
        fb.id,
        newStatus,
        user?.name || user?.email || 'Gestor',
      )
      if (updated) {
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === fb.id ? { ...item, ...updated } : item)),
        )
        toast({
          title: txt('Status atualizado', 'Status updated'),
          description: txt(
            `Comentário marcado como "${newStatus}".`,
            `Feedback marked as "${newStatus}".`,
          ),
        })
      }
    } catch {
      toast({
        title: txt('Erro ao atualizar', 'Update error'),
        variant: 'destructive',
      })
    }
  }

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      f.comment.toLowerCase().includes(term) ||
      f.user_name.toLowerCase().includes(term) ||
      f.screen_name.toLowerCase().includes(term) ||
      f.screen_path.toLowerCase().includes(term)
    )
  })

  const newCount = feedbacks.filter((f) => f.status === 'novo').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/20 text-white sm:max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-heading flex items-center gap-2">
                  {txt(
                    'Central de Feedback & Comentários dos Usuários',
                    'User Feedback & Comments Center',
                  )}
                  {newCount > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                      {newCount} {txt('novo(s)', 'new')}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/70">
                  {txt(
                    'Visualize e responda às sugestões, dúvidas e relatos enviados pelos colaboradores em cada tela.',
                    'View and address suggestions, questions and bug reports submitted across screens.',
                  )}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadFeedbacks}
              disabled={loading}
              className="border-white/10 text-xs hover:bg-white/10 gap-1.5 h-8"
            >
              <RotateCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              {txt('Atualizar', 'Refresh')}
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={txt(
                  'Buscar por texto, usuário ou tela...',
                  'Search text, user or screen...',
                )}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-black/30 border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="w-36">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs bg-black/30 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Todos os Status
                  </SelectItem>
                  <SelectItem value="novo" className="text-xs">
                    Novo
                  </SelectItem>
                  <SelectItem value="lido" className="text-xs">
                    Lido
                  </SelectItem>
                  <SelectItem value="resolvido" className="text-xs">
                    Resolvido
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs bg-black/30 border-white/10 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Todos os Tipos
                  </SelectItem>
                  <SelectItem value="sugestao" className="text-xs">
                    Sugestão
                  </SelectItem>
                  <SelectItem value="problema" className="text-xs">
                    Problema
                  </SelectItem>
                  <SelectItem value="duvida" className="text-xs">
                    Dúvida
                  </SelectItem>
                  <SelectItem value="elogio" className="text-xs">
                    Elogio
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* Feedback List Table */}
        <div className="flex-1 overflow-y-auto mt-3 border border-white/10 rounded-lg">
          <Table>
            <TableHeader className="bg-white/5 sticky top-0 z-10">
              <TableRow className="border-white/10">
                <TableHead className="text-xs text-white/70 w-[140px]">
                  {txt('Usuário / Data', 'User / Date')}
                </TableHead>
                <TableHead className="text-xs text-white/70 w-[140px]">
                  {txt('Tela / Tipo', 'Screen / Type')}
                </TableHead>
                <TableHead className="text-xs text-white/70">
                  {txt('Comentário', 'Comment')}
                </TableHead>
                <TableHead className="text-xs text-white/70 w-[110px] text-center">
                  {txt('Status', 'Status')}
                </TableHead>
                <TableHead className="text-xs text-white/70 w-[130px] text-right">
                  {txt('Ações', 'Actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground text-xs"
                  >
                    {loading
                      ? txt('Carregando comentários...', 'Loading comments...')
                      : txt(
                          'Nenhum comentário encontrado com os filtros selecionados.',
                          'No comments found.',
                        )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedbacks.map((fb) => (
                  <TableRow key={fb.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="align-top py-3">
                      <div className="font-semibold text-xs text-white">{fb.user_name}</div>
                      <div className="text-[11px] text-white/50">{fb.user_email || '—'}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {safeFormatDate(fb.created, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <div className="font-medium text-xs text-white">{fb.screen_name}</div>
                      <div className="font-mono text-[10px] text-white/50 truncate max-w-[130px]">
                        {fb.screen_path}
                      </div>
                      <div className="mt-1">
                        {fb.type === 'sugestao' && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] gap-1 px-1.5 py-0">
                            <Sparkles className="w-3 h-3" /> Sugestão
                          </Badge>
                        )}
                        {fb.type === 'problema' && (
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] gap-1 px-1.5 py-0">
                            <AlertTriangle className="w-3 h-3" /> Problema
                          </Badge>
                        )}
                        {fb.type === 'duvida' && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] gap-1 px-1.5 py-0">
                            <HelpCircle className="w-3 h-3" /> Dúvida
                          </Badge>
                        )}
                        {fb.type === 'elogio' && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] gap-1 px-1.5 py-0">
                            <ThumbsUp className="w-3 h-3" /> Elogio
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap break-words bg-black/20 p-2 rounded border border-white/5">
                        {fb.comment}
                      </p>
                      {fb.status === 'resolvido' && fb.resolved_by_name && (
                        <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {txt('Resolvido por:', 'Resolved by:')} {fb.resolved_by_name}
                          {fb.resolved_at && ` em ${safeFormatDate(fb.resolved_at, 'dd/MM/yyyy')}`}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="align-top py-3 text-center">
                      {fb.status === 'novo' && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                          Novo
                        </Badge>
                      )}
                      {fb.status === 'lido' && (
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 text-blue-300 text-[10px]"
                        >
                          Lido
                        </Badge>
                      )}
                      {fb.status === 'resolvido' && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                          Resolvido
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="align-top py-3 text-right">
                      <div className="flex flex-col gap-1 items-end">
                        {fb.status === 'novo' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(fb, 'lido')}
                            className="h-6 text-[11px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
                          >
                            {txt('Marcar lido', 'Mark read')}
                          </Button>
                        )}
                        {fb.status !== 'resolvido' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(fb, 'resolvido')}
                            className="h-6 text-[11px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-2"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {txt('Resolver', 'Resolve')}
                          </Button>
                        )}
                        {fb.status === 'resolvido' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(fb, 'lido')}
                            className="h-6 text-[10px] text-white/40 hover:text-white"
                          >
                            {txt('Reabrir', 'Reopen')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
