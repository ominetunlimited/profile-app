import { useLanguage } from '@/app/LanguageContext'
import { LANGUAGES, type LanguageCode } from '@/app/i18n'

/** §30.1/§30.2 — a real, working language switcher, not a decorative list. */
export function LanguagePicker() {
  const { language, setLanguage } = useLanguage()
  return (
    <select
      aria-label="Language"
      value={language}
      onChange={(e) => setLanguage(e.target.value as LanguageCode)}
      className="h-[34px] rounded-lg border border-border-strong bg-surface px-2 text-xs font-medium text-text-0"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.native}
        </option>
      ))}
    </select>
  )
}
