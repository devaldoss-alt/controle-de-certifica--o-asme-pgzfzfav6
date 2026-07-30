import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { normalizeDate } from '@/lib/spreadsheet-parser'

export interface InternalDocument {
  id: string
  title: string
  title_en?: string
  content: string
  code?: string
  revision?: string
  prefix?: string
  category: string
  document_type?: string
  effective_date?: string
  next_review_date?: string
  origin?: string
  language?: string
  status?: string
  file?: string | string[]
  file_path?: string
  company_id?: string
  created: string
  updated: string
}

export interface ImportRow {
  code?: string
  title: string
  revision?: string
  effective_date?: string
  next_review_date?: string
  document_type?: string
  origin?: string
  language?: string
  status?: string
}

export interface ImportResult {
  success: number
  errors: { row: number; error: string }[]
}

export async function getInternalDocuments(params: {
  companyId?: string
  search?: string
  revision?: string
  documentType?: string
  status?: string
}): Promise<InternalDocument[]> {
  const filters: string[] = ['category = "Internal"']
  const { companyId, search, revision, documentType, status } = params

  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
  } else {
    filters.push('company_id != ""')
  }
  if (search && search.trim()) {
    const s = search.trim()
    filters.push(`(code ~ "${s}" || title ~ "${s}")`)
  }
  if (revision && revision !== 'all') filters.push(`revision = "${revision}"`)
  if (documentType && documentType !== 'all') filters.push(`document_type = "${documentType}"`)
  if (status && status !== 'all') filters.push(`status = "${status}"`)

  try {
    const result = await pb.collection('documents').getFullList<InternalDocument>({
      filter: filters.join(' && '),
      sort: '-updated',
    })
    return safeArray<InternalDocument>(result)
  } catch (e) {
    console.error('getInternalDocuments failed:', e)
    return []
  }
}

export async function getInternalDocument(id: string): Promise<InternalDocument> {
  return pb.collection('documents').getOne<InternalDocument>(id)
}

export async function createInternalDocument(data: FormData) {
  return pb.collection('documents').create(data)
}

export async function updateInternalDocument(id: string, data: FormData) {
  return pb.collection('documents').update(id, data)
}

export async function deleteInternalDocument(id: string) {
  return pb.collection('documents').delete(id)
}

export async function bulkImportInternalDocuments(
  rows: ImportRow[],
  companyId: string,
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] }
  const existingDocs = await getInternalDocuments({ companyId })

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.title || !row.title.trim()) {
      result.errors.push({ row: i + 1, error: 'Título é obrigatório' })
      continue
    }

    const code = row.code?.trim() || ''
    const revision = row.revision?.trim() || ''
    const isDuplicate = existingDocs.some(
      (d) => (d.code || '') === code && (d.revision || '') === revision && code && revision,
    )
    if (isDuplicate) {
      result.errors.push({ row: i + 1, error: `Duplicado: código ${code} revisão ${revision}` })
      continue
    }

    try {
      await pb.collection('documents').create({
        title: row.title.trim(),
        code,
        revision,
        category: 'Internal',
        document_type: row.document_type || 'Internal',
        effective_date: row.effective_date || null,
        next_review_date: row.next_review_date || null,
        origin: row.origin || '',
        language: row.language || 'Portuguese',
        status: row.status || 'Active',
        company_id: companyId,
      })
      result.success++
    } catch (e: any) {
      result.errors.push({
        row: i + 1,
        error: e?.message || 'Erro ao criar documento',
      })
    }
  }
  return result
}
