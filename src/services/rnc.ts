import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export interface NonConformity {
  id: string
  number: string
  date: string
  process: string
  severity: 'Leve' | 'Médio' | 'Grave' | 'Crítico'
  description: string
  immediate_action?: string
  root_cause_analysis?: string
  corrective_action?: string
  deadline?: string
  responsible?: string
  status: 'Em Andamento' | 'Fechada' | 'Cancelada'
  effectiveness_verification?: string
  verification_date?: string
  verifier?: string
  company_id?: string
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string; name_en?: string }
  }
}

export async function getNonConformities(
  params: {
    companyId?: string
    status?: string
    severity?: string
    process?: string
    search?: string
  } = {},
): Promise<NonConformity[]> {
  try {
    const filters: string[] = []
    if (params.companyId && params.companyId !== 'all') {
      filters.push(`company_id = "${params.companyId}" || company_id = ""`)
    }
    if (params.status && params.status !== 'all') {
      filters.push(`status = "${params.status}"`)
    }
    if (params.severity && params.severity !== 'all') {
      filters.push(`severity = "${params.severity}"`)
    }
    if (params.process && params.process !== 'all') {
      filters.push(`process = "${params.process}"`)
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim()
      filters.push(
        `(number ~ "${s}" || process ~ "${s}" || description ~ "${s}" || responsible ~ "${s}")`,
      )
    }

    const result = await pb.collection('non_conformities').getFullList<NonConformity>({
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'company_id',
    })
    return safeArray<NonConformity>(result)
  } catch (e) {
    console.error('getNonConformities failed:', e)
    return []
  }
}

export async function createNonConformity(data: Partial<NonConformity>): Promise<NonConformity> {
  return pb.collection('non_conformities').create<NonConformity>(data)
}

export async function updateNonConformity(
  id: string,
  data: Partial<NonConformity>,
): Promise<NonConformity> {
  return pb.collection('non_conformities').update<NonConformity>(id, data)
}

export async function deleteNonConformity(id: string): Promise<void> {
  await pb.collection('non_conformities').delete(id)
}

export async function generateRNCNumber(companyId?: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  try {
    const records = await pb.collection('non_conformities').getFullList<NonConformity>({
      filter: `number ~ "/${currentYear}"`,
      sort: '-number',
      limit: 100,
    })
    let maxNum = 0
    for (const r of records) {
      const match = r.number.match(/RNC-(\d+)\//i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    const nextNum = String(maxNum + 1).padStart(3, '0')
    return `RNC-${nextNum}/${currentYear}`
  } catch (e) {
    return `RNC-001/${currentYear}`
  }
}
