export interface DmsPrefix {
  prefix: string
  label_pt: string
  label_en: string
}

export const DMS_PREFIXES: DmsPrefix[] = [
  { prefix: 'ASME PSC', label_pt: 'ASME PSC', label_en: 'ASME PSC' },
  { prefix: 'CDE', label_pt: 'CDE - Controle Dimensional', label_en: 'CDE - Dimensional Control' },
  {
    prefix: 'CQS',
    label_pt: 'CQS - Certificado de Qualificação de Soldadores',
    label_en: 'CQS - Welder Qualification Certificate',
  },
  { prefix: 'EVS', label_pt: 'EVS - Ensaio Visual', label_en: 'EVS - Visual Testing' },
  { prefix: 'FSGQ', label_pt: 'FSGQ - Formulários do SGQ', label_en: 'FSGQ - QMS Forms' },
  {
    prefix: 'ISSGQ',
    label_pt: 'ISSGQ - Instrução de Segurança do SGQ',
    label_en: 'ISSGQ - QMS Safety Instruction',
  },
  {
    prefix: 'IT-CQ',
    label_pt: 'IT-CQ - Instrução do Controle de Qualidade',
    label_en: 'IT-CQ - QC Instruction',
  },
  { prefix: 'ITSGQ', label_pt: 'ITSGQ - Instrução do SGQ', label_en: 'ITSGQ - QMS Instruction' },
  { prefix: 'LP', label_pt: 'LP - Líquido Penetrante', label_en: 'LP - Dye Penetrant Testing' },
  { prefix: 'MCQ', label_pt: 'MCQ - Manual do Controle de Qualidade', label_en: 'MCQ - QC Manual' },
  { prefix: 'MSGQ', label_pt: 'MSGQ - Manual do SGQ', label_en: 'MSGQ - QMS Manual' },
  {
    prefix: 'PR-CQ',
    label_pt: 'PR-CQ - Procedimento do Controle de Qualidade',
    label_en: 'PR-CQ - QC Procedure',
  },
  { prefix: 'PSGQ', label_pt: 'PSGQ - Procedimento do SGQ', label_en: 'PSGQ - QMS Procedure' },
]

export function getPrefixLabel(prefix: string, lang: string): string {
  const found = DMS_PREFIXES.find((p) => p.prefix === prefix)
  if (!found) return prefix
  return lang === 'en' ? found.label_en : found.label_pt
}

export interface DocumentFormData {
  title: string
  titleEn: string
  content: string
  category: string
  filePath: string
  prefix: string
  code: string
  revision: string
  file: File | null
}

export function normalizePrefix(prefix: string): string {
  const trimmed = (prefix || '').trim().toUpperCase()
  if (!trimmed) return ''
  const normalized = trimmed.replace(/[\s_]+/g, '-')
  if (normalized === 'ASME-PSC') return 'ASME PSC'
  const fixes: Record<string, string> = {
    'CDE-PS': 'CDE',
    CDEPS: 'CDE',
    'CDE-PSC': 'CDE',
    'CQS-PS': 'CQS',
    CQSPS: 'CQS',
    'CQS-PSC': 'CQS',
    'EVS-PS': 'EVS',
    EVSPS: 'EVS',
    'EVS-PSC': 'EVS',
    'LP-KS': 'LP',
    LPKS: 'LP',
  }
  if (fixes[normalized]) return fixes[normalized]
  if (normalized.endsWith('-PSC')) return normalized.slice(0, -4)
  if (normalized.endsWith('-KS')) return normalized.slice(0, -3)
  return trimmed
}

export function resolveCompanyByPrefix(
  prefix: string,
  defaultCompanyId: string,
  companies: Array<{ id: string; name: string; name_en?: string }>,
): string {
  const upper = (prefix || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '-')
  if (upper.endsWith('-KS')) {
    const koala = companies.find(
      (c) =>
        c.name.toLowerCase().includes('koala') || (c.name_en || '').toLowerCase().includes('koala'),
    )
    if (koala) return koala.id
  }
  if (upper.endsWith('-PSC') || upper === 'CDE-PS' || upper === 'CQS-PS' || upper === 'EVS-PS') {
    const psc = companies.find(
      (c) =>
        c.name.toLowerCase().includes('psc') || (c.name_en || '').toLowerCase().includes('psc'),
    )
    if (psc) return psc.id
  }
  return defaultCompanyId
}

function compareNumericCodes(a: string, b: string): number {
  const partsA = a.split('.').map((n) => parseFloat(n) || 0)
  const partsB = b.split('.').map((n) => parseFloat(n) || 0)
  const maxLen = Math.max(partsA.length, partsB.length)
  for (let i = 0; i < maxLen; i++) {
    const va = partsA[i] || 0
    const vb = partsB[i] || 0
    if (va < vb) return -1
    if (va > vb) return 1
  }
  return 0
}

export function sortDocumentsByPrefixAndCode<T extends { prefix?: string; code?: string }>(
  docs: T[],
): T[] {
  return [...docs].sort((a, b) => {
    const prefixA = (a.prefix || '').toUpperCase()
    const prefixB = (b.prefix || '').toUpperCase()
    if (prefixA < prefixB) return -1
    if (prefixA > prefixB) return 1
    return compareNumericCodes(a.code || '', b.code || '')
  })
}

export function formatDocumentDisplayName(
  prefix: string | undefined,
  code: string | undefined,
  title: string,
): string {
  const parts = [prefix, code].filter(Boolean).join(' ')
  if (parts && title.toUpperCase().startsWith(parts.toUpperCase())) {
    return title
  }
  return [parts, title].filter(Boolean).join(' ')
}
