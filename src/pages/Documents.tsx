import { useEffect, useMemo, useState } from 'react'
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
import { DMS_PREFIXES, extractCodeFromTitle, type DocumentFormData } from '@/lib/dms-codes'
import { exportDocumentPdf, exportDocumentWord, exportDocumentExcel } from '@/lib/document-exports'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { DocumentFolderView } from '@/components/DocumentFolderView'
import { DocumentEditor } from '@/components/DocumentEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Lock, AlertTriangle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

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
  const [search, setSearch] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const canEdit = canUseDocumentEditor(user?.plan) && ['QCC', 'Manager'].includes(user?.role || '')
  const txt = (pt: string, en: string) => (lang === 'pt' ? pt : en)

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.trim().toLowerCase()
    return documents.filter(
      (doc) =>
        (doc.code || '').toLowerCase().includes(q) ||
        (doc.prefix || '').toLowerCase().includes(q) ||
        (doc.prefix_en || '').toLowerCase().includes(q) ||
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.title_en || '').toLowerCase().includes(q),
    )
  }, [documents, search])

  const effectiveSelectedPrefix = search.trim() ? 'ALL' : selectedPrefix

  const loadData = async () => {
    setLoadError(null)
    try {
      const isFullAccess = ['Manager', 'Director', 'QCC', 'Consultor'].includes(user?.role || '')
      const access = await getDocumentAccess(user?.role)
      const prefixes = access.filter((r: any) => r.can_view).map((r: any) => r.document_prefix)
      setAccessiblePrefixes(isFullAccess ? [] : prefixes)
      const effectivePrefixes = isFullAccess ? undefined : prefixes
      const docs = await getDocuments(filter, selectedCompanyId, effectivePrefixes)
      setDocuments(docs)
    } catch (e) {
      setDocuments([])
      setLoadError(getErrorMessage(e))
      toast({
        title: txt('Erro ao carregar documentos', 'Error loading documents'),
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [filter, selectedCompanyId, user?.role])
  useRealtime('documents', () => {
    if (!editMode) loadData()
  })
  useRealtime('document_access', () => loadData())

  const updateField = (field: keyof DocumentFormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

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
    fd.append('code', formData.code.trim() || extractCodeFromTitle(formData.title))
    fd.append('revision', formData.revision)
    const effectiveCompanyId =
      selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''
    if (effectiveCompanyId) fd.append('company_id', effectiveCompanyId)
    if (formData.file) fd.append('file', formData.file)

    setIsSaving(true)
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
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteDocument(deleteTarget)
      toast({ title: txt('Documento excluído', 'Document deleted') })
      loadData()
    } catch (e) {
      toast({
        title: txt('Erro ao excluir', 'Error deleting'),
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setDeleteTarget(null)
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
        canEditContent={canEdit}
        isSaving={isSaving}
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
        {['all', 'ASME', 'ISO', 'Internal'].map((c) => (
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

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={txt(
            'Buscar por código, tipo ou título...',
            'Search by code, type or title...',
          )}
          className="bg-black/20 border-white/10 text-white pl-9"
        />
      </div>

      {loadError ? (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">
              {txt('Erro ao carregar documentos', 'Error loading documents')}
            </p>
            <p className="text-rose-400/70 mt-1">{loadError}</p>
          </div>
        </div>
      ) : (
        <DocumentFolderView
          documents={filteredDocuments}
          accessiblePrefixes={accessiblePrefixes}
          selectedPrefix={effectiveSelectedPrefix}
          onSelectPrefix={setSelectedPrefix}
          onEdit={openEdit}
          onDelete={handleDeleteRequest}
          onExport={handleExport}
          canEdit={canEdit}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{txt('Confirmar exclusão', 'Confirm deletion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {txt(
                'Tem certeza que deseja excluir este documento?',
                'Are you sure you want to delete this document?',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{txt('Cancelar', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {txt('Excluir', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
