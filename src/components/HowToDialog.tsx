import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookOpen } from 'lucide-react'

interface HowToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  tutorial: string
}

export function HowToDialog({ open, onOpenChange, title, tutorial }: HowToDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            How-To: {title}
          </DialogTitle>
        </DialogHeader>
        <div
          className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_h3]:text-white [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_strong]:text-primary"
          dangerouslySetInnerHTML={{ __html: tutorial || '<p>Sem tutorial disponivel.</p>' }}
        />
      </DialogContent>
    </Dialog>
  )
}
