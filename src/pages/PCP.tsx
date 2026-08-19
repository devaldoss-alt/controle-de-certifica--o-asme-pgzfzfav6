import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n } from '@/hooks/use-i18n'
import useRealtime from '@/hooks/use-realtime'
import { getPCPCapacityData, type PCPDashboardData, type SectorCapacity } from '@/services/pcp'
import { ServiceOrder } from '@/services/service-orders'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Factory,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/safe-data'
import { cn } from '@/lib/utils'

export default function PCPPage() {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang } = useI18n()

  const [data, setData] = useState<PCPDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPCPCapacityData(selectedCompanyId)
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])

  useRealtime('service_orders', () => loadData())
  useRealtime('team', () => loadData())

  // Calendar calculations for Delivery Calendar (Calendário de Entregas de OSs)
  const calendarMonthYear = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const calendarDays = useMemo(() => {
    const days: Array<{ dayNumber: number; dateStr: string; orders: ServiceOrder[] }> = []
    const ordersMap: Record<string, ServiceOrder[]> = {}

    if (data?.serviceOrders) {
      data.serviceOrders.forEach((so) => {
        if (so.deadline) {
          const dStr = so.deadline.split('T')[0]
          if (!ordersMap[dStr]) ordersMap[dStr] = []
          ordersMap[dStr].push(so)
        }
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        dayNumber: d,
        dateStr: dayStr,
        orders: ordersMap[dayStr] || [],
      })
    }
    return days
  }, [data, year, month, daysInMonth])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Factory className="w-3.5 h-3.5 mr-1" /> PCP & Operações
            </Badge>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">
            Planejamento e Controle da Produção (PCP)
          </h1>
          <p className="text-muted-foreground text-sm">
            Capacidade produtiva por setor e calendário consolidado de entregas das Ordens de
            Serviço (OSs)
          </p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Capacidade Total Disponível
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {data?.totalAvailableHours || 0}{' '}
                <span className="text-xs font-normal text-muted-foreground">horas/mês</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Horas Ocupadas (OSs Ativas)
              </p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">
                {data?.totalOccupiedHours || 0}{' '}
                <span className="text-xs font-normal text-muted-foreground">horas</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Ocupação Global da Fábrica
              </p>
              <h3 className="text-2xl font-bold text-primary mt-1">
                {data?.overallOccupationPercentage || 0}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Factory className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="capacity" className="space-y-6">
        <TabsList className="bg-black/30 border border-white/10 p-1 rounded-lg">
          <TabsTrigger
            value="capacity"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Capacidade Produtiva por Setor
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendário de Entregas (OSs)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Capacity Planning (Capacidade Produtiva por Setor) */}
        <TabsContent value="capacity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.sectorCapacities.map((sc) => {
              const isOverloaded = sc.occupationPercentage > 90
              return (
                <Card
                  key={sc.sector}
                  className="glass border-white/10 hover:border-primary/30 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                        {sc.sector}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          isOverloaded
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : sc.occupationPercentage > 70
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        )}
                      >
                        {sc.occupationPercentage}% Ocupado
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" /> {sc.teamCount} colaboradores no
                      setor
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Horas Ocupadas / Mês</span>
                        <span className="text-white font-medium">
                          {sc.occupiedHours}h / {sc.availableHoursMonth}h
                        </span>
                      </div>
                      <Progress
                        value={Math.min(sc.occupationPercentage, 100)}
                        className={cn(
                          'h-2 bg-black/40',
                          isOverloaded
                            ? '[&>div]:bg-rose-500'
                            : sc.occupationPercentage > 70
                              ? '[&>div]:bg-amber-400'
                              : '[&>div]:bg-primary',
                        )}
                      />
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-primary" /> Ordens de Serviço (OSs)
                        Vinculadas ({sc.activeOrdersCount}):
                      </p>
                      {sc.orders.length === 0 ? (
                        <p className="text-xs text-white/40 italic">
                          Nenhuma OS atribuída a este setor.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {sc.orders.map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between text-xs bg-black/30 p-2 rounded border border-white/5"
                            >
                              <span className="font-mono text-primary font-semibold">
                                {o.number}
                              </span>
                              <span className="text-white/80">{o.estimated_hours || 80}h</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Delivery Calendar (Calendário de Entregas) */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-4">
              <div>
                <CardTitle className="text-lg text-white capitalize">{calendarMonthYear}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Datas de entrega previstas para as Ordens de Serviço (OSs)
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  className="border-white/10 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="border-white/10 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty offset padding cells */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-24 bg-black/10 rounded-md border border-transparent opacity-30"
                  />
                ))}

                {/* Month days */}
                {calendarDays.map((day) => (
                  <div
                    key={day.dayNumber}
                    className={cn(
                      'min-h-24 p-2 rounded-md bg-black/20 border border-white/5 space-y-1.5 flex flex-col justify-between hover:border-primary/30 transition-colors',
                      day.orders.length > 0 && 'bg-primary/5 border-primary/20',
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{day.dayNumber}</span>
                      {day.orders.length > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0">
                          {day.orders.length} OS
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {day.orders.map((so) => (
                        <div
                          key={so.id}
                          className="text-[10px] bg-black/40 border border-primary/30 text-primary p-1 rounded font-mono truncate"
                          title={`${so.number} - ${so.client} (${so.equipment})`}
                        >
                          {so.number}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
