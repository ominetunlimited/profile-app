import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fontStackFor, isRtl, translate, type LanguageCode } from './i18n'

interface LanguageContextValue {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  dir: 'ltr' | 'rtl'
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'profile:language'

function loadInitial(): LanguageCode {
  try {
    return (localStorage.getItem(STORAGE_KEY) as LanguageCode) || 'en'
  } catch {
    return 'en'
  }
}

/**
 * §30.1: "Full i18n + l10n on every element" — the mechanism, per the
 * Handoff's own i18n & RTL Example screen, is `dir` on the root switching
 * layout direction natively (flex/grid main-axis, default text alignment)
 * rather than a manual mirrored stylesheet. Applied here at the document
 * root rather than the Handoff's single-card scope, so it's real
 * infrastructure, not a one-screen demo — CSS logical layout (flex/grid,
 * `gap` instead of one-sided margins) mirrors automatically; physical
 * utilities (`ml-*`, `text-left`, `left-*`) used elsewhere in this codebase
 * do not auto-flip and are a flagged follow-up, not silently claimed fixed.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(loadInitial)
  const dir = isRtl(language) ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
    document.documentElement.style.fontFamily = fontStackFor(language)
  }, [dir, language])

  function setLanguage(lang: LanguageCode) {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // best-effort persistence only
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t: (key: string) => translate(language, key) }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
