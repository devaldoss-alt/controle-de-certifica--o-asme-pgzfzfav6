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
import { DMS_PREFIXES, type DocumentFormData } from '@/lib/dms-codes'
import { Upload, FileText, X, Loader2 } from 'lucide-react'

export interface InternalDocFormData extends DocumentFormData {
  documentType: string
  effectiveDate: string
  nextReviewDate: string
  origin: string
  language: string
  docStatus: string
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
            <Field label="Título" required>
              <Input
                value={data.title}
                onChange={(e) => onChange('title', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label="Título (EN)">
              <Input
                value={data.titleEn}
                onChange={(e) => onChange('titleEn', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label="Prefixo">
              <Select value={data.prefix} onValueChange={(v) => onChange('prefix', v)}>
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
            <Field label="Tipo">
              <Select value={data.documentType} onValueChange={(v) => onChange('documentType', v)}>
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
              <Select value={data.docStatus} onValueChange={(v) => onChange('docStatus', v)}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Obsolete">Obsolete</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <Field label="Data de Emissão">
              <Input
                type="date"
                value={data.effectiveDate}
                onChange={(e) => onChange('effectiveDate', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label="Próxima Revisão">
              <Input
                type="date"
                value={data.nextReviewDate}
                onChange={(e) => onChange('nextReviewDate', e.target.value)}
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label="Origem">
              <Input
                value={data.origin}
                onChange={(e) => onChange('origin', e.target.value)}
                placeholder="ISO, ASME, Cliente"
                className="bg-black/20 border-white/10 text-white"
              />
            </Field>
            <Field label="Idioma">
              <Select value={data.language} onValueChange={(v) => onChange('language', v)}>
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

          <Field label="Caminho do Arquivo">
            <Input
              value={data.filePath}
              onChange={(e) => onChange('filePath', e.target.value)}
              placeholder="\\rede\pasta\arquivo.pdf"
              className="bg-black/20 border-white/10 text-white"
            />
          </Field>

          <div>
            <Label className="text-white/80 mb-1 block">Conteúdo</Label>
            <RichTextEditor value={data.content} onChange={(v: string) => onChange('content', v)} />
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
