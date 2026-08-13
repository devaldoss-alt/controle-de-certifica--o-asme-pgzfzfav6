import pb from '@/lib/pocketbase/client'
import { getChecklists, type Checklist } from '@/services/api'
import { getDocuments, type DocumentRecord } from '@/services/documents'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'

import { getPackingSlips, type PackingSlip } from '@/services/packing-slips'

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
          assignedUser: (chk as any).apontador_id || chk.last_action_by,
          originalItem: chk,
        })
      }
    })

    // 2. Fetch documents (Next Review Date)
    const docs = await getDocuments('all', companyId)
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
          sector: (doc as any).sector || doc.category,
          originalItem: doc,
        })
      }
    })

    // 3. Fetch Service Orders (Deadlines)
    const serviceOrders = await getServiceOrders('all', companyId)
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

    // 4. Fetch Packing Slips (Romaneios)
    const packingSlips = await getPackingSlips(companyId)
    packingSlips.forEach((ps) => {
      if (ps.issue_date) {
        const isDone = ps.status === 'Finalized' || ps.status === 'Cancelled'
        events.push({
          id: `ps_${ps.id}`,
          title: `Romaneio ${ps.type} #${ps.number}: ${ps.recipient_origin || 'Pend'}`.slice(0, 45),
          type: 'packing_slip',
          date: ps.issue_date.split('T')[0],
          status: isDone ? 'completed' : 'pending',
          sector: ps.sector || 'Expedição/Almoxarifado',
          assignedUser: ps.delivery_responsible || (ps.expand?.responsible_id as any)?.name,
          originalItem: ps,
        })
      }
    })
  } catch (e) {
    console.error('getCalendarEvents failed:', e)
  }

  return events
}
