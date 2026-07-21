import { useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Baseline,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  readOnly?: boolean
}

const FONT_SIZES = [
  { label: '12px', value: '2' },
  { label: '14px', value: '3' },
  { label: '16px', value: '4' },
  { label: '18px', value: '5' },
  { label: '24px', value: '6' },
  { label: '32px', value: '7' },
]

export function RichTextEditor({
  value,
  onChange,
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  const exec = (command: string, val?: string) => {
    if (readOnly) return
    document.execCommand(command, false, val)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const insertTable = () => {
    if (readOnly || !ref.current) return
    const html =
      '<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody><tr><td style="border:1px solid #666;padding:8px;">&nbsp;</td><td style="border:1px solid #666;padding:8px;">&nbsp;</td></tr><tr><td style="border:1px solid #666;padding:8px;">&nbsp;</td><td style="border:1px solid #666;padding:8px;">&nbsp;</td></tr></tbody></table>'
    document.execCommand('insertHTML', false, html)
    onChange(ref.current.innerHTML)
  }

  const tools = [
    { icon: Bold, cmd: 'bold' },
    { icon: Italic, cmd: 'italic' },
    { icon: Underline, cmd: 'underline' },
    { icon: List, cmd: 'insertUnorderedList' },
    { icon: ListOrdered, cmd: 'insertOrderedList' },
    { icon: Heading1, cmd: 'formatBlock', arg: 'h1' },
    { icon: Heading2, cmd: 'formatBlock', arg: 'h2' },
    { icon: AlignLeft, cmd: 'justifyLeft' },
    { icon: AlignCenter, cmd: 'justifyCenter' },
    { icon: AlignRight, cmd: 'justifyRight' },
    { icon: AlignJustify, cmd: 'justifyFull' },
  ]

  if (readOnly) {
    return (
      <div className={cn('rounded-lg border border-white/10 overflow-hidden', className)}>
        <div
          className="prose prose-invert prose-sm max-w-none p-4 min-h-[300px] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_td]:border [&_td]:border-white/20 [&_td]:p-2"
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
      </div>
    )
  }

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
              tool.arg ? exec(tool.cmd, tool.arg) : exec(tool.cmd)
            }}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
        <Select onValueChange={(v) => exec('fontSize', v)}>
          <SelectTrigger className="w-20 h-8 bg-black/20 border-white/10 text-xs">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1 cursor-pointer h-8 px-2 rounded hover:bg-white/5">
          <Baseline className="w-4 h-4 text-muted-foreground" />
          <input
            type="color"
            className="w-5 h-5 cursor-pointer bg-transparent border-none"
            onChange={(e) => exec('foreColor', e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1 cursor-pointer h-8 px-2 rounded hover:bg-white/5">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <input
            type="color"
            className="w-5 h-5 cursor-pointer bg-transparent border-none"
            onChange={(e) => exec('hiliteColor', e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => {
            e.preventDefault()
            insertTable()
          }}
        >
          <Table className="w-4 h-4" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose prose-invert prose-sm max-w-none p-4 min-h-[300px] focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_td]:border [&_td]:border-white/20 [&_td]:p-2"
      />
    </div>
  )
}
