import { useState, useMemo, useRef } from 'react'
import { DocumentRecord, updateDocument } from '@/services/documents'
import { Company } from '@/services/companies'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TwoColumnMarkdownEditor } from './TwoColumnMarkdownEditor'
import { openDocumentFidelityPrint } from '@/lib/document-fidelity-pdf'
import { TEMPLATE_FAMILIES, inferTemplateFamily } from '@/lib/document-template-helper'
import { extractTextFromDocx } from '@/lib/docx-extractor'
import { cleanWordHtml, htmlToMarkdown, markdownToHtml } from '@/lib/markdown-utils'
import { useToast } from '@/components/ui/use-toast'
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react'

interface DocumentBatchMigrationAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: DocumentRecord[]
  companies: Company[]
  onSuccess: () => void
}

export function DocumentBatchMigrationAssistant({
  open,
  onOpenChange,
  documents,
  companies,
  onSuccess,
}: DocumentBatchMigrationAssistantProps) {
  const { toast } = useToast()
  const docxInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'word-paste' | 'markdown' | 'docx-files'>(
    'word-paste',
  )
  const [wordPasteText, setWordPasteText] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [editingContentEn, setEditingContentEn] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<string>(TEMPLATE_FAMILIES.FAMILY_A)
  const [isSaving, setIsSaving] = useState(false)
  const [docxProcessing, setDocxProcessing] = useState(false)
  const [docxLogs, setDocxLogs] = useState<string[]>([])
  const [showHelp, setShowHelp] = useState(false)

  // Documentos que ainda não têm conteúdo completo (content vazio ou com menos de 30 caracteres)
  const pendingDocs = useMemo(() => {
    return documents.filter((d) => !d.content || d.content.trim().length < 30)
  }, [documents])

  const migratedDocs = useMemo(() => {
    return documents.filter((d) => d.content && d.content.trim().length >= 30)
  }, [documents])

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.toLowerCase()
    return documents.filter(
      (d) =>
        (d.code || '').toLowerCase().includes(q) ||
        (d.title || '').toLowerCase().includes(q) ||
        (d.prefix || '').toLowerCase().includes(q),
    )
  }, [documents, search])

  const currentDoc = useMemo(() => {
    if (!selectedDocId) return null
    return documents.find((d) => d.id === selectedDocId) || null
  }, [documents, selectedDocId])

  const docCompany = useMemo(() => {
    if (!currentDoc?.company_id) return companies[0] || null
    return companies.find((c) => c.id === currentDoc.company_id) || null
  }, [currentDoc, companies])

  // Ao selecionar um documento, carrega seus dados
  const handleSelectDoc = (doc: DocumentRecord) => {
    setSelectedDocId(doc.id)
    setEditingContent(doc.content || '')
    setEditingContentEn(doc.content_en || '')
    const inferred = doc.template_family || inferTemplateFamily(doc.prefix, doc.code)
    setSelectedFamily(inferred)
    setWordPasteText('')
  }

  // Ação 1: Processar colagem do Word
  const handleApplyWordPaste = () => {
    if (!wordPasteText.trim()) return
    const cleanedHtml = cleanWordHtml(wordPasteText)
    setEditingContent(cleanedHtml)
    toast({
      title: 'Texto do Word limpo e aplicado!',
      description: 'Estilos Office foram removidos mantendo a estrutura semântica.',
    })
  }

  // Ação 2: Importação em lote de arquivos .docx
  const handleDocxFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setDocxProcessing(true)
    const logs: string[] = []
    let matchedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name.replace(/\.docx$/i, '').trim()

      try {
        logs.push(`Processando: ${file.name}...`)
        const extractedMd = await extractTextFromDocx(file)
        const extractedHtml = markdownToHtml(extractedMd)

        // Tenta encontrar o documento correspondente pelo código ou nome do arquivo
        const matched = documents.find((d) => {
          const c = (d.code || '').toLowerCase().trim()
          const t = (d.title || '').toLowerCase().trim()
          const fn = fileName.toLowerCase()
          return (c && fn.includes(c)) || fn.includes(t) || t.includes(fn)
        })

        if (matched) {
          await updateDocument(matched.id, {
            content: extractedHtml,
            status: 'Under Review', // RASCUNHO / EM REVISÃO
          })
          matchedCount++
          logs.push(`✓ Sucesso: Vinculado ao documento ${matched.code || matched.title}`)
        } else {
          logs.push(`⚠ Aviso: Nenhum documento correspondente encontrado para ${file.name}`)
        }
      } catch (err: any) {
        logs.push(`✗ Erro ao extrair ${file.name}: ${err?.message || 'Falha desconhecida'}`)
      }
    }

    setDocxLogs(logs)
    setDocxProcessing(false)
    toast({
      title: `Extração concluída: ${matchedCount} documento(s) migrado(s)`,
      description: 'Verifique a lista para revisão e aprovação pela GQ.',
    })
    onSuccess()
  }

  // Salvar alterações no documento atual como RASCUNHO (Under Review)
  const handleSaveDraft = async () => {
    if (!currentDoc) return
    setIsSaving(true)
    try {
      await updateDocument(currentDoc.id, {
        content: editingContent,
        content_en: editingContentEn,
        template_family: selectedFamily,
        status: 'Under Review', // Todo documento migrado entra como RASCUNHO
      })
      toast({
        title: 'Documento gravado como Rascunho / Em Revisão',
        description: 'Conteúdo salvo em doc.content com sucesso.',
      })
      onSuccess()
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Aprovar e Publicar documento (Active)
  const handleApprovePublish = async () => {
    if (!currentDoc) return
    setIsSaving(true)
    try {
      await updateDocument(currentDoc.id, {
        content: editingContent,
        content_en: editingContentEn,
        template_family: selectedFamily,
        status: 'Active', // Publicado oficialmente pela GQ
      })
      toast({
        title: 'Documento homologado e publicado!',
        description: 'Status alterado para APROVADO.',
      })
      onSuccess()
    } catch (e: any) {
      toast({
        title: 'Erro ao publicar documento',
        description: e?.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Testar pré-visualização PDF fiel
  const handlePreviewPdf = (lang: 'pt' | 'en' = 'pt') => {
    if (!currentDoc) return
    const previewDoc: DocumentRecord = {
      ...currentDoc,
      content: editingContent,
      content_en: editingContentEn,
      template_family: selectedFamily,
    }
    openDocumentFidelityPrint(previewDoc, docCompany, selectedFamily as any, lang)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-card border-white/10 p-6">
        <DialogHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl text-white font-heading">
                  Assistente de Migração em Lote — Pacote Documentos (Onda B)
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Migre procedimentos originais para dentro de doc.content com layout de impressão
                  fiel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
                <Clock className="w-3 h-3 mr-1" /> Pendentes: {pendingDocs.length}/
                {documents.length}
              </Badge>
              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Migrados: {migratedDocs.length}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs h-7 text-muted-foreground hover:text-white"
              >
                <HelpCircle className="w-4 h-4 mr-1" /> {showHelp ? 'Ocultar Ajuda' : '? Ajuda'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showHelp && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-2 text-white/90 animate-fade-in">
            <h4 className="font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Como funciona a Migração em Lote (Onda B):
            </h4>
            <p>
              1. <strong>Não fazemos upload de PDF/DOCX soltos:</strong> os textos originais vivem
              no campo padronizado <code>doc.content</code> (e <code>content_en</code> para inglês).
            </p>
            <p>
              2. <strong>Fidelidade do Layout:</strong> Ao imprimir, o sistema gera o cabeçalho
              oficial com a logomarca da empresa, bloco de assinaturas com linhas para mão e tabela
              de revisões.
            </p>
            <p>
              3. <strong>Três formas de trazer o texto:</strong> Cole do Word direto (com limpeza de
              sujeira de estilo), digite ou cole em Markdown com live preview ao lado, ou selecione
              vários arquivos .docx de uma vez para extração automática.
            </p>
            <p>
              4. <strong>Segurança GQ:</strong> Todo documento migrado entra inicialmente como{' '}
              <strong>RASCUNHO / EM REVISÃO</strong>. Somente a GQ homologa para APROVADO.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lado Esquerdo: Fila de Documentos (4 colunas) */}
          <div className="lg:col-span-4 space-y-3 border-r border-white/10 pr-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Fila de Documentos ({filteredDocs.length})
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar código ou título..."
                className="h-8 pl-8 text-xs bg-black/20 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id
                const isMigrated = doc.content && doc.content.trim().length >= 30

                return (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`w-full text-left p-2.5 rounded-md border transition-all text-xs flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-white font-medium'
                        : 'bg-black/20 border-white/5 hover:border-white/20 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-primary font-bold">
                          {doc.code || doc.prefix || 'DOC'}
                        </span>
                        {doc.revision && (
                          <span className="text-muted-foreground">Rev.{doc.revision}</span>
                        )}
                      </div>
                      <div className="truncate text-white/90 text-xs mt-0.5">{doc.title}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isMigrated ? (
                        <span
                          className="p-1 rounded bg-green-500/20 text-green-400"
                          title="Conteúdo migrado"
                        >
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span
                          className="p-1 rounded bg-amber-500/20 text-amber-400"
                          title="Conteúdo pendente"
                        >
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lado Direito: Editor / Importador do Documento Selecionado (8 colunas) */}
          <div className="lg:col-span-8 space-y-4">
            {currentDoc ? (
              <>
                <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">
                        {currentDoc.code || currentDoc.prefix}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Rev. {currentDoc.revision || '00'}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {currentDoc.status === 'Active' ? 'APROVADO' : 'EM REVISÃO / RASCUNHO'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-white mt-1">{currentDoc.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewPdf('pt')}
                      className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10"
                      title="Pré-visualizar o PDF original com cabeçalho e assinaturas"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" /> Ver PDF (PT)
                    </Button>
                    {editingContentEn && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewPdf('en')}
                        className="h-8 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" /> Ver PDF (EN)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Seleção do Template de Família */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Família do Template Original
                    </Label>
                    <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                      <SelectTrigger className="h-8 text-xs bg-black/40 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TEMPLATE_FAMILIES.FAMILY_A}>
                          SGQ — Português (PSGQ/FSGQ/ITSGQ)
                        </SelectItem>
                        <SelectItem value={TEMPLATE_FAMILIES.FAMILY_B}>
                          Técnico/CQ — Bilíngue (CDE)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/80 block mb-1">
                      Empresa / Identidade Visual
                    </Label>
                    <div className="text-xs text-muted-foreground mt-2 truncate">
                      {docCompany?.name || 'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA'}
                    </div>
                  </div>
                </div>

                {/* Abas de Importação do Conteúdo */}
                <Tabs
                  value={importMode}
                  onValueChange={(v) => setImportMode(v as any)}
                  className="space-y-3"
                >
                  <TabsList className="bg-black/30 border border-white/10">
                    <TabsTrigger value="word-paste" className="text-xs">
                      (A) Colar do Word (Limpeza Auto)
                    </TabsTrigger>
                    <TabsTrigger value="markdown" className="text-xs">
                      (B) Editor Markdown (2 Colunas)
                    </TabsTrigger>
                    <TabsTrigger value="docx-files" className="text-xs">
                      (C) Lote de Arquivos .docx
                    </TabsTrigger>
                  </TabsList>

                  {/* ABA A: Colar do Word */}
                  <TabsContent value="word-paste" className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Copie o texto do documento Word original (Ctrl+C) e cole na caixa abaixo. O
                      sistema remove estilos sujos do Office preservando títulos, tabelas e listas.
                    </p>
                    <Textarea
                      value={wordPasteText}
                      onChange={(e) => setWordPasteText(e.target.value)}
                      placeholder="Cole o texto copiado do Word aqui..."
                      className="min-h-[220px] bg-black/20 border-white/10 text-xs font-mono text-white"
                    />
                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyWordPaste}
                        disabled={!wordPasteText.trim()}
                        className="bg-primary hover:bg-primary/90 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Limpar e Inserir no doc.content
                      </Button>
                      <span className="text-[11px] text-muted-foreground">
                        {editingContent ? 'Conteúdo atual: gravado' : 'Sem conteúdo gravado'}
                      </span>
                    </div>
                  </TabsContent>

                  {/* ABA B: Editor Markdown 2 Colunas */}
                  <TabsContent value="markdown" className="space-y-3">
                    <div className="space-y-4">
                      <TwoColumnMarkdownEditor
                        label="Conteúdo Principal em Português (doc.content)"
                        valueHtml={editingContent}
                        onChangeHtml={setEditingContent}
                      />
                      <TwoColumnMarkdownEditor
                        label="Conteúdo em Inglês (content_en - Bilíngue Família B)"
                        valueHtml={editingContentEn}
                        onChangeHtml={setEditingContentEn}
                        placeholder="Type English content here if applicable..."
                      />
                    </div>
                  </TabsContent>

                  {/* ABA C: Arquivos .docx em lote */}
                  <TabsContent value="docx-files" className="space-y-3">
                    <div className="border border-dashed border-white/20 rounded-lg p-6 text-center space-y-3 bg-black/20">
                      <Upload className="w-8 h-8 text-primary mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Selecione vários arquivos .docx de uma vez
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          O sistema extrai o texto de cada documento e associa automaticamente pelo
                          código ou título.
                        </p>
                      </div>
                      <input
                        ref={docxInputRef}
                        type="file"
                        multiple
                        accept=".docx"
                        onChange={handleDocxFilesSelected}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => docxInputRef.current?.click()}
                        disabled={docxProcessing}
                        className="border-primary/40 text-primary hover:bg-primary/10 text-xs"
                      >
                        {docxProcessing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Extraindo
                            textos...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 mr-1" /> Escolher Arquivos .docx
                          </>
                        )}
                      </Button>
                    </div>

                    {docxLogs.length > 0 && (
                      <div className="p-3 rounded-md bg-black/40 border border-white/10 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                        <div className="text-[11px] font-bold text-white/80 mb-1">Log do Lote:</div>
                        {docxLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={
                              log.startsWith('✓')
                                ? 'text-green-400'
                                : log.startsWith('✗')
                                  ? 'text-rose-400'
                                  : 'text-muted-foreground'
                            }
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-24 text-muted-foreground space-y-2">
                <FileText className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">
                  Selecione um documento na fila à esquerda para iniciar a migração.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Fechar
          </Button>

          {currentDoc && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="text-xs border-white/10 text-white"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Salvar como Rascunho
              </Button>
              <Button
                size="sm"
                onClick={handleApprovePublish}
                disabled={isSaving || !editingContent.trim()}
                className="text-xs bg-green-600 hover:bg-green-700 text-white"
                title="Homologar procedimento como Aprovado pelo SGQ"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar e Publicar
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
