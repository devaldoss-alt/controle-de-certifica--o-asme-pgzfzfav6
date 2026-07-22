export interface DmsPrefix {
  prefix: string
  label_pt: string
  label_en: string
}

export const DMS_PREFIXES: DmsPrefix[] = [
  { prefix: 'ASME PSC', label_pt: 'ASME PSC', label_en: 'ASME PSC' },
  {
    prefix: 'CDE-PS',
    label_pt: 'CDE-PS - Controle Dimensional',
    label_en: 'CDE-PS - Dimensional Control',
  },
  {
    prefix: 'CQS-PSC',
    label_pt: 'CQS-PSC - Certificado de Qualificação de Soldadores',
    label_en: 'CQS-PSC - Welder Qualification Certificate',
  },
  { prefix: 'EVS-PSC', label_pt: 'EVS-PSC - Ensaio Visual', label_en: 'EVS-PSC - Visual Testing' },
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
  {
    prefix: 'LP-KS',
    label_pt: 'LP-KS - Líquido Penetrante',
    label_en: 'LP-KS - Dye Penetrant Testing',
  },
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
