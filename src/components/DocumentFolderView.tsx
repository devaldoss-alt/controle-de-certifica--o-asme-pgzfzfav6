import { useI18n, BilingualText } from '@/hooks/use-i18n'
import { DMS_PREFIXES, getPrefixLabel } from '@/lib/dms-codes'
import type { DocumentRecord } from '@/services/documents'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Folder,
  FileText,
  ArrowLeft,
  Trash2,
  FileDown,
  FileType,
  FileSpreadsheet,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { localizedField } from '@/lib/i18n-content'

interface DocumentFolderViewProps {
  documents: DocumentRecord[]
  accessiblePrefixes: string[]
  selectedPrefix: string | null
  onSelectPrefix: (prefix: string | null) => void
  onEdit: (doc: DocumentRecord) => void
  onDelete: (id: string) => void
  onExport: (type: 'pdf' | 'word' | 'excel', doc: DocumentRecord) => void
  canEdit: boolean
}

export function DocumentFolderView({
  documents,
  accessiblePrefixes,
  selectedPrefix,
  onSelectPrefix,
  onEdit,
  onDelete,
  onExport,
  canEdit,
}: DocumentFolderViewProps) {
  const { t, lang } = useI18n()

  if (!selectedPrefix) {
    const prefixesToShow =
      accessiblePrefixes.length > 0
        ? DMS_PREFIXES.filter((p) => accessiblePrefixes.includes(p.prefix))
        : DMS_PREFIXES

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <Card
          className="glass border-white/5 backdrop-blur-md hover:border-primary/30 transition-all cursor-pointer"
          onClick={() => onSelectPrefix('ALL')}
        >
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Folder className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium text-white">{t('dms.allFolders')}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {documents.length} {t('dms.docCount')}
            </span>
          </CardContent>
        </Card>
        {prefixesToShow.map((p) => {
          const count = documents.filter((d) => d.prefix === p.prefix).length
          return (
            <Card
              key={p.prefix}
              className={cn(
                'glass border-white/5 backdrop-blur-md hover:border-primary/30 transition-all cursor-pointer',
                count === 0 && 'opacity-50',
              )}
              onClick={() => onSelectPrefix(p.prefix)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center">
                <Folder className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-mono font-bold text-white">{p.prefix}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {lang === 'en' ? p.label_en : p.label_pt}
                </span>
                <span className="text-xs text-primary/60 mt-1">
                  {count} {t('dms.docCount')}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const filtered =
    selectedPrefix === 'ALL' ? documents : documents.filter((d) => d.prefix === selectedPrefix)

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => onSelectPrefix(null)}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <BilingualText k="dms.allFolders" />
      </Button>
      <h2 className="text-xl font-heading font-bold text-white">
        {selectedPrefix === 'ALL' ? t('dms.allFolders') : getPrefixLabel(selectedPrefix, lang)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
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
              {doc.code && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary">{doc.code}</span>
                  {doc.revision && (
                    <span className="text-xs text-muted-foreground">Rev. {doc.revision}</span>
                  )}
                </div>
              )}
              <h3 className="font-medium text-white text-base line-clamp-2">
                {localizedField(doc.title, doc.title_en, lang)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(doc.updated), 'dd/MM/yyyy HH:mm')}
              </p>
              <div className="flex gap-2 pt-2 border-t border-white/5 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(doc)}
                  disabled={!canEdit}
                  className="text-xs h-7"
                >
                  <BilingualText k="common.edit" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onExport('pdf', doc)}
                  className="text-xs h-7"
                >
                  <FileDown className="w-3 h-3 mr-1" />
                  <BilingualText k="doc.exportPdf" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onExport('word', doc)}
                  className="text-xs h-7"
                >
                  <FileType className="w-3 h-3 mr-1" />
                  <BilingualText k="doc.exportWord" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onExport('excel', doc)}
                  className="text-xs h-7"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  <BilingualText k="doc.exportExcel" />
                </Button>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(doc.id)}
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
      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>
            <BilingualText k="dms.noDocsInFolder" />
          </p>
        </div>
      )}
    </div>
  )
}
