export interface DmsPrefix {
  prefix: string
  label_pt: string
  label_en: string
}

export const DMS_PREFIXES: DmsPrefix[] = [
  { prefix: 'PSGQ', label_pt: 'Procedimentos do SGQ', label_en: 'QMS Procedures' },
  { prefix: 'MN-AD', label_pt: 'Manuais', label_en: 'Manuals' },
  { prefix: 'PR-CQ', label_pt: 'Procedimentos de Qualidade', label_en: 'Quality Procedures' },
  { prefix: 'PR-EN', label_pt: 'Procedimentos de Engenharia', label_en: 'Engineering Procedures' },
  { prefix: 'IT-CQ', label_pt: 'Instruções de Trabalho - CQ', label_en: 'Work Instructions - QC' },
  {
    prefix: 'IT-EN',
    label_pt: 'Instruções de Trabalho - ENG',
    label_en: 'Work Instructions - ENG',
  },
  { prefix: 'RG-CQ', label_pt: 'Registros de Qualidade', label_en: 'Quality Records' },
  { prefix: 'RG-EN', label_pt: 'Registros de Engenharia', label_en: 'Engineering Records' },
]

export function getPrefixLabel(prefix: string, lang: string): string {
  const found = DMS_PREFIXES.find((p) => p.prefix === prefix)
  if (!found) return prefix
  return lang === 'en' ? found.label_en : found.label_pt
}

export interface DocumentFormData {
  title: string
  content: string
  category: string
  filePath: string
  prefix: string
  code: string
  revision: string
}
