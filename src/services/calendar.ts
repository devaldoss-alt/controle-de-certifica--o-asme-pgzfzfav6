import pb from '@/lib/pocketbase/client'
import { getChecklists, type Checklist } from '@/services/api'
import { getDocuments, type DocumentRecord } from '@/services/documents'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'

import { getPackingSlips, type PackingSlip } from '@/services/packing-slips'

// Normalize any PocketBase date value (e.g. "2026-08-19 17:15:22.264Z" or
// "2026-08-19T17:15:22.264Z" or "2026-08-19") to a stable YYYY-MM-DD key so
// it matches the calendar grid date keys (which are pure YYYY-MM-DD).
const toDateKey = (value?: string): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  // PocketBase returns date fields with a space (not 'T') between date and
  // time; replace it so Date can parse reliably across engines.
  const d = new Date(trimmed.replace(' ', 'T'))
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return trimmed.split(/[T ]/)[0]
}

export interface CalendarEvent {
  id: string
  title: string
  type: 'checklist' | 'document_review' | 'os_deadline' | 'packing_slip'
  date: string // YYYY-MM-DD
  status: 'completed' | 'pending' | 'overdue' | 'upcoming'
  priority?: 'high' | 'medium' | 'low'
  role?: string
  sector?: string
  assignedUser?: string
  originalItem: Checklist | DocumentRecord | ServiceOrder | PackingSlip
}

export const getCalendarEvents = async (
  companyId?: string,
  userId?: string,
): Promise<CalendarEvent[]> => {
  const events: CalendarEvent[] = []
  const todayStr = new Date().toISOString().split('T')[0]

  // Days-from-today helper that uses a normalized YYYY-MM-DD key (resilient to
  // PocketBase returning "2026-08-19 00:00:00.000Z" with a space instead of 'T').
  const daysFromToday = (value?: string): number => {
    const key = toDateKey(value)
    if (!key) return NaN
    const [y, m, day] = key.split('-').map(Number)
    if (!y || !m || !day) return NaN
    const d = Date.UTC(y, m - 1, day)
    const now = new Date()
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((d - today) / (1000 * 3600 * 24))
  }

  try {
    // 1. Fetch checklists (filter by company_id, using the correct field name)
    const checklists = await getChecklists(undefined, undefined, undefined, companyId)
    checklists.forEach((chk) => {
      const dateKey = toDateKey(chk.due_date)
      if (!dateKey) return
      const isDone = chk.status === 'completed' || chk.approval_status === 'approved'
      let status: CalendarEvent['status'] = isDone ? 'completed' : 'pending'

      if (!isDone) {
        const diffDays = daysFromToday(chk.due_date)
        if (diffDays < 0) {
          status = 'overdue'
        } else if (diffDays <= 3) {
          status = 'upcoming'
        }
      }

      events.push({
        id: `chk_${chk.id}`,
        title: `Checklist: ${chk.title}`,
        type: 'checklist',
        date: dateKey,
        status,
        role: chk.role_assigned,
        assignedUser: (chk as any).apontador_id || chk.last_action_by,
        originalItem: chk,
      })
    })

    // 2. Fetch documents (Next Review Date)
    const docs = await getDocuments('all', companyId)
    docs.forEach((doc) => {
      const dateKey = toDateKey(doc.next_review_date)
      if (!dateKey) return
      let status: CalendarEvent['status'] = doc.status === 'Active' ? 'pending' : 'completed'

      if (doc.status !== 'Obsolete') {
        const diffDays = daysFromToday(doc.next_review_date)
        if (diffDays < 0) {
          status = 'overdue'
        } else if (diffDays <= 15) {
          status = 'upcoming'
        }
      }

      events.push({
        id: `doc_${doc.id}`,
        title: `Revisão Doc: ${doc.code ? doc.code + ' - ' : ''}${doc.title}`,
        type: 'document_review',
        date: dateKey,
        status,
        sector: (doc as any).sector || doc.category,
        originalItem: doc,
      })
    })

    // 3. Fetch Service Orders (Deadlines)
    const serviceOrders = await getServiceOrders('all', companyId)
    serviceOrders.forEach((so) => {
      const dateKey = toDateKey(so.deadline)
      if (!dateKey) return
      const isDone = so.status === 'Completed'
      let status: CalendarEvent['status'] = isDone ? 'completed' : 'pending'

      if (!isDone) {
        const diffDays = daysFromToday(so.deadline)
        if (diffDays < 0) {
          status = 'overdue'
        } else if (diffDays <= 7) {
          status = 'upcoming'
        }
      }

      events.push({
        id: `so_${so.id}`,
        title: `Prazo O.S. #${so.number}: ${so.client}`,
        type: 'os_deadline',
        date: dateKey,
        status,
        originalItem: so,
      })
    })

    // 4. Fetch Packing Slips (Romaneios)
    const packingSlips = await getPackingSlips(companyId)
    packingSlips.forEach((ps) => {
      const dateKey = toDateKey(ps.issue_date)
      if (!dateKey) return
      const isDone = ps.status === 'Finalized' || ps.status === 'Cancelled'
      events.push({
        id: `ps_${ps.id}`,
        title: `Romaneio ${ps.type} #${ps.number}: ${ps.recipient_origin || 'Pend'}`.slice(0, 45),
        type: 'packing_slip',
        date: dateKey,
        status: isDone ? 'completed' : 'pending',
        sector: ps.sector || 'Expedição/Almoxarifado',
        assignedUser: ps.delivery_responsible || (ps.expand?.responsible_id as any)?.name,
        originalItem: ps,
      })
    })
  } catch (e) {
    console.error('getCalendarEvents failed:', e)
  }

  return events
}
