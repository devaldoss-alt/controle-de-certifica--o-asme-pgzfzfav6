/**
 * Diálogo de Importação de RNCs - Formato FSGQ 8.7-2 / FSGQ 8.7-1
 * Acesso exclusivo para gestores (canManage).
 * Suporta Excel multi-abas (.xlsx) e JSON, identificação automática de empresa/ano,
 * deduplicação acumulada, opção de substituição e critério de status conforme especificação.
 */

import { useState, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Progress } from './ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Input } from './ui/input'
import { useToast } from '../hooks/use-toast'
import type { Company } from '../services/companies'
import {
  parseFSGQSpreadsheet,
  parseFSGQJson,
  type FSGQParsedRecord,
  type ParseResultFSGQ,
} from '../lib/fsgq-parser'
import { bulkImportFSGQRecords, type BulkImportFSGQResult } from '../services/rnc'
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Download,
  HelpCircle,
  Sparkles,
  Building2,
  Loader2,
  Search,
  FileCode2,
  Trash2,
  Check,
  Calendar,
  Layers,
} from 'lucide-react'

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
  companies: _companies,
  defaultCompanyId = 'a631bv695rr4gef',
  onSuccess,
}: RNCImportDialogProps) {
  const { toast } = useToast()

  // Steps: 'upload' -> 'preview' -> 'result'
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')

  // Arquivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'xlsx' | 'json' | null>(null)

  // Resultado do parse
  const [parseResult, setParseResult] = useState<ParseResultFSGQ | null>(null)

  // Opções de importação
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false)
  const [showReplaceConfirmDialog, setShowReplaceConfirmDialog] = useState<boolean>(false)

  // Estados de execução
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: '',
  })
  const [importResult, setImportResult] = useState<BulkImportFSGQResult | null>(null)
  const [error, setError] = useState<string>('')

  // Filtros no preview
  const [previewFilterCompany, setPreviewFilterCompany] = useState<string>('all')
  const [previewFilterStatus, setPreviewFilterStatus] = useState<
    'all' | 'Fechada' | 'Em Andamento'
  >('all')
  const [previewSearch, setPreviewSearch] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetAll = () => {
    setStep('upload')
    setSelectedFile(null)
    setFileType(null)
    setParseResult(null)
    setReplaceExisting(false)
    setShowReplaceConfirmDialog(false)
    setIsParsing(false)
    setIsImporting(false)
    setProgress({ current: 0, total: 0, message: '' })
    setImportResult(null)
    setError('')
    setPreviewSearch('')
    setPreviewFilterCompany('all')
    setPreviewFilterStatus('all')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Manipular seleção de arquivo Excel ou JSON
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSelectedFile(file)

    const lower = file.name.toLowerCase()
    if (lower.endsWith('.json')) {
      setFileType('json')
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      setFileType('xlsx')
    } else {
      setFileType(null)
      setError('Formato não suportado. Envie uma planilha Excel (.xlsx, .xls) ou arquivo JSON.')
    }
  }

  // Processar arquivo (Parse)
  const handleProcessFile = async () => {
    if (!selectedFile) {
      setError('Selecione um arquivo Excel ou JSON para prosseguir.')
      return
    }

    setIsParsing(true)
    setError('')

    try {
      let result: ParseResultFSGQ
      if (fileType === 'json') {
        const text = await selectedFile.text()
        result = parseFSGQJson(text)
      } else {
        result = await parseFSGQSpreadsheet(selectedFile)
      }

      if (result.records.length === 0) {
        throw new Error(
          'Nenhum registro válido de RNC foi encontrado nas abas reconhecidas. Verifique se as abas contêm nomes como "PSC 2025", "PSC 2026", "Koala 2025", "Koala 2026" ou colunas do FSGQ 8.7-2.',
        )
      }

      setParseResult(result)
      setStep('preview')
      toast({
        title: 'Arquivo processado com sucesso!',
        description: `${result.totalRecords} RNCs identificadas (${result.mergedCount} duplicidades mescladas).`,
      })
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Falha ao processar o arquivo.')
    } finally {
      setIsParsing(false)
    }
  }

  // Iniciar importação (verifica se requer confirmação de substituição)
  const handleTriggerImport = () => {
    if (replaceExisting) {
      setShowReplaceConfirmDialog(true)
    } else {
      executeImport()
    }
  }

  // Gravar no PocketBase
  const executeImport = async () => {
    if (!parseResult || parseResult.records.length === 0) return

    setShowReplaceConfirmDialog(false)
    setIsImporting(true)
    setError('')
    setProgress({ current: 0, total: parseResult.records.length, message: 'Iniciando gravação...' })

    try {
      const res = await bulkImportFSGQRecords(
        parseResult.records,
        {
          replaceExisting,
          defaultCompanyId,
        },
        (current, total, message) => {
          setProgress({ current, total, message })
        },
      )

      setImportResult(res)
      setStep('result')

      if (res.created > 0) {
        toast({
          title: 'Importação finalizada!',
          description: `${res.created} Não Conformidades foram gravadas com sucesso.`,
        })
        onSuccess()
      }
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro durante a gravação das RNCs.')
    } finally {
      setIsImporting(false)
    }
  }

  // Registros filtrados para o preview
  const filteredRecords = useMemo(() => {
    if (!parseResult) return []
    return parseResult.records.filter((r) => {
      if (previewFilterCompany !== 'all' && r.company_id !== previewFilterCompany) {
        return false
      }
      if (previewFilterStatus !== 'all' && r.status !== previewFilterStatus) {
        return false
      }
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase()
        const matchNum = r.number.toLowerCase().includes(q)
        const matchDesc = r.description.toLowerCase().includes(q)
        const matchResp = (r.responsible || '').toLowerCase().includes(q)
        const matchIssuer = (r.issuer || '').toLowerCase().includes(q)
        const matchPart = (r.part_item || '').toLowerCase().includes(q)
        return matchNum || matchDesc || matchResp || matchIssuer || matchPart
      }
      return true
    })
  }, [parseResult, previewFilterCompany, previewFilterStatus, previewSearch])

  // Download do modelo CSV / JSON
  const handleDownloadTemplate = () => {
    const jsonSample = [
      {
        sheetName: 'PSC 2025',
        number: '002/2024',
        date: '2025-01-20',
        issuer: 'Carlos GQ',
        service_order_number: 'OS-1020',
        part_item: 'Flange 4 pol',
        involved_parties: 'Usinagem',
        description: 'Dimensional da rosca fora do toleranciamento',
        responsible: 'Marcos Usinagem',
        immediate_action: 'Retrabalho da rosca no torno',
        reinspection_notes: 'Aprovado dimensional pelo CQ',
        root_cause: 'Desgaste de pastilha',
        root_cause_details: 'Ferramenta operando acima da vida útil recomendada',
        corrective_action: 'Instituir checklist de vida de ferramentas a cada lote',
        is_effective: 'Sim',
        notes: 'Ajuste concluído sem atraso na entrega',
      },
      {
        sheetName: 'Koala 2026',
        number: '011/25',
        date: '15/02/2026',
        issuer: 'Roberta GQ',
        service_order_number: 'OS-4088',
        part_item: 'Painel Elétrico',
        involved_parties: 'Montagem',
        description: 'Cabeamento invertido no relé térmico',
        responsible: 'Engenharia Elétrica',
        immediate_action: '',
        reinspection_notes: '',
        root_cause: '',
        root_cause_details: '',
        corrective_action: '',
        is_effective: 'Pendente',
        notes: 'Aguardando parecer do fornecedor',
      },
    ]

    const blob = new Blob([JSON.stringify(jsonSample, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_rnc_fsgq_8_7_2.json')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v)
          if (!v) resetAll()
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[92vh] overflow-y-auto bg-card border-white/10 p-6"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    Importação de RNCs
                    <Badge
                      variant="outline"
                      className="border-primary/40 text-primary text-[11px] font-mono"
                    >
                      FSGQ 8.7-2 / Excel & JSON
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Mapeamento automático com preservação fiel de numeração, segregação PSC / Koala
                    System e cálculo de status.
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
                  <Download className="w-3.5 h-3.5" /> Modelo Exemplo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-muted-foreground hover:text-white h-8 gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHelp ? 'Ocultar Regras' : 'Regras da Carga'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {showHelp && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-2.5 text-white/90 animate-fade-in">
              <h4 className="font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Critérios e Diretrizes da Ferramenta de Carga FSGQ
                8.7-2:
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-muted-foreground text-[11px] leading-relaxed">
                <li>
                  <strong className="text-white">Preservação exata da numeração:</strong> Números
                  como <code>002/2024</code>, <code>011/25</code>, <code>005-26</code>,{' '}
                  <code>NC001</code> são gravados <em>exatamente</em> como constam na planilha/JSON,
                  sem renumerar.
                </li>
                <li>
                  <strong className="text-white">Identificação por aba:</strong> O nome da aba
                  determina a empresa (<code>PSC ...</code> → PSC Indústria; <code>Koala ...</code>{' '}
                  / <code>Koala Siystem</code> → Koala System) e o ano de referência (2025/2026).
                  Numeração independente por empresa.
                </li>
                <li>
                  <strong className="text-white">Abas ignoradas automaticamente:</strong> Abas de
                  sumário ou auxiliares como <code>Índice</code>, <code>Relatório</code>,{' '}
                  <code>Inconsistências</code>, <code>Resumo</code> são descartadas e não poluem a
                  base.
                </li>
                <li>
                  <strong className="text-white">Mesclagem de duplicidades:</strong> Linhas com o
                  mesmo número de RNC na mesma empresa são unificadas em um único registro,
                  acumulando ações, causas, evidências e observações.
                </li>
                <li>
                  <strong className="text-white">Critério de Status do SGQ:</strong> Quando a
                  correção/ação corretiva está preenchida E a eficácia está definida (Sim/Não) →{' '}
                  <code>Fechada</code>. Se o tratamento estiver vazio ou sem desfecho →{' '}
                  <code>Em Andamento</code>.
                </li>
              </ul>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-5 py-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/15 hover:border-primary/50 bg-black/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.json"
                  className="hidden"
                  onChange={handleFileSelection}
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                      {fileType === 'json' ? (
                        <FileCode2 className="w-6 h-6" />
                      ) : (
                        <FileSpreadsheet className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white break-all">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Pronto para processar
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-white/70 hover:text-white mt-1 h-7"
                    >
                      Clique para escolher outro arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        Arraste ou clique para selecionar a planilha Excel (.xlsx) ou arquivo JSON
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formato padrão: formulário FSGQ 8.7-2 com múltiplas abas (PSC 2025, PSC
                        2026, Koala 2025, Koala 2026)
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className="border-white/10 text-white/60 text-[10px]"
                      >
                        .xlsx
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-white/10 text-white/60 text-[10px]"
                      >
                        .xls
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-white/10 text-white/60 text-[10px]"
                      >
                        .json
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Opção: Substituir registros existentes da mesma empresa */}
              <div className="p-4 rounded-lg bg-black/20 border border-white/10 space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="replace-existing"
                    checked={replaceExisting}
                    onCheckedChange={(checked) => setReplaceExisting(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="replace-existing"
                      className="text-sm font-medium text-white cursor-pointer select-none flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Substituir registros existentes da mesma empresa antes da carga
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Remove os registros incompletos/antigos de cada empresa identificada no
                      arquivo antes de importar, garantindo base limpa e sem inconsistências.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'preview' && parseResult && (
            <div className="space-y-4 py-2">
              {/* Cards de Resumo por Empresa / Ano */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {parseResult.summaryByCompanyYear.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-black/30 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-primary" /> {item.company_name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-primary/30 text-primary font-mono"
                      >
                        {item.year}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">
                      {item.count}{' '}
                      <span className="text-xs font-normal text-muted-foreground">RNCs</span>
                    </p>
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-primary uppercase font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Total Geral
                    </span>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                      {parseResult.totalRecords} itens
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary mt-1">{parseResult.totalRecords}</p>
                  {parseResult.mergedCount > 0 && (
                    <p className="text-[10px] text-emerald-400 font-medium">
                      ✓ {parseResult.mergedCount} linhas mescladas por nº
                    </p>
                  )}
                </div>
              </div>

              {/* Avisos de abas ignoradas / duplicidades */}
              <div className="space-y-2">
                {parseResult.ignoredSheets.length > 0 && (
                  <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-xs flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-white/50" />
                      Abas informativas ignoradas (não são dados de RNC):{' '}
                      <strong className="text-white/80">
                        {parseResult.ignoredSheets.join(', ')}
                      </strong>
                    </span>
                    <Badge variant="outline" className="text-[10px] text-white/60">
                      Ignoradas com sucesso
                    </Badge>
                  </div>
                )}

                {parseResult.duplicateNumbersList.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>Mesclagem de duplicidades:</strong>{' '}
                      {parseResult.duplicateNumbersList.length} RNCs tinham múltiplas linhas (ex:
                      ações parceladas) e foram unificadas (
                      {parseResult.duplicateNumbersList.slice(0, 6).join(', ')}
                      {parseResult.duplicateNumbersList.length > 6 ? '...' : ''}).
                    </span>
                  </div>
                )}

                {replaceExisting && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      <strong>Atenção:</strong> A opção de substituição está{' '}
                      <strong>ativada</strong>. Os registros anteriores das empresas identificadas
                      serão excluídos antes da importação.
                    </span>
                  </div>
                )}
              </div>

              {/* Critério de Status Explicativo */}
              <div className="p-3 rounded-lg bg-black/30 border border-white/10 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  <strong>Fechada:</strong> Correção ou Ação preenchidas E eficácia definida
                  (Sim/Não).
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                  <strong>Em Andamento:</strong> Tratamento em aberto ou pendente de eficácia.
                </span>
              </div>

              {/* Barra de Filtro e Busca na Tabela de Preview */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      placeholder="Buscar por número, descrição, responsável..."
                      className="h-8 pl-8 text-xs bg-black/20 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant={previewFilterCompany === 'all' ? 'secondary' : 'outline'}
                    onClick={() => setPreviewFilterCompany('all')}
                    className="text-[11px] h-7 border-white/10"
                  >
                    Todas ({parseResult.records.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={previewFilterCompany === 'a631bv695rr4gef' ? 'secondary' : 'outline'}
                    onClick={() => setPreviewFilterCompany('a631bv695rr4gef')}
                    className="text-[11px] h-7 border-white/10"
                  >
                    PSC
                  </Button>
                  <Button
                    size="sm"
                    variant={previewFilterCompany === 'i7kjauu378swxg6' ? 'secondary' : 'outline'}
                    onClick={() => setPreviewFilterCompany('i7kjauu378swxg6')}
                    className="text-[11px] h-7 border-white/10"
                  >
                    Koala System
                  </Button>
                  <span className="text-white/20">|</span>
                  <Button
                    size="sm"
                    variant={previewFilterStatus === 'all' ? 'secondary' : 'outline'}
                    onClick={() => setPreviewFilterStatus('all')}
                    className="text-[11px] h-7 border-white/10"
                  >
                    Todos Status
                  </Button>
                  <Button
                    size="sm"
                    variant={previewFilterStatus === 'Fechada' ? 'secondary' : 'outline'}
                    onClick={() => setPreviewFilterStatus('Fechada')}
                    className="text-[11px] h-7 border-white/10 text-emerald-400"
                  >
                    Fechada
                  </Button>
                  <Button
                    size="sm"
                    variant={previewFilterStatus === 'Em Andamento' ? 'secondary' : 'outline'}
                    onClick={() => setPreviewFilterStatus('Em Andamento')}
                    className="text-[11px] h-7 border-white/10 text-amber-400"
                  >
                    Em Andamento
                  </Button>
                </div>
              </div>

              {/* Tabela de Preview */}
              <div className="border border-white/10 rounded-lg overflow-x-auto max-h-[380px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-black/40 sticky top-0 z-10">
                    <TableRow className="border-white/10">
                      <TableHead className="text-[11px] text-white/70 font-semibold w-12">
                        #
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Nº RNC (Exato)
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Empresa / Ano
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Data
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Item / Peça
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Eficaz?
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Responsável
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Descrição
                      </TableHead>
                      <TableHead className="text-[11px] text-white/70 font-semibold">
                        Ação Corretiva
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((row: FSGQParsedRecord, idx: number) => (
                      <TableRow key={idx} className="border-white/5 hover:bg-white/5 text-xs">
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono font-bold whitespace-nowrap text-primary">
                          {row.number}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium text-white/90">{row.company_name}</span>{' '}
                          <span className="text-[10px] text-muted-foreground">({row.year})</span>
                        </TableCell>
                        <TableCell className="text-white/80 whitespace-nowrap font-mono text-[11px]">
                          {row.date}
                        </TableCell>
                        <TableCell
                          className="text-white/90 whitespace-nowrap max-w-[140px] truncate"
                          title={row.part_item}
                        >
                          {row.part_item || '—'}
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
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              row.is_effective === 'SIM'
                                ? 'border-emerald-500/30 text-emerald-400'
                                : row.is_effective === 'NÃO'
                                  ? 'border-rose-500/30 text-rose-400'
                                  : 'border-white/20 text-muted-foreground'
                            }`}
                          >
                            {row.is_effective}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80 whitespace-nowrap">
                          {row.responsible || '—'}
                        </TableCell>
                        <TableCell
                          className="text-white/80 max-w-xs truncate"
                          title={row.description}
                        >
                          {row.description}
                        </TableCell>
                        <TableCell
                          className="text-white/80 max-w-xs truncate"
                          title={row.corrective_action}
                        >
                          {row.corrective_action || row.immediate_action || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && importResult && (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Importação Concluída com Sucesso!</h3>
                <p className="text-xs text-muted-foreground">
                  Os registros foram gravados na coleção <code>non_conformities</code> e integrados
                  aos indicadores.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-[10px] text-emerald-400 uppercase font-semibold">
                    Criadas / Salvas
                  </p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{importResult.created}</p>
                </div>
                {importResult.deleted > 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    <p className="text-[10px] text-rose-400 uppercase font-semibold">
                      Substituídas / Limpas
                    </p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">{importResult.deleted}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Falhas / Erros
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${importResult.errors.length > 0 ? 'text-rose-400' : 'text-white/60'}`}
                  >
                    {importResult.errors.length}
                  </p>
                </div>
              </div>

              {/* Resumo por empresa */}
              {Object.keys(importResult.summaryByCompany).length > 0 && (
                <div className="max-w-xl mx-auto p-3 rounded-lg bg-black/20 border border-white/10 text-left text-xs space-y-1">
                  <p className="font-semibold text-white/90">Distribuição por empresa:</p>
                  <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
                    {Object.entries(importResult.summaryByCompany).map(([cName, count]) => (
                      <span key={cName} className="font-mono">
                        • {cName}: <strong className="text-primary">{count}</strong> RNCs
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="max-w-xl mx-auto p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-left space-y-2">
                  <p className="text-xs font-semibold text-rose-300">Falhas registradas:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-rose-200">
                    {importResult.errors.map((e, idx) => (
                      <div key={idx} className="font-mono">
                        • Linha {e.row}: {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BARRA DE PROGRESSO */}
          {isImporting && (
            <div className="space-y-2 py-4 bg-black/40 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between text-xs text-white">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  {progress.message || 'Gravando Não Conformidades no banco de dados...'}
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
                  ← Voltar e Trocar Arquivo
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
                    onClick={handleProcessFile}
                    disabled={!selectedFile || isParsing}
                    className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando Abas...
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
                    onClick={handleTriggerImport}
                    disabled={isImporting || !parseResult || parseResult.records.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-emerald-900/20"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gravando no Banco...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Confirmar e Gravar{' '}
                        {parseResult?.totalRecords} RNCs
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

      {/* DIÁLOGO DE CONFIRMAÇÃO EXPLÍCITA PARA SUBSTITUIÇÃO */}
      <AlertDialog open={showReplaceConfirmDialog} onOpenChange={setShowReplaceConfirmDialog}>
        <AlertDialogContent className="bg-card border-rose-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Confirmar Substituição de
              Registros?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Você marcou a opção de{' '}
              <strong className="text-rose-400">substituir registros existentes</strong>. Todos os
              registros atuais de RNC das empresas identificadas no arquivo serão excluídos
              permanentemente antes da importação.
              <br />
              <br />
              Esta ação não pode ser desfeita. Tem certeza de que deseja limpar a base e prosseguir
              com a nova carga de <strong>{parseResult?.totalRecords} RNCs</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeImport}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Sim, Limpar Base e Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
