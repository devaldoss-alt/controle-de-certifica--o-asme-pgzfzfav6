export function localizedField(
  ptValue: string | undefined | null,
  enValue: string | undefined | null,
  lang: string,
): string {
  if (lang === 'en' && enValue && enValue.trim() !== '') {
    return enValue.trim()
  }
  return ptValue || ''
}
