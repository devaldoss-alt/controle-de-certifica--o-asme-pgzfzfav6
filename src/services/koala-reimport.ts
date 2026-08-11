import {
  parseSpreadsheet,
  normalizeDate,
  findHeaderRow,
  normalizeText,
} from '@/lib/spreadsheet-parser'
import {
  bulkImportInternalDocuments,
  type ImportRow,
  type ImportResult,
  type ImportProgressCallback,
} from '@/services/internal-documents'
import koalaSpreadsheetUrl from '@/assets/fsgq-7.5.1-lista-mestra-internos-rev.07-ec5e9.xlsx?url'

const FIELDS = [
  'prefix',
  'code',
  'title',
  'revision',
  'status',
  'applicable_document',
  'sector',
  'effective_date',
  'review_deadline_days',
  'notes',
] as const

const FIELD_SYNONYMS: Record<string, string[]> = {
  code: ['codigo', 'item', 'cod'],
  title: ['identificacao', 'titulo', 'descricao'],
  revision: ['revisao', 'n revisao', 'n rev', 'rev'],
  effective_date: ['data de aprovacao', 'data de aprovacao reaprovacao', 'data aprovacao', 'data'],
  applicable_document: ['documento que se aplica', 'doc aplicavel', 'doc que se aplica'],
  review_deadline_days: ['prazo de revisao', 'prazo revisao', 'prazo de revisao dias', 'prazo'],
  notes: ['observacoes', 'observacao', 'obs'],
  sector: ['setor', 'area', 'departamento'],
  status: ['status', 'situacao'],
  prefix: ['tipo'],
}

function guessMapping(headers: string[]): Record<string, string> {
  const normalized = headers.map((h) => normalizeText(h))
  const guess: Record<string, string> = {}
  const usedIndices = new Set<number>()

  for (const field of FIELDS) {
    const synonyms = FIELD_SYNONYMS[field] || []
    let found = -1
    for (const syn of synonyms) {
      found = normalized.findIndex(
        (h, i) =>
          !usedIndices.has(i) &&
          (h === syn || (syn.length >= 3 && h.includes(syn)) || (h.length >= 3 && syn.includes(h))),
      )
      if (found >= 0) break
    }
    if (found >= 0) {
      guess[field] = String(found)
      usedIndices.add(found)
    } else {
      guess[field] = '_skip'
    }
  }

  return guess
}

export async function reimportKoalaDocuments(
  koalaCompanyId: string,
  onProgress?: ImportProgressCallback,
): Promise<ImportResult> {
  const response = await fetch(koalaSpreadsheetUrl)
  if (!response.ok) {
    throw new Error('Falha ao baixar a planilha do Koala System')
  }
  const blob = await response.blob()
  const file = new File([blob], 'fsgq-7.5.1-lista-mestra-internos-rev.07.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const data = await parseSpreadsheet(file)
  if (data.length < 1) {
    return { success: 0, errors: [{ row: 0, error: 'Planilha vazia' }] }
  }

  const headerIdx = findHeaderRow(data)
  const headers = data[headerIdx].map((h, i) => h || `Coluna ${i + 1}`)
  const rows = data.slice(headerIdx + 1)

  const mapping = guessMapping(headers)

  const importRows: ImportRow[] = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const [field, colIdx] of Object.entries(mapping)) {
      if (colIdx === '_skip') continue
      const val = row[parseInt(colIdx, 10)] || ''
      if (field === 'effective_date') {
        obj[field] = normalizeDate(val) || undefined
      } else if (field === 'review_deadline_days') {
        const num = parseInt(val, 10)
        obj[field] = isNaN(num) ? undefined : num
      } else {
        obj[field] = val.trim()
      }
    }
    obj.origin = 'Koala System'
    obj.language = 'Portuguese'
    return obj as ImportRow
  })

  return bulkImportInternalDocuments(importRows, koalaCompanyId, onProgress, {
    forceCompanyId: true,
  })
}
