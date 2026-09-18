import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskRegisterItem, calculateRiskLevelAndGrade } from '@/services/risks'

interface RiskMatrix5x5Props {
  risks: RiskRegisterItem[]
  onCellClick?: (prob: number, imp: number) => void
  selectedProb?: number | null
  selectedImp?: number | null
}

export const RiskMatrix5x5: React.FC<RiskMatrix5x5Props> = ({
  risks,
  onCellClick,
  selectedProb,
  selectedImp,
}) => {
  // Probabilities: 5 (top) down to 1 (bottom)
  const probabilities = [5, 4, 3, 2, 1]
  // Impacts: 1 (left) to 5 (right)
  const impacts = [1, 2, 3, 4, 5]

  const getCellRisks = (prob: number, imp: number) => {
    return risks.filter((r) => r.probability === prob && r.impact === imp)
  }

  return (
    <Card className="border shadow-xs">
      <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">
            Matriz Visual 5×5 de Riscos e Oportunidades (ISO 9001 §6.1)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Eixo Vertical: Probabilidade (1 a 5) × Eixo Horizontal: Impacto (1 a 5). Clique em
            qualquer célula para filtrar os registros.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Baixo (1-4)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Médio (5-9)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Alto (10-15)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-muted-foreground">Crítico (16-25)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 overflow-x-auto">
        <div className="min-w-[620px]">
          {/* Top impact header */}
          <div className="grid grid-cols-6 gap-1 text-center text-xs font-semibold mb-1">
            <div className="text-muted-foreground uppercase text-[10px] flex items-center justify-center">
              Prob \ Impacto
            </div>
            <div>1 (Insignificante)</div>
            <div>2 (Baixo)</div>
            <div>3 (Moderado)</div>
            <div>4 (Alto)</div>
            <div>5 (Crítico)</div>
          </div>

          {/* Matrix Rows (Probabilities 5 to 1) */}
          <div className="space-y-1">
            {probabilities.map((prob) => (
              <div key={prob} className="grid grid-cols-6 gap-1 h-16">
                {/* Y-axis label */}
                <div className="flex flex-col items-center justify-center bg-muted/30 rounded border text-xs font-semibold text-muted-foreground">
                  <span className="text-foreground font-bold">{prob}</span>
                  <span className="text-[10px] truncate">
                    {prob === 5
                      ? 'Muito Provável'
                      : prob === 4
                        ? 'Provável'
                        : prob === 3
                          ? 'Possível'
                          : prob === 2
                            ? 'Rara'
                            : 'Muito Rara'}
                  </span>
                </div>

                {/* 5 Impact Cells */}
                {impacts.map((imp) => {
                  const cellRisks = getCellRisks(prob, imp)
                  const { level, grade } = calculateRiskLevelAndGrade(prob, imp)
                  const isSelected = selectedProb === prob && selectedImp === imp

                  // Color gradient by grade
                  let cellBg =
                    'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70 text-emerald-900'
                  let badgeBg = 'bg-emerald-600'
                  if (grade === 'Médio') {
                    cellBg = 'bg-amber-50 border-amber-200 hover:bg-amber-100/70 text-amber-900'
                    badgeBg = 'bg-amber-600'
                  } else if (grade === 'Alto') {
                    cellBg = 'bg-orange-50 border-orange-200 hover:bg-orange-100/70 text-orange-900'
                    badgeBg = 'bg-orange-600'
                  } else if (grade === 'Crítico') {
                    cellBg = 'bg-rose-50 border-rose-300 hover:bg-rose-100/70 text-rose-900'
                    badgeBg = 'bg-rose-600'
                  }

                  const riskCount = cellRisks.filter((r) => r.type === 'Risco').length
                  const oppCount = cellRisks.filter((r) => r.type === 'Oportunidade').length

                  return (
                    <div
                      key={imp}
                      onClick={() => onCellClick?.(prob, imp)}
                      className={`relative p-1.5 rounded border flex flex-col justify-between cursor-pointer transition-all ${cellBg} ${
                        isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-md scale-[1.02]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold opacity-70">{level}</span>
                        <span className="text-[9px] uppercase font-semibold opacity-60">
                          {grade}
                        </span>
                      </div>

                      {/* Counts */}
                      {cellRisks.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {riskCount > 0 && (
                            <span
                              className={`text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full ${badgeBg}`}
                              title={`${riskCount} Risco(s)`}
                            >
                              R: {riskCount}
                            </span>
                          )}
                          {oppCount > 0 && (
                            <span
                              className="bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full"
                              title={`${oppCount} Oportunidade(s)`}
                            >
                              O: {oppCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-muted-foreground/40 font-mono">
                          —
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
