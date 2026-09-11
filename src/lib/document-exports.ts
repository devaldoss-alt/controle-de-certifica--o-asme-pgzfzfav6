import { localizedField } from '@/lib/i18n-content'
import type { DocumentRecord } from '@/services/documents'
import type { Company } from '@/services/companies'
import { openDocumentFidelityPrint } from './document-fidelity-pdf'

export function exportDocumentPdf(
  doc: DocumentRecord,
  lang: string,
  company?: Company | null,
  forceLang?: 'pt' | 'en' | 'bilingual',
) {
  const targetLang = forceLang || (lang === 'en' ? 'en' : 'pt')
  openDocumentFidelityPrint(doc, company, undefined, targetLang)
}

export function exportDocumentWord(doc: DocumentRecord, lang: string) {
  const title = localizedField(doc.title, doc.title_en, lang)
  const content = localizedField(doc.content, doc.content_en, lang)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;line-height:1.6}h1{font-size:24px}h2{font-size:20px}</style></head><body>${content}</body></html>`
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.doc`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDocumentExcel(doc: DocumentRecord, lang: string) {
  const title = localizedField(doc.title, doc.title_en, lang)
  const content = localizedField(doc.content, doc.content_en, lang)
  const plainText = content.replace(/<[^>]+>/g, ' ').trim()
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>${title}</th></tr><tr><td>${plainText}</td></tr></table></body></html>`
  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.xls`
  a.click()
  URL.revokeObjectURL(url)
}
