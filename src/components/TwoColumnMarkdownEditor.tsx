import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markdownToHtml, htmlToMarkdown, cleanWordHtml } from '@/lib/markdown-utils'
import { Sparkles, Eye, Code2, Eraser, Check } from 'lucide-react'

interface TwoColumnMarkdownEditorProps {
  valueHtml: string
  onChangeHtml: (html: string) => void
  readOnly?: boolean
  label?: string
  placeholder?: string
}

export function TwoColumnMarkdownEditor({
  valueHtml,
  onChangeHtml,
  readOnly = false,
  label,
  placeholder = 'Cole ou digite seu texto em Markdown aqui...',
}: TwoColumnMarkdownEditorProps) {
  // Converte o valor HTML inicial para Markdown puro para visualização no editor
  const [markdown, setMarkdown] = useState<string>(() => htmlToMarkdown(valueHtml || ''))
  const [liveHtml, setLiveHtml] = useState<string>(() => markdownToHtml(markdown))
  const [copiedWordCleaned, setCopiedWordCleaned] = useState(false)

  // Sincroniza se o valueHtml for alterado externamente
  useEffect(() => {
    const currentHtmlFromMd = markdownToHtml(markdown)
    if (valueHtml !== currentHtmlFromMd) {
      const newMd = htmlToMarkdown(valueHtml || '')
      setMarkdown(newMd)
      setLiveHtml(markdownToHtml(newMd))
    }
  }, [valueHtml])

  const handleMarkdownChange = (newMd: string) => {
    setMarkdown(newMd)
    const converted = markdownToHtml(newMd)
    setLiveHtml(converted)
    onChangeHtml(converted)
  }

  // Intercepta colagem: se vier HTML com sujeira do Word/Office, limpa automaticamente e converte para MD
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData
    const pastedHtml = clipboardData.getData('text/html')

    if (
      pastedHtml &&
      (pastedHtml.includes('mso-') || pastedHtml.includes('urn:schemas-microsoft-com'))
    ) {
      e.preventDefault()
      const cleaned = cleanWordHtml(pastedHtml)
      const cleanedMd = htmlToMarkdown(cleaned)

      // Insere no cursor atual
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const current = markdown
      const updated = current.substring(0, start) + cleanedMd + current.substring(end)
      handleMarkdownChange(updated)

      setCopiedWordCleaned(true)
      setTimeout(() => setCopiedWordCleaned(false), 3000)
    }
  }

  // Botão para limpar estilos do conteúdo atual (forçar conversão e limpeza)
  const handleCleanOfficeFormatting = () => {
    const cleaned = cleanWordHtml(markdownToHtml(markdown))
    const backToMd = htmlToMarkdown(cleaned)
    handleMarkdownChange(backToMd)
    setCopiedWordCleaned(true)
    setTimeout(() => setCopiedWordCleaned(false), 3000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">
            Modo Markdown (2 Colunas)
          </Badge>
          {copiedWordCleaned && (
            <Badge
              variant="outline"
              className="border-green-500/40 text-green-400 text-xs flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Formatação Word limpa com sucesso!
            </Badge>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCleanOfficeFormatting}
              className="h-7 text-xs border-white/10 text-muted-foreground hover:text-white"
              title="Remove estilos sujos do Word mantendo títulos, listas e tabelas"
            >
              <Eraser className="w-3 h-3 mr-1" /> Limpar Formatação Word
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-white/10 rounded-lg overflow-hidden bg-card/40">
        {/* Coluna Esquerda: Editor de Markdown */}
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-white/10">
          <div className="bg-black/40 px-3 py-1.5 border-b border-white/10 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-primary" /> Markdown (Entrada / Colagem)
            </span>
            <span className="text-[10px]"># Título | - Lista | | Tabela |</span>
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            readOnly={readOnly}
            className="flex-1 min-h-[360px] resize-none border-0 rounded-none bg-transparent font-mono text-xs leading-relaxed text-white focus-visible:ring-0 p-3"
          />
        </div>

        {/* Coluna Direita: Live Preview Renderizado */}
        <div className="flex flex-col bg-black/20">
          <div className="bg-black/40 px-3 py-1.5 border-b border-white/10 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-primary" /> Pré-Visualização em Tempo Real
            </span>
            <span className="text-[10px] text-primary/70 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Converte para HTML ao salvar
            </span>
          </div>
          <div
            className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto p-4 prose prose-invert prose-sm max-w-none text-xs leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:bg-white/10 [&_h1]:p-1.5 [&_h1]:border [&_h1]:border-white/20 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:bg-white/5 [&_h2]:p-1.5 [&_h2]:border [&_h2]:border-white/10 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-white/20 [&_th]:p-1.5 [&_th]:bg-white/10 [&_td]:border [&_td]:border-white/10 [&_td]:p-1.5"
            dangerouslySetInnerHTML={{
              __html:
                liveHtml ||
                '<p class="text-muted-foreground italic">Nenhum conteúdo renderizado.</p>',
            }}
          />
        </div>
      </div>
    </div>
  )
}
