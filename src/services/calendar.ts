import pb from '@/lib/pocketbase/client'
import { getChecklists, type Checklist } from '@/services/api'
import { getDocuments, type DocumentRecord } from '@/services/documents'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'

export interface CalendarEvent {
  id: string
  title: string
  type: 'checklist' | 'document_review' | 'os_deadline'
  date: string // YYYY-MM-DD
  status: 'completed' | 'pending' | 'overdue' | 'upcoming'
  priority?: 'high' | 'medium' | 'low'
  role?: string
  sector?: string
  assignedUser?: string
  originalItem: Checklist | DocumentRecord | ServiceOrder
}

export const getCalendarEvents = async (
  companyId?: string,
  userId?: string,
): Promise<CalendarEvent[]> => {
  const events: CalendarEvent[] = []
  const todayStr = new Date().toISOString().split('T')[0]

  try {
    // 1. Fetch checklists
    const checklists = await getChecklists(undefined, undefined, undefined, companyId)
    checklists.forEach((chk) => {
      if (chk.due_date) {
        const isDone = chk.status === 'completed' || chk.approval_status === 'approved'
        let status: CalendarEvent['status'] = isDone ? 'completed' : 'pending'

        if (!isDone) {
          if (chk.due_date < todayStr) {
            status = 'overdue'
          } else {
            const diffDays = Math.ceil(
              (new Date(chk.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
            )
            if (diffDays <= 3) {
              status = 'upcoming'
            }
          }
        }

        events.push({
          id: `chk_${chk.id}`,
          title: `Checklist: ${chk.title}`,
          type: 'checklist',
          date: chk.due_date,
          status,
          role: chk.role_assigned,
          assignedUser: chk.apontador_id || chk.last_action_by,
          originalItem: chk,
        })
      }
    })

    // 2. Fetch documents (Next Review Date)
    const docs = await getDocuments(companyId)
    docs.forEach((doc) => {
      if (doc.next_review_date) {
        let status: CalendarEvent['status'] = doc.status === 'Active' ? 'pending' : 'completed'

        if (doc.status !== 'Obsolete') {
          if (doc.next_review_date < todayStr) {
            status = 'overdue'
          } else {
            const diffDays = Math.ceil(
              (new Date(doc.next_review_date).getTime() - new Date().getTime()) /
                (1000 * 3600 * 24),
            )
            if (diffDays <= 15) {
              status = 'upcoming'
            }
          }
        }

        events.push({
          id: `doc_${doc.id}`,
          title: `Revisão Doc: ${doc.code ? doc.code + ' - ' : ''}${doc.title}`,
          type: 'document_review',
          date: doc.next_review_date,
          status,
          sector: doc.sector,
          originalItem: doc,
        })
      }
    })

    // 3. Fetch Service Orders (Deadlines)
    const serviceOrders = await getServiceOrders(companyId)
    serviceOrders.forEach((so) => {
      if (so.deadline) {
        const isDone = so.status === 'Completed'
        let status: CalendarEvent['status'] = isDone ? 'completed' : 'pending'

        if (!isDone) {
          if (so.deadline < todayStr) {
            status = 'overdue'
          } else {
            const diffDays = Math.ceil(
              (new Date(so.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
            )
            if (diffDays <= 7) {
              status = 'upcoming'
            }
          }
        }

        events.push({
          id: `so_${so.id}`,
          title: `Prazo O.S. #${so.number}: ${so.client}`,
          type: 'os_deadline',
          date: so.deadline,
          status,
          originalItem: so,
        })
      }
    })
  } catch (e) {
    console.error('getCalendarEvents failed:', e)
  }

  return events
}
