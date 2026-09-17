import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { useAccount } from '@/app/AccountContext'
import { useLanguage } from '@/app/LanguageContext'
import { ownerKey } from '@/app/activityStore'
import { getProfileMedia } from '@/app/mediaStore'
import { unreadCount } from '@/app/notificationStore'
import { bottomTabs, hamburgerGroups, profileDrawerItems, topNavItems } from '@/app/navConfig'
import { BRAND } from '@/shared/brand/assets'
import { LanguagePicker } from './LanguagePicker'
import { IconBell, IconBriefcase, IconDocument, IconHandshake, IconHome, IconMenu, IconMessage, IconPlus, IconSearch, type IconProps } from './icons'
import type { ComponentType } from 'react'

const TAB_ICON: Record<string, ComponentType<IconProps>> = {
  home: IconHome,
  connections: IconHandshake,
  create: IconPlus,
  opportunity: IconBriefcase,
  cv_portfolio: IconDocument,
}

/**
 * Recovery patch — §10.1/§10.2/§10.3/§10.4 rebuilt from scratch. Previously
 * this shell hardcoded 5 links total and a 4-item avatar menu; every other
 * real route in the build (Store, Career Engine, Org/Institution/Government
 * workspaces, Owner/Internal tools, and the 8 new recovery-patch screens)
 * had no nav entry anywhere. Everything below reads from navConfig.ts's
 * single account-aware source, so mobile and desktop never drift apart
 * (§10.8's own quality gate).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { account, staffRole, setAccount, setStaffRole } = useAccount()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hamburgerOpen, setHamburgerOpen] = useState(false)
  const { t } = useLanguage()
  const unread = account ? unreadCount(ownerKey(account)) : 0

  const displayName = account?.accountType === 'individual' ? account.legalName : account?.accountType === 'organisation' ? account.legalName : staffRole ? 'Staff' : 'Guest'
  const owner = account ? ownerKey(account) : ''
  const [avatarUrl, setAvatarUrl] = useState(() => (owner ? getProfileMedia(owner).avatarDataUrl : null))

  useEffect(() => {
    function refresh() {
      setAvatarUrl(owner ? getProfileMedia(owner).avatarDataUrl : null)
    }
    refresh()
    window.addEventListener('profile-media-changed', refresh)
    return () => window.removeEventListener('profile-media-changed', refresh)
  }, [owner])

  const drawerItems = profileDrawerItems({ account, staffRole })
  const groups = hamburgerGroups({ account, staffRole })
  const tabs = bottomTabs({ account, staffRole })
  const topItems = topNavItems({ account, staffRole })

  function signOut() {
    setAccount(null)
    setStaffRole(null)
    setMenuOpen(false)
    setHamburgerOpen(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          <Link to="/home" className="flex-none" aria-label="PROFILE home">
            <img src={BRAND.mark} alt="" className="h-7 w-7" />
          </Link>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-global-search'))}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-strong bg-surface-sunken px-3 text-sm text-text-2 sm:max-w-[360px]"
          >
            <IconSearch size={16} />
            <span className="truncate">{t('nav.search')}</span>
            <span className="ms-auto hidden font-mono text-[10px] text-text-2 sm:inline">Ctrl K</span>
          </button>

          <div className="ms-auto flex flex-none items-center gap-1.5">
            <LanguagePicker />
            <Link to="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-1 hover:text-text-0">
              <IconBell size={18} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[9px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link to="/messages" aria-label="Messages" className="hidden h-9 w-9 items-center justify-center rounded-lg text-text-1 hover:text-text-0 sm:flex">
              <IconMessage size={18} />
            </Link>
            <button
              type="button"
              onClick={() => setHamburgerOpen(true)}
              aria-label="Menu"
              aria-haspopup="menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-1 hover:text-text-0"
            >
              <IconMenu size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Profile"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-white"
              >
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div role="menu" className="absolute end-0 top-11 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
                  <div className="px-2.5 py-2 text-xs text-text-2">{displayName}</div>
                  {drawerItems.map((item) => (
                    <Link key={item.key} to={item.to} onClick={() => setMenuOpen(false)} role="menuitem" className="block rounded-lg px-2.5 py-2 text-sm text-text-0 hover:bg-surface-sunken">
                      {item.label}
                    </Link>
                  ))}
                  {(account || staffRole) && (
                    <>
                      <div className="my-1 h-px bg-border" />
                      <button role="menuitem" onClick={signOut} className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-danger hover:bg-surface-sunken">
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {topItems.length > 0 && (
          <nav aria-label="Primary" className="hidden border-t border-border sm:block">
            <div className="mx-auto flex max-w-[1200px] gap-1 px-4 py-1.5 sm:px-6">
              {topItems.map((item) => {
                const active = location.pathname === item.to.split('?')[0]
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${active ? 'bg-surface-sunken text-text-0' : 'text-text-1 hover:text-text-0'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="pb-16 sm:pb-0">{children}</main>

      {tabs.length > 0 && (
        <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur sm:hidden">
          {tabs.map((tab) => {
            const TabIcon = TAB_ICON[tab.key]
            return (
              <Link
                key={tab.key}
                to={tab.to}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-text-1 ${tab.key === 'create' ? 'relative' : ''}`}
              >
                <span className={tab.key === 'create' ? '-mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg' : 'flex items-center justify-center'}>
                  <TabIcon size={tab.key === 'create' ? 22 : 20} />
                </span>
                {tab.key !== 'create' && tab.label}
              </Link>
            )
          })}
        </nav>
      )}

      {hamburgerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setHamburgerOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[320px] flex-col overflow-y-auto border-s border-border bg-surface p-2">
            <div className="flex items-center justify-between px-2 py-2">
              <img src={BRAND.lockup} alt="PROFILE" className="h-5 w-auto" />
              <button onClick={() => setHamburgerOpen(false)} aria-label="Close menu" className="flex h-8 w-8 items-center justify-center rounded-lg text-text-1">
                ✕
              </button>
            </div>
            {groups.map((group, gi) => (
              <div key={group.key}>
                {gi > 0 && <div className="my-1.5 h-px bg-border" />}
                <div className="flex flex-col gap-0.5 py-1">
                  {group.items.map((item) => (
                    <Link key={item.key} to={item.to} onClick={() => setHamburgerOpen(false)} role="menuitem" className="rounded-lg px-3 py-2.5 text-sm text-text-0 hover:bg-surface-sunken">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {(account || staffRole) && (
              <>
                <div className="my-1.5 h-px bg-border" />
                <button onClick={signOut} className="rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-surface-sunken">
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
