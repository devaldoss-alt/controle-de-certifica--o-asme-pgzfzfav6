import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n, BilingualText } from '@/hooks/use-i18n'
import useRealtime from '@/hooks/use-realtime'
import { getCalendarEvents, type CalendarEvent } from '@/services/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Briefcase,
  CheckSquare,
  Search,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Calendar() {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang, t } = useI18n()

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0],
  )
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getCalendarEvents(selectedCompanyId, user?.id)
      setEvents(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])

  useRealtime('checklists', () => loadData())
  useRealtime('documents', () => loadData())
  useRealtime('service_orders', () => loadData())

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNamesPt = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  const monthNamesEn = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const monthLabel =
    lang === 'pt' ? `${monthNamesPt[month]} ${year}` : `${monthNamesEn[month]} ${year}`

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  const todayMonth = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDateStr(today.toISOString().split('T')[0])
  }

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesType = typeFilter === 'all' || ev.type === typeFilter
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        (ev.role || '').toLowerCase().includes(q) ||
        (ev.sector || '').toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [events, typeFilter, search])

  // Events map by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    filteredEvents.forEach((ev) => {
      if (!ev.date) return
      const dateKey = ev.date.split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(ev)
    })
    return map
  }, [filteredEvents])

  // Events on selected day
  const selectedDayEvents = eventsByDate[selectedDateStr] || []

  const renderCalendarDays = () => {
    const days = []
    const totalSlots = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - firstDayOfWeek + 1
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth

      if (!isValidDay) {
        days.push(
          <div
            key={`empty-${i}`}
            className="min-h-[90px] bg-black/10 border border-white/5 p-1 text-muted-foreground/20 text-xs"
          />,
        )
        continue
      }

      const formattedDay = String(dayNum).padStart(2, '0')
      const formattedMonth = String(month + 1).padStart(2, '0')
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`

      const dayEvents = eventsByDate[dateStr] || []
      const isSelected = selectedDateStr === dateStr
      const isToday = new Date().toISOString().split('T')[0] === dateStr

      const hasOverdue = dayEvents.some((e) => e.status === 'overdue')
      const hasUpcoming = dayEvents.some((e) => e.status === 'upcoming')

      days.push(
        <div
          key={dateStr}
          onClick={() => setSelectedDateStr(dateStr)}
          className={cn(
            'min-h-[90px] border border-white/5 p-1.5 transition-all cursor-pointer flex flex-col justify-between group hover:bg-white/5',
            isSelected && 'bg-primary/10 border-primary/50 ring-1 ring-primary/40',
            isToday && !isSelected && 'bg-white/5 border-primary/30',
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full',
                isToday
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-muted-foreground group-hover:text-white',
              )}
            >
              {dayNum}
            </span>

            {dayEvents.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 font-mono rounded bg-white/10 text-white font-bold">
                {dayEvents.length}
              </span>
            )}
          </div>

          <div className="space-y-1 my-1 overflow-hidden max-h-[50px]">
            {dayEvents.slice(0, 2).map((ev) => {
              const statusColor =
                ev.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : ev.status === 'overdue'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : ev.status === 'upcoming'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'

              return (
                <div
                  key={ev.id}
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded truncate border font-medium',
                    statusColor,
                  )}
                  title={ev.title}
                >
                  {ev.type === 'checklist' && '✓ '}
                  {ev.type === 'document_review' && '📄 '}
                  {ev.type === 'os_deadline' && '🛠 '}
                  {ev.type === 'packing_slip' && '📦 '}
                  {ev.title}
                </div>
              )
            })}

            {dayEvents.length > 2 && (
              <p className="text-[9px] text-muted-foreground font-semibold px-1">
                +{dayEvents.length - 2} {lang === 'pt' ? 'mais' : 'more'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            {hasUpcoming && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </div>
        </div>,
      )
    }

    return days
  }

  const getStatusBadge = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {lang === 'pt' ? 'Concluído' : 'Completed'}
          </Badge>
        )
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {lang === 'pt' ? 'Atrasado' : 'Overdue'}
          </Badge>
        )
      case 'upcoming':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {lang === 'pt' ? 'Próximo' : 'Upcoming'}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {lang === 'pt' ? 'Pendente' : 'Pending'}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-primary" />
            {lang === 'pt' ? 'Agenda Consolidada' : 'Consolidated Calendar'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'pt'
              ? 'Acompanhamento unificado de Checklists, Revisões de Documentos e Prazos de O.S.'
              : 'Unified view of Checklists, Document Reviews and Service Order Deadlines'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={todayMonth}
            className="border-white/10 text-white hover:bg-white/10"
          >
            {lang === 'pt' ? 'Hoje' : 'Today'}
          </Button>
          <div className="flex items-center bg-white/5 rounded-md border border-white/10">
            <Button
              size="icon"
              variant="ghost"
              onClick={prevMonth}
              className="hover:bg-white/10 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 font-heading font-bold text-sm min-w-[130px] text-center text-white">
              {monthLabel}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={nextMonth}
              className="hover:bg-white/10 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
            className={
              typeFilter === 'all' ? 'bg-primary' : 'border-white/10 text-muted-foreground'
            }
          >
            {lang === 'pt' ? 'Todos os Eventos' : 'All Events'}
          </Button>
          <Button
            variant={typeFilter === 'checklist' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('checklist')}
            className={
              typeFilter === 'checklist'
                ? 'bg-emerald-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            Checklists
          </Button>
          <Button
            variant={typeFilter === 'document_review' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('document_review')}
            className={
              typeFilter === 'document_review'
                ? 'bg-blue-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            {lang === 'pt' ? 'Revisões Doc' : 'Doc Reviews'}
          </Button>
          <Button
            variant={typeFilter === 'os_deadline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('os_deadline')}
            className={
              typeFilter === 'os_deadline'
                ? 'bg-amber-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            <Briefcase className="w-3.5 h-3.5 mr-1" />
            {lang === 'pt' ? 'Prazos O.S.' : 'O.S. Deadlines'}
          </Button>
          <Button
            variant={typeFilter === 'packing_slip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('packing_slip')}
            className={
              typeFilter === 'packing_slip'
                ? 'bg-purple-600 text-white'
                : 'border-white/10 text-muted-foreground'
            }
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            {lang === 'pt' ? 'Romaneios' : 'Packing Slips'}
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === 'pt' ? 'Filtrar título, cargo, setor...' : 'Filter title, role, sector...'
            }
            className="bg-black/20 border-white/10 text-white pl-9"
          />
        </div>
      </div>

      {/* Main Grid: Calendar Month View + Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid (2 cols) */}
        <Card className="glass border-white/10 lg:col-span-2">
          <CardHeader className="p-4 border-b border-white/10">
            <div className="grid grid-cols-7 text-center font-bold text-xs uppercase text-muted-foreground">
              <div>{lang === 'pt' ? 'Dom' : 'Sun'}</div>
              <div>{lang === 'pt' ? 'Seg' : 'Mon'}</div>
              <div>{lang === 'pt' ? 'Ter' : 'Tue'}</div>
              <div>{lang === 'pt' ? 'Qua' : 'Wed'}</div>
              <div>{lang === 'pt' ? 'Qui' : 'Thu'}</div>
              <div>{lang === 'pt' ? 'Sex' : 'Fri'}</div>
              <div>{lang === 'pt' ? 'Sáb' : 'Sat'}</div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
          </CardContent>
        </Card>

        {/* Selected Day Panel (1 col) */}
        <Card className="glass border-white/10 flex flex-col h-full">
          <CardHeader className="p-4 border-b border-white/10 bg-black/20">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span>
                {lang === 'pt' ? 'Eventos em' : 'Events on'}{' '}
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(
                  lang === 'pt' ? 'pt-BR' : 'en-US',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  },
                )}
              </span>
              <Badge variant="outline" className="border-primary/40 text-primary font-mono">
                {selectedDayEvents.length} {lang === 'pt' ? 'itens' : 'items'}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[600px]">
            {selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-lg bg-black/30 border border-white/10 space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {ev.type === 'checklist' && (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {ev.type === 'document_review' && (
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    {ev.type === 'os_deadline' && (
                      <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-white">{ev.title}</span>
                  </div>
                  {getStatusBadge(ev.status)}
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-white/5">
                  {ev.role && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-muted-foreground/70">
                        {lang === 'pt' ? 'Cargo:' : 'Role:'}
                      </span>
                      <span className="text-white">{ev.role}</span>
                    </div>
                  )}
                  {ev.sector && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-muted-foreground/70">
                        {lang === 'pt' ? 'Setor:' : 'Sector:'}
                      </span>
                      <span className="text-white">{ev.sector}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedDayEvents.length === 0 && (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto opacity-30 text-primary" />
                <p className="text-sm font-medium">
                  {lang === 'pt'
                    ? 'Nenhum compromisso neste dia'
                    : 'No events scheduled for this day'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'pt'
                    ? 'Selecione outra data no calendário ao lado.'
                    : 'Select another date on the calendar.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
