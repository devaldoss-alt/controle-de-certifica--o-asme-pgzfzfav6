import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  parseSpreadsheet,
  normalizeDate,
  findHeaderRow,
  normalizeText,
} from '@/lib/spreadsheet-parser'
import type { ImportRow, ImportResult, ImportProgressCallback } from '@/services/internal-documents'

const FIELD_OPTIONS = [
  { value: 'prefix', label: 'PREFIXO' },
  { value: 'document_type', label: 'TIPO' },
  { value: 'code', label: 'CÓDIGO' },
  { value: 'title', label: 'IDENTIFICAÇÃO' },
  { value: 'revision', label: 'REVISÃO' },
  { value: 'status', label: 'STATUS' },
  { value: 'applicable_document', label: 'DOCUMENTO QUE SE APLICA' },
  { value: 'sector', label: 'SETOR' },
  { value: 'effective_date', label: 'DATA DE APROVAÇÃO/REAPROVAÇÃO' },
  { value: 'review_deadline_days', label: 'PRAZO DE REVISÃO (DIAS)' },
  { value: 'notes', label: 'OBSERVAÇÃO' },
  { value: '_skip', label: '— Ignorar —' },
]

const DEFAULT_MAP: Record<string, string> = {
  prefix: 'prefix',
  document_type: 'document_type',
  code: 'code',
  title: 'title',
  revision: 'revision',
  status: 'status',
  applicable_document: 'applicable_document',
  sector: 'sector',
  effective_date: 'effective_date',
  review_deadline_days: 'review_deadline_days',
  notes: 'notes',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (rows: ImportRow[], onProgress?: ImportProgressCallback) => Promise<ImportResult>
}

export function InternalDocumentImportDialog({ open, onOpenChange, onImport }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const guessMapping = useCallback((hdrs: string[]) => {
    const normalized = hdrs.map((h) => normalizeText(h))
    const guess: Record<string, string> = {}
    for (const field of Object.keys(DEFAULT_MAP)) {
      const label = normalizeText(FIELD_OPTIONS.find((f) => f.value === field)?.label || '')
      let idx = normalized.findIndex((h) => h === label)
      if (idx < 0) {
        idx = normalized.findIndex((h) => h.includes(label) || label.includes(h))
      }
      guess[field] = idx >= 0 ? String(idx) : '_skip'
    }
    return guess
  }, [])

  const handleFile = async (file: File) => {
    setError('')
    try {
      const data = await parseSpreadsheet(file)
      if (data.length < 1) {
        setError('Arquivo vazio.')
        return
      }
      const headerIdx = findHeaderRow(data)
      const hdrs = data[headerIdx].map((h, i) => h || `Coluna ${i + 1}`)
      setHeaders(hdrs)
      setRows(data.slice(headerIdx + 1))
      setMapping(guessMapping(hdrs))
      setStep('preview')
    } catch (e: any) {
      setError(e?.message || 'Erro ao processar arquivo.')
    }
  }

  const handleImport = async () => {
    setIsProcessing(true)
    setError('')
    setProgress({ current: 0, total: rows.length })
    try {
      const importRows: ImportRow[] = rows.map((row) => {
        const obj: any = {}
        for (const [field, colIdx] of Object.entries(mapping)) {
          if (colIdx === '_skip') continue
          const val = row[parseInt(colIdx, 10)] || ''
          if (field === 'effective_date' || field === 'next_review_date') {
            obj[field] = normalizeDate(val) || undefined
          } else if (field === 'review_deadline_days') {
            const num = parseInt(val, 10)
            obj[field] = isNaN(num) ? undefined : num
          } else if (field === 'prefix') {
            obj[field] = val.trim().toUpperCase()
          } else {
            obj[field] = val.trim()
          }
        }
        return obj as ImportRow
      })
      const result = await onImport(importRows, (current, total) => {
        setProgress({ current, total })
      })
      setImportResult(result)
      setStep('result')
    } catch (e: any) {
      setError(e?.message || 'Erro na importação.')
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  const reset = () => {
    setStep('upload')
    setHeaders([])
    setRows([])
    setMapping({})
    setImportResult(null)
    setError('')
    setProgress(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Importar Planilha de Documentos</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-8 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-primary/50" />
            <p className="text-muted-foreground mb-4">Selecione um arquivo CSV ou XLSX</p>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="import-file"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button
              onClick={() => document.getElementById('import-file')?.click()}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo
            </Button>
            {error && <p className="text-sm text-rose-400 mt-4">{error}</p>}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confira o mapeamento de colunas e a pré-visualização:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(DEFAULT_MAP).map((field) => (
                <div key={field}>
                  <Label className="text-xs text-white/60 mb-1 block">
                    {FIELD_OPTIONS.find((f) => f.value === field)?.label}
                  </Label>
                  <Select
                    value={mapping[field] || '_skip'}
                    onValueChange={(v) => setMapping((p) => ({ ...p, [field]: v }))}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">— Ignorar —</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="border border-white/10 rounded-md overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    {headers.map((h, i) => (
                      <TableHead key={i} className="text-xs text-white/60">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((row, i) => (
                    <TableRow key={i} className="border-white/5">
                      {headers.map((_, j) => (
                        <TableCell key={j} className="text-xs text-white/80 px-2">
                          {row[j] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {isProcessing && progress && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando {progress.current} de {progress.total} documentos...
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={reset}
                disabled={isProcessing}
                className="border-white/10 text-muted-foreground"
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {rows.length} registro(s)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-white font-medium">
                  {importResult.success} documento(s) importado(s)
                </p>
                {importResult.errors.length > 0 && (
                  <p className="text-sm text-amber-500">
                    {importResult.errors.length} linha(s) com erro
                  </p>
                )}
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-white/10 rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-xs text-white/60">Linha</TableHead>
                      <TableHead className="text-xs text-white/60">Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((e, i) => (
                      <TableRow key={i} className="border-white/5">
                        <TableCell className="text-xs text-white/80">{e.row}</TableCell>
                        <TableCell className="text-xs text-rose-400">{e.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  reset()
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        )}

        {error && step !== 'upload' && (
          <div className="flex items-center gap-2 text-sm text-rose-400 mt-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
