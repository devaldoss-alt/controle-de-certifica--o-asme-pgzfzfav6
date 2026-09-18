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
  Presentation,
  Plus,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Printer,
  Edit,
  Trash2,
  Paperclip,
  Sparkles,
  FileCheck,
  ChevronRight,
  ListOrdered,
} from 'lucide-react'
import { useCompany } from '@/hooks/use-company'
import {
  ManagementReviewComputed,
  ReviewStatus,
  getManagementReviews,
  createManagementReview,
  updateManagementReview,
  deleteManagementReview,
} from '@/services/management-review'
import { getCompanies, Company } from '@/services/companies'
import { getUsers, User } from '@/services/api'
import { ManagementReviewFormDialog } from '@/components/ManagementReviewFormDialog'
import { ManagementReviewReportPrint } from '@/components/ManagementReviewReportPrint'
import pb from '@/lib/pocketbase/client'

export default function ManagementReviewPage() {
  const { selectedCompanyId } = useCompany()
  const currentYear = new Date().getFullYear()

  const [reviews, setReviews] = useState<ManagementReviewComputed[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Form Dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<ManagementReviewComputed | null>(null)

  // Print view
  const [viewingReport, setViewingReport] = useState<ManagementReviewComputed | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [comps, usrs, list] = await Promise.all([
        getCompanies(),
        getUsers(),
        getManagementReviews({
          companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
          year: selectedYear,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        }),
      ])
      setCompanies(comps)
      setUsers(usrs)
      setReviews(list)

      if (viewingReport) {
        const refreshed = list.find((r) => r.id === viewingReport.id)
        if (refreshed) setViewingReport(refreshed)
      }
    } catch (err) {
      console.error('Failed to load management reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId, selectedYear, selectedStatus])

  const handleSaveReview = async (data: any, file?: File) => {
    if (editingReview) {
      await updateManagementReview(editingReview.id, data, file)
    } else {
      await createManagementReview(data, file)
    }
    await loadData()
  }

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Deseja excluir esta Revisão pela Direção?')) return
    await deleteManagementReview(id)
    if (viewingReport?.id === id) setViewingReport(null)
    await loadData()
  }

  // Quick aggregates
  const totalReviews = reviews.length
  const completedReviews = reviews.filter((r) => r.status === 'Realizada').length
  const inPrepReviews = reviews.filter((r) => r.status === 'Em preparação').length

  // If viewing report mode
  if (viewingReport) {
    const comp = companies.find((c) => c.id === viewingReport.company_id)
    return (
      <ManagementReviewReportPrint
        review={viewingReport}
        company={comp}
        onClose={() => setViewingReport(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Presentation className="w-7 h-7 text-primary" />
            Revisão pela Direção (ISO 9001 §9.3)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise crítica periódica do SGQ pela Alta Direção com consolidação automática de
            entradas (§9.3.2), decisões estratégicas (§9.3.3) e geração da ata oficial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingReview(null)
              setFormOpen(true)
            }}
            className="gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Nova Revisão
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Revisões no Ciclo</span>
            <Presentation className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-black text-primary mt-2">{totalReviews}</p>
          <p className="text-xs text-muted-foreground mt-1">Exercício {selectedYear}</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Realizadas / Homologadas</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-2">{completedReviews}</p>
          <p className="text-xs text-emerald-600 mt-1">Ata e deliberações concluídas</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Em Preparação</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-700 mt-2">{inPrepReviews}</p>
          <p className="text-xs text-amber-600 mt-1">Consolidando entradas de dados</p>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Automação §9.3</span>
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-700 mt-2">100% Conectado</p>
          <p className="text-xs text-blue-600 mt-1">RNC, Auditoria, Riscos e Metas</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground">Ano:</span>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Em preparação">Em preparação</SelectItem>
              <SelectItem value="Realizada">Realizada</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" variant="secondary" onClick={loadData} className="h-8 text-xs">
          Filtrar
        </Button>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-semibold">
            Revisões pela Direção Programadas / Realizadas — Ano {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma revisão pela direção registrada para este ano ou filtro. Clique em "Nova
              Revisão" para convocar e estruturar a reunião de análise crítica.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Data da Reunião</th>
                  <th className="p-3">Participantes</th>
                  <th className="p-3">Ações Deliberadas</th>
                  <th className="p-3">Anexo Assinado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reviews.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.status === 'Realizada'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : item.status === 'Cancelada'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </td>

                    <td className="p-3 font-semibold whitespace-nowrap text-foreground">
                      {item.expand?.company_id?.name || '—'}
                    </td>

                    <td className="p-3 whitespace-nowrap font-medium text-foreground">
                      {item.meeting_date
                        ? new Date(item.meeting_date).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>

                    <td className="p-3 max-w-xs text-muted-foreground">
                      {item.participantsList.length > 0
                        ? `${item.participantsList.length} participantes (${item.participantsList
                            .map((p) => p.name)
                            .slice(0, 2)
                            .join(', ')}${item.participantsList.length > 2 ? '...' : ''})`
                        : '—'}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-foreground">
                        {item.actionsList.length} ação(ões)
                      </span>
                      {item.actionsList.length > 0 && (
                        <span className="text-[10px] text-muted-foreground block">
                          {item.actionsList.filter((a) => a.status === 'Concluída').length}{' '}
                          concluídas
                        </span>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {item.attachment ? (
                        <a
                          href={pb.files.getURL(item, item.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Ata PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Sem anexo</span>
                      )}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setViewingReport(item)}
                          title="Visualizar Ata e Relatório Formal para Impressão"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver Ata / PDF</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingReview(item)
                            setFormOpen(true)
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:text-rose-700"
                          onClick={() => handleDeleteReview(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ManagementReviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        review={editingReview}
        companies={companies}
        users={users}
        selectedCompanyId={selectedCompanyId}
        currentYear={selectedYear}
        onSave={handleSaveReview}
      />
    </div>
  )
}
