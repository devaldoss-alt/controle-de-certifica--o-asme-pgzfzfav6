import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import {
  getPendingApprovals,
  approveChecklist,
  rejectChecklist,
  type Checklist,
} from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { EvidencePreview } from '@/components/EvidencePreview'
import {
  safeDifferenceInHours,
  safeFormatDate,
  safeParseEvidenceFiles,
  safeHasEvidence,
} from '@/lib/safe-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Check, X, FileText, CheckCircle2, Clock, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Approvals() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      const data = await getPendingApprovals()
      setChecklists(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('checklists', () => loadData())

  const handleApprove = async (id: string) => {
    setLoading(true)
    try {
      await approveChecklist(id)
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectId || !comment.trim()) return
    setLoading(true)
    try {
      await rejectChecklist(rejectId, comment)
      setRejectId(null)
      setComment('')
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'Manager' && user?.role !== 'QCC') {
    return (
      <div className="p-8 text-center text-rose-500">
        <BilingualText k="approval.accessDenied" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          <BilingualText k="page.approvals.title" />
        </h1>
        <p className="text-muted-foreground">
          <BilingualText k="page.approvals.desc" />
        </p>
      </div>

      <div className="grid gap-3">
        {checklists.map((item) => {
          const hours = safeDifferenceInHours(item.due_date)
          return (
            <Card key={item.id} className="glass border-white/5 backdrop-blur-md">
              <CardContent className="p-4 flex flex-col lg:flex-row items-start gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-base text-white">{item.title}</h3>
                    {item.category && (
                      <Badge variant="outline" className="border-white/10 text-xs">
                        {item.category}
                      </Badge>
                    )}
                    {item.expand?.os_id && (
                      <Badge variant="outline" className="border-primary/20 text-primary text-xs">
                        {item.expand.os_id.number}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                    <Badge variant="outline" className="border-white/10">
                      {item.role_assigned}
                    </Badge>
                    <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded border border-white/5 font-mono">
                      <FileText className="w-3 h-3" />
                      {item.mcq_ref || t('common.na')}
                    </span>
                    {item.expand?.last_action_by && <span>{item.expand.last_action_by.name}</span>}
                    <span
                      className={cn(
                        'flex items-center gap-1',
                        hours < 0 ? 'text-rose-500' : hours <= 48 ? 'text-amber-500' : '',
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {item.due_date
                        ? safeFormatDate(item.due_date, 'dd/MM/yyyy')
                        : t('qualifications.noDate')}
                    </span>
                  </div>
                  {safeHasEvidence(item.evidence_file) && (
                    <div className="mt-2 p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-emerald-500">
                        <Paperclip className="w-3 h-3" />
                        <BilingualText k="common.evidence" />
                      </div>
                      <EvidencePreview checklistId={item.id} filename={item.evidence_file} />
                      {item.evidence_notes && item.evidence_notes.trim() !== '' && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {item.evidence_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(item.id)}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <BilingualText k="common.approve" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectId(item.id)
                      setComment('')
                    }}
                    disabled={loading}
                    className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <BilingualText k="common.reject" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {checklists.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>
            <BilingualText k="msg.noApprovals" />
          </p>
        </div>
      )}

      <Dialog open={!!rejectId} onOpenChange={(v) => !v && setRejectId(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              <BilingualText k="common.reject" />
            </DialogTitle>
            <DialogDescription>
              <BilingualText k="approval.rejectReason" />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-white/80">
              <BilingualText k="approval.reason" />
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="..."
              className="bg-black/20 border-white/10 text-white min-h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectId(null)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              <BilingualText k="common.cancel" />
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !comment.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {loading ? '...' : <BilingualText k="common.reject" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
