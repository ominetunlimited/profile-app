import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { listNotifications, markAllRead, markRead, onNotificationsChange, type NotificationCategory } from '@/app/notificationStore'

const CATEGORIES: (NotificationCategory | 'all')[] = ['all', 'social', 'messages', 'professional', 'opportunities', 'verification', 'profile', 'community', 'career', 'security', 'system', 'marketing']
// Real Title Case display labels instead of CSS `capitalize` on raw keys.
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  all: 'All',
  social: 'Social',
  messages: 'Messages',
  professional: 'Network',
  opportunities: 'Opportunities',
  verification: 'Verification',
  profile: 'Profile',
  community: 'Community',
  career: 'Career',
  security: 'Security',
  system: 'System',
  marketing: 'News',
}

/** PROFILE Notification Centre.dc.html's row layout uses a colored icon
 * square per notification, not a plain text badge — glyphs/tones are chosen
 * per real category. */
const P: Record<string, string> = {
  heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  chat: 'M4 5h16v11H9l-5 4z',
  users: 'M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20c0-4 3.5-6 8-6s8 2 8 6',
  brief: 'M3 8h18v12H3zM9 8V5h6v3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  user: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4 4-6 8-6s8 2 8 6',
  trend: 'M4 16l5-5 4 4 7-8M15 7h5v5',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3',
  info: 'M12 8v.5M12 11v5M12 3a9 9 0 100 18 9 9 0 000-18z',
  pen: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3',
}
const CATEGORY_GLYPH: Record<NotificationCategory, { icon: string; bg: string; ink: string }> = {
  social: { icon: 'heart', bg: 'bg-accent-soft', ink: 'text-accent' },
  messages: { icon: 'chat', bg: 'bg-accent-soft', ink: 'text-accent' },
  professional: { icon: 'users', bg: 'bg-trust-soft', ink: 'text-trust' },
  opportunities: { icon: 'brief', bg: 'bg-success-soft', ink: 'text-success' },
  verification: { icon: 'shield', bg: 'bg-trust-soft', ink: 'text-trust' },
  profile: { icon: 'user', bg: 'bg-surface-sunken', ink: 'text-text-1' },
  community: { icon: 'users', bg: 'bg-accent-soft', ink: 'text-accent' },
  career: { icon: 'trend', bg: 'bg-success-soft', ink: 'text-success' },
  security: { icon: 'lock', bg: 'bg-warning-soft', ink: 'text-warning' },
  system: { icon: 'info', bg: 'bg-warning-soft', ink: 'text-warning' },
  marketing: { icon: 'pen', bg: 'bg-surface-sunken', ink: 'text-text-1' },
}

function dayBucket(iso: string): 'Today' | 'Yesterday' | 'Earlier' {
  const d = new Date(iso)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const t = start.getTime()
  if (d.getTime() >= t) return 'Today'
  if (d.getTime() >= t - 86400000) return 'Yesterday'
  return 'Earlier'
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

/** §10, §20 Notification Centre — full-width inbox, real events only
 * (notificationStore.ts). Every item deep-links to the entity that
 * generated it — a follow, a connection request, a comment, an
 * attribution credit, a provider reference — never a dead end pointing
 * back at Home. */
export function NotificationCentre() {
  const { account } = useAccount()
  const navigate = useNavigate()
  const owner = ownerKey(account)
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>('all')
  const [items, setItems] = useState(() => listNotifications(owner))

  // Pipeline repair Phase A: the notifications cache loads asynchronously
  // (and receives a Realtime push for every new one) — without this, this
  // list would freeze at whatever the cache held on mount.
  useEffect(() => onNotificationsChange(() => setItems(listNotifications(owner))), [owner])

  const unreadTotal = items.filter((i) => !i.read).length
  const filtered = tab === 'all' ? items : items.filter((i) => i.category === tab)
  const unreadByCategory = (c: (typeof CATEGORIES)[number]) => items.filter((i) => !i.read && (c === 'all' || i.category === c)).length

  const groups = (['Today', 'Yesterday', 'Earlier'] as const)
    .map((label) => ({ label, rows: filtered.filter((n) => dayBucket(n.createdAt) === label) }))
    .filter((g) => g.rows.length > 0)
  const topBtn = 'flex min-h-[40px] items-center rounded-xl border border-border-strong bg-surface px-4 text-[13px] font-semibold text-text-0'

  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 pb-16 pt-6 sm:px-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[clamp(24px,3.4vw,34px)] font-bold leading-tight tracking-tight text-text-0">Notifications</h1>
            <p className="mt-1 text-[14px] text-text-1" role="status" aria-live="polite">
              {unreadTotal > 0 ? `${unreadTotal} unread` : 'You are all caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <button
                onClick={async () => {
                  await markAllRead(owner)
                  setItems(listNotifications(owner))
                }}
                className={topBtn}
              >
                Mark all read
              </button>
            )}
            <Link to="/settings?tab=notifications" className={topBtn}>
              Preferences
            </Link>
          </div>
        </header>

        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Notification categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={tab === c}
              onClick={() => setTab(c)}
              className={`shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-[12.5px] font-semibold ${
                tab === c ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'
              }`}
            >
              {CATEGORY_LABEL[c]}
              {unreadByCategory(c) > 0 && <span className="ms-1.5 rounded-full bg-accent-solid px-1.5 text-[10px] font-bold text-white">{unreadByCategory(c)}</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-sunken p-12 text-center text-sm leading-relaxed text-text-1">
            <p className="mx-auto max-w-[44ch]">Nothing here yet. Notifications appear as people react, comment, message, follow or connect with you.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label}>
                <h2 className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-text-1">{g.label}</h2>
                <div className="flex flex-col gap-2">
                  {g.rows.map((n) => {
                    const c = CATEGORY_GLYPH[n.category]
                    return (
                      <button
                        key={n.id}
                        onClick={async () => {
                          await markRead(n.id)
                          navigate(n.deepLink)
                        }}
                        className={`relative flex min-h-[64px] items-start gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-shadow hover:shadow-md ${
                          n.read ? 'border-border bg-surface' : 'border-accent/30 bg-accent-soft/40'
                        }`}
                      >
                        {!n.read && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent-solid" />}
                        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${c.bg} ${c.ink}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d={P[c.icon]} />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[14.5px] leading-snug text-text-0 ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.text}</span>
                          <span className="mt-1 block text-[12px] text-text-1">
                            {timeAgo(n.createdAt)} · {CATEGORY_LABEL[n.category]}
                            {n.groupCount > 1 ? ` · ${n.groupCount} people` : ''}
                          </span>
                        </span>
                        {!n.read && <span className="sr-only">Unread</span>}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
