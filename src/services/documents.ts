import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

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
  if (accessiblePrefixes && accessiblePrefixes.length === 0) return []
  if (accessiblePrefixes && accessiblePrefixes.length > 0) {
    const prefixFilter = accessiblePrefixes.map((p) => `prefix = "${p}"`).join(' || ')
    filters.push(`(${prefixFilter})`)
  }
  const opts: Record<string, any> = { sort: '-updated' }
  if (filters.length > 0) opts.filter = filters.join(' && ')
  try {
    const result = await pb.collection('documents').getFullList<DocumentRecord>(opts)
    return safeArray<DocumentRecord>(result)
  } catch (e) {
    console.error('getDocuments failed:', e)
    return []
  }
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
