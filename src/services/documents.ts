import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { normalizePrefix } from '@/lib/dms-codes'

export interface DocumentRecord {
  id: string
  title: string
  title_en?: string
  content: string
  content_en?: string
  file_path: string
  os_id?: string
  category: string
  company_id?: string
  prefix?: string
  prefix_en?: string
  code?: string
  revision?: string
  document_type?: string
  effective_date?: string
  next_review_date?: string
  origin?: string
  language?: string
  status?: string
  created: string
  updated: string
  file?: string | string[]
}

export const getDocuments = async (
  filter?: string,
  companyId?: string,
  accessiblePrefixes?: string[],
) => {
  const filters: string[] = []
  if (filter && filter !== 'all') filters.push(`category = "${filter}"`)
  if (companyId && companyId !== 'all') filters.push(`company_id = "${companyId}"`)
  else filters.push('company_id != ""')
  if (accessiblePrefixes && accessiblePrefixes.length === 0) return []
  if (accessiblePrefixes && accessiblePrefixes.length > 0) {
    const normalized = [
      ...new Set(accessiblePrefixes.map((p) => normalizePrefix(p)).filter(Boolean)),
    ]
    const prefixFilter = normalized.map((p) => `prefix = "${p}"`).join(' || ')
    filters.push(`(${prefixFilter})`)
  }
  const opts: Record<string, any> = { sort: '-updated' }
  if (filters.length > 0) opts.filter = filters.join(' && ')
  const result = await pb.collection('documents').getFullList<DocumentRecord>(opts)
  return safeArray<DocumentRecord>(result)
}

export const getDocument = async (id: string) => {
  return pb.collection('documents').getOne<DocumentRecord>(id)
}

export const createDocument = async (data: FormData) => {
  return pb.collection('documents').create(data)
}

export const updateDocument = async (id: string, data: FormData | Partial<DocumentRecord>) => {
  return pb.collection('documents').update(id, data)
}

export const deleteDocument = async (id: string) => {
  return pb.collection('documents').delete(id)
}
