import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export type FeedbackType = 'sugestao' | 'problema' | 'duvida' | 'elogio'
export type FeedbackStatus = 'novo' | 'lido' | 'resolvido'

export interface UserFeedback {
  id: string
  user_id?: string
  user_name: string
  user_email?: string
  screen_path: string
  screen_name: string
  type: FeedbackType
  comment: string
  status: FeedbackStatus
  resolved_at?: string
  resolved_by_name?: string
  company_id?: string
  created: string
  updated: string
  expand?: {
    user_id?: { id: string; name: string; email: string }
    company_id?: { id: string; name: string }
  }
}

export interface CreateFeedbackParams {
  userId?: string
  userName: string
  userEmail?: string
  screenPath: string
  screenName: string
  type: FeedbackType
  comment: string
  companyId?: string
}

/**
 * Creates user feedback in a non-blocking / tolerant manner.
 * Sends notification 🔔 to Manager and Consultor users.
 */
export async function createUserFeedback(
  params: CreateFeedbackParams,
): Promise<{ success: boolean; data?: UserFeedback; error?: string }> {
  try {
    const payload = {
      user_id: params.userId || undefined,
      user_name: params.userName || 'Usuário',
      user_email: params.userEmail || '',
      screen_path: params.screenPath,
      screen_name: params.screenName,
      type: params.type || 'sugestao',
      comment: params.comment.trim(),
      status: 'novo' as FeedbackStatus,
      company_id: params.companyId && params.companyId !== 'all' ? params.companyId : undefined,
    }

    const created = await pb.collection('user_feedback').create<UserFeedback>(payload)

    // Notify Managers & Consultants with non-blocking tolerant notification
    notifyManagersOnFeedback({
      feedbackId: created.id,
      userName: params.userName,
      screenName: params.screenName,
      type: params.type,
      comment: params.comment,
      companyId: params.companyId,
    })

    return { success: true, data: created }
  } catch (err: any) {
    console.warn('[user-feedback] createUserFeedback tolerant catch:', err)
    return {
      success: false,
      error: err?.message || 'Falha ao salvar comentário',
    }
  }
}

export async function getUserFeedbacks(params: {
  companyId?: string
  status?: FeedbackStatus | 'all'
  type?: FeedbackType | 'all'
}): Promise<UserFeedback[]> {
  try {
    const filters: string[] = []
    if (params.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}" || company_id = ""`)
    }
    if (params.status && params.status !== 'all') {
      filters.push(`status = "${params.status}"`)
    }
    if (params.type && params.type !== 'all') {
      filters.push(`type = "${params.type}"`)
    }

    const list = await pb.collection('user_feedback').getFullList<UserFeedback>({
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'user_id,company_id',
    })
    return safeArray<UserFeedback>(list)
  } catch (err) {
    console.warn('[user-feedback] getUserFeedbacks failed:', err)
    return []
  }
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  resolvedByName?: string,
): Promise<UserFeedback | null> {
  try {
    const patch: Partial<UserFeedback> = {
      status,
    }
    if (status === 'resolvido') {
      patch.resolved_at = new Date().toISOString()
      patch.resolved_by_name = resolvedByName || 'Gestor'
    }

    return await pb.collection('user_feedback').update<UserFeedback>(id, patch)
  } catch (err) {
    console.warn('[user-feedback] updateFeedbackStatus failed:', err)
    return null
  }
}

/**
 * Sends non-blocking notification to Managers and Consultants
 */
async function notifyManagersOnFeedback(params: {
  feedbackId: string
  userName: string
  screenName: string
  type: string
  comment: string
  companyId?: string
}): Promise<void> {
  try {
    const users = await pb
      .collection('users')
      .getFullList<{ id: string; role?: string | string[] }>({
        fields: 'id,role',
      })

    const targetUsers = users.filter((u) => {
      const r = Array.isArray(u.role) ? u.role : [u.role || '']
      return r.includes('Manager') || r.includes('Consultor') || r.includes('Director')
    })

    const typeLabels: Record<string, string> = {
      sugestao: '💡 Sugestão',
      problema: '⚠️ Problema',
      duvida: '❓ Dúvida',
      elogio: '⭐ Elogio',
    }
    const typeLabel = typeLabels[params.type] || 'Comentário'
    const shortComment =
      params.comment.length > 80 ? params.comment.slice(0, 77) + '...' : params.comment

    const message = `${typeLabel} de ${params.userName} em [${params.screenName}]: "${shortComment}"`

    await Promise.all(
      targetUsers.map((u) =>
        pb
          .collection('notifications')
          .create({
            user_id: u.id,
            message,
            read: false,
            company_id:
              params.companyId && params.companyId !== 'all' ? params.companyId : undefined,
            type: 'submission',
          })
          .catch(() => {}),
      ),
    )
  } catch (err) {
    console.warn('[user-feedback] notifyManagersOnFeedback silent error:', err)
  }
}
