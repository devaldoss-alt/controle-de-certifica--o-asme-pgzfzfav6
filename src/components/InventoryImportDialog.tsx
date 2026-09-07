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
} from 'lucide-react'
import { parseSpreadsheet, findHeaderRow, normalizeText } from '@/lib/spreadsheet-parser'
import {
  bulkImportInventory,
  type InventoryImportRow,
  type InventoryImportResult,
  type InventoryImportProgressCallback,
} from '@/services/inventory'

const FIELD_OPTIONS = [
  { value: 'description', label: 'DESCRIÇÃO / PRODUTO *' },
  { value: 'category', label: 'CATEGORIA' },
  { value: 'unit', label: 'UNIDADE (KG, UN, L...)' },
  { value: 'quantity', label: 'QUANTIDADE / SALDO' },
  { value: 'unit_price', label: 'VALOR UNITÁRIO' },
  { value: 'minimum_stock', label: 'ESTOQUE MÍNIMO' },
  { value: 'location', label: 'LOCALIZAÇÃO' },
  { value: 'requires_cq_inspection', label: 'REQUER INSPEÇÃO CQ' },
  { value: 'is_consigned', label: 'CONSIGNADO (SIM/NÃO)' },
  { value: 'supplier', label: 'FORNECEDOR' },
  { value: 'is_controlled', label: 'ITEM CONTROLADO' },
  { value: 'notes', label: 'OBSERVAÇÕES' },
  { value: '_skip', label: '— Ignorar —' },
]

const FIELD_SYNONYMS: Record<string, string[]> = {
  description: [
    'descricao',
    'descriçao',
    'produto',
    'material',
    'item',
    'discriminacao',
    'nome',
    'especificacao',
  ],
  category: ['categoria', 'tipo', 'grupo', 'familia', 'classe'],
  unit: ['unidade', 'und', 'un', 'unid', 'medida', 'u.m.'],
  quantity: [
    'quantidade',
    'saldo',
    'qtd',
    'quantidade atual',
    'saldo atual',
    'estoque',
    'estoque atual',
    'quant',
  ],
  unit_price: [
    'valor unitario',
    'valor unit',
    'preco unitario',
    'preco',
    'custo',
    'vl unit',
    'vlr unitario',
  ],
  minimum_stock: ['estoque minimo', 'minimo', 'est min', 'estoque min', 'min'],
  location: ['localizacao', 'local', 'almoxarifado', 'deposito', 'posicao', 'box'],
  requires_cq_inspection: [
    'requer inspecao cq',
    'inspecao cq',
    'inspecao',
    'requer cq',
    'cq',
    'inspecao qualidade',
  ],
  is_consigned: ['consignado', 'item consignado', 'consignacao'],
  supplier: ['fornecedor', 'fabricante', 'origem', 'marca'],
  is_controlled: ['controlado', 'item controlado', 'policia civil', 'exercito', 'pf'],
  notes: ['observacoes', 'observacao', 'obs', 'detalhes', 'nota'],
}

const DEFAULT_MAP_KEYS = [
  'description',
  'category',
  'unit',
  'quantity',
  'unit_price',
  'minimum_stock',
  'location',
  'requires_cq_inspection',
  'is_consigned',
  'supplier',
  'is_controlled',
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
}

export function InventoryImportDialog({
  open,
  onOpenChange,
  onSuccess,
  companies,
  defaultCompanyId,
}: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<InventoryImportResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [destinationCompanyId, setDestinationCompanyId] = useState('')
  const [companyError, setCompanyError] = useState('')

  useEffect(() => {
    if (open) {
      setDestinationCompanyId(
        defaultCompanyId && defaultCompanyId !== 'all' ? defaultCompanyId : '',
      )
      setCompanyError('')
    }
  }, [open, defaultCompanyId])

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
      setCompanyError('Selecione a empresa de destino do estoque')
      return
    }

    if (mapping.description === '_skip') {
      setError('Mapeie ao menos a coluna de Descrição do produto para continuar.')
      return
    }

    setIsProcessing(true)
    setError('')
    setProgress({ current: 0, total: rows.length })

    const targetCompany = companies.find((c) => c.id === destinationCompanyId)
    const targetCompanyName = targetCompany ? targetCompany.name : 'Empresa'

    try {
      const importRows: InventoryImportRow[] = rows.map((row) => {
        const obj: any = {}
        for (const [field, colIdx] of Object.entries(mapping)) {
          if (colIdx === '_skip') continue
          const rawVal = row[parseInt(colIdx, 10)] || ''
          const val = rawVal.trim()

          if (field === 'quantity' || field === 'unit_price' || field === 'minimum_stock') {
            const sanitized = val.replace(/\./g, '').replace(',', '.')
            const num = parseFloat(sanitized)
            obj[field] = isNaN(num) ? 0 : num
          } else {
            obj[field] = val
          }
        }
        return obj as InventoryImportRow
      })

      const onProgressCallback: InventoryImportProgressCallback = (current, total) => {
        setProgress({ current, total })
      }

      const res = await bulkImportInventory(
        importRows,
        destinationCompanyId,
        targetCompanyName,
        onProgressCallback,
      )

      setImportResult(res)
      setStep('result')
      if (res.success > 0) {
        onSuccess?.()
      }
    } catch (e: any) {
      setError(e?.message || 'Erro durante a importação do estoque.')
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      'Descrição;Categoria;Unidade;Quantidade;Valor Unitário;Estoque Mínimo;Localização;Requer Inspeção CQ;Consignado;Fornecedor;Item Controlado;Observações\n' +
      'Chapa Aço Carbono SA-516 Gr 70;Insumo;UN;10;1850.00;5;Almoxarifado;Sim;Não;Usiminas;Não;Rastrear corrida\n' +
      'Acetona P.A. 1000ml;Consumível;L;15;65.00;4;Almoxarifado;Não;Não;Química do Vale;Sim;Controlado PF\n' +
      'Cilindro Argônio 10m3;Gás-Cilindro;UN;6;420.00;2;Área Externa;Sim;Sim;White Martins;Não;Consignado White Martins'

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_almoxarifado.csv')
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
            <span>Importar Planilha de Estoque (Almoxarifado)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-xs border-white/10 hover:bg-white/10 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Modelo CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        {step !== 'result' && (
          <div className="space-y-2 bg-black/20 p-3 rounded-md border border-white/5">
            <Label className="text-white/80 flex items-center gap-1.5 text-sm font-medium">
              <Building2 className="w-4 h-4 text-primary" /> Empresa do Estoque *
            </Label>
            <p className="text-xs text-muted-foreground">
              O estoque é rigorosamente separado por empresa (PSC, KS, GENTI).
            </p>
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
                <SelectValue placeholder="Selecione a empresa para atribuir os itens..." />
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
        )}

        {step === 'upload' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-primary">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-medium">Envie a planilha do estoque atual</p>
              <p className="text-muted-foreground text-sm mt-1">
                Suporta arquivos .xlsx ou .csv com qualquer arranjo de colunas. O mapeamento é
                flexível.
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg text-left text-xs text-muted-foreground max-w-lg mx-auto space-y-1.5 border border-white/5">
              <div className="flex items-center gap-1.5 text-white/90 font-medium">
                <Info className="w-4 h-4 text-blue-400" />
                Como funciona a importação:
              </div>
              <p>
                • <strong>Trava de duplicidade:</strong> Itens com a mesma Descrição na empresa são
                atualizados, sem duplicar.
              </p>
              <p>
                • <strong>Saldo inicial:</strong> Gera automaticamente o movimento de histórico
                "Saldo Inicial" para cada item.
              </p>
              <p>
                • <strong>Código rastreável:</strong> Novos itens recebem código único no padrão da
                empresa (ex: PSC-EST-000123).
              </p>
            </div>

            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="import-inventory-file"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button
              onClick={() => document.getElementById('import-inventory-file')?.click()}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo da Planilha
            </Button>
            {error && <p className="text-sm text-rose-400 mt-2">{error}</p>}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mapeamento flexível de colunas detectado no arquivo ({rows.length} itens
                encontrados):
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-black/20 p-3 rounded-md border border-white/5">
              {DEFAULT_MAP_KEYS.map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs text-white/70 block truncate">
                    {FIELD_OPTIONS.find((f) => f.value === field)?.label}
                  </Label>
                  <Select
                    value={mapping[field] || '_skip'}
                    onValueChange={(v) => setMapping((p) => ({ ...p, [field]: v }))}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 text-white text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">— Ignorar —</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {h} (Col {i + 1})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-white/60 mb-1.5">
                Pré-visualização dos primeiros registros ({Math.min(rows.length, 10)} de{' '}
                {rows.length}):
              </p>
              <div className="border border-white/10 rounded-md overflow-hidden max-h-56 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/5">
                      {headers.map((h, i) => (
                        <TableHead key={i} className="text-xs text-white/70">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i} className="border-white/5">
                        {headers.map((_, j) => (
                          <TableCell key={j} className="text-xs text-white/80 py-1.5 px-2">
                            {row[j] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {isProcessing && progress && (
              <div className="flex items-center gap-2 text-sm text-white/80 p-2 bg-primary/10 rounded border border-primary/20">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Processando item {progress.current} de {progress.total}...
              </div>
            )}

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={reset}
                disabled={isProcessing}
                className="border-white/10 text-muted-foreground"
              >
                Trocar Arquivo
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Importação de {rows.length} Item(ns)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              {importResult.success > 0 ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              ) : (
                <AlertCircle className="w-9 h-9 text-rose-500" />
              )}
              <div>
                <p className="text-white font-medium text-base">
                  {importResult.success > 0
                    ? `Importação concluída com sucesso!`
                    : 'Nenhum item pôde ser importado'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Novos cadastrados:{' '}
                  <span className="text-white font-medium">{importResult.created}</span> |
                  Atualizados:{' '}
                  <span className="text-white font-medium">{importResult.updated}</span>
                  {importResult.errors.length > 0 &&
                    ` | Linhas com pendência: ${importResult.errors.length}`}
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="max-h-56 overflow-y-auto border border-white/10 rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-xs text-white/60">Linha</TableHead>
                      <TableHead className="text-xs text-white/60">Motivo / Erro</TableHead>
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
                Concluir e Ver Estoque
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
