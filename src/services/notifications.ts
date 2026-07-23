import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface Notification {
  id: string
  user_id: string
  type: 'submission' | 'approved' | 'rejected'
  checklist_id: string
  message: string
  read: boolean
  created: string
  updated: string
}

export const getNotifications = async (userId: string, limit = 20): Promise<Notification[]> => {
  try {
    const result = await pb.collection('notifications').getList<Notification>(1, limit, {
      filter: `user_id = "${userId}"`,
      sort: '-created',
    })
    return safeArray<Notification>(result.items)
  } catch (e) {
    console.error('getNotifications failed:', e)
    return []
  }
}

export const markAsRead = async (id: string): Promise<void> => {
  try {
    await pb.collection('notifications').update(id, { read: true })
  } catch (e) {
    console.error('markAsRead failed:', e)
  }
}
