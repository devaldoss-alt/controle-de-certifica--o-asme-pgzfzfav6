import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  ShieldAlert,
  TrendingUp,
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  X,
  Layers,
} from 'lucide-react'
import { useCompany } from '@/hooks/use-company'
import {
  RiskRegisterItem,
  RiskGrade,
  RISK_PROCESS_LIST,
  getRiskRegister,
  createRiskRegister,
  updateRiskRegister,
  deleteRiskRegister,
  calculateRiskLevelAndGrade,
} from '@/services/risks'
import { getCompanies, Company } from '@/services/companies'
import { RiskFormDialog } from '@/components/RiskFormDialog'
import { RiskMatrix5x5 } from '@/components/RiskMatrix5x5'

export default function RisksPage() {
  const { selectedCompanyId } = useCompany()

  const [risks, setRisks] = useState<RiskRegisterItem[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedProcess, setSelectedProcess] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Interactive matrix selection
  const [matrixFilter, setMatrixFilter] = useState<{ prob: number; imp: number } | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<RiskRegisterItem | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [comps, list] = await Promise.all([
        getCompanies(),
        getRiskRegister({
          companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
          process: selectedProcess !== 'all' ? selectedProcess : undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          grade: selectedGrade !== 'all' ? selectedGrade : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search,
        }),
      ])
      setCompanies(comps)
      setRisks(list)
    } catch (err) {
      console.error('Failed to load risks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId, selectedProcess, selectedType, selectedGrade, selectedStatus])

  const handleCellClick = (prob: number, imp: number) => {
    if (matrixFilter?.prob === prob && matrixFilter?.imp === imp) {
      setMatrixFilter(null) // toggle off
    } else {
      setMatrixFilter({ prob, imp })
    }
  }

  const handleSaveRisk = async (data: Partial<RiskRegisterItem>) => {
    if (editingRisk) {
      await updateRiskRegister(editingRisk.id, data)
    } else {
      await createRiskRegister(data)
    }
    await loadData()
  }

  const handleDeleteRisk = async (id: string) => {
    if (!confirm('Deseja excluir este registro de risco/oportunidade?')) return
    await deleteRiskRegister(id)
    await loadData()
  }

  // Filter items in list (including matrix cell click if active)
  const displayedRisks = risks.filter((r) => {
    if (matrixFilter && (r.probability !== matrixFilter.prob || r.impact !== matrixFilter.imp)) {
      return false
    }
    return true
  })

  // Indicators
  const criticalRisksOpen = risks.filter(
    (r) => r.type === 'Risco' && r.risk_grade === 'Crítico' && r.status === 'Ativo',
  ).length

  const highRisksOpen = risks.filter(
    (r) => r.type === 'Risco' && r.risk_grade === 'Alto' && r.status === 'Ativo',
  ).length

  const activeOpportunities = risks.filter(
    (r) => r.type === 'Oportunidade' && r.status === 'Ativo',
  ).length

  const implementedTreatments = risks.filter((r) => r.treatment_status === 'Implementado').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-primary" />
            Riscos e Oportunidades (ISO 9001 §6.1)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mapeamento sistemático de incertezas e melhorias nos 21 processos do SGQ, com matriz 5×5
            de probabilidade e impacto e planos de mitigação integrados.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingRisk(null)
            setDialogOpen(true)
          }}
          className="gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Risco / Oportunidade
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-rose-50/50 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Riscos Críticos em Aberto</span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-rose-700 mt-2">{criticalRisksOpen}</p>
          <p className="text-xs text-rose-600 mt-1">Exigem tratamento imediato</p>
        </Card>

        <Card className="p-4 bg-orange-50/50 border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-800">Riscos de Nível Alto</span>
            <ShieldAlert className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-black text-orange-700 mt-2">{highRisksOpen}</p>
          <p className="text-xs text-orange-600 mt-1">Acompanhamento contínuo</p>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Oportunidades Ativas</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-700 mt-2">{activeOpportunities}</p>
          <p className="text-xs text-blue-600 mt-1">Ganhos potenciais para o SGQ</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Tratamentos Concluídos</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-2">{implementedTreatments}</p>
          <p className="text-xs text-emerald-600 mt-1">Planos de ação implementados</p>
        </Card>
      </div>

      {/* Interactive 5x5 Matrix */}
      <RiskMatrix5x5
        risks={risks}
        onCellClick={handleCellClick}
        selectedProb={matrixFilter?.prob}
        selectedImp={matrixFilter?.imp}
      />

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-lg border">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground">Tipo:</span>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Risco">Risco</SelectItem>
                <SelectItem value="Oportunidade">Oportunidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground">Processo:</span>
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">Todos os 21 Processos</SelectItem>
                {RISK_PROCESS_LIST.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground">Classificação:</span>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground">Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, responsável ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="pl-8 text-xs h-8"
            />
          </div>

          <Button size="sm" variant="secondary" onClick={loadData} className="h-8 text-xs">
            Filtrar
          </Button>
        </div>

        {/* Matrix Active Filter Indicator */}
        {matrixFilter && (
          <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded text-xs text-primary">
            <span>
              Filtrando pela célula da Matriz: <strong>Probabilidade {matrixFilter.prob}</strong> ×{' '}
              <strong>Impacto {matrixFilter.imp}</strong> ({displayedRisks.length} registro(s))
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMatrixFilter(null)}
              className="h-6 px-2 text-xs text-primary hover:bg-primary/20"
            >
              <X className="w-3 h-3 mr-1" /> Limpar filtro da matriz
            </Button>
          </div>
        )}
      </div>

      {/* Risks Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Registro Consolidado de Riscos e Oportunidades ({displayedRisks.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {displayedRisks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Processo</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3 text-center">P × I</th>
                  <th className="p-3">Nível</th>
                  <th className="p-3">Plano de Tratamento</th>
                  <th className="p-3">Tratamento</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayedRisks.map((item) => {
                  const { level, grade, colorClass } = calculateRiskLevelAndGrade(
                    item.probability,
                    item.impact,
                  )

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={item.type === 'Risco' ? 'destructive' : 'default'}
                          className={`text-[10px] ${
                            item.type === 'Oportunidade' ? 'bg-blue-600 hover:bg-blue-700' : ''
                          }`}
                        >
                          {item.type}
                        </Badge>
                      </td>

                      <td className="p-3 font-semibold whitespace-nowrap">
                        {item.process}
                        {item.cause_category && (
                          <div className="text-[10px] text-muted-foreground font-normal">
                            {item.cause_category}
                          </div>
                        )}
                      </td>

                      <td className="p-3 max-w-sm">
                        <p className="text-foreground line-clamp-2">{item.description}</p>
                      </td>

                      <td className="p-3 text-center font-mono font-semibold whitespace-nowrap">
                        {item.probability} × {item.impact}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}
                        >
                          {level} — {grade}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs text-muted-foreground">
                        {item.treatment_plan ? (
                          <div>
                            <p className="text-foreground line-clamp-1">{item.treatment_plan}</p>
                            <span className="text-[10px]">
                              Resp: {item.treatment_responsible || '—'}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            item.treatment_status === 'Implementado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.treatment_status === 'Em andamento'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                          }
                        >
                          {item.treatment_status}
                        </Badge>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            item.status === 'Ativo'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>

                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingRisk(item)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700"
                          onClick={() => handleDeleteRisk(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <RiskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveRisk}
        initialData={editingRisk}
        companies={companies}
        selectedCompanyId={selectedCompanyId !== 'all' ? selectedCompanyId : undefined}
      />
    </div>
  )
}
