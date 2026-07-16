import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  const exec = (command: string) => {
    document.execCommand(command, false)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const tools = [
    { icon: Bold, cmd: 'bold' },
    { icon: Italic, cmd: 'italic' },
    { icon: Underline, cmd: 'underline' },
    { icon: List, cmd: 'insertUnorderedList' },
    { icon: ListOrdered, cmd: 'insertOrderedList' },
    { icon: Heading1, cmd: 'formatBlock', arg: 'h1' },
    { icon: Heading2, cmd: 'formatBlock', arg: 'h2' },
  ]

  return (
    <div className={cn('rounded-lg border border-white/10 overflow-hidden', className)}>
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-card/50 flex-wrap">
        {tools.map((tool, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault()
              if (tool.arg) {
                document.execCommand(tool.cmd, false, tool.arg)
                if (ref.current) onChange(ref.current.innerHTML)
              } else {
                exec(tool.cmd)
              }
            }}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose prose-invert prose-sm max-w-none p-4 min-h-[300px] focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
      />
    </div>
  )
}
