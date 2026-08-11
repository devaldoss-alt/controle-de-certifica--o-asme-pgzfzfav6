import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Loader2, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { reimportKoalaDocuments } from '@/services/koala-reimport'
import type { ImportResult } from '@/services/internal-documents'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Array<{ id: string; name: string; name_en?: string }>
  onComplete?: () => void
}

export function KoalaReimportDialog({ open, onOpenChange, companies, onComplete }: Props) {
  const [step, setStep] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const koalaCompany = companies.find(
    (c) =>
      c.name.toLowerCase().includes('koala') || (c.name_en || '').toLowerCase().includes('koala'),
  )

  const handleStart = async () => {
    if (!koalaCompany) {
      setError('Empresa Koala System não encontrada')
      setStep('error')
      return
    }

    setStep('processing')
    setError('')
    setProgress({ current: 0, total: 0 })

    try {
      const res = await reimportKoalaDocuments(koalaCompany.id, (current, total) => {
        setProgress({ current, total })
      })
      setResult(res)
      setStep('done')
      onComplete?.()
    } catch (e: any) {
      setError(e?.message || 'Erro na reimportação')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('idle')
    setProgress(null)
    setResult(null)
    setError('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="max-w-2xl bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Reimportar Documentos Koala System</DialogTitle>
        </DialogHeader>

        {step === 'idle' && (
          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Esta operação irá reimportar todos os documentos da planilha original do Koala
                  System (Lista Mestra de Documentos Internos).
                </p>
                <p>
                  Cada documento será atribuído à empresa{' '}
                  <strong className="text-white">Koala System</strong>, garantindo que PSC e Koala
                  System mantenham listas independentes.
                </p>
                {koalaCompany ? (
                  <p className="text-green-500">Empresa encontrada: {koalaCompany.name}</p>
                ) : (
                  <p className="text-rose-500">
                    Empresa Koala System não encontrada. Verifique se a empresa existe.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleStart}
                disabled={!koalaCompany}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Upload className="w-4 h-4 mr-2" /> Iniciar Reimportação
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress && progress.total > 0
                ? `Importando ${progress.current} de ${progress.total} documentos...`
                : 'Processando planilha...'}
            </div>
            {progress && progress.total > 0 && (
              <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {step === 'done' && result && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-white font-medium">
                  {result.success} documento(s) importado(s) com sucesso
                </p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-amber-500">{result.errors.length} linha(s) com erro</p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-white/10 rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-xs text-white/60">Linha</TableHead>
                      <TableHead className="text-xs text-white/60">Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((e, i) => (
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

        {step === 'error' && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={reset}
                className="border-white/10 text-muted-foreground"
              >
                Voltar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
