import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { normalizeDate } from '@/lib/spreadsheet-parser'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

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
  applicable_document?: string
  sector?: string
  review_deadline_days?: number
  notes?: string
  file?: string | string[]
  file_path?: string
  company_id?: string
  created: string
  updated: string
}

export interface ImportRow {
  prefix?: string
  code?: string
  title: string
  revision?: string
  effective_date?: string
  next_review_date?: string
  document_type?: string
  origin?: string
  language?: string
  status?: string
  applicable_document?: string
  sector?: string
  review_deadline_days?: number
  notes?: string
}

export interface ImportResult {
  success: number
  errors: { row: number; error: string }[]
}

export type ImportProgressCallback = (current: number, total: number) => void

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PREFIX_TO_DOC_TYPE: Record<string, string> = {
  'ASME PSC': 'External',
  'CDE-PS': 'Record',
  'CQS-PSC': 'Record',
  'EVS-PSC': 'Record',
  FSGQ: 'Record',
  ISSGQ: 'Internal',
  'IT-CQ': 'Internal',
  ITSGQ: 'Internal',
  'LP-KS': 'Record',
  MCQ: 'Internal',
  MSGQ: 'Internal',
  'PR-CQ': 'Internal',
  PSGQ: 'Internal',
}

const VALID_DOCUMENT_TYPES = ['Internal', 'External', 'Record']

const BATCH_SIZE = 5
const BATCH_DELAY = 500
const REQUEST_DELAY = 200
const MAX_RETRIES = 15
const MAX_BACKOFF_MS = 30000
const BASE_BACKOFF_MS = 2000
const JITTER_MS = 500

export function inferDocumentType(prefix: string | undefined): string {
  const normalized = (prefix || '').trim().toUpperCase()
  if (!normalized) return 'Internal'
  const mapped = PREFIX_TO_DOC_TYPE[normalized]
  if (mapped) return mapped
  return 'Internal'
}

async function createDocumentWithRetry(
  data: Record<string, unknown>,
  maxRetries = MAX_RETRIES,
): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await pb.collection('documents').create(data)
      return
    } catch (e: any) {
      lastError = e
      if (e?.status === 429) {
        const baseDelay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS)
        const jitter = Math.floor(Math.random() * JITTER_MS)
        await sleep(baseDelay + jitter)
        continue
      }
      if (attempt < maxRetries - 1 && !e?.status) {
        await sleep(BASE_BACKOFF_MS * (attempt + 1))
        continue
      }
      throw e
    }
  }
  throw lastError
}

async function updateDocumentWithRetry(
  id: string,
  data: Record<string, unknown>,
  maxRetries = MAX_RETRIES,
): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await pb.collection('documents').update(id, data)
      return
    } catch (e: any) {
      lastError = e
      if (e?.status === 429) {
        const baseDelay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS)
        const jitter = Math.floor(Math.random() * JITTER_MS)
        await sleep(baseDelay + jitter)
        continue
      }
      if (attempt < maxRetries - 1 && !e?.status) {
        await sleep(BASE_BACKOFF_MS * (attempt + 1))
        continue
      }
      throw e
    }
  }
  throw lastError
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
  onProgress?: ImportProgressCallback,
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] }
  const existingDocs = await getInternalDocuments({ companyId })

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.title || !row.title.trim()) {
      result.errors.push({ row: i + 1, error: 'Título é obrigatório' })
      onProgress?.(i + 1, rows.length)
      continue
    }

    const code = row.code?.trim() || ''
    const revision = row.revision?.trim() || ''
    const prefix = (row.prefix || '').trim().toUpperCase()
    const documentType = inferDocumentType(prefix)
    const existing =
      code && revision
        ? existingDocs.find((d) => (d.code || '') === code && (d.revision || '') === revision)
        : existingDocs.find((d) => (d.title || '') === row.title.trim())

    if (existing) {
      try {
        await updateDocumentWithRetry(existing.id, {
          title: row.title.trim(),
          code,
          revision,
          category: 'Internal',
          prefix: prefix || '',
          document_type: documentType,
          effective_date: row.effective_date || null,
          next_review_date: row.next_review_date || null,
          origin: row.origin || '',
          language: row.language || 'Portuguese',
          status: row.status || 'Active',
          applicable_document: row.applicable_document || '',
          sector: row.sector || '',
          review_deadline_days: row.review_deadline_days ?? null,
          notes: row.notes || '',
          company_id: companyId,
        })
        result.success++
      } catch (e: any) {
        if (e?.status === 429) {
          result.errors.push({
            row: i + 1,
            error: 'Limite de requisições excedido após múltiplas tentativas',
          })
        } else {
          const fieldErrors = extractFieldErrors(e)
          const fieldEntries = Object.entries(fieldErrors)
          if (fieldEntries.length > 0) {
            const detail = fieldEntries.map(([field, msg]) => `${field}: ${msg}`).join('; ')
            result.errors.push({ row: i + 1, error: detail })
          } else {
            result.errors.push({ row: i + 1, error: getErrorMessage(e) })
          }
        }
      }

      onProgress?.(i + 1, rows.length)

      await sleep(REQUEST_DELAY)

      if ((i + 1) % BATCH_SIZE === 0 && i < rows.length - 1) {
        await sleep(BATCH_DELAY)
      }
      continue
    }

    try {
      await createDocumentWithRetry({
        title: row.title.trim(),
        code,
        revision,
        category: 'Internal',
        prefix: prefix || '',
        document_type: documentType,
        effective_date: row.effective_date || null,
        next_review_date: row.next_review_date || null,
        origin: row.origin || '',
        language: row.language || 'Portuguese',
        status: row.status || 'Active',
        applicable_document: row.applicable_document || '',
        sector: row.sector || '',
        review_deadline_days: row.review_deadline_days ?? null,
        notes: row.notes || '',
        company_id: companyId,
      })
      result.success++
    } catch (e: any) {
      if (e?.status === 429) {
        result.errors.push({
          row: i + 1,
          error: 'Limite de requisições excedido após múltiplas tentativas',
        })
      } else {
        const fieldErrors = extractFieldErrors(e)
        const fieldEntries = Object.entries(fieldErrors)
        if (fieldEntries.length > 0) {
          const detail = fieldEntries.map(([field, msg]) => `${field}: ${msg}`).join('; ')
          result.errors.push({ row: i + 1, error: detail })
        } else {
          result.errors.push({ row: i + 1, error: getErrorMessage(e) })
        }
      }
    }

    onProgress?.(i + 1, rows.length)

    await sleep(REQUEST_DELAY)

    if ((i + 1) % BATCH_SIZE === 0 && i < rows.length - 1) {
      await sleep(BATCH_DELAY)
    }
  }
  return result
}
