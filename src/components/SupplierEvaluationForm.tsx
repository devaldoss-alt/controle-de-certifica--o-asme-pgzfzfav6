import { useState } from 'react'
import type { SupplierEvaluationQuestion } from '@/services/suppliers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Calculator, Save } from 'lucide-react'

interface SupplierEvaluationFormDialogProps {
  evaluationType: 'Inicial (FSGQ 8.4-2)' | 'Reavaliação (FSGQ 8.4-2.1)'
  supplierName: string
  supplierId: string
  initialQuestions: SupplierEvaluationQuestion[]
  onSave: (data: {
    evaluatorName: string
    observations: string
    actionPlan: string
    questions: SupplierEvaluationQuestion[]
  }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  incfCurrent?: number
}

export function SupplierEvaluationForm({
  evaluationType,
  supplierName,
  initialQuestions,
  onSave,
  onCancel,
  isSubmitting = false,
  incfCurrent,
}: SupplierEvaluationFormDialogProps) {
  const [evaluatorName, setEvaluatorName] = useState('Gestor da Qualidade')
  const [observations, setObservations] = useState('')
  const [actionPlan, setActionPlan] = useState('')
  const [questions, setQuestions] = useState<SupplierEvaluationQuestion[]>(initialQuestions)

  const handleScoreChange = (qId: string, score: number) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, score } : q)))
  }

  const handleNotesChange = (qId: string, notes: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, notes } : q)))
  }

  const totalScore = questions.reduce((acc, q) => acc + (q.score || 0), 0)
  const isApproved = totalScore >= 6.0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      evaluatorName,
      observations,
      actionPlan,
      questions,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs mb-1">
              {evaluationType.includes('Inicial')
                ? 'FSGQ 8.4-2 • Avaliação Inicial'
                : 'FSGQ 8.4-2.1 • Reavaliação Bienal'}
            </Badge>
            <h3 className="text-base font-bold text-white">
              Fornecedor: <span className="text-primary">{supplierName}</span>
            </h3>
          </div>

          {incfCurrent !== undefined && (
            <div
              className={`px-3 py-1.5 rounded-lg border text-right text-xs ${
                incfCurrent >= 30
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              }`}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                INCF Atual Consumido
              </div>
              <div className="text-base font-black font-mono">
                {incfCurrent}% {incfCurrent >= 30 ? '(Alerta ≥ 30%)' : '(Aceitável < 30%)'}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <Label className="text-xs text-muted-foreground">
              Nome do Avaliador / Responsável *
            </Label>
            <Input
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              required
              className="bg-black/40 border-white/10 text-white h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Regra de Pontuação (PSGQ 8.4 item 5.3 d)
            </Label>
            <div className="text-xs text-muted-foreground pt-1">
              Cada resposta satisfatória = <strong>2 pontos</strong>. Parcial ={' '}
              <strong>1 ponto</strong>. Não atende = <strong>0</strong>. Aprovação exige nota final{' '}
              <strong>≥ 6,0</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Itens de Avaliação do Questionário ({questions.length} perguntas)
        </h4>

        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="p-4 rounded-xl bg-card border border-white/10 space-y-3 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  {idx + 1}. {q.section}
                </span>
                <p className="text-sm font-medium text-white">{q.question}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-black/40 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => handleScoreChange(q.id, 2)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    q.score === 2
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  title="Atende plenamente (2 pontos)"
                >
                  SIM (2.0)
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(q.id, 1)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    q.score === 1
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  title="Atende parcialmente com ressalvas (1 ponto)"
                >
                  PARCIAL (1.0)
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(q.id, 0)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    q.score === 0
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  title="Não atende (0 pontos)"
                >
                  NÃO (0.0)
                </button>
              </div>
            </div>

            <div>
              <Input
                placeholder="Evidências ou observações sobre este critério..."
                value={q.notes || ''}
                onChange={(e) => handleNotesChange(q.id, e.target.value)}
                className="bg-black/30 border-white/5 text-xs text-white h-7 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Score Summary Box */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4 ${
          isApproved
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-muted-foreground">
              Resultado Calculado
            </div>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              Nota Final:{' '}
              <span
                className={isApproved ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}
              >
                {totalScore.toFixed(1)} / 10.0
              </span>
              <Badge
                className={
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }
              >
                {isApproved ? 'QUALIFICADO (≥ 6,0)' : 'NÃO QUALIFICADO (< 6,0)'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          {isApproved ? (
            <p className="text-emerald-300">
              Fornecedor apto a integrar a Lista de Fornecedores Qualificados (FSGQ 8.4-4).
            </p>
          ) : (
            <p className="text-rose-300">
              Nota abaixo da meta mínima de 6,0 pontos estipulada pelo PSGQ 8.4.
            </p>
          )}
        </div>
      </div>

      {/* Observations & Action Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Observações Gerais / Evidências Analisadas
          </Label>
          <Textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex: Apresentou laudos de conformidade, histórico sem apontamentos graves..."
            className="bg-black/30 border-white/10 text-white text-xs min-h-[80px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Plano de Ação / Recomendações (se reprovado ou com ressalvas)
          </Label>
          <Textarea
            value={actionPlan}
            onChange={(e) => setActionPlan(e.target.value)}
            placeholder="Ex: Enviar notificação formal, solicitar plano de calibração atualizado..."
            className="bg-black/30 border-white/10 text-white text-xs min-h-[80px]"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5"
        >
          <Save className="w-4 h-4" />{' '}
          {isSubmitting ? 'Gravando Avaliação...' : 'Salvar Avaliação & Atualizar Status'}
        </Button>
      </div>
    </form>
  )
}
