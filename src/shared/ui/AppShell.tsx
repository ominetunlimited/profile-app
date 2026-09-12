import { Link, useNavigate } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useAccount } from '@/app/AccountContext'
import { useLanguage } from '@/app/LanguageContext'
import { LanguagePicker } from './LanguagePicker'

/**
 * §10.2 Top App Bar, condensed for this phase — a real, working nav across
 * Home/Opportunities/Messages/Learning/Notifications/Settings, not the full
 * 25-item Hamburger Menu (§10.4). That full ecosystem-wide menu reaches routes
 * this build hasn't built yet (Marketplace, Analytics, Collab Hub, Developer
 * Platform, Admin Centre, …) — outside the declared 43-screen/7-phase scope,
 * and wiring it in piecemeal here would either dead-end on unbuilt routes or
 * require inventing them ahead of their own phase. Flagged as deferred, not
 * silently skipped: build doc §49.3 forbids dead links, so this shell only
 * links to routes that are real in this build.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { account, staffRole, setAccount, setStaffRole } = useAccount()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useLanguage()

  const displayName = account?.accountType === 'individual' ? account.legalName : account?.accountType === 'organisation' ? account.legalName : staffRole ? 'Staff' : 'Guest'
  const cvPortfolioLabel = account?.accountType === 'organisation' ? 'Portfolio' : 'CV'

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/home" className="flex-none text-sm font-bold text-text-0">
            PROFILE
          </Link>
          <nav aria-label="Primary" className="hidden flex-1 items-center gap-1 sm:flex">
            <Link to="/home" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-1 hover:text-text-0">
              {t('nav.home')}
            </Link>
            <Link to="/opportunities" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-1 hover:text-text-0">
              {t('nav.opportunities')}
            </Link>
            <Link to="/messages" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-1 hover:text-text-0">
              Messages
            </Link>
            <Link to="/communities" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-1 hover:text-text-0">
              Communities
            </Link>
            <Link to="/learn" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-1 hover:text-text-0">
              Learning
            </Link>
          </nav>
          <div className="ms-auto flex flex-none items-center gap-1.5">
            <LanguagePicker />
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-1 hover:text-text-0"
            >
              🔔
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
              >
                {displayName.slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div role="menu" className="absolute end-0 top-11 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
                  <div className="px-2.5 py-2 text-xs text-text-2">{displayName}</div>
                  <Link to="/profile/me" onClick={() => setMenuOpen(false)} role="menuitem" className="block rounded-lg px-2.5 py-2 text-sm text-text-0 hover:bg-surface-sunken">
                    My Profile
                  </Link>
                  <Link to="/profile/me?tab=cv-portfolio" onClick={() => setMenuOpen(false)} role="menuitem" className="block rounded-lg px-2.5 py-2 text-sm text-text-0 hover:bg-surface-sunken">
                    My {cvPortfolioLabel}
                  </Link>
                  <Link to="/trust" onClick={() => setMenuOpen(false)} role="menuitem" className="block rounded-lg px-2.5 py-2 text-sm text-text-0 hover:bg-surface-sunken">
                    Trust Centre
                  </Link>
                  <Link to="/settings" onClick={() => setMenuOpen(false)} role="menuitem" className="block rounded-lg px-2.5 py-2 text-sm text-text-0 hover:bg-surface-sunken">
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setAccount(null)
                      setStaffRole(null)
                      setMenuOpen(false)
                      navigate('/')
                    }}
                    className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-danger hover:bg-surface-sunken"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
