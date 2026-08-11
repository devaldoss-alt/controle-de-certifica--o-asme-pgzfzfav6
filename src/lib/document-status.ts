const STATUS_DISPLAY: Record<string, string> = {
  Active: 'APROVADO',
  'Under Review': 'EM REVISÃO',
  Obsolete: 'OBSOLETO',
}

const STATUS_FILTER_TO_DB: Record<string, string> = {
  APROVADO: 'Active',
  'EM REVISÃO': 'Under Review',
  OBSOLETO: 'Obsolete',
}

export function displayStatus(status?: string): string {
  if (!status) return '—'
  return STATUS_DISPLAY[status] || status
}

export { STATUS_DISPLAY, STATUS_FILTER_TO_DB }

export function normalizeImportStatus(status?: string): string {
  if (!status) return 'Active'
  const trimmed = status.trim()
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return 'Active'
  if (trimmed === 'Active' || trimmed === 'Obsolete' || trimmed === 'Under Review') return trimmed
  const upper = trimmed.toUpperCase()
  if (upper === 'APROVADO') return 'Active'
  if (upper === 'EM REVISÃO' || upper === 'EM REVISAO') return 'Under Review'
  if (upper === 'OBSOLETO') return 'Obsolete'
  return trimmed
}
