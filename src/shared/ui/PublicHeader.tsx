import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useLanguage } from '@/app/LanguageContext'
import { LanguagePicker } from './LanguagePicker'

const NAV_LINKS = [
  { to: '/about', key: 'nav.about' },
  { to: '/trust', key: 'nav.trust' },
  { to: '/opportunities', key: 'nav.opportunities' },
  { to: '/career/cv/executive', key: 'nav.career' },
  { to: '/blog', key: 'nav.blog' },
  { to: '/help', key: 'nav.help' },
]

/** §6.2/§6.9 — shared header across every public-facing page. */
export function PublicHeader() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-8">
        <Link to="/" className="flex flex-none items-center gap-2 order-1" aria-label="PROFILE home">
          <span className="font-sans text-[15px] font-bold tracking-tight text-text-0">PROFILE</span>
        </Link>
        <div className="order-2 ms-auto flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
          <LanguagePicker />
          <button
            type="button"
            onClick={() => {
              document.documentElement.classList.toggle('dark')
              setDark((d) => !d)
            }}
            className="h-[34px] rounded-lg border border-border-strong bg-surface px-3 text-xs font-medium text-text-0"
          >
            {dark ? 'Dark' : 'Light'}
          </button>
          <Link to="/auth" className="flex h-[34px] items-center rounded-lg px-3 text-sm font-semibold text-text-0">
            {t('nav.signin')}
          </Link>
          <Link to="/auth?mode=signup" className="flex h-[34px] items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white">
            {t('nav.openProfile')}
          </Link>
        </div>
        <nav aria-label="Primary" className="order-3 flex w-full flex-wrap gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-2.5 py-2 text-sm font-medium text-text-1 hover:text-text-0">
              {t(l.key)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
