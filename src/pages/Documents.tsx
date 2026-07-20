import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  type DocumentRecord,
} from '@/services/documents'
import { canUseDocumentEditor } from '@/lib/plans'
import useRealtime from '@/hooks/use-realtime'
import { useCompany } from '@/hooks/use-company'
import { Card, CardContent } from '@/components/ui/card'
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
import { RichTextEditor } from '@/components/RichTextEditor'
import {
  Plus,
  FileText,
  ArrowLeft,
  Trash2,
  FileDown,
  Lock,
  FileType,
  FileSpreadsheet,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { localizedField } from '@/lib/i18n-content'

export default function Documents() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [selected, setSelected] = useState<DocumentRecord | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('ASME')
  const [filePath, setFilePath] = useState('')
  const [filter, setFilter] = useState('all')
  const { selectedCompanyId } = useCompany()

  const canEdit = canUseDocumentEditor(user?.plan)

  const loadData = async () => {
    try {
      const data = await getDocuments(filter, selectedCompanyId)
      setDocuments(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter, selectedCompanyId])
  useRealtime('documents', () => {
    if (!editMode) loadData()
  })

  const openNew = () => {
    setSelected(null)
    setEditMode(true)
    setTitle('')
    setContent('')
    setCategory('ASME')
    setFilePath('')
  }

  const openEdit = (doc: DocumentRecord) => {
    setSelected(doc)
    setEditMode(true)
    setTitle(doc.title)
    setContent(doc.content)
    setCategory(doc.category)
    setFilePath(doc.file_path || '')
  }

  const handleSave = async () => {
    if (!title.trim()) return
    try {
      if (selected) {
        await updateDocument(selected.id, { title, content, category, file_path: filePath })
      } else {
        await createDocument({
          title,
          content,
          category,
          file_path: filePath,
          company_id: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
        })
      }
      setEditMode(false)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const exportPdf = (doc: DocumentRecord) => {
    const lTitle = localizedField(doc.title, doc.title_en, lang)
    const lContent = localizedField(doc.content, doc.content_en, lang)
    const html = `<!DOCTYPE html><html><head><title>${lTitle}</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6;color:#222}h1{font-size:24px}h2{font-size:20px}ul,ol{margin-left:20px}@media print{body{margin:10px}}</style></head><body>${lContent}</body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.onload = () => win.print()
    }
  }

  const exportWord = (doc: DocumentRecord) => {
    const lTitle = localizedField(doc.title, doc.title_en, lang)
    const lContent = localizedField(doc.content, doc.content_en, lang)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${lTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.6}h1{font-size:24px}h2{font-size:20px}</style></head><body>${lContent}</body></html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lTitle}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = (doc: DocumentRecord) => {
    const lTitle = localizedField(doc.title, doc.title_en, lang)
    const lContent = localizedField(doc.content, doc.content_en, lang)
    const plainText = lContent.replace(/<[^>]+>/g, ' ').trim()
    const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>${lTitle}</th></tr><tr><td>${plainText}</td></tr></table></body></html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lTitle}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (editMode) {
    return (
      <div className="space-y-4 animate-fade-in pb-12">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => setEditMode(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <BilingualText k="doc.back" />
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <BilingualText k="common.save" />
          </Button>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-white/80 mb-1 block">
              <BilingualText k="common.title" />
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/80 mb-1 block">
              <BilingualText k="common.category" />
            </Label>
            <Select value={category} onValueChange={setCategory}>
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
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="\\rede\pasta\arquivo.pdf"
            className="bg-black/20 border-white/10 text-white"
          />
        </div>
        <RichTextEditor value={content} onChange={setContent} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            <BilingualText k="page.documents.title" />
          </h1>
          <p className="text-muted-foreground">
            <BilingualText k="page.documents.desc" />
          </p>
        </div>
        {canEdit ? (
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            <BilingualText k="doc.new" />
          </Button>
        ) : (
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
            <Lock className="w-3 h-3 mr-1" />
            <BilingualText k="msg.planRestricted" />
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        {['all', 'ASME', 'ISO'].map((c) => (
          <Button
            key={c}
            variant={c === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(c)}
            className={cn(c === filter ? 'bg-primary' : 'border-white/10 text-muted-foreground')}
          >
            {c === 'all' ? t('common.all') : c}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="glass border-white/5 backdrop-blur-md hover:border-primary/20 transition-colors"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <Badge variant="secondary" className="text-xs">
                  {doc.category}
                </Badge>
              </div>
              <h3 className="font-medium text-white text-base line-clamp-2">
                {localizedField(doc.title, doc.title_en, lang)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(doc.updated), 'dd/MM/yyyy HH:mm')}
              </p>
              {doc.file_path && (
                <p className="text-xs text-primary/60 font-mono truncate" title={doc.file_path}>
                  {doc.file_path}
                </p>
              )}
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(doc)}
                  className="text-xs h-7"
                  disabled={!canEdit}
                >
                  <BilingualText k="common.edit" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => exportPdf(doc)}
                  className="text-xs h-7"
                >
                  <FileDown className="w-3 h-3 mr-1" />
                  <BilingualText k="doc.exportPdf" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => exportWord(doc)}
                  className="text-xs h-7"
                >
                  <FileType className="w-3 h-3 mr-1" />
                  <BilingualText k="doc.exportWord" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => exportExcel(doc)}
                  className="text-xs h-7"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  <BilingualText k="doc.exportExcel" />
                </Button>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs h-7 text-rose-500 hover:text-rose-400 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>
            <BilingualText k="msg.noDocuments" />
          </p>
        </div>
      )}
    </div>
  )
}
