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

export const createDocument = async (data: {
  title: string
  title_en?: string
  content: string
  category: string
  file_path?: string
  file?: File | null
  company_id?: string
  prefix?: string
  prefix_en?: string
  code?: string
  revision?: string
}) => {
  if (data.file) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.title_en) formData.append('title_en', data.title_en)
    formData.append('content', data.content)
    formData.append('category', data.category)
    if (data.file_path) formData.append('file_path', data.file_path)
    if (data.company_id) formData.append('company_id', data.company_id)
    if (data.prefix) formData.append('prefix', data.prefix)
    if (data.prefix_en) formData.append('prefix_en', data.prefix_en)
    if (data.code) formData.append('code', data.code)
    if (data.revision) formData.append('revision', data.revision)
    formData.append('file', data.file)
    return pb.collection('documents').create(formData)
  }
  const { file: _file, ...rest } = data
  return pb.collection('documents').create(rest)
}

export const updateDocument = async (id: string, data: Partial<DocumentRecord>) => {
  return pb.collection('documents').update(id, data)
}

export const deleteDocument = async (id: string) => {
  return pb.collection('documents').delete(id)
}
