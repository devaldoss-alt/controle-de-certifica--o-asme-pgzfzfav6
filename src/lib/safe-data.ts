import { format, differenceInDays, differenceInHours, isValid } from 'date-fns'

export function safeParseDate(value: string | undefined | null): Date | null {
  if (!value || typeof value !== 'string' || value.trim() === '') return null
  const d = new Date(value)
  return isValid(d) ? d : null
}

export function safeFormatDate(
  value: string | undefined | null,
  formatStr: string = 'dd/MM/yyyy',
  placeholder: string = 'N/A',
): string {
  const d = safeParseDate(value)
  if (!d) return placeholder
  try {
    return format(d, formatStr)
  } catch {
    return placeholder
  }
}

export function safeDifferenceInDays(
  value: string | undefined | null,
  reference: Date = new Date(),
): number {
  const d = safeParseDate(value)
  if (!d) return 0
  try {
    return differenceInDays(d, reference)
  } catch {
    return 0
  }
}

export function safeDifferenceInHours(
  value: string | undefined | null,
  reference: Date = new Date(),
): number {
  const d = safeParseDate(value)
  if (!d) return 0
  try {
    return differenceInHours(d, reference)
  } catch {
    return 0
  }
}

export function safeArray<T>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return []
}

export function safeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback
  return String(value)
}

export function safeRole(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return 'Unknown'
  const knownRoles = [
    'Director',
    'QCC',
    'Inspector',
    'AI',
    'Designer',
    'Engineer',
    'CertifyingEngineer',
    'Welder',
    'NDE',
    'Manager',
  ]
  return knownRoles.includes(value) ? value : 'Unknown'
}

export function safeExpandOs(
  expand: unknown,
): { id: string; number: string; client: string } | null {
  if (!expand || typeof expand !== 'object') return null
  const e = expand as Record<string, unknown>
  if (!e.id || typeof e.id !== 'string') return null
  return {
    id: e.id,
    number: safeString(e.number, 'N/A'),
    client: safeString(e.client, 'N/A'),
  }
}
