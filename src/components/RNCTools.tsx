import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  HelpCircle,
  Plus,
  Trash2,
  Workflow,
  Network,
  Calculator,
  Upload,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import type { FiveWhyItem, IshikawaData } from '@/services/rnc'

interface FiveWhysProps {
  whys: FiveWhyItem[]
  onChange: (whys: FiveWhyItem[]) => void
}

export function FiveWhysEditor({ whys, onChange }: FiveWhysProps) {
  const addWhy = () => {
    if (whys.length >= 7) return
    const nextNum = whys.length + 1
    onChange([
      ...whys,
      {
        why: `${nextNum}º Por quê: Por que o desvio ocorreu?`,
        answer: '',
      },
    ])
  }

  const removeWhy = (index: number) => {
    onChange(whys.filter((_, i) => i !== index))
  }

  const updateWhy = (index: number, field: 'why' | 'answer', value: string) => {
    const updated = [...whys]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/20 pb-2">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-amber-200">
            Ferramenta dos 5 Por Quês (Aba Metodologia FSGQ)
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">
            {whys.length} etapas registradas
          </Badge>
          {whys.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWhy}
              className="h-7 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar Por Quê
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {whys.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-black/30 p-2.5 rounded border border-white/5"
          >
            <div className="w-8 h-8 shrink-0 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
              {idx + 1}º
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <Input
                value={item.why}
                onChange={(e) => updateWhy(idx, 'why', e.target.value)}
                placeholder={`Pergunta do ${idx + 1}º Por Quê...`}
                className="bg-black/40 border-white/10 text-white text-xs h-8"
              />
              <Input
                value={item.answer}
                onChange={(e) => updateWhy(idx, 'answer', e.target.value)}
                placeholder={`Resposta explicativa (Fato gerador)...`}
                className="bg-black/60 border-amber-500/20 text-amber-100 text-xs h-8 font-medium"
              />
            </div>
            {whys.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeWhy(idx)}
                className="text-white/40 hover:text-rose-400 h-8 w-8 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {whys.length >= 3 && whys[whys.length - 1].answer && (
        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-bold">Causa Raiz Fundamental deduzida:</span>{' '}
            {whys[whys.length - 1].answer}
          </div>
        </div>
      )}
    </div>
  )
}

interface IshikawaProps {
  data: IshikawaData
  onChange: (data: IshikawaData) => void
}

const ISHIKAWA_BRANCHES = [
  {
    key: 'metodo',
    label: 'Método / Procedimento',
    placeholder: 'Instruções desatualizadas, falta de POP...',
  },
  {
    key: 'maquina',
    label: 'Máquina / Equipamento',
    placeholder: 'Falha de manutenção, máquina descalibrada...',
  },
  {
    key: 'mao_de_obra',
    label: 'Mão de Obra / Pessoas',
    placeholder: 'Falta de treinamento, sobrecarga, erro humano...',
  },
  {
    key: 'material',
    label: 'Material / Matéria-Prima',
    placeholder: 'Lote defeituoso, certificado não conforme...',
  },
  {
    key: 'meio_ambiente',
    label: 'Meio Ambiente / Espaço',
    placeholder: 'Temperatura, iluminação inadequada, ruído...',
  },
  {
    key: 'medicao',
    label: 'Medição / Instrumento',
    placeholder: 'Paquímetro descalibrado, método de aferição...',
  },
] as const

export function IshikawaDiagramEditor({ data, onChange }: IshikawaProps) {
  const [newEntries, setNewEntries] = useState<Record<string, string>>({})

  const handleAdd = (branch: keyof IshikawaData) => {
    const text = (newEntries[branch] || '').trim()
    if (!text) return
    const current = data[branch] || []
    onChange({
      ...data,
      [branch]: [...current, text],
    })
    setNewEntries({ ...newEntries, [branch]: '' })
  }

  const handleRemove = (branch: keyof IshikawaData, index: number) => {
    const current = data[branch] || []
    onChange({
      ...data,
      [branch]: current.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-blue-500/20 pb-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-blue-400" />
          <h4 className="text-sm font-semibold text-blue-200">
            Diagrama de Causa e Efeito (Ishikawa 6M)
          </h4>
        </div>
        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
          Aba Ishikawa da Planilha FSGQ
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ISHIKAWA_BRANCHES.map((b) => {
          const list = data[b.key] || []
          return (
            <div
              key={b.key}
              className="bg-black/40 border border-white/10 rounded p-3 flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-300">{b.label}</span>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-white/60">
                    {list.length}
                  </Badge>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto mb-2 pr-1">
                  {list.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-white/5 border border-white/5 p-1.5 rounded flex items-center justify-between gap-1 text-white/90"
                    >
                      <span className="truncate">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(b.key, idx)}
                        className="text-white/40 hover:text-rose-400 shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <span className="text-[11px] text-muted-foreground italic">
                      Nenhuma causa identificada
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <Input
                  value={newEntries[b.key] || ''}
                  onChange={(e) => setNewEntries({ ...newEntries, [b.key]: e.target.value })}
                  placeholder={b.placeholder}
                  className="h-7 text-xs bg-black/60 border-white/10 text-white flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAdd(b.key)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdd(b.key)}
                  className="h-7 px-2 border-white/10 text-white/80 hover:bg-white/10"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface CostCalculatorProps {
  rawMaterial: number
  supplies: number
  services: number
  onChange: (costs: { rawMaterial: number; supplies: number; services: number }) => void
}

export function CostOfQualityCalculator({
  rawMaterial,
  supplies,
  services,
  onChange,
}: CostCalculatorProps) {
  const total = (rawMaterial || 0) + (supplies || 0) + (services || 0)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  return (
    <div className="p-3.5 bg-black/30 border border-white/10 rounded-lg space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-emerald-400" />
          <Label className="text-xs font-semibold text-white uppercase tracking-wider">
            Custo da Não Qualidade (Cálculo Automático FSGQ 8.7-2)
          </Label>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground mr-2">Custo Total:</span>
          <span className="text-sm font-bold font-mono text-emerald-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[11px] text-white/70 block mb-1">Matéria-Prima Afetada (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rawMaterial || ''}
            onChange={(e) =>
              onChange({
                rawMaterial: parseFloat(e.target.value) || 0,
                supplies,
                services,
              })
            }
            placeholder="0,00"
            className="bg-black/20 border-white/10 text-white text-xs h-8 font-mono"
          />
        </div>

        <div>
          <Label className="text-[11px] text-white/70 block mb-1">Insumos / Consumíveis (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={supplies || ''}
            onChange={(e) =>
              onChange({
                rawMaterial,
                supplies: parseFloat(e.target.value) || 0,
                services,
              })
            }
            placeholder="0,00"
            className="bg-black/20 border-white/10 text-white text-xs h-8 font-mono"
          />
        </div>

        <div>
          <Label className="text-[11px] text-white/70 block mb-1">Serviços / Terceiros (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={services || ''}
            onChange={(e) =>
              onChange({
                rawMaterial,
                supplies,
                services: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0,00"
            className="bg-black/20 border-white/10 text-white text-xs h-8 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
