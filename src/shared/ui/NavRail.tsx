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

  const groups: { label?: string; tone: string; items: RailItem[] }[] = [
    {
      tone: 'bg-surface-secondary text-accent',
      items: [
        { key: 'home', label: 'Home', to: '/home', Icon: IconHome },
        { key: 'connections', label: 'Connections', to: '/connections', Icon: IconHandshake },
        { key: 'opportunities', label: 'Opportunities', to: '/opportunities', Icon: IconBriefcase, count: openJobs },
        { key: 'messages', label: 'Messages', to: '/messages', Icon: IconMessage, count: unread },
      ],
    },
    {
      label: 'Trust & identity',
      tone: 'bg-trust-soft text-trust',
      items: [
        { key: 'trust', label: 'Trust Center', to: '/trust-passport', Icon: IconMedal },
        { key: 'cv', label: 'CV / Portfolio', to: '/career/cv/executive', Icon: IconDocument },
      ],
    },
    {
      label: 'Growth',
      tone: 'bg-gold-soft text-gold',
      items: [
        { key: 'growth', label: 'Career Growth', to: '/career-growth', Icon: IconSeedling },
        { key: 'learning', label: 'Learning', to: '/learn', Icon: IconGraduationCap },
      ],
    },
  ]

  return (
    <nav
      aria-label="Primary"
      className="sticky top-[53px] hidden h-[calc(100vh-53px)] w-[240px] min-w-[200px] flex-none flex-col gap-5 overflow-y-auto border-e border-border bg-surface px-3 py-4 md:flex"
    >
      {groups.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {g.label && <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-text-2">{g.label}</div>}
          {g.items.map(({ key, label, to, Icon, count }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`) || (key === 'cv' && pathname.startsWith('/career/cv'))
            return (
              <Link
                key={key}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`group flex min-h-[42px] items-center gap-2.5 rounded-xl px-2 text-sm font-medium transition-colors ${active ? 'bg-accent-solid text-white shadow-md' : 'text-text-1 hover:bg-surface-sunken'}`}
              >
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${active ? 'bg-white/20 text-white' : g.tone}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">{label}</span>
                {count ? (
                  <span className={`flex-none rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-surface-secondary text-accent'}`}>{count}</span>
                ) : null}
              </Link>
            )
          })}
        </div>
      ))}
      <div className="mt-auto border-t border-dashed border-border-strong pt-3">
        <button type="button" onClick={onOpenAll} className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-2 text-start text-sm font-medium text-text-1 hover:bg-surface-sunken">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-sunken text-text-1"><IconMenu16 /></span>
          <span>All of PROFILE</span>
        </button>
      </div>
    </nav>
  )
}

function IconMenu16() {
  return <span aria-hidden className="h-4 w-4 flex-none rounded border-[1.5px] border-text-1" />
}
