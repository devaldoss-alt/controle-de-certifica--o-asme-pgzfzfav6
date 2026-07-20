import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BilingualText, useI18n } from '@/hooks/use-i18n'
import useRealtime from '@/hooks/use-realtime'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/hooks/use-toast'
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
import { DocumentFolderView } from '@/components/DocumentFolderView'
import { DocumentEditor } from '@/components/DocumentEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

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
  const { t } = useI18n()
  const { lang } = useI18n()
  const { selectedCompanyId } = useCompany()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [accessiblePrefixes, setAccessiblePrefixes] = useState<string[]>([])
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DocumentFormData>(EMPTY_FORM)
  const [filter, setFilter] = useState('all')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { toast } = useToast()
  const canEdit = canUseDocumentEditor(user?.plan)

  const loadData = async () => {
    try {
      const access = await getDocumentAccess(user?.role)
      const prefixes = access.filter((r) => r.can_view).map((r) => r.document_prefix)
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

  const updateField = (field: keyof DocumentFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const openNew = () => {
    setEditingId(null)
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
    const errors: FieldErrors = {}
    if (!formData.title.trim()) errors.title = t('msg.requiredField')
    if (!formData.category) errors.category = t('msg.requiredField')
    if (!editingId && !formData.file) errors.file = t('msg.requiredField')
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    const prefixMeta = DMS_PREFIXES.find((p) => p.prefix === formData.prefix)
    const payload = {
      title: formData.title,
      title_en: formData.titleEn || undefined,
      content: formData.content,
      category: formData.category,
      file_path: formData.filePath,
      file: formData.file,
      prefix: formData.prefix,
      prefix_en: prefixMeta?.label_en || '',
      code: formData.code,
      revision: formData.revision,
      company_id: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
    }
    try {
      if (editingId) {
        const { file: _f, ...updatePayload } = payload
        await updateDocument(editingId, updatePayload)
        toast({ title: t('msg.docUpdated') })
      } else {
        await createDocument(payload)
        toast({ title: t('msg.docUploaded') })
      }
      setEditMode(false)
      loadData()
    } catch (e) {
      const fe = extractFieldErrors(e)
      if (Object.keys(fe).length > 0) {
        setFieldErrors(fe)
      }
      toast({
        title: t('msg.uploadFailed'),
        variant: 'destructive',
      })
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
        isEditing={!!editingId}
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
