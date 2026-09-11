export const TEMPLATE_FAMILIES = {
  FAMILY_A: 'SGQ — Português (PSGQ/FSGQ/ITSGQ)',
  FAMILY_B: 'Técnico/CQ — Bilíngue (CDE)',
} as const

export type TemplateFamilyType = 'SGQ — Português (PSGQ/FSGQ/ITSGQ)' | 'Técnico/CQ — Bilíngue (CDE)'

/**
 * Infere a família de template a partir do prefixo do código do documento
 * Regra do cliente:
 * PSGQ / FSGQ / ITSGQ / MSGQ / ISSGQ -> Família A (SGQ em Português)
 * Senão (CDE, PR-CQ, IT-CQ, CQS, LP, ASME, etc.) -> Família B (Técnico / CQ Bilíngue)
 */
export function inferTemplateFamily(prefix?: string, code?: string): TemplateFamilyType {
  const norm = (prefix || '').trim().toUpperCase()
  const codeNorm = (code || '').trim().toUpperCase()

  if (
    norm.startsWith('PSGQ') ||
    norm.startsWith('FSGQ') ||
    norm.startsWith('ITSGQ') ||
    norm.startsWith('MSGQ') ||
    norm.startsWith('ISSGQ') ||
    codeNorm.startsWith('PSGQ') ||
    codeNorm.startsWith('FSGQ') ||
    codeNorm.startsWith('ITSGQ') ||
    codeNorm.startsWith('MSGQ') ||
    codeNorm.startsWith('ISSGQ')
  ) {
    return TEMPLATE_FAMILIES.FAMILY_A
  }

  return TEMPLATE_FAMILIES.FAMILY_B
}

/**
 * Retorna o tipo/assunto descritivo conforme o prefixo para o cabeçalho do documento SGQ
 */
export function getDocumentSubjectType(prefix?: string): string {
  const p = (prefix || '').trim().toUpperCase()
  if (p === 'PSGQ') return 'Procedimento do Sistema de Gestão da Qualidade'
  if (p === 'ITSGQ' || p === 'IT-CQ')
    return 'Instrução de Trabalho do Sistema de Gestão da Qualidade'
  if (p === 'FSGQ') return 'Formulário do Sistema de Gestão da Qualidade'
  if (p === 'MSGQ') return 'Manual do Sistema de Gestão da Qualidade'
  if (p === 'PR-CQ') return 'Procedimento do Controle da Qualidade'
  if (p === 'CDE') return 'Procedimento Técnico de Engenharia e CQ'
  return 'Procedimento do Sistema de Gestão da Qualidade'
}
