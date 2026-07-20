import type { Language } from '@/lib/i18n'

export function localizedField(
  primary: string | undefined | null,
  en: string | undefined | null,
  lang: Language,
): string {
  if (lang === 'en' && en && typeof en === 'string' && en.trim() !== '') return en
  return primary || ''
}
