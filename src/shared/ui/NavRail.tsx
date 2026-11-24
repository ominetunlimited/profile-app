import { Link, useLocation } from 'react-router-dom'
import type { ComponentType } from 'react'
import { useChatVersion, unreadTotal } from '@/app/messageStore'
import { listOpenJobs, useJobsCacheVersion } from '@/app/jobStore'
import { IconBriefcase, IconDocument, IconGraduationCap, IconHandshake, IconHome, IconMedal, IconMessage, IconSeedling, type IconProps } from './icons'

interface RailItem {
  key: string
  label: string
  to: string
  Icon: ComponentType<IconProps>
  count?: number
}

/** The 188px primary navigation rail from the approved Home design — shown to
 * individual accounts from md up (phones use the bottom tabs instead). */
export function NavRail({ onOpenAll }: { onOpenAll: () => void }) {
  const { pathname } = useLocation()
  useChatVersion()
  useJobsCacheVersion()
  const openJobs = listOpenJobs().length
  const unread = unreadTotal()

  const items: RailItem[] = [
    { key: 'home', label: 'Home', to: '/home', Icon: IconHome },
    { key: 'connections', label: 'Connections', to: '/connections', Icon: IconHandshake },
    { key: 'opportunities', label: 'Opportunities', to: '/opportunities', Icon: IconBriefcase, count: openJobs },
    { key: 'messages', label: 'Messages', to: '/messages', Icon: IconMessage, count: unread },
    { key: 'cv', label: 'CV / Portfolio', to: '/career/cv/executive', Icon: IconDocument },
    { key: 'trust', label: 'Trust Center', to: '/trust-passport', Icon: IconMedal },
    { key: 'growth', label: 'Career Growth', to: '/career-growth', Icon: IconSeedling },
    { key: 'learning', label: 'Learning', to: '/learn', Icon: IconGraduationCap },
  ]

  return (
    <nav
      aria-label="Primary"
      className="sticky top-[53px] hidden h-[calc(100vh-53px)] w-[188px] min-w-[170px] flex-none flex-col gap-0.5 overflow-y-auto border-e border-border bg-surface px-2.5 py-3.5 md:flex"
    >
      {items.map(({ key, label, to, Icon, count }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`) || (key === 'cv' && pathname.startsWith('/career/cv'))
        return (
          <Link
            key={key}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[38px] items-center gap-[9px] rounded-[9px] px-2.5 text-[12.5px] ${active ? 'bg-accent-soft font-semibold text-accent' : 'text-text-1 hover:bg-surface-sunken'}`}
          >
            <Icon size={18} className="flex-none" />
            <span className="min-w-0 flex-1">{label}</span>
            {count ? <span className="flex-none font-mono text-[10.5px] tabular-nums text-text-2">{count}</span> : null}
          </Link>
        )
      })}
      <div className="mt-auto border-t border-dashed border-border-strong pt-3">
        <button type="button" onClick={onOpenAll} className="flex min-h-[38px] w-full items-center gap-[9px] rounded-[9px] px-2.5 text-start text-[12.5px] text-text-1 hover:bg-surface-sunken">
          <IconMenu16 />
          <span>All of PROFILE</span>
        </button>
      </div>
    </nav>
  )
}

function IconMenu16() {
  return <span aria-hidden className="h-4 w-4 flex-none rounded border-[1.5px] border-text-1" />
}
