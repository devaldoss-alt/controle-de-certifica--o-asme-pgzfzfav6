import { useState, useCallback, useEffect } from 'react'
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
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import {
  parseSpreadsheet,
  normalizeDate,
  findHeaderRow,
  normalizeText,
} from '@/lib/spreadsheet-parser'
import type { ImportRow, ImportResult, ImportProgressCallback } from '@/services/internal-documents'

const FIELD_OPTIONS = [
  { value: 'prefix', label: 'TIPO' },
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

const FIELD_SYNONYMS: Record<string, string[]> = {
  code: ['item', 'codigo', 'cod', 'item n', 'item no'],
  title: ['identificacao', 'titulo', 'descricao', 'nome'],
  revision: ['revisao', 'n revisao', 'nº revisao', 'n° revisao', 'n rev', 'rev'],
  effective_date: ['data de aprovacao', 'data de aprovacao reaprovacao', 'data aprovacao', 'data'],
  applicable_document: ['documento que se aplica', 'doc aplicavel', 'doc que se aplica'],
  review_deadline_days: ['prazo de revisao', 'prazo revisao', 'prazo de revisao dias', 'prazo'],
  notes: ['observacoes', 'observacao', 'obs'],
  sector: ['setor', 'area', 'departamento'],
  status: ['status', 'situacao'],
  prefix: ['tipo'],
}

const DEFAULT_MAP: Record<string, string> = {
  prefix: 'prefix',
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

interface CompanyOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (
    rows: ImportRow[],
    companyId: string,
    onProgress?: ImportProgressCallback,
  ) => Promise<ImportResult>
  companies: CompanyOption[]
  defaultCompanyId?: string
}

export function InternalDocumentImportDialog({
  open,
  onOpenChange,
  onImport,
  companies,
  defaultCompanyId,
}: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [destinationCompanyId, setDestinationCompanyId] = useState('')
  const [companyError, setCompanyError] = useState('')

  useEffect(() => {
    if (open) {
      setDestinationCompanyId(defaultCompanyId || '')
      setCompanyError('')
    }
  }, [open, defaultCompanyId])

  const guessMapping = useCallback((hdrs: string[], dataRows: string[][]) => {
    const normalized = hdrs.map((h) => normalizeText(h))
    const guess: Record<string, string> = {}
    const usedIndices = new Set<number>()

    for (const field of Object.keys(DEFAULT_MAP)) {
      const label = normalizeText(FIELD_OPTIONS.find((f) => f.value === field)?.label || '')
      const idx = normalized.findIndex((h, i) => !usedIndices.has(i) && h === label)
      if (idx >= 0) {
        guess[field] = String(idx)
        usedIndices.add(idx)
      } else {
        guess[field] = '_skip'
      }
    }

    for (const field of Object.keys(DEFAULT_MAP)) {
      if (guess[field] !== '_skip') continue
      const label = normalizeText(FIELD_OPTIONS.find((f) => f.value === field)?.label || '')
      const idx = normalized.findIndex(
        (h, i) => !usedIndices.has(i) && (h.includes(label) || label.includes(h)),
      )
      if (idx >= 0) {
        guess[field] = String(idx)
        usedIndices.add(idx)
      }
    }

    for (const field of Object.keys(DEFAULT_MAP)) {
      if (guess[field] !== '_skip') continue
      const synonyms = FIELD_SYNONYMS[field] || []
      let found = -1
      for (const syn of synonyms) {
        found = normalized.findIndex(
          (h, i) =>
            !usedIndices.has(i) &&
            (h === syn ||
              (syn.length >= 3 && h.includes(syn)) ||
              (h.length >= 3 && syn.includes(h))),
        )
        if (found >= 0) break
      }
      if (found >= 0) {
        guess[field] = String(found)
        usedIndices.add(found)
      }
    }

    if (guess.applicable_document === '_skip') {
      const dmsPrefixes = [
        'ASME PSC',
        'CDE',
        'CQS',
        'EVS',
        'FSGQ',
        'ISSGQ',
        'IT-CQ',
        'ITSGQ',
        'LP',
        'MCQ',
        'MSGQ',
        'PR-CQ',
        'PSGQ',
      ]
      const prefixPattern = new RegExp(
        '^(' + dmsPrefixes.map((p) => p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')',
        'i',
      )
      let bestIdx = -1
      let bestScore = 0
      for (let i = 0; i < hdrs.length; i++) {
        if (usedIndices.has(i)) continue
        const colValues = dataRows
          .slice(0, 50)
          .map((r) => (r[i] || '').trim())
          .filter(Boolean)
        const matches = colValues.filter((v) => prefixPattern.test(v)).length
        if (matches > bestScore) {
          bestScore = matches
          bestIdx = i
        }
      }
      if (bestIdx >= 0 && bestScore >= 1) {
        guess.applicable_document = String(bestIdx)
      }
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
      setMapping(guessMapping(hdrs, data.slice(headerIdx + 1)))
      setStep('preview')
    } catch (e: any) {
      setError(e?.message || 'Erro ao processar arquivo.')
    }
  }

  const handleImport = async () => {
    if (!destinationCompanyId) {
      setCompanyError('Selecione a empresa de destino')
      return
    }
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
            obj[field] = val.trim()
          } else {
            obj[field] = val.trim()
          }
        }
        return obj as ImportRow
      })
      const result = await onImport(importRows, destinationCompanyId, (current, total) => {
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
    setDestinationCompanyId(defaultCompanyId || '')
    setCompanyError('')
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

        {step !== 'result' && (
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Empresa Destino *
            </Label>
            <Select
              value={destinationCompanyId}
              onValueChange={(v) => {
                setDestinationCompanyId(v)
                setCompanyError('')
              }}
            >
              <SelectTrigger
                className={`bg-black/20 border-white/10 text-white ${companyError ? 'border-rose-500' : ''}`}
              >
                <SelectValue placeholder="Selecione a empresa de destino" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {companyError && <p className="text-sm text-rose-400">{companyError}</p>}
          </div>
        )}

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
              {importResult.success > 0 ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-rose-500" />
              )}
              <div>
                <p className="text-white font-medium">
                  {importResult.success > 0
                    ? `${importResult.success} documento(s) importado(s)`
                    : 'Nenhum documento foi registrado para a empresa selecionada'}
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
