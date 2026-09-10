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
  Download,
  Info,
  Calendar,
} from 'lucide-react'
import { parseSpreadsheet, findHeaderRow, normalizeText } from '@/lib/spreadsheet-parser'
import {
  bulkImportTrainingPlan,
  type TrainingImportRow,
  type TrainingImportResult,
  type TrainingImportProgressCallback,
} from '@/services/trainings'

const FIELD_OPTIONS = [
  { value: 'action', label: 'AÇÃO *' },
  { value: 'periodicity', label: 'PERIODICIDADE' },
  { value: 'responsible', label: 'RESPONSÁVEL' },
  { value: 'target_audience', label: 'PÚBLICO-ALVO' },
  { value: 'origin', label: 'ORIGEM (INTERNO / EXTERNO)' },
  { value: 'type', label: 'TIPO' },
  { value: 'competence_form', label: 'FORMA DE PROVER COMPETÊNCIA' },
  { value: 'planned_date', label: 'DATA PREVISTA' },
  { value: 'realized_date', label: 'DATA REALIZADA' },
  { value: 'requires_effectiveness_eval', label: 'REQUER AVALIAÇÃO DE EFICÁCIA? (SIM/NÃO)' },
  { value: 'ch_hours', label: 'CH REALIZADA (h)' },
  { value: 'participants_count', label: 'QTD. PARTICIPANTES' },
  { value: 'notes', label: 'OBSERVAÇÕES' },
  { value: '_skip', label: '— Ignorar —' },
]

const FIELD_SYNONYMS: Record<string, string[]> = {
  action: [
    'acao',
    'ação',
    'treinamento',
    'curso',
    'atividade',
    'tema',
    'titulo',
    'nome',
    'descricao',
  ],
  periodicity: ['periodicidade', 'frequencia', 'freq', 'intervalo'],
  responsible: [
    'responsavel',
    'responsável',
    'instrutor',
    'ministrante',
    'responsavel pelo treinamento',
  ],
  target_audience: [
    'publico-alvo',
    'publico alvo',
    'publico',
    'setor',
    'participantes previstos',
    'audiencia',
  ],
  origin: ['origem', 'interno/externo', 'tipo origem'],
  type: ['tipo', 'categoria', 'classificacao', 'tipo de acao', 'tipo de ação'],
  competence_form: [
    'forma de prover competencia',
    'forma de prover competência',
    'competencia',
    'competência',
    'modalidade',
    'meio',
  ],
  planned_date: [
    'data prevista',
    'previsto',
    'data limite',
    'prazo previsto',
    'previsao',
    'previsão',
    'dias para realizacao',
    'dias para realização',
  ],
  realized_date: [
    'data realizada',
    'realizado',
    'data de realizacao',
    'data de realização',
    'conclusao',
  ],
  requires_effectiveness_eval: [
    'requer avaliacao de eficacia?',
    'requer avaliação de eficácia?',
    'requer avaliacao',
    'avaliacao de eficacia',
    'avaliação de eficácia',
    'eficacia',
    'eficácia',
  ],
  ch_hours: [
    'ch de treinamento',
    'ch realizada (h)',
    'ch realizada',
    'carga horaria',
    'carga horária',
    'ch (h)',
    'ch',
    'horas',
    'duracao',
  ],
  participants_count: [
    'qtd. participantes',
    'qtd participantes',
    'quantidade participantes',
    'participantes',
    'n participantes',
    'nº participantes',
    'headcount',
  ],
  notes: ['observacoes', 'observações', 'observacao', 'observação', 'obs', 'notas', 'comentarios'],
}

const DEFAULT_MAP_KEYS = [
  'action',
  'periodicity',
  'responsible',
  'target_audience',
  'origin',
  'type',
  'competence_form',
  'planned_date',
  'realized_date',
  'requires_effectiveness_eval',
  'ch_hours',
  'participants_count',
  'notes',
]

interface CompanyOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  companies: CompanyOption[]
  defaultCompanyId?: string
  defaultYear?: number
}

export function TrainingImportDialog({
  open,
  onOpenChange,
  onSuccess,
  companies,
  defaultCompanyId,
  defaultYear = 2026,
}: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<TrainingImportResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [destinationCompanyId, setDestinationCompanyId] = useState('')
  const [destinationYear, setDestinationYear] = useState<number>(defaultYear)
  const [companyError, setCompanyError] = useState('')

  useEffect(() => {
    if (open) {
      setDestinationCompanyId(
        defaultCompanyId && defaultCompanyId !== 'all' ? defaultCompanyId : '',
      )
      setDestinationYear(defaultYear || 2026)
      setCompanyError('')
    }
  }, [open, defaultCompanyId, defaultYear])

  const guessMapping = useCallback((hdrs: string[]) => {
    const normalized = hdrs.map((h) => normalizeText(h))
    const guess: Record<string, string> = {}
    const usedIndices = new Set<number>()

    for (const field of DEFAULT_MAP_KEYS) {
      const fieldOption = FIELD_OPTIONS.find((f) => f.value === field)
      const fieldLabel = normalizeText(fieldOption?.label || '')
      const synonyms = FIELD_SYNONYMS[field] || []

      // 1. Exact match with label or field name
      let foundIdx = normalized.findIndex(
        (h, i) => !usedIndices.has(i) && (h === field || h === fieldLabel),
      )

      // 2. Synonyms match
      if (foundIdx === -1) {
        for (const syn of synonyms) {
          foundIdx = normalized.findIndex(
            (h, i) =>
              !usedIndices.has(i) &&
              (h === syn ||
                (syn.length >= 3 && h.includes(syn)) ||
                (h.length >= 3 && syn.includes(h))),
          )
          if (foundIdx >= 0) break
        }
      }

      if (foundIdx >= 0) {
        guess[field] = String(foundIdx)
        usedIndices.add(foundIdx)
      } else {
        guess[field] = '_skip'
      }
    }

    return guess
  }, [])

  const handleFile = async (file: File) => {
    setError('')
    try {
      const data = await parseSpreadsheet(file)
      if (data.length < 1) {
        setError('Arquivo vazio ou sem dados legíveis.')
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
    if (!destinationCompanyId) {
      setCompanyError('Selecione a empresa proprietária do plano de treinamentos')
      return
    }

    if (mapping.action === '_skip') {
      setError('Mapeie ao menos a coluna de AÇÃO do treinamento para continuar.')
      return
    }

    setIsProcessing(true)
    setError('')
    setProgress({ current: 0, total: rows.length })

    try {
      const importRows: TrainingImportRow[] = rows.map((row) => {
        const obj: any = {}
        for (const [field, colIdx] of Object.entries(mapping)) {
          if (colIdx === '_skip') continue
          const rawVal = row[parseInt(colIdx, 10)] || ''
          const val = rawVal.trim()

          if (field === 'ch_hours' || field === 'participants_count') {
            const sanitized = val.replace(/\./g, '').replace(',', '.')
            const num = parseFloat(sanitized)
            obj[field] = isNaN(num) ? 0 : num
          } else {
            obj[field] = val
          }
        }

        // Se CH Total não foi preenchida ou calculada, calcular: CH Total = CH Realizada × Qtd. Participantes
        const ch =
          typeof obj.ch_hours === 'number' ? obj.ch_hours : parseFloat(obj.ch_hours || '0') || 0
        const qtd =
          typeof obj.participants_count === 'number'
            ? obj.participants_count
            : parseFloat(obj.participants_count || '0') || 0
        if (ch > 0 && qtd > 0) {
          obj.ch_total = Number((ch * qtd).toFixed(2))
        }

        return obj as TrainingImportRow
      })

      const onProgressCallback: TrainingImportProgressCallback = (current, total) => {
        setProgress({ current, total })
      }

      const res = await bulkImportTrainingPlan(
        importRows,
        destinationCompanyId,
        destinationYear,
        onProgressCallback,
      )

      setImportResult(res)
      setStep('result')
      if (res.success > 0) {
        onSuccess?.()
      }
    } catch (e: any) {
      setError(e?.message || 'Erro durante a importação do plano.')
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      'AÇÃO;PERIODICIDADE;RESPONSÁVEL;PÚBLICO-ALVO;ORIGEM;TIPO;FORMA DE PROVER COMPETÊNCIA;DATA PREVISTA;DATA REALIZADA;REQUER AVALIAÇÃO DE EFICÁCIA?;CH REALIZADA (h);QTD. PARTICIPANTES;OBSERVAÇÕES\n' +
      'INTEGRAÇÃO DE SMS PARA NOVOS COLABORADORES;Mensal;Fabiana;Novos Colaboradores;Interno;SMS;Treinamento;15/01/2026;14/01/2026;Sim;4;8;Integração admissional obrigatória\n' +
      'QUALIFICAÇÃO EM PROCEDIMENTO DE SOLDAGEM ASME IX;Pontual;Devaldo;Soldadores;Interno;Qualificação Pessoal-Sensibilização;Treinamento;10/02/2026;;Sim;8;5;Avaliação via radiografia de cupons\n' +
      'NR-35 TRABALHO EM ALTURA - RECICLAGEM;Anual;SENAC;Produção;Externo;SMS;Empresa Parceira;01/03/2026;;Sim;8;12;Treinamento prático e teórico'

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FSGQ_7.2-1_PLANO_DE_TREINAMENTO_REV03_${destinationYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const reset = () => {
    setStep('upload')
    setHeaders([])
    setRows([])
    setMapping({})
    setImportResult(null)
    setError('')
    setProgress(null)
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
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Importar Formulário FSGQ 7.2-1 (Plano de Treinamento Rev.03)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-xs border-white/10 hover:bg-white/10 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Modelo CSV FSGQ 7.2-1
            </Button>
          </DialogTitle>
        </DialogHeader>

        {step !== 'result' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-3 rounded-md border border-white/5">
            <div className="space-y-1.5">
              <Label className="text-white/80 flex items-center gap-1.5 text-xs font-medium">
                <Building2 className="w-4 h-4 text-primary" /> Empresa Proprietária do Plano *
              </Label>
              <Select
                value={destinationCompanyId}
                onValueChange={(v) => {
                  setDestinationCompanyId(v)
                  setCompanyError('')
                }}
              >
                <SelectTrigger
                  className={`bg-black/30 border-white/10 text-white ${
                    companyError ? 'border-rose-500 ring-1 ring-rose-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Selecione a empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companyError && <p className="text-xs text-rose-400 font-medium">{companyError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/80 flex items-center gap-1.5 text-xs font-medium">
                <Calendar className="w-4 h-4 text-primary" /> Ano de Vigência do Plano
              </Label>
              <Select
                value={String(destinationYear)}
                onValueChange={(v) => setDestinationYear(parseInt(v, 10))}
              >
                <SelectTrigger className="bg-black/30 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Ano {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-primary">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-medium">Envie a planilha do Plano FSGQ 7.2-1</p>
              <p className="text-muted-foreground text-sm mt-1">
                Suporta arquivos .xlsx ou .csv com todas as colunas do formulário oficial.
                Mapeamento tolerante a acentos e ordem.
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg text-left text-xs text-muted-foreground max-w-lg mx-auto space-y-1.5 border border-white/5">
              <div className="flex items-center gap-1.5 text-white/90 font-medium">
                <Info className="w-4 h-4 text-blue-400" />
                Regras de importação FSGQ 7.2-1:
              </div>
              <p>
                • <strong>Trava de duplicidade:</strong> Ações com mesmo Nome + Empresa + Ano são
                atualizadas automaticamente, sem duplicar linhas.
              </p>
              <p>
                • <strong>Cálculos automáticos:</strong> CH Total = CH Realizada × Qtd.
                Participantes; Avaliação de Eficácia = Data Realizada + 60 dias.
              </p>
              <p>
                • <strong>Formato FSGQ 7.2-1:</strong> Todas as colunas do formulário da qualidade
                são preservadas e importadas.
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id="training-file-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <Button
              onClick={() => document.getElementById('training-file-upload')?.click()}
              className="gap-2 bg-primary text-white"
            >
              <Upload className="w-4 h-4" /> Selecionar Arquivo (.xlsx / .csv)
            </Button>

            {error && (
              <div className="text-rose-400 text-sm flex items-center justify-center gap-1.5 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Mapeamento das Colunas do Formulário
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verifique se as colunas da sua planilha foram identificadas corretamente com os
                campos do FSGQ 7.2-1.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
              {DEFAULT_MAP_KEYS.map((field) => {
                const fieldDef = FIELD_OPTIONS.find((f) => f.value === field)
                return (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-2 p-2 rounded bg-white/5 border border-white/5"
                  >
                    <Label className="text-xs text-white/90 truncate flex-1">
                      {fieldDef?.label}
                    </Label>
                    <Select
                      value={mapping[field] || '_skip'}
                      onValueChange={(val) => setMapping((prev) => ({ ...prev, [field]: val }))}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs bg-black/40 border-white/10 text-white">
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
                )
              })}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white mb-2">
                Pré-visualização dos Dados ({rows.length} ações encontradas)
              </h4>
              <div className="border border-white/10 rounded-md overflow-x-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-xs text-white/70">#</TableHead>
                      <TableHead className="text-xs text-white/70">AÇÃO</TableHead>
                      <TableHead className="text-xs text-white/70">PERIODICIDADE</TableHead>
                      <TableHead className="text-xs text-white/70">RESPONSÁVEL</TableHead>
                      <TableHead className="text-xs text-white/70">PÚBLICO-ALVO</TableHead>
                      <TableHead className="text-xs text-white/70">PREVISÃO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((r, i) => {
                      const actionCol =
                        mapping.action !== '_skip' ? parseInt(mapping.action, 10) : -1
                      const perCol =
                        mapping.periodicity !== '_skip' ? parseInt(mapping.periodicity, 10) : -1
                      const respCol =
                        mapping.responsible !== '_skip' ? parseInt(mapping.responsible, 10) : -1
                      const audCol =
                        mapping.target_audience !== '_skip'
                          ? parseInt(mapping.target_audience, 10)
                          : -1
                      const planCol =
                        mapping.planned_date !== '_skip' ? parseInt(mapping.planned_date, 10) : -1

                      return (
                        <TableRow key={i} className="border-white/5 text-xs">
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-white font-medium max-w-xs truncate">
                            {actionCol >= 0 ? r[actionCol] : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {perCol >= 0 ? r[perCol] : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {respCol >= 0 ? r[respCol] : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {audCol >= 0 ? r[audCol] : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {planCol >= 0 ? r[planCol] : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {error && (
              <div className="text-rose-400 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={reset}
                disabled={isProcessing}
                className="border-white/10"
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                className="bg-primary text-white gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando... {progress ? `(${progress.current}/${progress.total})` : ''}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar e Importar ({rows.length} ações)
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Importação Concluída com Sucesso</h3>
              <p className="text-xs text-muted-foreground mt-1">
                O plano anual da empresa foi sincronizado conforme o FSGQ 7.2-1.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-white">{importResult.success}</span>
                <p className="text-[11px] text-muted-foreground">Processadas</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-emerald-400">{importResult.created}</span>
                <p className="text-[11px] text-muted-foreground">Novas Criadas</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-blue-400">{importResult.updated}</span>
                <p className="text-[11px] text-muted-foreground">Atualizadas (Sem duplicação)</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="max-w-md mx-auto text-left bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                <p className="text-xs text-rose-400 font-semibold mb-1">
                  Alertas em {importResult.errors.length} linha(s):
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-rose-300">
                  {importResult.errors.map((e, i) => (
                    <div key={i}>
                      Linha {e.row}: {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="justify-center sm:justify-center">
              <Button onClick={() => onOpenChange(false)} className="bg-primary text-white">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
