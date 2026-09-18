import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  FileSpreadsheet,
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  Download,
  Info,
  Files,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  FileWarning,
  Search,
  ChevronRight,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import {
  parseSpreadsheetSheets,
  normalizeDate,
  normalizeText,
  type SheetData,
} from '@/lib/spreadsheet-parser'
import {
  bulkImportRNCs,
  normalizeRNCNumberForMatch,
  normalizeRNCActionType,
  parseControlRncSheet,
  type RNCImportRow,
  type RNCImportResult,
  type FiveWhyItem,
  type IshikawaData,
} from '@/services/rnc'
import { type Company } from '@/services/companies'
import { useToast } from '@/components/ui/use-toast'

interface RNCImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  defaultCompanyId?: string
  onSuccess: () => void
}

export function RNCImportDialog({
  open,
  onOpenChange,
  companies,
  defaultCompanyId,
  onSuccess,
}: RNCImportDialogProps) {
  const { toast } = useToast()

  // Steps: 1. upload (Excel + PDFs) -> 2. preview (Tabela detalhada & diagnósticos) -> 3. importing/result
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')

  // Selected Target Company (Mandatory)
  const [targetCompanyId, setTargetCompanyId] = useState<string>('')
  const [companyError, setCompanyError] = useState<string>('')

  // Files state
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [rawSheets, setRawSheets] = useState<SheetData[]>([])
  const [pdfFiles, setPdfFiles] = useState<File[]>([])

  // Parsed RNCs ready for import
  const [parsedRows, setParsedRows] = useState<RNCImportRow[]>([])
  const [unmatchedPdfs, setUnmatchedPdfs] = useState<string[]>([])
  const [sheetStats, setSheetStats] = useState<{
    rncSheetName?: string
    whysSheetName?: string
    ishikawaSheetName?: string
    evidenceSheetName?: string
    totalRows: number
    linkedWhys: number
    linkedIshikawas: number
    linkedPdfs: number
    diagnostics?: {
      isControleSheet: boolean
      nonStandardCount: number
      duplicateNumberCount: number
      blankDateCount: number
      suspiciousTotal: number
      totalRows: number
      allSuspicious: boolean
      hasSafeguardWarning: boolean
      reasons: string[]
    }
  }>({
    totalRows: 0,
    linkedWhys: 0,
    linkedIshikawas: 0,
    linkedPdfs: 0,
  })

  // User explicit override when safeguard warning is active (and not 100% blocked)
  const [overrideSafeguard, setOverrideSafeguard] = useState(false)

  // Execution state
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; currentNum?: string }>(
    {
      current: 0,
      total: 0,
    },
  )
  const [importResult, setImportResult] = useState<RNCImportResult | null>(null)
  const [error, setError] = useState<string>('')
  const [previewFilter, setPreviewFilter] = useState<
    'all' | 'with_evidence' | 'with_whys' | 'with_ishikawa'
  >('all')
  const [previewSearch, setPreviewSearch] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const excelInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Initialize company selection
  useEffect(() => {
    if (open) {
      if (defaultCompanyId && defaultCompanyId !== 'all') {
        setTargetCompanyId(defaultCompanyId)
      } else if (companies.length > 0) {
        setTargetCompanyId(companies[0].id)
      }
      setCompanyError('')
    }
  }, [open, defaultCompanyId, companies])

  const resetAll = () => {
    setStep('upload')
    setExcelFile(null)
    setRawSheets([])
    setPdfFiles([])
    setParsedRows([])
    setUnmatchedPdfs([])
    setSheetStats({ totalRows: 0, linkedWhys: 0, linkedIshikawas: 0, linkedPdfs: 0 })
    setOverrideSafeguard(false)
    setIsParsing(false)
    setIsImporting(false)
    setProgress({ current: 0, total: 0 })
    setImportResult(null)
    setError('')
    setPreviewSearch('')
    setPreviewFilter('all')
    if (excelInputRef.current) excelInputRef.current.value = ''
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }

  // Handle PDF additions
  const handlePdfSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const validPdfs: File[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf') {
        validPdfs.push(f)
      }
    }

    setPdfFiles((prev) => {
      const existingNames = new Set(prev.map((p) => p.name.toLowerCase()))
      const newlyAdded = validPdfs.filter((f) => !existingNames.has(f.name.toLowerCase()))
      return [...prev, ...newlyAdded]
    })
  }

  const removePdf = (fileName: string) => {
    setPdfFiles((prev) => prev.filter((p) => p.name !== fileName))
  }

  // Handle Multiple Excel Selections (Planilha de Controle e/ou Formulários Individuais)
  const [selectedExcelFiles, setSelectedExcelFiles] = useState<File[]>([])

  const handleExcelSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    setError('')
    setSelectedExcelFiles(files)
    setExcelFile(files[0]) // Primary file for backwards-compat display
  }

  /**
   * Intelligently parses Excel sheets and associates 5 Porquês, Ishikawa and PDFs
   * Supports:
   * (a) FSGQ 8.7-1 Rev.06 Planilha de Controle de RNCs (aba CONTROLE_RNC)
   * (b) FSGQ 8.7-2 Rev.04 Formulários Individuais (abas FSGQ 8.7-2 / Relatório, Evidências-Evidence, "5 Por quês - 5 Whys", Ishikawa)
   * (c) Multiple files merging by RNC number
   */
  const processSpreadsheetAndPdfs = async () => {
    if (!targetCompanyId) {
      setCompanyError('Selecione a empresa alvo antes de prosseguir.')
      return
    }
    if (selectedExcelFiles.length === 0 && !excelFile) {
      setError('Selecione o arquivo Excel (.xlsx) das RNCs.')
      return
    }

    setIsParsing(true)
    setError('')

    try {
      const filesToProcess =
        selectedExcelFiles.length > 0 ? selectedExcelFiles : excelFile ? [excelFile] : []
      const allFilesSheets: { file: File; sheets: SheetData[] }[] = []

      for (const f of filesToProcess) {
        const sheets = await parseSpreadsheetSheets(f)
        allFilesSheets.push({ file: f, sheets })
      }

      const allParsedSheets = allFilesSheets.flatMap((x) => x.sheets)
      setRawSheets(allParsedSheets)

      if (allParsedSheets.length === 0) {
        throw new Error('Os arquivos de planilha estão vazios ou não possuem abas legíveis.')
      }

      // Maps for merged secondary data across all files
      const whysMap = new Map<string, FiveWhyItem[]>()
      const ishikawaMap = new Map<string, IshikawaData>()
      const evidenceSheetNotesMap = new Map<string, string>()
      const individualFormRncMap = new Map<string, Partial<RNCImportRow>>()

      // Process each file's sheets
      for (const { file, sheets } of allFilesSheets) {
        for (const s of sheets) {
          const norm = normalizeText(s.name)

          // 1. Check for 5 Whys ("5 Por quês - 5 Whys", "5 Porques", etc.)
          if (
            norm.includes('5 por') ||
            norm.includes('why') ||
            norm.includes('5whys') ||
            norm.includes('porques')
          ) {
            const wData = s.data
            if (wData.length >= 2) {
              const headerRow = wData[0].map((c) => normalizeText(c))
              let rncColIdx = headerRow.findIndex(
                (h) =>
                  h.includes('rnc') ||
                  h.includes('numero') ||
                  h.includes('n°') ||
                  h.includes('codigo'),
              )
              if (rncColIdx === -1) {
                // If this is an individual form with no explicit RNC column, find RNC number in top rows
                let foundRncNum = ''
                for (let r = 0; r < Math.min(8, wData.length); r++) {
                  for (let c = 0; c < wData[r].length; c++) {
                    const txt = wData[r][c] || ''
                    if (txt.toLowerCase().includes('rnc')) {
                      const match = txt.match(/rnc[\s\-#:]*([0-9a-z/\-_]+)/i)
                      if (match) {
                        foundRncNum = match[1]
                        break
                      }
                    }
                  }
                  if (foundRncNum) break
                }
                const fallbackNorm = normalizeRNCNumberForMatch(foundRncNum || file.name)
                if (fallbackNorm) {
                  const items: FiveWhyItem[] = []
                  for (let r = 1; r < wData.length; r++) {
                    const lineText = wData[r].filter(Boolean).join(' ')
                    if (lineText.trim()) {
                      items.push({
                        why: `${items.length + 1}º Por quê`,
                        answer: lineText.trim(),
                      })
                    }
                  }
                  if (items.length > 0) whysMap.set(fallbackNorm, items)
                }
              } else {
                for (let r = 1; r < wData.length; r++) {
                  const row = wData[r]
                  const rncNumRaw = row[rncColIdx] || ''
                  const normKey = normalizeRNCNumberForMatch(rncNumRaw)
                  if (!normKey) continue
                  const items: FiveWhyItem[] = []
                  for (let c = 0; c < row.length; c++) {
                    if (c === rncColIdx) continue
                    const colName = headerRow[c] || `Coluna ${c + 1}`
                    const val = row[c] ? row[c].trim() : ''
                    if (!val) continue
                    items.push({ why: colName, answer: val })
                  }
                  if (items.length > 0) whysMap.set(normKey, items)
                }
              }
            }
          }

          // 2. Check for Ishikawa
          if (
            norm.includes('ishikawa') ||
            norm.includes('espinha') ||
            norm.includes('causa e efeito') ||
            norm.includes('6m')
          ) {
            const iData = s.data
            if (iData.length >= 2) {
              const headerRow = iData[0].map((c) => normalizeText(c))
              let rncColIdx = headerRow.findIndex(
                (h) => h.includes('rnc') || h.includes('numero') || h.includes('n°'),
              )
              const fallbackNorm = normalizeRNCNumberForMatch(file.name)
              const ishi: IshikawaData = {
                metodo: [],
                maquina: [],
                mao_de_obra: [],
                material: [],
                meio_ambiente: [],
                medicao: [],
              }

              for (let r = 1; r < iData.length; r++) {
                const row = iData[r]
                const rowRnc =
                  rncColIdx >= 0 ? normalizeRNCNumberForMatch(row[rncColIdx] || '') : fallbackNorm
                for (let c = 0; c < row.length; c++) {
                  if (c === rncColIdx) continue
                  const colName = headerRow[c] || ''
                  const val = row[c] ? row[c].trim() : ''
                  if (!val) continue
                  if (colName.includes('metod') || colName.includes('process'))
                    ishi.metodo?.push(val)
                  else if (colName.includes('maquin') || colName.includes('ferram'))
                    ishi.maquina?.push(val)
                  else if (colName.includes('obra') || colName.includes('pess'))
                    ishi.mao_de_obra?.push(val)
                  else if (colName.includes('mater')) ishi.material?.push(val)
                  else if (colName.includes('ambient') || colName.includes('sms'))
                    ishi.meio_ambiente?.push(val)
                  else if (colName.includes('medic') || colName.includes('instru'))
                    ishi.medicao?.push(val)
                  else ishi.metodo?.push(val)
                }
                if (rowRnc) {
                  ishikawaMap.set(rowRnc, ishi)
                }
              }
            }
          }

          // 3. Check for Evidências (Evidências-Evidence)
          if (norm.includes('evidenc') || norm.includes('evidence')) {
            const eData = s.data
            let textAcc = ''
            for (let r = 0; r < Math.min(25, eData.length); r++) {
              const rowText = eData[r].filter(Boolean).join(' ')
              if (rowText.trim()) textAcc += `${rowText.trim()} \n`
            }
            if (textAcc) {
              const rncKey = normalizeRNCNumberForMatch(file.name)
              if (rncKey) evidenceSheetNotesMap.set(rncKey, textAcc.trim())
            }
          }

          // 4. Check for Individual Form Sheet ("FSGQ 8.7-2", "Relatório de RNC", etc.)
          if (
            norm.includes('8.7-2') ||
            (norm.includes('relatorio') && !norm.includes('controle'))
          ) {
            // Extract individual form fields from sheet key-value cells
            const grid = s.data
            let formRncNum = ''
            let formProcess = ''
            let formSeverity = ''
            let formOrigin = ''
            let formActionType = ''
            let formDesc = ''
            let formImmediateAction = ''
            let formImmediateType = ''
            let formCorrectiveAction = ''
            let formDeadline = ''
            let formCost = 0
            let formRisk = ''
            let formIsReinspected = false
            let formInterferesSubsequent = false
            let formInterferesDeadline = false
            let formRequestedByClient = false

            for (let r = 0; r < grid.length; r++) {
              for (let c = 0; c < grid[r].length; c++) {
                const cell = (grid[r][c] || '').trim()
                const cellNorm = normalizeText(cell)
                const nextCell = (grid[r][c + 1] || '').trim()

                // Check 3 flags Sim/Não
                if (cellNorm.includes('processo subsequente')) {
                  const checkArea = `${cell} ${nextCell} ${grid[r][c + 2] || ''}`.toLowerCase()
                  if (checkArea.includes('sim') || checkArea.includes('[x] sim'))
                    formInterferesSubsequent = true
                }
                if (cellNorm.includes('prazo de entrega')) {
                  const checkArea = `${cell} ${nextCell} ${grid[r][c + 2] || ''}`.toLowerCase()
                  if (checkArea.includes('sim') || checkArea.includes('[x] sim'))
                    formInterferesDeadline = true
                }
                if (cellNorm.includes('solicitado pelo cliente')) {
                  const checkArea = `${cell} ${nextCell} ${grid[r][c + 2] || ''}`.toLowerCase()
                  if (checkArea.includes('sim') || checkArea.includes('[x] sim'))
                    formRequestedByClient = true
                }

                // Check RNC Number
                if (
                  (cellNorm === 'numero' ||
                    cellNorm === 'n rnc' ||
                    cellNorm.includes('numero da rnc')) &&
                  nextCell
                ) {
                  formRncNum = nextCell
                }
                // Check Risk assessment
                if (cellNorm.includes('avaliacao de risco') || cellNorm.includes('novos riscos')) {
                  formRisk = nextCell || (grid[r + 1] ? grid[r + 1][c] : '')
                }
                // Check Action type
                if (cellNorm.includes('tipo de acao')) {
                  formActionType = nextCell
                }
              }
            }

            const rncKey = normalizeRNCNumberForMatch(formRncNum || file.name)
            if (rncKey) {
              individualFormRncMap.set(rncKey, {
                number: formRncNum || file.name.replace(/\.[^/.]+$/, ''),
                interferes_subsequent_process: formInterferesSubsequent,
                interferes_delivery_deadline: formInterferesDeadline,
                requested_by_client: formRequestedByClient,
                risk_assessment: formRisk,
                action_type: formActionType ? normalizeRNCActionType(formActionType) : undefined,
              })
            }
          }
        }
      }

      // 5. Identify the main CONTROL sheet (prioritize "CONTROLE_RNC" from FSGQ 8.7-1 Rev.06)
      let rncSheet: SheetData | undefined = undefined
      for (const s of allParsedSheets) {
        const norm = normalizeText(s.name)
        if (norm.includes('controle_rnc') || norm === 'controle rnc' || norm.includes('controle')) {
          rncSheet = s
          break
        }
      }

      // If no sheet is named CONTROLE_RNC, search for standard RNC sheet or individual form sheet
      if (!rncSheet) {
        for (const s of allParsedSheets) {
          const norm = normalizeText(s.name)
          if (
            norm.includes('fsgq 8.7-1') ||
            norm.includes('fsgq 8.7-2') ||
            norm.includes('rnc') ||
            norm.includes('desvio') ||
            norm.includes('geral')
          ) {
            rncSheet = s
            break
          }
        }
      }

      // Fallback: use first sheet with largest number of rows
      if (!rncSheet) {
        rncSheet = allParsedSheets.slice().sort((a, b) => b.data.length - a.data.length)[0]
      }

      // Parse RNC Main / Control sheet using parseControlRncSheet
      const {
        parsedRows: parsed,
        matchedPdfsSet,
        countWithWhys,
        countWithIshikawa,
        countWithPdfs,
        diagnostics,
      } = parseControlRncSheet({
        sheet: rncSheet,
        individualFormRncMap,
        whysMap,
        ishikawaMap,
        pdfFiles,
      })

      // Check unmatched PDFs
      const unmatched = pdfFiles.filter((p) => !matchedPdfsSet.has(p.name)).map((p) => p.name)

      setUnmatchedPdfs(unmatched)
      setParsedRows(parsed)
      setOverrideSafeguard(false)
      setSheetStats({
        rncSheetName: rncSheet.name,
        whysSheetName: whysMap.size > 0 ? `${whysMap.size} RNCs vinculadas` : undefined,
        ishikawaSheetName: ishikawaMap.size > 0 ? `${ishikawaMap.size} RNCs vinculadas` : undefined,
        evidenceSheetName:
          evidenceSheetNotesMap.size > 0
            ? `${evidenceSheetNotesMap.size} notas de evidência`
            : undefined,
        totalRows: parsed.length,
        linkedWhys: countWithWhys,
        linkedIshikawas: countWithIshikawa,
        linkedPdfs: countWithPdfs,
        diagnostics,
      })

      if (parsed.length === 0) {
        throw new Error('Nenhuma RNC válida foi identificada na planilha.')
      }

      setStep('preview')
      toast({
        title: 'Planilha processada com sucesso!',
        description: `${parsed.length} RNCs identificadas para conferência no preview.`,
      })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Falha ao processar o arquivo Excel.')
    } finally {
      setIsParsing(false)
    }
  }

  // Execute the database write
  const handleConfirmImport = async () => {
    if (!targetCompanyId) {
      setError('Selecione uma empresa válida.')
      return
    }

    setIsImporting(true)
    setError('')
    setProgress({ current: 0, total: parsedRows.length })

    try {
      const res = await bulkImportRNCs(
        parsedRows,
        targetCompanyId,
        (current, total, currentNumber) => {
          setProgress({ current, total, currentNum: currentNumber })
        },
      )

      res.unmatchedPdfFiles = unmatchedPdfs
      setImportResult(res)
      setStep('result')

      if (res.success > 0) {
        toast({
          title: 'Importação concluída!',
          description: `${res.success} Não Conformidades foram salvas com sucesso.`,
        })
        onSuccess()
      }
    } catch (err: any) {
      setError(err?.message || 'Erro durante a gravação das RNCs.')
    } finally {
      setIsImporting(false)
    }
  }

  // Filter preview records
  const filteredPreviewRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (
        previewFilter === 'with_evidence' &&
        (!r.matched_evidence_names || r.matched_evidence_names.length === 0)
      ) {
        return false
      }
      if (previewFilter === 'with_whys' && (!r.five_whys || r.five_whys.length === 0)) {
        return false
      }
      if (previewFilter === 'with_ishikawa' && !r.ishikawa_data) {
        return false
      }
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase()
        const matchNum = r.number.toLowerCase().includes(q)
        const matchProc = r.process.toLowerCase().includes(q)
        const matchDesc = r.description.toLowerCase().includes(q)
        const matchResp = (r.responsible || '').toLowerCase().includes(q)
        return matchNum || matchProc || matchDesc || matchResp
      }
      return true
    })
  }, [parsedRows, previewFilter, previewSearch])

  // Download template CSV helper
  const handleDownloadTemplate = () => {
    const csvContent =
      'Nº RNC;Data;Processo;Grau;Origem;Status;Responsável;OS;Resumo;Descrição;Ação Imediata;Ação Corretiva;Prazo;Custo Matéria-Prima;Custo Insumos;Custo Serviços;Custo Ação;Eficácia;Data Eficácia\n' +
      'RNC-007/2025;15/03/2025;CQ;Médio;Auditoria Interna;Fechada;Carlos CQ;OS-2025-01;Instrumento descalibrado;Paquímetro utilizado com aferição vencida;Segregação imediata;Recalibração RBC e treinamento;25/03/2025;0;120;450;0;SIM;28/03/2025\n' +
      'RNC 015-26;10/01/2026;Caldeiraria;Grave;Reclamação de Cliente;Em Andamento;João Solda;OS-2026-08;Trinca em chanfro;Trinca detectada na raiz da junta soldada;Retrabalho e esmerilhamento;Requalificação de soldador e EPS revisada;15/02/2026;500;300;1200;800;Pendente;'

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_rncs.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedCompany = companies.find((c) => c.id === targetCompanyId)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) resetAll()
      }}
    >
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-card border-white/10 p-6">
        <DialogHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  Assistente de Importação em Lote de RNCs
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary text-[11px] font-mono"
                  >
                    FSGQ 8.7-1 / 8.7-2
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Importação direta pelo navegador: planilha Excel (RNC, 5 Porquês, Ishikawa) +
                  pasta de PDFs escaneados
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs border-white/10 hover:bg-white/10 gap-1.5 h-8 text-white/80"
              >
                <Download className="w-3.5 h-3.5" /> Modelo de Planilha
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs text-muted-foreground hover:text-white h-8 gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />{' '}
                {showHelp ? 'Ocultar Dicas' : 'Como Funciona'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showHelp && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-2 text-white/90 animate-fade-in">
            <h4 className="font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Diretrizes de Importação Histórica (Gestor da
              Qualidade):
            </h4>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground text-[11px]">
              <li>
                <strong>Uma empresa por vez:</strong> Selecione PSC INDÚSTRIA (81 registros) ou
                KOALA SYSTEM (35 registros).
              </li>
              <li>
                <strong>Numeração original intocada:</strong> O formato de código (ex:{' '}
                <code>RNC-007/2025</code> ou <code>RNC 015-26</code>) é preservado sem modificações.
              </li>
              <li>
                <strong>Mapeamento das 4 Abas:</strong> O assistente reconhece automaticamente as
                abas <code>RNC</code>, <code>5 Porquês</code>, <code>Ishikawa</code> e{' '}
                <code>Evidências</code> vinculando os dados pelo número da RNC.
              </li>
              <li>
                <strong>Vínculo tolerante de PDFs:</strong> Arraste todos os PDFs da pasta de
                evidências escaneadas de uma vez só. O assistente liga cada arquivo pelo número (ex:{' '}
                <code>RNC-007-2025.pdf</code> → <code>RNC-007/2025</code>).
              </li>
              <li>
                <strong>Auditoria e Preview obrigatório:</strong> Você revisa todas as linhas antes
                da gravação no banco, com contagens de desvios, 5 Porquês e arquivos anexados.
              </li>
            </ul>
          </div>
        )}

        {/* STEP 1: UPLOAD EXCEL + PDFS */}
        {step === 'upload' && (
          <div className="space-y-5 py-2">
            {/* Target Company Selection */}
            <div className="space-y-2 bg-black/20 p-4 rounded-lg border border-white/10">
              <Label className="text-white flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" /> 1. Empresa Destino das RNCs *
              </Label>
              <p className="text-xs text-muted-foreground">
                Selecione a empresa à qual o arquivo de Não Conformidades pertence.
              </p>
              <Select
                value={targetCompanyId}
                onValueChange={(val) => {
                  setTargetCompanyId(val)
                  setCompanyError('')
                }}
              >
                <SelectTrigger
                  className={`bg-black/30 border-white/10 text-white ${
                    companyError ? 'border-rose-500 ring-1 ring-rose-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Selecione a empresa correspondente..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.tax_id ? `(${c.tax_id})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companyError && <p className="text-xs text-rose-400 font-medium">{companyError}</p>}
            </div>

            {/* Grid for Excel and PDFs dropzones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Excel File */}
              <div className="p-4 rounded-lg bg-black/20 border border-white/10 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm font-semibold flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> 2. Planilha Excel
                      (.xlsx) *
                    </Label>
                    {excelFile && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400 text-[10px]"
                      >
                        Carregado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Planilha com as abas <strong>RNC</strong>, <strong>5 Porquês</strong> e{' '}
                    <strong>Ishikawa</strong>.
                  </p>
                </div>

                <div
                  onClick={() => excelInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    excelFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-white/15 hover:border-primary/50 bg-black/30'
                  }`}
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelSelection}
                  />
                  {selectedExcelFiles.length > 0 ? (
                    <div className="space-y-1">
                      <FileCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-semibold text-white break-all">
                        {selectedExcelFiles.length === 1
                          ? selectedExcelFiles[0].name
                          : `${selectedExcelFiles.length} arquivos Excel selecionados`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Planilha de Controle e/ou Formulários Individuais FSGQ — clique para trocar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-7 h-7 text-white/40 mx-auto" />
                      <p className="text-xs text-white/80 font-medium">
                        Clique ou arraste o(s) arquivo(s) .xlsx
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Suporta CONTROLE_RNC e formulários individuais FSGQ (merge por número)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Scanned PDFs Multi-upload */}
              <div className="p-4 rounded-lg bg-black/20 border border-white/10 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm font-semibold flex items-center gap-2">
                      <Files className="w-4 h-4 text-sky-400" /> 3. PDFs de Evidências Escaneadas
                    </Label>
                    <Badge variant="outline" className="border-sky-500/40 text-sky-400 text-[10px]">
                      {pdfFiles.length} selecionado(s)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione todos os relatórios/fotos escaneados da pasta da empresa de uma vez
                    só.
                  </p>
                </div>

                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    pdfFiles.length > 0
                      ? 'border-sky-500/50 bg-sky-500/5'
                      : 'border-white/15 hover:border-primary/50 bg-black/30'
                  }`}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePdfSelection}
                  />
                  {pdfFiles.length > 0 ? (
                    <div className="space-y-1">
                      <Files className="w-8 h-8 text-sky-400 mx-auto" />
                      <p className="text-xs font-semibold text-white">
                        {pdfFiles.length} arquivo(s) PDF carregado(s)
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Clique para adicionar mais arquivos à lista
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-7 h-7 text-white/40 mx-auto" />
                      <p className="text-xs text-white/80 font-medium">
                        Selecionar PDFs de Evidências
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Arraste múltiplos arquivos .pdf (ex: RNC-007-2025.pdf)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List of Loaded PDFs with remove tag */}
            {pdfFiles.length > 0 && (
              <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80 font-medium flex items-center gap-1.5">
                    <Files className="w-3.5 h-3.5 text-sky-400" />
                    PDFs aguardando vínculo automático com o Excel ({pdfFiles.length}):
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPdfFiles([])}
                    className="h-6 text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    Remover todos os PDFs
                  </Button>
                </div>
                <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 pr-1">
                  {pdfFiles.map((f) => (
                    <span
                      key={f.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white/5 border border-white/10 text-white/80 font-mono"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removePdf(f.name)
                        }}
                        className="text-white/40 hover:text-rose-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW TABLE & DIAGNOSTICS */}
        {step === 'preview' && (
          <div className="space-y-4 py-2">
            {/* SAFEGUARD BANNER: Bloqueio ou Alerta claro no topo */}
            {sheetStats.diagnostics?.hasSafeguardWarning && (
              <div
                className={`p-4 rounded-lg border text-xs space-y-3 ${
                  sheetStats.diagnostics.allSuspicious
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      sheetStats.diagnostics.allSuspicious
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4
                      className={`font-bold text-sm ${
                        sheetStats.diagnostics.allSuspicious ? 'text-rose-300' : 'text-amber-300'
                      }`}
                    >
                      {sheetStats.diagnostics.allSuspicious
                        ? 'Importação Bloqueada: Arquivo Não Corresponde à Planilha de Controle'
                        : 'Atenção na Carga Inicial de RNCs'}
                    </h4>
                    <p className="leading-relaxed">
                      Este arquivo parece ser um <strong>FORMULÁRIO INDIVIDUAL (FSGQ 8.7-2)</strong>
                      , não a planilha de <strong>CONTROLE (FSGQ 8.7-1)</strong>. Para a carga
                      inicial das RNCs, suba a planilha de CONTROLE. Formulários individuais devem
                      ser usados depois, para enriquecer RNCs já criadas.
                    </p>

                    {sheetStats.diagnostics.reasons.length > 0 && (
                      <div className="pt-1">
                        <p className="font-semibold text-[11px] opacity-90 mb-1">
                          Diagnósticos identificados:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 font-mono">
                          {sheetStats.diagnostics.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => setStep('upload')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-8 shadow-sm"
                      >
                        ← Voltar e Trocar Arquivos
                      </Button>

                      {!sheetStats.diagnostics.allSuspicious && (
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-white/90 bg-black/40 px-3 py-1.5 rounded border border-white/10">
                          <input
                            type="checkbox"
                            checked={overrideSafeguard}
                            onChange={(e) => setOverrideSafeguard(e.target.checked)}
                            className="rounded border-white/20 text-primary focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="font-medium text-amber-300">
                            Gravar mesmo assim (compreendo os riscos de duplicar ou importar campos
                            avulsos)
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Total RNCs
                </p>
                <p className="text-xl font-bold text-white mt-0.5">{sheetStats.totalRows}</p>
                <p className="text-[10px] text-white/60 truncate">
                  Aba: {sheetStats.rncSheetName || 'Principal'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  5 Porquês Vinculados
                </p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">{sheetStats.linkedWhys}</p>
                <p className="text-[10px] text-white/60 truncate">
                  {sheetStats.whysSheetName ? `Aba: ${sheetStats.whysSheetName}` : 'Não localizada'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Ishikawa Vinculados
                </p>
                <p className="text-xl font-bold text-purple-400 mt-0.5">
                  {sheetStats.linkedIshikawas}
                </p>
                <p className="text-[10px] text-white/60 truncate">
                  {sheetStats.ishikawaSheetName
                    ? `Aba: ${sheetStats.ishikawaSheetName}`
                    : 'Não localizada'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  PDFs Vinculados
                </p>
                <p className="text-xl font-bold text-sky-400 mt-0.5">{sheetStats.linkedPdfs}</p>
                <p className="text-[10px] text-white/60">
                  {unmatchedPdfs.length > 0
                    ? `${unmatchedPdfs.length} não correspondentes`
                    : '100% correspondentes'}
                </p>
              </div>
            </div>

            {/* Warning if there are unmatched PDFs */}
            {unmatchedPdfs.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <FileWarning className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Aviso: {unmatchedPdfs.length} arquivo(s) PDF não correspondem a nenhuma RNC
                    desta planilha:
                  </span>
                </div>
                <div className="text-[11px] text-amber-200/80 font-mono truncate">
                  {unmatchedPdfs.join(', ')}
                </div>
                <p className="text-[10px] text-white/60">
                  Esses PDFs não serão descartados silenciosamente; eles ficam registrados como
                  avulsos para conferência.
                </p>
              </div>
            )}

            {/* Warning if there are suspicious RNC lines detected */}
            {parsedRows.some((r) => r.isSuspicious) && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Atenção: {parsedRows.filter((r) => r.isSuspicious).length} linha(s) possuem
                    numeração suspeita (destacadas em amarelo na tabela abaixo):
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90">
                  Verifique se essas linhas são registros reais de RNC antes de confirmar a
                  gravação.
                </p>
              </div>
            )}
            {/* Filter and Search Bar for Preview */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Filtrar por número, processo ou responsável..."
                    className="h-8 pl-8 text-xs bg-black/20 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant={previewFilter === 'all' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewFilter('all')}
                  className="text-[11px] h-7 border-white/10"
                >
                  Todas ({parsedRows.length})
                </Button>
                <Button
                  size="sm"
                  variant={previewFilter === 'with_evidence' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewFilter('with_evidence')}
                  className="text-[11px] h-7 border-white/10 gap-1 text-sky-400"
                >
                  Com PDF ({sheetStats.linkedPdfs})
                </Button>
                <Button
                  size="sm"
                  variant={previewFilter === 'with_whys' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewFilter('with_whys')}
                  className="text-[11px] h-7 border-white/10 gap-1 text-amber-400"
                >
                  Com 5 Porquês ({sheetStats.linkedWhys})
                </Button>
                <Button
                  size="sm"
                  variant={previewFilter === 'with_ishikawa' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewFilter('with_ishikawa')}
                  className="text-[11px] h-7 border-white/10 gap-1 text-purple-400"
                >
                  Com Ishikawa ({sheetStats.linkedIshikawas})
                </Button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-white/10 rounded-lg overflow-x-auto max-h-[380px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-black/40 sticky top-0 z-10">
                  <TableRow className="border-white/10">
                    <TableHead className="text-[11px] text-white/70 font-semibold w-12">
                      #
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">
                      Nº RNC (Original)
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">Data</TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">
                      Processo
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">Grau</TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">
                      Status Mapeado
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">
                      Responsável
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold">
                      Descrição Resumida
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold text-center">
                      5 Porquês
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold text-center">
                      Ishikawa
                    </TableHead>
                    <TableHead className="text-[11px] text-white/70 font-semibold text-center">
                      Evidências (PDFs)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreviewRows.map((row, idx) => {
                    const hasWhys = row.five_whys && row.five_whys.length > 0
                    const hasIshi = !!row.ishikawa_data
                    const hasPdf =
                      row.matched_evidence_names && row.matched_evidence_names.length > 0

                    return (
                      <TableRow
                        key={idx}
                        className={`border-white/5 hover:bg-white/5 text-xs ${
                          row.isSuspicious ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : ''
                        }`}
                      >
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={
                                row.isSuspicious ? 'text-amber-400 font-bold' : 'text-primary'
                              }
                            >
                              {row.number}
                            </span>
                            {row.isSuspicious && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/50 bg-amber-500/20 text-amber-300 text-[9px] px-1 py-0 h-4"
                                title={row.suspiciousReason || 'Numeração suspeita'}
                              >
                                Suspeita
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80 whitespace-nowrap">
                          {row.date || '—'}
                        </TableCell>{' '}
                        <TableCell className="text-white/90 font-medium whitespace-nowrap">
                          {row.process}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px]">
                            {row.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              row.status === 'Fechada'
                                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                            }`}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80 whitespace-nowrap">
                          {row.responsible || '—'}
                        </TableCell>
                        <TableCell
                          className="text-white/80 max-w-xs truncate"
                          title={row.description}
                        >
                          {row.summary || row.description}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasWhys ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-400 text-[10px]"
                            >
                              {row.five_whys?.length} itens
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasIshi ? (
                            <Badge
                              variant="outline"
                              className="border-purple-500/40 text-purple-400 text-[10px]"
                            >
                              6M Pronto
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasPdf ? (
                            <Badge
                              variant="outline"
                              className="border-sky-500/40 text-sky-400 text-[10px] truncate max-w-[120px]"
                              title={row.matched_evidence_names?.join(', ')}
                            >
                              {row.matched_evidence_names?.length} PDF(s)
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Destino:{' '}
                <strong className="text-white">
                  {selectedCompany?.name || 'Empresa selecionada'}
                </strong>
              </span>
              <span>
                Pronto para gravação de <strong>{parsedRows.length}</strong> Não Conformidades
                históricas.
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: RESULT REPORT */}
        {step === 'result' && importResult && (
          <div className="py-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Importação Concluída com Sucesso!</h3>
              <p className="text-xs text-muted-foreground">
                As Não Conformidades foram registradas na collection <code>non_conformities</code> e
                integradas aos indicadores de qualidade.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Total Processado
                </p>
                <p className="text-2xl font-bold text-white mt-1">{importResult.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-[10px] text-emerald-400 uppercase font-semibold">
                  Salvas com Sucesso
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{importResult.success}</p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Falhas / Erros
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${importResult.failed > 0 ? 'text-rose-400' : 'text-white/60'}`}
                >
                  {importResult.failed}
                </p>
              </div>
            </div>

            {importResult.unmatchedPdfFiles && importResult.unmatchedPdfFiles.length > 0 && (
              <div className="max-w-xl mx-auto p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left space-y-1">
                <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                  PDFs avulsos não vinculados a nenhuma linha do Excel:
                </p>
                <p className="text-[11px] font-mono text-amber-200/80">
                  {importResult.unmatchedPdfFiles.join(', ')}
                </p>
              </div>
            )}

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="max-w-xl mx-auto p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-left space-y-2">
                <p className="text-xs font-semibold text-rose-300">
                  Falhas registradas durante a importação:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-rose-200">
                  {importResult.errors.map((e, idx) => (
                    <div key={idx} className="font-mono">
                      • Linha {e.row} ({e.number}): {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS BAR WHILE IMPORTING */}
        {isImporting && (
          <div className="space-y-2 py-4 bg-black/40 p-4 rounded-lg border border-white/10">
            <div className="flex justify-between text-xs text-white">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Gravando Não Conformidades no banco de dados...
              </span>
              <span className="font-mono text-primary font-bold">
                {progress.current} de {progress.total} (
                {Math.round((progress.current / (progress.total || 1)) * 100)}%)
              </span>
            </div>
            <Progress
              value={Math.round((progress.current / (progress.total || 1)) * 100)}
              className="h-2"
            />
            {progress.currentNum && (
              <p className="text-[11px] text-muted-foreground font-mono">
                Processando: <strong>{progress.currentNum}</strong>
              </p>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-white/10 flex items-center justify-between sm:justify-between w-full">
          <div>
            {step === 'preview' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('upload')}
                disabled={isImporting}
                className="text-xs text-muted-foreground hover:text-white"
              >
                ← Voltar e Trocar Arquivos
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 'upload' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs border-white/10 text-white/80"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={processSpreadsheetAndPdfs}
                  disabled={!excelFile || isParsing}
                  className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando Abas...
                    </>
                  ) : (
                    <>
                      Avançar para Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isImporting}
                  className="text-xs border-white/10 text-white/80"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={
                    isImporting ||
                    parsedRows.length === 0 ||
                    (sheetStats.diagnostics?.hasSafeguardWarning &&
                      (sheetStats.diagnostics.allSuspicious || !overrideSafeguard))
                  }
                  className={`text-white text-xs font-semibold gap-1.5 shadow-lg ${
                    sheetStats.diagnostics?.hasSafeguardWarning &&
                    (sheetStats.diagnostics.allSuspicious || !overrideSafeguard)
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                  }`}
                  title={
                    sheetStats.diagnostics?.allSuspicious
                      ? 'Gravação bloqueada: todas as linhas são suspeitas ou arquivo individual detectado'
                      : sheetStats.diagnostics?.hasSafeguardWarning && !overrideSafeguard
                        ? 'Marque a confirmação "Gravar mesmo assim" para prosseguir'
                        : undefined
                  }
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gravando no Banco...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar e Gravar{' '}
                      {parsedRows.length} RNCs
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'result' && (
              <Button
                onClick={() => {
                  onOpenChange(false)
                  resetAll()
                }}
                className="bg-primary text-primary-foreground text-xs font-semibold"
              >
                Concluir e Ver RNCs
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
