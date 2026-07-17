import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface DocumentRecord {
  id: string
  title: string
  content: string
  file_path: string
  os_id?: string
  category: string
  company_id?: string
  created: string
  updated: string
}

export const getDocuments = async (filter?: string, companyId?: string) => {
  const filters: string[] = []
  if (filter && filter !== 'all') filters.push(`category = "${filter}"`)
  if (companyId && companyId !== 'all') filters.push(`company_id = "${companyId}"`)
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

export const createDocument = async (data: {
  title: string
  content: string
  category: string
  file_path?: string
  company_id?: string
}) => {
  return pb.collection('documents').create(data)
}

export const updateDocument = async (id: string, data: Partial<DocumentRecord>) => {
  return pb.collection('documents').update(id, data)
}

export const deleteDocument = async (id: string) => {
  return pb.collection('documents').delete(id)
}
