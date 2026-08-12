import pb from '@/lib/pocketbase/client'

export interface PackingSlipItem {
  item: number
  quantity: number | string
  unit: string
  description: string
  observation: string
}

export interface PackingSlipGRV {
  code: string
  description: string
  value: number | string
  type: string
  sector: string
  requester: string
}

export interface PackingSlip {
  id: string
  number: number
  issue_date: string
  type: 'Entrada' | 'Saída' | 'Cancelamento'
  recipient_origin?: string
  origin_location?: string
  destination_location?: string
  delivery_responsible?: string
  responsible_id?: string
  os_id?: string
  oc_number?: string
  nfe_number?: string
  doc_non_official?: string
  cm_number?: string
  contact_phone?: string
  warehouse_responsible?: string
  cq_pcp_responsible?: string
  sector?: string
  requester?: string
  in_charge?: string
  items?: PackingSlipItem[]
  grv_info?: PackingSlipGRV[]
  status: 'Draft' | 'Finalized' | 'Cancelled'
  company_id: string
  created?: string
  updated?: string
  expand?: {
    responsible_id?: { name: string; email: string }
    os_id?: { number: string; client: string; equipment: string }
    company_id?: { name: string }
  }
}

export const getPackingSlips = async (companyId?: string): Promise<PackingSlip[]> => {
  try {
    const filters: string[] = []
    if (companyId && companyId !== 'all') {
      filters.push(`company_id = '${companyId}'`)
    }
    const filter = filters.length > 0 ? filters.join(' && ') : undefined

    const result = await pb.collection('packing_slips').getFullList<PackingSlip>({
      filter,
      sort: '-number,-created',
      expand: 'responsible_id,os_id,company_id',
    })
    return result
  } catch (e) {
    console.error('getPackingSlips failed:', e)
    return []
  }
}

export const getPackingSlip = async (id: string): Promise<PackingSlip> => {
  return pb.collection('packing_slips').getOne<PackingSlip>(id, {
    expand: 'responsible_id,os_id,company_id',
  })
}

export const getNextPackingSlipNumber = async (companyId: string): Promise<number> => {
  try {
    const lastRecords = await pb.collection('packing_slips').getList<PackingSlip>(1, 1, {
      filter: `company_id = '${companyId}'`,
      sort: '-number',
    })
    if (lastRecords.items.length > 0 && lastRecords.items[0].number) {
      return lastRecords.items[0].number + 1
    }
    return 1001
  } catch (e) {
    console.error('getNextPackingSlipNumber failed:', e)
    return 1001
  }
}

export const createPackingSlip = async (data: Partial<PackingSlip>): Promise<PackingSlip> => {
  return pb.collection('packing_slips').create<PackingSlip>(data)
}

export const updatePackingSlip = async (
  id: string,
  data: Partial<PackingSlip>,
): Promise<PackingSlip> => {
  return pb.collection('packing_slips').update<PackingSlip>(id, data)
}

export const deletePackingSlip = async (id: string): Promise<boolean> => {
  return pb.collection('packing_slips').delete(id)
}
