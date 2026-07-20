import { BilingualText } from '@/hooks/use-i18n'
import { useI18n } from '@/hooks/use-i18n'
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
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
import { DMS_PREFIXES, type DocumentFormData } from '@/lib/dms-codes'
import type { FieldErrors } from '@/lib/pocketbase/errors'
import { useRef } from 'react'

interface DocumentEditorProps {
  data: DocumentFormData
  onFieldChange: (field: keyof DocumentFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
  fieldErrors?: FieldErrors
  isEditing?: boolean
}

export function DocumentEditor({
  data,
  onFieldChange,
  onSave,
  onCancel,
  fieldErrors = {},
  isEditing = false,
}: DocumentEditorProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    onFieldChange('file', file as unknown as string)
  }

  const handleRemoveFile = () => {
    onFieldChange('file', '' as unknown as string)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        <Button onClick={onSave} className="bg-primary hover:bg-primary/90">
          <BilingualText k="common.save" />
        </Button>
      </div>

      {!isEditing && (
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="doc.file" /> *
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
            {data.file && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm text-white truncate max-w-48">
                  {(data.file as unknown as File).name}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-muted-foreground hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {fieldErrors.file && <p className="text-sm text-rose-400 mt-1">{fieldErrors.file}</p>}
        </div>
      )}

      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-48">
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="common.title" /> *
          </Label>
          <Input
            value={data.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className="bg-black/20 border-white/10 text-white"
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
          />
        </div>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="dms.prefix" />
          </Label>
          <Select value={data.prefix} onValueChange={(v) => onFieldChange('prefix', v)}>
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
          />
        </div>
        <div>
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="common.category" /> *
          </Label>
          <Select value={data.category} onValueChange={(v) => onFieldChange('category', v)}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASME">ASME</SelectItem>
              <SelectItem value="ISO">ISO</SelectItem>
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
        />
      </div>

      <div>
        <Label className="text-white/80 mb-1 block">
          <BilingualText k="doc.content" />
        </Label>
        <RichTextEditor
          value={data.content}
          onChange={(v: string) => onFieldChange('content', v)}
        />
      </div>
    </div>
  )
}
