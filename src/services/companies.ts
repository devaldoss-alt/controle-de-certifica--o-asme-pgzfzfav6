import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface Company {
  id: string
  name: string
  name_en?: string
  tax_id: string
  logo?: string
  iso_certs?: string
  asme_certs?: string
  nbic_certs?: string
  created: string
  updated: string
}

export const getCompanies = async () => {
  try {
    const result = await pb.collection('companies').getFullList<Company>({ sort: 'name' })
    return safeArray<Company>(result)
  } catch (e) {
    console.error('getCompanies failed:', e)
    return []
  }
}

export const getCompany = async (id: string) => {
  return pb.collection('companies').getOne<Company>(id)
}

export const createCompany = async (data: Partial<Company>) => {
  return pb.collection('companies').create(data)
}

export const updateCompany = async (id: string, data: Partial<Company>) => {
  return pb.collection('companies').update(id, data)
}

export const deleteCompany = async (id: string) => {
  return pb.collection('companies').delete(id)
}
