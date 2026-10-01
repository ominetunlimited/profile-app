import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { listNotifications, markAllRead, markRead, onNotificationsChange, type NotificationCategory } from '@/app/notificationStore'

/** data-model.md Notification.category, verbatim. */
const CATEGORIES: (NotificationCategory | 'all')[] = ['all', 'verification', 'messages', 'opportunities', 'community', 'security', 'marketing']
// Design handoff gap audit: CSS `capitalize` on the raw category key only
// uppercases its first letter — real Title Case display labels instead.
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  all: 'All',
  verification: 'Verification',
  messages: 'Messages',
  opportunities: 'Opportunities',
  community: 'Community',
  security: 'Security',
  marketing: 'Marketing',
}

/** PROFILE Notification Centre.dc.html's row layout uses a colored icon
 * square per notification, not a plain text badge — its own 6 example rows
 * don't map 1:1 onto this build's real category enum, so glyphs/tones are
 * chosen per real category rather than copied verbatim. */
const CATEGORY_GLYPH: Record<NotificationCategory, { glyph: string; bg: string; ink: string }> = {
  verification: { glyph: '✓', bg: 'bg-trust-soft', ink: 'text-trust' },
  messages: { glyph: '@', bg: 'bg-accent-soft', ink: 'text-accent' },
  opportunities: { glyph: '!', bg: 'bg-success-soft', ink: 'text-success' },
  community: { glyph: '◍', bg: 'bg-accent-soft', ink: 'text-accent' },
  security: { glyph: '!', bg: 'bg-warning-soft', ink: 'text-warning' },
  marketing: { glyph: '✎', bg: 'bg-surface-sunken', ink: 'text-text-1' },
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

  const filtered = tab === 'all' ? items : items.filter((i) => i.category === tab)

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-0">Notifications</h1>
          <div className="flex items-center gap-3">
            {items.some((i) => !i.read) && (
              <button
                onClick={async () => {
                  await markAllRead(owner)
                  setItems(listNotifications(owner))
                }}
                className="text-xs font-semibold text-accent"
              >
                Mark all read
              </button>
            )}
            <Link to="/settings?tab=notifications" className="text-xs font-semibold text-text-1 hover:text-accent">
              Preferences
            </Link>
          </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                tab === c ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            Nothing here yet — real notifications appear as people follow, connect, comment, credit you, or reference
            work you're associated with.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((n) => {
              const g = CATEGORY_GLYPH[n.category]
              return (
                <button
                  key={n.id}
                  onClick={async () => {
                    await markRead(n.id)
                    navigate(n.deepLink)
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left ${n.read ? 'border-border bg-surface' : 'border-border bg-surface-sunken'}`}
                >
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xs font-bold ${g.bg} ${g.ink}`}>{g.glyph}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm text-text-0 ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.text}</span>
                    <span className="mt-0.5 block text-xs text-text-2">
                      {new Date(n.createdAt).toLocaleDateString()} · {CATEGORY_LABEL[n.category]}
                    </span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
