import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import useRealtime from '@/hooks/use-realtime'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/components/ui/use-toast'
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  type DocumentRecord,
} from '@/services/documents'
import { getDocumentAccess } from '@/services/document-access'
import { canUseDocumentEditor } from '@/lib/plans'
import { DMS_PREFIXES, type DocumentFormData } from '@/lib/dms-codes'
import { exportDocumentPdf, exportDocumentWord, exportDocumentExcel } from '@/lib/document-exports'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { DocumentFolderView } from '@/components/DocumentFolderView'
import { DocumentEditor } from '@/components/DocumentEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMPTY_FORM: DocumentFormData = {
  title: '',
  titleEn: '',
  content: '',
  category: 'ASME',
  filePath: '',
  prefix: '',
  code: '',
  revision: '',
  file: null,
}

export default function Documents() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId } = useCompany()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [accessiblePrefixes, setAccessiblePrefixes] = useState<string[]>([])
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DocumentFormData>(EMPTY_FORM)
  const [filter, setFilter] = useState('all')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined)
  const canEdit = canUseDocumentEditor(user?.plan)
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const loadData = async () => {
    try {
      const access = await getDocumentAccess(user?.role)
      const prefixes = access.filter((r: any) => r.can_view).map((r: any) => r.document_prefix)
      setAccessiblePrefixes(prefixes)
      const isFullAccess = ['Manager', 'Director', 'QCC'].includes(user?.role || '')
      const effectivePrefixes = isFullAccess ? undefined : prefixes
      const docs = await getDocuments(filter, selectedCompanyId, effectivePrefixes)
      setDocuments(docs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter, selectedCompanyId, user?.role])
  useRealtime('documents', () => {
    if (!editMode) loadData()
  })
  useRealtime('document_access', () => loadData())

  const updateField = (field: keyof DocumentFormData, value: string | File | null) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const openNew = () => {
    setEditingId(null)
    setExistingFileName(undefined)
    setFieldErrors({})
    setFormData({
      ...EMPTY_FORM,
      prefix: selectedPrefix && selectedPrefix !== 'ALL' ? selectedPrefix : '',
    })
    setEditMode(true)
  }

  const openEdit = (doc: DocumentRecord) => {
    setEditingId(doc.id)
    setFieldErrors({})
    const fileField = doc.file as string | string[] | undefined
    const fileName = fileField ? (Array.isArray(fileField) ? fileField[0] : fileField) : undefined
    setExistingFileName(fileName)
    setFormData({
      title: doc.title,
      titleEn: doc.title_en || '',
      content: doc.content,
      category: doc.category,
      filePath: doc.file_path || '',
      prefix: doc.prefix || '',
      code: doc.code || '',
      revision: doc.revision || '',
      file: null,
    })
    setEditMode(true)
  }

  const handleSave = async () => {
    setFieldErrors({})
    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = txt('Título é obrigatório', 'Title is required')
    if (!formData.category) errors.category = txt('Categoria é obrigatória', 'Category is required')
    if (!editingId && !formData.file) errors.file = txt('Arquivo é obrigatório', 'File is required')
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const fd = new FormData()
    fd.append('title', formData.title)
    fd.append('title_en', formData.titleEn)
    fd.append('content', formData.content)
    fd.append('category', formData.category)
    fd.append('file_path', formData.filePath)
    fd.append('prefix', formData.prefix)
    const prefixMeta = DMS_PREFIXES.find((p) => p.prefix === formData.prefix)
    fd.append('prefix_en', prefixMeta?.label_en || '')
    fd.append('code', formData.code)
    fd.append('revision', formData.revision)
    if (selectedCompanyId !== 'all') fd.append('company_id', selectedCompanyId)
    if (formData.file) fd.append('file', formData.file)

    try {
      if (editingId) {
        await updateDocument(editingId, fd)
        toast({ title: txt('Documento atualizado com sucesso', 'Document updated successfully') })
      } else {
        await createDocument(fd)
        toast({ title: txt('Documento criado com sucesso', 'Document created successfully') })
      }
      setEditMode(false)
      loadData()
    } catch (e) {
      const errs = extractFieldErrors(e)
      if (Object.keys(errs).length > 0) setFieldErrors(errs)
      toast({
        title: txt('Erro ao salvar documento', 'Error saving document'),
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      toast({ title: txt('Documento excluído', 'Document deleted') })
      loadData()
    } catch (e) {
      toast({
        title: txt('Erro ao excluir', 'Error deleting'),
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleExport = (type: 'pdf' | 'word' | 'excel', doc: DocumentRecord) => {
    if (type === 'pdf') exportDocumentPdf(doc, lang)
    else if (type === 'word') exportDocumentWord(doc, lang)
    else exportDocumentExcel(doc, lang)
  }

  if (editMode) {
    return (
      <DocumentEditor
        data={formData}
        onFieldChange={updateField}
        onSave={handleSave}
        onCancel={() => setEditMode(false)}
        fieldErrors={fieldErrors}
        existingFileName={existingFileName}
        isEdit={!!editingId}
      />
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

      <DocumentFolderView
        documents={documents}
        accessiblePrefixes={accessiblePrefixes}
        selectedPrefix={selectedPrefix}
        onSelectPrefix={setSelectedPrefix}
        onEdit={openEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        canEdit={canEdit}
      />
    </div>
  )
}
