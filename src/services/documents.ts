import pb from '@/lib/pocketbase/client'
import type { ServiceOrder } from '@/services/service-orders'

export interface DocumentRecord {
  id: string
  title: string
  content: string
  file_path: string
  os_id: string
  category: 'ISO' | 'ASME'
  created: string
  updated: string
  expand?: {
    os_id?: ServiceOrder | null
  }
}

export const getDocuments = async (category?: string) => {
  const opts: Record<string, any> = { sort: '-updated', expand: 'os_id' }
  if (category && category !== 'all') {
    opts.filter = `category = "${category}"`
  }
  return pb.collection('documents').getFullList<DocumentRecord>(opts)
}

export const getDocument = async (id: string) => {
  return pb.collection('documents').getOne<DocumentRecord>(id, { expand: 'os_id' })
}

export const createDocument = async (data: {
  title: string
  content: string
  category: string
  file_path?: string
  os_id?: string
}) => {
  return pb.collection('documents').create(data)
}

export const updateDocument = async (id: string, data: Partial<DocumentRecord>) => {
  return pb.collection('documents').update(id, data)
}

export const deleteDocument = async (id: string) => {
  return pb.collection('documents').delete(id)
}
