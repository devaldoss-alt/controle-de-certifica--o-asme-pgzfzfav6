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
import { useI18n } from '@/hooks/use-i18n'

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
  isEdit = false,
  isSaving = false,
  existingFileName,
}: Props) {
  const { lang, t } = useI18n()
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
            {isEdit ? t('doc.editInternal') : t('doc.newInternal')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white/80 mb-1 block">{t('masterList.colFile')}</Label>
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
                <Upload className="w-4 h-4 mr-2" /> {t('common.select')}
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
            <Field label={t('masterList.colTitle')} required>
              <Input
                value={data.title}
                onChange={(e) => onChange('title', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label={`${t('masterList.colTitle')} (EN)`}>
              <Input
                value={data.titleEn}
                onChange={(e) => onChange('titleEn', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label={t('masterList.colType')}>
              <Select
                value={data.prefix || '_none'}
                onValueChange={(v) => onChange('prefix', v === '_none' ? '' : v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-40">
                  <SelectValue placeholder={t('doc.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('doc.notDefined')}</SelectItem>
                  {DMS_PREFIXES.map((p) => (
                    <SelectItem key={p.prefix} value={p.prefix}>
                      {p.prefix} - {lang === 'en' ? p.label_en : p.label_pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('masterList.colCode')}>
              <Input
                value={data.code}
                onChange={(e) => onChange('code', e.target.value)}
                placeholder="PR-CQ-001"
                className="bg-black/20 border-white/10 text-white w-32 font-mono"
              />
            </Field>
            <Field label={t('masterList.colRevision')}>
              <Input
                value={data.revision}
                onChange={(e) => onChange('revision', e.target.value)}
                placeholder="01"
                className="bg-black/20 border-white/10 text-white w-20 font-mono"
              />
            </Field>
            <Field label={t('masterList.colCategory')}>
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
            <Field label={t('masterList.colStatus')}>
              <Select
                value={data.docStatus || 'Active'}
                onValueChange={(v) => onChange('docStatus', v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{lang === 'en' ? 'APPROVED' : 'APROVADO'}</SelectItem>
                  <SelectItem value="Under Review">
                    {lang === 'en' ? 'IN REVISION' : 'EM REVISÃO'}
                  </SelectItem>
                  <SelectItem value="Obsolete">
                    {lang === 'en' ? 'OBSOLETE' : 'OBSOLETO'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label={t('masterList.colEffectiveDate')}>
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
            <Field label={t('masterList.nextReview')}>
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
            <Field label={t('doc.origin')}>
              <Select value={data.origin || 'Interna'} onValueChange={(v) => onChange('origin', v)}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASME">ASME</SelectItem>
                  <SelectItem value="ISO">ISO</SelectItem>
                  <SelectItem value="Interna">
                    {lang === 'en' ? 'Internal Standard / General' : 'Norma Interna / Geral'}
                  </SelectItem>
                  <SelectItem value="Cliente">{lang === 'en' ? 'Client' : 'Cliente'}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('doc.language')}>
              <Select
                value={data.language || 'Portuguese'}
                onValueChange={(v) => onChange('language', v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portuguese">
                    {lang === 'en' ? 'Portuguese' : 'Português'}
                  </SelectItem>
                  <SelectItem value="English">{lang === 'en' ? 'English' : 'Inglês'}</SelectItem>
                  <SelectItem value="Spanish">{lang === 'en' ? 'Spanish' : 'Espanhol'}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label={t('masterList.colApplicableDoc')}>
              <Input
                value={data.applicableDocument}
                onChange={(e) => onChange('applicableDocument', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label={t('masterList.colSector')}>
              <Select
                value={data.sector || '_none'}
                onValueChange={(v) => onChange('sector', v === '_none' ? '' : v)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-48">
                  <SelectValue placeholder={t('doc.selectSector')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('doc.notSpecified')}</SelectItem>
                  <SelectItem value="Qualidade">
                    {lang === 'en' ? 'Quality' : 'Qualidade'}
                  </SelectItem>
                  <SelectItem value="Engenharia">
                    {lang === 'en' ? 'Engineering' : 'Engenharia'}
                  </SelectItem>
                  <SelectItem value="Produção">
                    {lang === 'en' ? 'Production' : 'Produção'}
                  </SelectItem>
                  <SelectItem value="SMS">
                    {lang === 'en' ? 'EHS / Safety' : 'SMS / Segurança'}
                  </SelectItem>
                  <SelectItem value="Almoxarifado">
                    {lang === 'en' ? 'Warehouse / Logistics' : 'Almoxarifado / Logística'}
                  </SelectItem>
                  <SelectItem value="PCP">PCP</SelectItem>
                  <SelectItem value="Manutenção">
                    {lang === 'en' ? 'Maintenance' : 'Manutenção'}
                  </SelectItem>
                  <SelectItem value="RH">
                    {lang === 'en' ? 'HR / Training' : 'RH / Treinamento'}
                  </SelectItem>
                  <SelectItem value="Diretoria">
                    {lang === 'en' ? 'Board of Directors' : 'Diretoria'}
                  </SelectItem>
                  <SelectItem value="Comercial">
                    {lang === 'en' ? 'Commercial' : 'Comercial'}
                  </SelectItem>
                  <SelectItem value="Geral">
                    {lang === 'en' ? 'General / All' : 'Geral / Todos'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('masterList.colReviewDeadline')}>
              <Input
                type="number"
                value={data.reviewDeadlineDays}
                onChange={(e) => onChange('reviewDeadlineDays', e.target.value)}
                placeholder={lang === 'en' ? 'Auto-calculated' : 'Calculado automaticamente'}
                className="bg-black/20 border-white/10 text-white w-36"
              />
            </Field>
            <Field label={t('masterList.colNotes')}>
              <Input
                value={data.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
          </div>

          <Field label={t('doc.filePath')}>
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
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !data.title.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? t('common.update') : t('masterList.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
