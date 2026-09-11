import { BilingualText } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/RichTextEditor'
import { TwoColumnMarkdownEditor } from '@/components/TwoColumnMarkdownEditor'
import { ArrowLeft, Upload, FileText, X, Loader2, Edit3, Code2, Printer } from 'lucide-react'
import { DMS_PREFIXES, type DocumentFormData } from '@/lib/dms-codes'
import { TEMPLATE_FAMILIES } from '@/lib/document-template-helper'
import type { FieldErrors } from '@/lib/pocketbase/errors'
import { useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DocumentEditorProps {
  data: DocumentFormData
  onFieldChange: (field: keyof DocumentFormData, value: string | File | null) => void
  onSave: () => void
  onCancel: () => void
  fieldErrors?: FieldErrors
  isEdit?: boolean
  existingFileName?: string
  canEditContent?: boolean
  isSaving?: boolean
}

export function DocumentEditor({
  data,
  onFieldChange,
  onSave,
  onCancel,
  fieldErrors = {},
  isEdit = false,
  existingFileName,
  canEditContent = true,
  isSaving = false,
}: DocumentEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contentEditorMode, setContentEditorMode] = useState<'visual' | 'markdown'>('visual')
  const [contentEnEditorMode, setContentEnEditorMode] = useState<'visual' | 'markdown'>('visual')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange('file', e.target.files?.[0] ?? null)
  }

  const handleRemoveFile = () => {
    onFieldChange('file', null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const renderFileSection = () => {
    if (data.file) {
      return (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm text-white truncate max-w-48">{(data.file as File).name}</span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-muted-foreground hover:text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )
    }
    if (isEdit && existingFileName) {
      return (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm text-white truncate max-w-48">{existingFileName}</span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-muted-foreground hover:text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <BilingualText k="doc.back" />
        </Button>
        {canEditContent && (
          <Button
            onClick={onSave}
            disabled={isSaving || !data.title.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? '...' : <BilingualText k="common.save" />}
          </Button>
        )}
      </div>

      <div>
        <Label className="text-white/80 mb-1 block">
          <BilingualText k="doc.file" /> {!isEdit && '*'}
        </Label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpeg,.jpg"
            onChange={handleFileChange}
            className="hidden"
            id="doc-file-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-white/10 text-muted-foreground hover:text-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            <BilingualText k="doc.selectFile" />
          </Button>
          {renderFileSection()}
        </div>
        {fieldErrors.file && <p className="text-sm text-rose-400 mt-1">{fieldErrors.file}</p>}
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-48">
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="common.title" /> *
          </Label>
          <Input
            value={data.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className="bg-black/20 border-white/10 text-white"
            readOnly={!canEditContent}
          />
          {fieldErrors.title && <p className="text-sm text-rose-400 mt-1">{fieldErrors.title}</p>}
        </div>
        <div className="min-w-48 flex-1">
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="doc.titleEn" />
          </Label>
          <Input
            value={data.titleEn}
            onChange={(e) => onFieldChange('titleEn', e.target.value)}
            className="bg-black/20 border-white/10 text-white"
            readOnly={!canEditContent}
          />
        </div>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="dms.prefix" />
          </Label>
          <Select
            value={data.prefix}
            onValueChange={(v) => onFieldChange('prefix', v)}
            disabled={!canEditContent}
          >
            <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {DMS_PREFIXES.map((p) => (
                <SelectItem key={p.prefix} value={p.prefix}>
                  {p.prefix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="dms.code" />
          </Label>
          <Input
            value={data.code}
            onChange={(e) => onFieldChange('code', e.target.value)}
            placeholder="PR-CQ-001"
            className="bg-black/20 border-white/10 text-white w-32 font-mono"
            readOnly={!canEditContent}
          />
        </div>
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="dms.revision" />
          </Label>
          <Input
            value={data.revision}
            onChange={(e) => onFieldChange('revision', e.target.value)}
            placeholder="01"
            className="bg-black/20 border-white/10 text-white w-20 font-mono"
            readOnly={!canEditContent}
          />
        </div>
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="common.category" /> *
          </Label>
          <Select
            value={data.category}
            onValueChange={(v) => onFieldChange('category', v)}
            disabled={!canEditContent}
          >
            <SelectTrigger className="bg-black/20 border-white/10 text-white w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASME">ASME</SelectItem>
              <SelectItem value="ISO">ISO</SelectItem>
              <SelectItem value="Norma Interna">Norma Interna / Geral</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.category && (
            <p className="text-sm text-rose-400 mt-1">{fieldErrors.category}</p>
          )}
        </div>
      </div>

      <div>
        <Label className="text-white/80 mb-1 block">
          <BilingualText k="doc.filePath" />
        </Label>
        <Input
          value={data.filePath}
          onChange={(e) => onFieldChange('filePath', e.target.value)}
          placeholder="\\rede\pasta\arquivo.pdf"
          className="bg-black/20 border-white/10 text-white"
          readOnly={!canEditContent}
        />
      </div>

      {/* Configurações de Template e Assinaturas */}
      <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-3">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" /> Template de Impressão PDF & Assinaturas
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Família do Template PDF</Label>
            <Select
              value={data.templateFamily || TEMPLATE_FAMILIES.FAMILY_A}
              onValueChange={(v) => onFieldChange('templateFamily', v)}
              disabled={!canEditContent}
            >
              <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs">
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
            <Label className="text-white/80 text-xs mb-1 block">Elaboração / Revisão</Label>
            <Input
              value={data.preparedBy || ''}
              onChange={(e) => onFieldChange('preparedBy', e.target.value)}
              placeholder="Ex: Roberta Junqueira / GQ"
              className="bg-black/20 border-white/10 text-white text-xs"
              readOnly={!canEditContent}
            />
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Aprovação / Reaprovação</Label>
            <Input
              value={data.approvedBy || ''}
              onChange={(e) => onFieldChange('approvedBy', e.target.value)}
              placeholder="Ex: Marcos Maciel / Diretor"
              className="bg-black/20 border-white/10 text-white text-xs"
              readOnly={!canEditContent}
            />
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Verificação (Família B)</Label>
            <Input
              value={data.verifiedBy || ''}
              onChange={(e) => onFieldChange('verifiedBy', e.target.value)}
              placeholder="Ex: Geraldo Timóteo"
              className="bg-black/20 border-white/10 text-white text-xs"
              readOnly={!canEditContent}
            />
          </div>
        </div>

        <div>
          <Label className="text-white/80 text-xs mb-1 block">
            Qualificação do Inspetor / Procedimento (Texto em destaque no PDF da Família B)
          </Label>
          <Input
            value={data.inspectorQualification || ''}
            onChange={(e) => onFieldChange('inspectorQualification', e.target.value)}
            placeholder="Ex: PROCEDIMENTO QUALIFICADO E DE ACORDO COM AS REGRAS DAS NORMAS ASME VIII; TEMA E N268."
            className="bg-black/20 border-white/10 text-white text-xs"
            readOnly={!canEditContent}
          />
        </div>
      </div>

      {/* Editor do Conteúdo Principal em Português (doc.content) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-white/80 block">
            <BilingualText k="doc.content" /> (Português)
          </Label>
          <Tabs
            value={contentEditorMode}
            onValueChange={(v) => setContentEditorMode(v as 'visual' | 'markdown')}
            className="w-auto"
          >
            <TabsList className="h-8 bg-black/40 border border-white/10">
              <TabsTrigger value="visual" className="text-xs gap-1.5 px-2.5 h-6">
                <Edit3 className="w-3 h-3" /> Visual (Rich-Text)
              </TabsTrigger>
              <TabsTrigger value="markdown" className="text-xs gap-1.5 px-2.5 h-6">
                <Code2 className="w-3 h-3" /> Markdown (2 Colunas)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {contentEditorMode === 'visual' ? (
          <RichTextEditor
            value={data.content}
            onChange={(v: string) => onFieldChange('content', v)}
            readOnly={!canEditContent}
          />
        ) : (
          <TwoColumnMarkdownEditor
            valueHtml={data.content}
            onChangeHtml={(v: string) => onFieldChange('content', v)}
            readOnly={!canEditContent}
            placeholder="Cole o procedimento em Markdown ou cole do Word..."
          />
        )}
      </div>

      {/* Editor do Conteúdo em Inglês (content_en) */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-white/80 block">
            Conteúdo em Inglês / English Content (content_en)
          </Label>
          <Tabs
            value={contentEnEditorMode}
            onValueChange={(v) => setContentEnEditorMode(v as 'visual' | 'markdown')}
            className="w-auto"
          >
            <TabsList className="h-8 bg-black/40 border border-white/10">
              <TabsTrigger value="visual" className="text-xs gap-1.5 px-2.5 h-6">
                <Edit3 className="w-3 h-3" /> Visual (Rich-Text)
              </TabsTrigger>
              <TabsTrigger value="markdown" className="text-xs gap-1.5 px-2.5 h-6">
                <Code2 className="w-3 h-3" /> Markdown (2 Colunas)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {contentEnEditorMode === 'visual' ? (
          <RichTextEditor
            value={data.contentEn || ''}
            onChange={(v: string) => onFieldChange('contentEn', v)}
            readOnly={!canEditContent}
          />
        ) : (
          <TwoColumnMarkdownEditor
            valueHtml={data.contentEn || ''}
            onChangeHtml={(v: string) => onFieldChange('contentEn', v)}
            readOnly={!canEditContent}
            placeholder="Type or paste English content in Markdown..."
          />
        )}
      </div>
    </div>
  )
}
