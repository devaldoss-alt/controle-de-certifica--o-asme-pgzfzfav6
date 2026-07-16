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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Upload, FileCheck } from 'lucide-react'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import { uploadEvidence, type Checklist } from '@/services/api'

interface EvidenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checklist: Checklist | null
  onSubmitted: () => void
}

export function EvidenceDialog({
  open,
  onOpenChange,
  checklist,
  onSubmitted,
}: EvidenceDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()

  const handleSubmit = async () => {
    if (!checklist || !file) return
    setLoading(true)
    try {
      await uploadEvidence(checklist.id, file, notes)
      setFile(null)
      setNotes('')
      onSubmitted()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            <BilingualText k="evidence.title" />
          </DialogTitle>
          <DialogDescription>
            <BilingualText k="evidence.desc" />
          </DialogDescription>
        </DialogHeader>
        {checklist && (
          <div className="rounded-lg bg-black/20 p-3 border border-white/5 mb-2">
            <p className="text-sm font-medium text-white">{checklist.title}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{checklist.mcq_ref}</p>
          </div>
        )}
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">
              <BilingualText k="evidence.file" />
            </Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-white/20 hover:border-primary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : t('evidence.noFile')}
                  </span>
                </div>
                <Input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && <FileCheck className="w-5 h-5 text-emerald-500" />}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">
              <BilingualText k="evidence.notes" />
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="..."
              className="bg-black/20 border-white/10 text-white min-h-20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <BilingualText k="common.cancel" />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? '...' : <BilingualText k="evidence.submit" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
