import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getInternalDocuments,
  createInternalDocument,
  updateInternalDocument,
  deleteInternalDocument,
  bulkImportInternalDocuments,
  type InternalDocument,
  type ImportRow,
  type ImportResult,
  type ImportProgressCallback,
} from '@/services/internal-documents'
import { InternalDocumentForm, type InternalDocFormData } from '@/components/InternalDocumentForm'
import { InternalDocumentImportDialog } from '@/components/InternalDocumentImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Plus, Upload, Search, Trash2, FileText, Pencil } from 'lucide-react'
import { ContextualHelpButton } from '@/components/ContextualHelpButton'
import { safeFormatDate } from '@/lib/safe-data'
import pb from '@/lib/pocketbase/client'
import {
  normalizePrefix,
  sortDocumentsByPrefixAndCode,
  extractCodeFromTitle,
} from '@/lib/dms-codes'
import { displayStatus, STATUS_FILTER_TO_DB } from '@/lib/document-status'

const EMPTY_FORM: InternalDocFormData = {
  title: '',
  titleEn: '',
  content: '',
  category: 'Internal',
  filePath: '',
  prefix: '',
  code: '',
  revision: '',
  file: null,
  documentType: 'Internal',
  effectiveDate: '',
  nextReviewDate: '',
  origin: '',
  language: 'Portuguese',
  docStatus: 'Active',
  applicableDocument: '',
  sector: '',
  reviewDeadlineDays: '',
  notes: '',
}

export default function MasterList() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId, companies, availableCompanyIds } = useCompany()
  const [documents, setDocuments] = useState<InternalDocument[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<InternalDocFormData>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [detailDoc, setDetailDoc] = useState<InternalDocument | null>(null)
  const [existingFileName, setExistingFileName] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const canEdit = ['QCC', 'Manager'].includes(user?.role || '')

  const loadData = async () => {
    const dbStatus = filterStatus !== 'all' ? STATUS_FILTER_TO_DB[filterStatus] || 'all' : 'all'
    const docs = await getInternalDocuments({
      companyId: selectedCompanyId,
      search,
      documentType: filterType,
      status: dbStatus,
    })
    setDocuments(sortDocumentsByPrefixAndCode(docs))
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId, search, filterType, filterStatus])
  useRealtime('documents', () => loadData())

  const handleChange = (field: keyof InternalDocFormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const openNew = () => {
    setEditingId(null)
    setExistingFileName(undefined)
    setFormData({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  const openEdit = (doc: InternalDocument) => {
    setEditingId(doc.id)
    const fileField = doc.file as string | string[] | undefined
    setExistingFileName(
      fileField ? (Array.isArray(fileField) ? fileField[0] : fileField) : undefined,
    )
    setFormData({
      title: doc.title,
      titleEn: doc.title_en || '',
      content: doc.content || '',
      contentEn: doc.content_en || '',
      category: 'Internal',
      filePath: doc.file_path || '',
      prefix: doc.prefix || '',
      code: doc.code || '',
      revision: doc.revision || '',
      file: null,
      documentType: doc.document_type || 'Internal',
      effectiveDate: doc.effective_date || '',
      nextReviewDate: doc.next_review_date || '',
      origin: doc.origin || '',
      language: doc.language || 'Portuguese',
      docStatus: doc.status || 'Active',
      applicableDocument: doc.applicable_document || '',
      sector: doc.sector || '',
      reviewDeadlineDays: doc.review_deadline_days ? String(doc.review_deadline_days) : '',
      notes: doc.notes || '',
      templateFamily: doc.template_family || '',
      inspectorQualification: doc.inspector_qualification || '',
      preparedBy: doc.prepared_by || '',
      approvedBy: doc.approved_by || '',
      verifiedBy: doc.verified_by || '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return
    const fd = new FormData()
    fd.append('title', formData.title)
    fd.append('title_en', formData.titleEn)
    fd.append('content', formData.content)
    if (formData.contentEn !== undefined) fd.append('content_en', formData.contentEn)
    fd.append('category', 'Internal')
    fd.append('file_path', formData.filePath)
    const normalizedPrefix = normalizePrefix(formData.prefix)
    fd.append('prefix', normalizedPrefix)
    fd.append('code', formData.code.trim() || extractCodeFromTitle(formData.title))
    fd.append('revision', formData.revision)
    fd.append('document_type', formData.documentType)
    fd.append('effective_date', formData.effectiveDate)
    fd.append('next_review_date', formData.nextReviewDate)
    fd.append('origin', formData.origin)
    fd.append('language', formData.language)
    fd.append('status', formData.docStatus)
    fd.append('applicable_document', formData.applicableDocument)
    fd.append('sector', formData.sector)
    fd.append('review_deadline_days', formData.reviewDeadlineDays || '')
    fd.append('notes', formData.notes)
    if (formData.templateFamily) fd.append('template_family', formData.templateFamily)
    if (formData.inspectorQualification !== undefined)
      fd.append('inspector_qualification', formData.inspectorQualification)
    if (formData.preparedBy !== undefined) fd.append('prepared_by', formData.preparedBy)
    if (formData.approvedBy !== undefined) fd.append('approved_by', formData.approvedBy)
    if (formData.verifiedBy !== undefined) fd.append('verified_by', formData.verifiedBy)
    const cid = selectedCompanyId !== 'all' ? selectedCompanyId : user?.primary_company_id || ''
    if (cid) fd.append('company_id', cid)
    if (formData.file) fd.append('file', formData.file)

    setIsSaving(true)
    try {
      if (editingId) {
        await updateInternalDocument(editingId, fd)
        toast({ title: 'Documento atualizado' })
      } else {
        await createInternalDocument(fd)
        toast({ title: 'Documento criado' })
      }
      setFormOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInternalDocument(id)
      toast({ title: 'Documento excluído' })
      setDetailDoc(null)
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' })
    }
  }

  const handleImport = async (
    rows: ImportRow[],
    companyId: string,
    onProgress?: ImportProgressCallback,
  ): Promise<ImportResult> => {
    return bulkImportInternalDocuments(rows, companyId, onProgress, { forceCompanyId: true })
  }

  const fileUrl = (doc: InternalDocument) => {
    const f = doc.file as string | string[] | undefined
    const fn = f ? (Array.isArray(f) ? f[0] : f) : null
    return fn ? pb.files.getURL({ id: doc.id } as any, fn) : null
  }

  const statusColor = (s?: string) =>
    s === 'Active'
      ? 'bg-green-500/10 text-green-500 border-green-500/20'
      : s === 'Obsolete'
        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-heading font-bold text-white mb-1">
              {t('masterList.title')}
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-sm font-medium">
              {t('masterList.totalPrefix')} {documents.length} {t('masterList.totalSuffix')}
            </Badge>
          </div>
          <p className="text-muted-foreground">{t('masterList.subtitle')}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <ContextualHelpButton variant="button" />
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-white/10 text-muted-foreground hover:text-primary"
            >
              <Upload className="w-4 h-4 mr-2" /> {t('masterList.importSheet')}
            </Button>
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> {t('masterList.add')}
            </Button>
          </div>
        )}
      </div>

      <Card className="glass border-white/5">
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('masterList.searchPlaceholder')}
                className="bg-black/20 border-white/10 text-white pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white w-36 h-9">
                <SelectValue placeholder={t('masterList.filterCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('masterList.filterCategory')}</SelectItem>
                <SelectItem value="Internal">Internal</SelectItem>
                <SelectItem value="External">External</SelectItem>
                <SelectItem value="Record">Record</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white w-36 h-9">
                <SelectValue placeholder={t('masterList.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('masterList.filterAll')}</SelectItem>
                <SelectItem value="APROVADO">{displayStatus('Active', lang)}</SelectItem>
                <SelectItem value="EM REVISÃO">{displayStatus('Under Review', lang)}</SelectItem>
                <SelectItem value="OBSOLETO">{displayStatus('Obsolete', lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colCategory')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">{t('masterList.colType')}</TableHead>
                  <TableHead className="text-xs text-white/60">{t('masterList.colCode')}</TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colTitle')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colRevision')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colStatus')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colApplicableDoc')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colSector')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colEffectiveDate')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colReviewDeadline')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">
                    {t('masterList.colNotes')}
                  </TableHead>
                  <TableHead className="text-xs text-white/60">{t('masterList.colFile')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="border-white/5 cursor-pointer hover:bg-white/5"
                    onClick={() => setDetailDoc(doc)}
                  >
                    <TableCell className="text-xs text-white/70">
                      {doc.document_type || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-white/70">{doc.prefix || '—'}</TableCell>
                    <TableCell className="text-xs font-mono text-primary">
                      {doc.code || extractCodeFromTitle(doc.title) || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-white/90 max-w-48 truncate">
                      {lang === 'en' && doc.title_en ? doc.title_en : doc.title}
                    </TableCell>
                    <TableCell className="text-xs text-white/70">{doc.revision || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(doc.status)}`}>
                        {displayStatus(doc.status, lang)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-white/70 max-w-32 truncate">
                      {doc.applicable_document || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-white/70">{doc.sector || '—'}</TableCell>
                    <TableCell className="text-xs text-white/70">
                      {safeFormatDate(doc.effective_date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-xs text-white/70">
                      {doc.review_deadline_days != null ? String(doc.review_deadline_days) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-white/70 max-w-32 truncate">
                      {doc.notes || '—'}
                    </TableCell>
                    <TableCell>
                      {fileUrl(doc) ? (
                        <a
                          href={fileUrl(doc)!}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-4 h-4 text-primary" />
                        </a>
                      ) : (
                        <span className="text-xs text-white/30">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {documents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t('masterList.noDocuments')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <InternalDocumentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        data={formData}
        onChange={handleChange}
        onSave={handleSave}
        isEdit={!!editingId}
        isSaving={isSaving}
        existingFileName={existingFileName}
      />

      <InternalDocumentImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        companies={companies.filter((c) => availableCompanyIds.includes(c.id))}
        defaultCompanyId={selectedCompanyId !== 'all' ? selectedCompanyId : undefined}
      />

      <Dialog open={!!detailDoc} onOpenChange={(v) => !v && setDetailDoc(null)}>
        <DialogContent className="max-w-2xl bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {lang === 'en' && detailDoc?.title_en ? detailDoc.title_en : detailDoc?.title}
            </DialogTitle>
          </DialogHeader>
          {detailDoc && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('masterList.colCategory')}:</span>{' '}
                  <span className="text-white">{detailDoc.document_type || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colType')}:</span>{' '}
                  <span className="text-white">{detailDoc.prefix || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colCode')}:</span>{' '}
                  <span className="text-white font-mono">{detailDoc.code || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colRevision')}:</span>{' '}
                  <span className="text-white">{detailDoc.revision || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colStatus')}:</span>{' '}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${statusColor(detailDoc.status)}`}
                  >
                    {displayStatus(detailDoc.status, lang)}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colApplicableDoc')}:</span>{' '}
                  <span className="text-white">{detailDoc.applicable_document || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colSector')}:</span>{' '}
                  <span className="text-white">{detailDoc.sector || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colEffectiveDate')}:</span>{' '}
                  <span className="text-white">
                    {safeFormatDate(detailDoc.effective_date, 'dd/MM/yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.nextReview')}:</span>{' '}
                  <span className="text-white">
                    {safeFormatDate(detailDoc.next_review_date, 'dd/MM/yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('masterList.colReviewDeadline')}:
                  </span>{' '}
                  <span className="text-white">
                    {detailDoc.review_deadline_days != null
                      ? String(detailDoc.review_deadline_days)
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('masterList.colNotes')}:</span>{' '}
                  <span className="text-white">{detailDoc.notes || '—'}</span>
                </div>
              </div>
              {detailDoc.content && (
                <div
                  className="border border-white/10 rounded-md p-3 max-h-48 overflow-y-auto text-sm text-white/80"
                  dangerouslySetInnerHTML={{
                    __html:
                      lang === 'en' && detailDoc.content_en
                        ? detailDoc.content_en
                        : detailDoc.content,
                  }}
                />
              )}
              {fileUrl(detailDoc) && (
                <a
                  href={fileUrl(detailDoc)!}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" /> {t('masterList.viewFile')}
                </a>
              )}
            </div>
          )}
          {canEdit && detailDoc && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  openEdit(detailDoc)
                  setDetailDoc(null)
                }}
                className="border-white/10 text-muted-foreground hover:text-primary"
              >
                <Pencil className="w-4 h-4 mr-2" /> {t('common.edit')}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteTarget(detailDoc.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('masterList.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('masterList.confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
