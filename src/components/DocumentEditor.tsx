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
import { ArrowLeft } from 'lucide-react'
import { DMS_PREFIXES, type DocumentFormData } from '@/lib/dms-codes'

interface DocumentEditorProps {
  data: DocumentFormData
  onFieldChange: (field: keyof DocumentFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function DocumentEditor({ data, onFieldChange, onSave, onCancel }: DocumentEditorProps) {
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
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-48">
          <Label className="text-white/80 mb-1 block">
            <BilingualText k="common.title" />
          </Label>
          <Input
            value={data.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className="bg-black/20 border-white/10 text-white"
          />
        </div>
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
            <BilingualText k="common.category" />
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
      <RichTextEditor value={data.content} onChange={(v: string) => onFieldChange('content', v)} />
    </div>
  )
}
