import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface DocumentAccess {
  id: string
  role: string
  document_prefix: string
  can_view: boolean
  can_edit: boolean
  created: string
  updated: string
}

export const getDocumentAccess = async (role?: string) => {
  try {
    const opts: Record<string, any> = { sort: 'role' }
    if (role) opts.filter = `role = "${role}"`
    const result = await pb.collection('document_access').getFullList<DocumentAccess>(opts)
    return safeArray<DocumentAccess>(result)
  } catch (e) {
    console.error('getDocumentAccess failed:', e)
    return []
  }
}

export const getAccessiblePrefixes = async (role: string) => {
  const rules = await getDocumentAccess(role)
  return rules.filter((r) => r.can_view).map((r) => r.document_prefix)
}

export const createDocumentAccess = async (data: {
  role: string
  document_prefix: string
  can_view: boolean
  can_edit: boolean
}) => {
  return pb.collection('document_access').create(data)
}

export const updateDocumentAccess = async (id: string, data: Partial<DocumentAccess>) => {
  return pb.collection('document_access').update(id, data)
}

export const deleteDocumentAccess = async (id: string) => {
  return pb.collection('document_access').delete(id)
}
