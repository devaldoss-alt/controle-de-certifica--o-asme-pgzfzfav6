import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface Certificate {
  id: string
  user_id: string
  certificate_type: string
  certificate_number: string
  expiry_date: string
  file: string
  created: string
  updated: string
}

export const getCertificates = async (userId?: string): Promise<Certificate[]> => {
  try {
    const opts: Record<string, any> = { sort: '-expiry_date' }
    if (userId) opts.filter = `user_id = "${userId}"`
    const result = await pb.collection('user_certificates').getFullList<Certificate>(opts)
    return safeArray<Certificate>(result)
  } catch (e) {
    console.error('getCertificates failed:', e)
    return []
  }
}

export const createCertificate = async (data: Record<string, any>) => {
  return pb.collection('user_certificates').create(data)
}

export const updateCertificate = async (id: string, data: Record<string, any>) => {
  return pb.collection('user_certificates').update(id, data)
}

export const deleteCertificate = async (id: string) => {
  return pb.collection('user_certificates').delete(id)
}
