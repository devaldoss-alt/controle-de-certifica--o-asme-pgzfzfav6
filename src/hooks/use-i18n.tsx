import { createContext, useContext, useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTranslation, type Language } from '@/lib/i18n'

interface I18nContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, langOverride?: Language) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within an I18nProvider')
  return context
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('i18n-lang')
    return (saved as Language) || 'pt'
  })

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem('i18n-lang', l)
  }

  const t = (key: string, langOverride?: Language) => getTranslation(key, langOverride || lang)

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function BilingualText({
  k,
  variant = 'inline',
  className,
}: {
  k: string
  variant?: 'inline' | 'stacked'
  className?: string
}) {
  const { lang, t } = useI18n()
  const pt = t(k, 'pt')
  const en = t(k, 'en')

  if (lang === 'pt' || pt === en) {
    return <span className={className}>{pt}</span>
  }

  if (variant === 'stacked') {
    return (
      <span className={cn('flex flex-col leading-tight', className)}>
        <span>{pt}</span>
        <span className="text-xs italic text-muted-foreground">{en}</span>
      </span>
    )
  }

  return (
    <span className={className}>
      {pt} <span className="text-xs italic text-muted-foreground">/ {en}</span>
    </span>
  )
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
      className="text-muted-foreground hover:text-foreground gap-2"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">{lang === 'pt' ? 'PT' : 'EN'}</span>
    </Button>
  )
}
