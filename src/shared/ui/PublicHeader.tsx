import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ColourModeSelect } from '@/shared/ui/ColourModeSelect'
import { useLanguage } from '@/app/LanguageContext'
import { LanguagePicker } from './LanguagePicker'
import { ProfileLogo } from '@/shared/ui/ProfileLogo'

const SOLUTIONS = [
  { title: 'Individuals', sub: 'Build and control your professional identity.' },
  { title: 'Students', sub: 'Turn learning and projects into evidence.' },
  { title: 'Professionals', sub: 'Trusted career history, verified.' },
  { title: 'Freelancers', sub: 'Show what you can actually deliver.' },
  { title: 'Organisations', sub: 'Discover and develop verified talent.' },
  { title: 'Institutions', sub: 'Verify credentials directly.' },
  { title: 'Recruitment partners', sub: 'Discover verified professional talent.' },
  { title: 'Enterprise', sub: 'Connect trust infrastructure to your systems.' },
]

const NAV_LINKS = [
  { to: '/about', key: 'nav.about' },
  { to: '/trust', key: 'nav.trust' },
  { to: '/opportunities', key: 'nav.opportunities' },
  { to: '/career/cv/executive', key: 'nav.career' },
  { to: '/blog', key: 'nav.blog' },
  { to: '/help', key: 'nav.help' },
]

function SolutionsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <span ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-full items-center gap-[5px] whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-text-1 hover:text-text-0"
      >
        Solutions <span aria-hidden className={`text-[9px] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute start-[-4px] top-[calc(100%+8px)] z-50 grid w-[min(560px,calc(100vw-32px))] grid-cols-1 gap-1 rounded-[14px] border border-border bg-surface p-4 shadow-xl sm:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <Link key={s.title} to="/about#solutions" onClick={() => setOpen(false)} className="flex flex-col gap-0.5 rounded-[9px] px-[11px] py-[9px] hover:bg-surface-sunken">
              <span className="text-[12.5px] font-semibold text-text-0">{s.title}</span>
              <span className="text-[11px] text-text-1">{s.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </span>
  )
}

/** Shared header across every public-facing page. */
export function PublicHeader() {
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-8">
        <Link to="/" className="flex flex-none items-center order-1" aria-label="PROFILE home">
          <ProfileLogo variant="horizontal" className="h-7 w-auto sm:h-8" />
        </Link>
        <div className="order-2 ms-auto flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
          <LanguagePicker />
          <ColourModeSelect className="h-[34px]" />
          <Link to="/auth" className="flex h-[34px] items-center rounded-lg px-3 text-sm font-semibold text-text-0">
            {t('nav.signin')}
          </Link>
          <Link to="/auth?mode=signup" className="flex h-[34px] items-center rounded-lg bg-accent-solid px-4 text-sm font-semibold text-white">
            {t('nav.openProfile')}
          </Link>
        </div>
        <nav aria-label="Primary" className="order-3 flex w-full flex-wrap gap-1">
          {NAV_LINKS.map((l, i) => (
            <span key={l.to} className="contents">
              <Link to={l.to} className="rounded-lg px-2.5 py-2 text-sm font-medium text-text-1 hover:text-text-0">
                {t(l.key)}
              </Link>
              {i === 0 && <SolutionsMenu />}
            </span>
          ))}
        </nav>
      </div>
    </header>
  )
}
