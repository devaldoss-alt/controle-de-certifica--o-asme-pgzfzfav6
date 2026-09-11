import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/RichTextEditor'
import { TwoColumnMarkdownEditor } from '@/components/TwoColumnMarkdownEditor'
import { DMS_PREFIXES, type DocumentFormData } from '@/lib/dms-codes'
import { TEMPLATE_FAMILIES } from '@/lib/document-template-helper'
import { Upload, FileText, X, Loader2, Edit3, Code2, Printer } from 'lucide-react'
import { HybridDatePicker } from '@/components/HybridDatePicker'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

export interface InternalDocFormData extends DocumentFormData {
  documentType: string
  effectiveDate: string
  nextReviewDate: string
  origin: string
  language: string
  docStatus: string
  applicableDocument: string
  sector: string
  reviewDeadlineDays: string
  notes: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: InternalDocFormData
  onChange: (field: keyof InternalDocFormData, value: string | File | null) => void
  onSave: () => void
  isEdit?: boolean
  isSaving?: boolean
  existingFileName?: string
}

export function InternalDocumentForm({
  open,
  onOpenChange,
  data,
  onChange,
  onSave,
  isEdit,
  isSaving,
  existingFileName,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contentMode, setContentMode] = useState<'visual' | 'markdown'>('visual')
  const [contentEnMode, setContentEnMode] = useState<'visual' | 'markdown'>('visual')

  const Field = ({
    label,
    children,
    required,
  }: {
    label: string
    children: React.ReactNode
    required?: boolean
  }) => (
    <div className="min-w-48 flex-1">
      <Label className="text-white/80 mb-1 block">
        {label}
        {required && ' *'}
      </Label>
      {children}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEdit ? 'Editar Documento Interno' : 'Novo Documento Interno'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white/80 mb-1 block">Arquivo</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpeg,.jpg"
                onChange={(e) => onChange('file', e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-white/10 text-muted-foreground hover:text-primary"
              >
                <Upload className="w-4 h-4 mr-2" /> Selecionar
              </Button>
              {data.file ? (
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-white truncate max-w-48">
                    {(data.file as File).name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChange('file', null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-muted-foreground hover:text-rose-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : isEdit && existingFileName ? (
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-white truncate max-w-48">{existingFileName}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Field label="Identificação" required>
              <Input
                value={data.title}
                onChange={(e) => onChange('title', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label="Identificação (EN)">
              <Input
                value={data.titleEn}
                onChange={(e) => onChange('titleEn', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label="Tipo de Documento">
              <Select
                value={data.prefix || '_none'}
                onValueChange={(v) => onChange('prefix', v === '_none' ? '' : v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-40">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Não definido —</SelectItem>
                  {DMS_PREFIXES.map((p) => (
                    <SelectItem key={p.prefix} value={p.prefix}>
                      {p.prefix} - {p.label_pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Código">
              <Input
                value={data.code}
                onChange={(e) => onChange('code', e.target.value)}
                placeholder="PR-CQ-001"
                className="bg-black/20 border-white/10 text-white w-32 font-mono"
              />
            </Field>
            <Field label="Revisão">
              <Input
                value={data.revision}
                onChange={(e) => onChange('revision', e.target.value)}
                placeholder="01"
                className="bg-black/20 border-white/10 text-white w-20 font-mono"
              />
            </Field>
            <Field label="Categoria">
              <Select
                value={data.documentType || 'Internal'}
                onValueChange={(v) => onChange('documentType', v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                  <SelectItem value="Record">Record</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={data.docStatus || 'Active'}
                onValueChange={(v) => onChange('docStatus', v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">APROVADO</SelectItem>
                  <SelectItem value="Under Review">EM REVISÃO</SelectItem>
                  <SelectItem value="Obsolete">OBSOLETO</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label="Data de Aprovação/Reaprovação">
              <HybridDatePicker
                value={data.effectiveDate}
                onChange={(iso) => {
                  onChange('effectiveDate', iso)
                  if (data.nextReviewDate && iso) {
                    const diff = Math.round(
                      (new Date(data.nextReviewDate).getTime() - new Date(iso).getTime()) /
                        86400000,
                    )
                    onChange('reviewDeadlineDays', diff >= 0 ? String(diff) : '0')
                  }
                }}
              />
            </Field>
            <Field label="Próxima Revisão">
              <HybridDatePicker
                value={data.nextReviewDate}
                onChange={(iso) => {
                  onChange('nextReviewDate', iso)
                  const base = data.effectiveDate
                  if (base && iso) {
                    const diff = Math.round(
                      (new Date(iso).getTime() - new Date(base).getTime()) / 86400000,
                    )
                    onChange('reviewDeadlineDays', diff >= 0 ? String(diff) : '0')
                  }
                }}
              />
            </Field>
            <Field label="Origem">
              <Select value={data.origin || 'Interna'} onValueChange={(v) => onChange('origin', v)}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASME">ASME</SelectItem>
                  <SelectItem value="ISO">ISO</SelectItem>
                  <SelectItem value="Interna">Norma Interna / Geral</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Idioma">
              <Select
                value={data.language || 'Portuguese'}
                onValueChange={(v) => onChange('language', v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label="Documento que se Aplica">
              <Input
                value={data.applicableDocument}
                onChange={(e) => onChange('applicableDocument', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label="Setor">
              <Select
                value={data.sector || '_none'}
                onValueChange={(v) => onChange('sector', v === '_none' ? '' : v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-48">
                  <SelectValue placeholder="Selecione o setor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Não especificado —</SelectItem>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Engenharia">Engenharia</SelectItem>
                  <SelectItem value="Produção">Produção</SelectItem>
                  <SelectItem value="SMS">SMS / Segurança</SelectItem>
                  <SelectItem value="Almoxarifado">Almoxarifado / Logística</SelectItem>
                  <SelectItem value="PCP">PCP</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="RH">RH / Treinamento</SelectItem>
                  <SelectItem value="Diretoria">Diretoria</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Geral">Geral / Todos</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prazo de Revisão (Dias)">
              <Input
                type="number"
                value={data.reviewDeadlineDays}
                onChange={(e) => onChange('reviewDeadlineDays', e.target.value)}
                placeholder="Calculado automaticamente"
                className="bg-black/20 border-white/10 text-white w-36"
              />
            </Field>
            <Field label="Observação">
              <Input
                value={data.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
          </div>

          <Field label="Caminho do Arquivo">
            <Input
              value={data.filePath}
              onChange={(e) => onChange('filePath', e.target.value)}
              placeholder="\\rede\pasta\arquivo.pdf"
              className="bg-black/20 border-white/10 text-white"
            />
          </Field>

          {/* Configuração do Template e Assinaturas */}
          <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-3">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Template de Impressão PDF & Assinaturas
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-white/80 text-xs mb-1 block">Família do Template</Label>
                <Select
                  value={data.templateFamily || TEMPLATE_FAMILIES.FAMILY_A}
                  onValueChange={(v) => onChange('templateFamily', v)}
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
                  onChange={(e) => onChange('preparedBy', e.target.value)}
                  placeholder="Ex: Roberta Junqueira / GQ"
                  className="bg-black/20 border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <Label className="text-white/80 text-xs mb-1 block">Aprovação / Reaprovação</Label>
                <Input
                  value={data.approvedBy || ''}
                  onChange={(e) => onChange('approvedBy', e.target.value)}
                  placeholder="Ex: Marcos Maciel / Diretor"
                  className="bg-black/20 border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <Label className="text-white/80 text-xs mb-1 block">Verificação (Família B)</Label>
                <Input
                  value={data.verifiedBy || ''}
                  onChange={(e) => onChange('verifiedBy', e.target.value)}
                  placeholder="Ex: Geraldo Timóteo"
                  className="bg-black/20 border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/80 text-xs mb-1 block">
                Qualificação do Inspetor / Procedimento (Família B)
              </Label>
              <Input
                value={data.inspectorQualification || ''}
                onChange={(e) => onChange('inspectorQualification', e.target.value)}
                placeholder="Ex: PROCEDIMENTO QUALIFICADO E DE ACORDO COM AS REGRAS DAS NORMAS ASME VIII; TEMA E N268."
                className="bg-black/20 border-white/10 text-white text-xs"
              />
            </div>
          </div>

          {/* Conteúdo doc.content com alternador Visual / Markdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-white/80 block">Conteúdo (doc.content - Português)</Label>
              <Tabs
                value={contentMode}
                onValueChange={(v) => setContentMode(v as 'visual' | 'markdown')}
                className="w-auto"
              >
                <TabsList className="h-8 bg-black/40 border border-white/10">
                  <TabsTrigger value="visual" className="text-xs gap-1.5 px-2.5 h-6">
                    <Edit3 className="w-3 h-3" /> Visual
                  </TabsTrigger>
                  <TabsTrigger value="markdown" className="text-xs gap-1.5 px-2.5 h-6">
                    <Code2 className="w-3 h-3" /> Markdown (2 Colunas)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {contentMode === 'visual' ? (
              <RichTextEditor
                value={data.content}
                onChange={(v: string) => onChange('content', v)}
              />
            ) : (
              <TwoColumnMarkdownEditor
                valueHtml={data.content}
                onChangeHtml={(v: string) => onChange('content', v)}
              />
            )}
          </div>

          {/* Conteúdo content_en com alternador Visual / Markdown */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-white/80 block">
                Conteúdo em Inglês (content_en - English)
              </Label>
              <Tabs
                value={contentEnMode}
                onValueChange={(v) => setContentEnMode(v as 'visual' | 'markdown')}
                className="w-auto"
              >
                <TabsList className="h-8 bg-black/40 border border-white/10">
                  <TabsTrigger value="visual" className="text-xs gap-1.5 px-2.5 h-6">
                    <Edit3 className="w-3 h-3" /> Visual
                  </TabsTrigger>
                  <TabsTrigger value="markdown" className="text-xs gap-1.5 px-2.5 h-6">
                    <Code2 className="w-3 h-3" /> Markdown (2 Colunas)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {contentEnMode === 'visual' ? (
              <RichTextEditor
                value={data.contentEn || ''}
                onChange={(v: string) => onChange('contentEn', v)}
              />
            ) : (
              <TwoColumnMarkdownEditor
                valueHtml={data.contentEn || ''}
                onChangeHtml={(v: string) => onChange('contentEn', v)}
                placeholder="Type or paste English content..."
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !data.title.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
