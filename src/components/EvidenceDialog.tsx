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
import { Upload, FileCheck, X, FileText, AlertCircle } from 'lucide-react'
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
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (selected) {
      setFiles((prev) => [...prev, ...Array.from(selected)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!checklist || files.length === 0) return
    setLoading(true)
    try {
      await uploadEvidence(checklist.id, files, notes, checklist.is_critical)
      setFiles([])
      setNotes('')
      onSubmitted()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      setFiles([])
      setNotes('')
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
            {checklist.is_critical && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-500">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <BilingualText k="evidence.criticalWarning" />
              </div>
            )}
          </div>
        )}
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">
              <BilingualText k="evidence.file" />
            </Label>
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-white/20 hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {files.length > 0
                    ? `${files.length} arquivo(s) selecionado(s)`
                    : t('evidence.noFile')}
                </span>
              </div>
              <Input
                type="file"
                className="hidden"
                multiple
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
              />
            </label>
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/20 border border-white/5 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="flex-1 truncate text-white/80">{file.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-rose-500 hover:text-rose-400 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            onClick={() => handleClose(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <BilingualText k="common.cancel" />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || files.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? '...' : <BilingualText k="evidence.submit" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
