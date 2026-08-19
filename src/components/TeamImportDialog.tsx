import { useState, useCallback, useEffect, useMemo } from 'react'
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
  Layers,
} from 'lucide-react'
import {
  parseSpreadsheetSheets,
  findPeopleSheet,
  scoreSheetForPeople,
  normalizeText,
  type SheetData,
} from '@/lib/spreadsheet-parser'
import type { TeamImportRow, TeamImportResult, TeamImportProgressCallback } from '@/services/team'

const FIELD_OPTIONS = [
  { value: 'name', label: 'NOME' },
  { value: 'company_name', label: 'EMPRESA' },
  { value: 'department', label: 'DEPARTAMENTO / CARGO' },
  { value: 'role', label: 'CARGO' },
  { value: '_skip', label: '— Ignorar —' },
]

const FIELD_SYNONYMS: Record<string, string[]> = {
  name: ['nome', 'colaborador', 'funcionario', 'pessoa'],
  company_name: ['empresa', 'compania'],
  department: ['departamento', 'cargo', 'area', 'setor', 'funcao'],
  role: ['cargo', 'funcao', 'papel', 'role'],
}

const DEFAULT_MAP: Record<string, string> = {
  name: 'name',
  company_name: 'company_name',
  department: 'department',
  role: 'role',
}

const NO_PEOPLE_SHEET_ERROR =
  'Nenhuma aba com dados de colaboradores encontrada. Verifique se o arquivo contém colunas como Nome, Empresa e Cargo.'

interface CompanyOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (
    rows: TeamImportRow[],
    companyId: string,
    onProgress?: TeamImportProgressCallback,
  ) => Promise<TeamImportResult>
  companies: CompanyOption[]
  defaultCompanyId?: string
}

interface SheetState {
  sheets: SheetData[]
  selectedSheetName: string
  headerIdx: number
  headers: string[]
  rows: string[][]
}

export function TeamImportDialog({
  open,
  onOpenChange,
  onImport,
  companies,
  defaultCompanyId,
}: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [sheetState, setSheetState] = useState<SheetState | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<TeamImportResult | null>(null)
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

  const guessMapping = useCallback((hdrs: string[], _dataRows: string[][]) => {
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
    return guess
  }, [])

  const handleFile = async (file: File) => {
    setError('')
    setSheetState(null)
    setMapping({})
    try {
      const sheets = await parseSpreadsheetSheets(file)
      if (sheets.length === 0) {
        setError(NO_PEOPLE_SHEET_ERROR)
        return
      }

      // Try to auto-select the best people sheet
      const best = findPeopleSheet(sheets)
      if (best) {
        const hdrs = (best.sheet.data[best.score.headerIdx] || []).map(
          (h, i) => h || `Coluna ${i + 1}`,
        )
        const dataRows = best.sheet.data
          .slice(best.score.headerIdx + 1)
          .filter((r) => r.some((c) => (c || '').trim().length > 0))
        setSheetState({
          sheets,
          selectedSheetName: best.sheet.name,
          headerIdx: best.score.headerIdx,
          headers: hdrs,
          rows: dataRows,
        })
        setMapping(guessMapping(hdrs, dataRows))
        setStep('preview')
        return
      }

      // No people sheet detected — try the first sheet as a last resort, then validate
      const first = sheets[0]
      const score = scoreSheetForPeople(first.data)
      const headerIdx = score.headerIdx
      const hdrs = (first.data[headerIdx] || []).map((h, i) => h || `Coluna ${i + 1}`)
      const dataRows = first.data
        .slice(headerIdx + 1)
        .filter((r) => r.some((c) => (c || '').trim().length > 0))
      setSheetState({
        sheets,
        selectedSheetName: first.name,
        headerIdx,
        headers: hdrs,
        rows: dataRows,
      })
      setMapping(guessMapping(hdrs, dataRows))

      if (sheets.length > 1) {
        setError(
          'Não foi possível identificar automaticamente a aba de colaboradores. Selecione a aba correta abaixo.',
        )
      } else {
        setError(NO_PEOPLE_SHEET_ERROR)
      }
      setStep('preview')
    } catch (e: any) {
      setError(e?.message || 'Erro ao processar arquivo.')
    }
  }

  const handleSheetChange = (name: string) => {
    if (!sheetState) return
    const target = sheetState.sheets.find((s) => s.name === name)
    if (!target) return
    const score = scoreSheetForPeople(target.data)
    const headerIdx = score.headerIdx
    const hdrs = (target.data[headerIdx] || []).map((h, i) => h || `Coluna ${i + 1}`)
    const dataRows = target.data
      .slice(headerIdx + 1)
      .filter((r) => r.some((c) => (c || '').trim().length > 0))
    setSheetState({
      sheets: sheetState.sheets,
      selectedSheetName: name,
      headerIdx,
      headers: hdrs,
      rows: dataRows,
    })
    setMapping(guessMapping(hdrs, dataRows))
    setError('')
  }

  // Validate that the currently selected sheet actually looks like a people sheet
  const currentSheetScore = useMemo(() => {
    if (!sheetState) return null
    const sheet = sheetState.sheets.find((s) => s.name === sheetState.selectedSheetName)
    if (!sheet) return null
    return scoreSheetForPeople(sheet.data)
  }, [sheetState])

  const looksLikePeopleSheet = currentSheetScore?.qualifies ?? false
  const showSheetError = step === 'preview' && sheetState !== null && !looksLikePeopleSheet

  const handleImport = async () => {
    if (!destinationCompanyId) {
      setCompanyError('Selecione a empresa de destino')
      return
    }
    if (!sheetState) return
    if (!looksLikePeopleSheet) {
      setError(NO_PEOPLE_SHEET_ERROR)
      return
    }
    setIsProcessing(true)
    setError('')
    setProgress({ current: 0, total: sheetState.rows.length })
    try {
      const importRows: TeamImportRow[] = sheetState.rows.map((row) => {
        const obj: any = {}
        for (const [field, colIdx] of Object.entries(mapping)) {
          if (colIdx === '_skip') continue
          const val = row[parseInt(colIdx, 10)] || ''
          obj[field] = val.trim()
        }
        return obj as TeamImportRow
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
    setSheetState(null)
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
          <DialogTitle className="text-white">Importar Colaboradores</DialogTitle>
        </DialogHeader>

        {step !== 'result' && (
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Empresa Padrão *
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
                <SelectValue placeholder="Selecione a empresa padrão" />
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
            <p className="text-xs text-muted-foreground">
              Colaboradores sem empresa informada serão vinculados a esta empresa.
            </p>
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
              id="team-import-file"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button
              onClick={() => document.getElementById('team-import-file')?.click()}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo
            </Button>
            {error && <p className="text-sm text-rose-400 mt-4">{error}</p>}
          </div>
        )}

        {step === 'preview' && sheetState && (
          <div className="space-y-4">
            {/* Sheet selector (when multiple sheets) */}
            {sheetState.sheets.length > 1 && (
              <div className="space-y-2">
                <Label className="text-white/80 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Aba do arquivo
                </Label>
                <Select value={sheetState.selectedSheetName} onValueChange={handleSheetChange}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Selecione a aba" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetState.sheets.map((s) => {
                      const sc = scoreSheetForPeople(s.data)
                      const tag = sc.qualifies ? ' ✓ colaboradores' : ''
                      return (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name}
                          {tag}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Abas marcadas com ✓ parecem conter dados de colaboradores.
                </p>
              </div>
            )}

            {showSheetError && (
              <div className="flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error || NO_PEOPLE_SHEET_ERROR}</span>
              </div>
            )}

            {!showSheetError && (
              <>
                <p className="text-sm text-muted-foreground">
                  Confira o mapeamento de colunas e a pré-visualização:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                          {sheetState.headers.map((h, i) => (
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
                        {sheetState.headers.map((h, i) => (
                          <TableHead key={i} className="text-xs text-white/60">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetState.rows.slice(0, 50).map((row, i) => (
                        <TableRow key={i} className="border-white/5">
                          {sheetState.headers.map((_, j) => (
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
                    Importando {progress.current} de {progress.total} colaboradores...
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
                    Importar {sheetState.rows.length} registro(s)
                  </Button>
                </DialogFooter>
              </>
            )}

            {showSheetError && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="border-white/10 text-muted-foreground"
                >
                  Voltar
                </Button>
              </DialogFooter>
            )}
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
                    ? `${importResult.success} colaborador(es) importado(s)`
                    : 'Nenhum colaborador foi importado'}
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

        {error && step !== 'upload' && step !== 'preview' && (
          <div className="flex items-center gap-2 text-sm text-rose-400 mt-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
