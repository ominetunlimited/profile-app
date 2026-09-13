import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { listNotifications, markAllRead, markRead, type NotificationCategory } from '@/app/notificationStore'

/** data-model.md Notification.category, verbatim. */
const CATEGORIES: (NotificationCategory | 'all')[] = ['all', 'verification', 'messages', 'opportunities', 'community', 'security', 'marketing']

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

  const filtered = tab === 'all' ? items : items.filter((i) => i.category === tab)

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-0">Notifications</h1>
          {items.some((i) => !i.read) && (
            <button
              onClick={() => {
                markAllRead(owner)
                setItems(listNotifications(owner))
              }}
              className="text-xs font-semibold text-accent"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
                tab === c ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'
              }`}
            >
              {c}
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
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id)
                  navigate(n.deepLink)
                }}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left ${n.read ? 'border-border bg-surface' : 'border-accent bg-surface-sunken'}`}
              >
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-text-2">{n.category}</span>
                <span className="flex-1 text-sm text-text-0">{n.text}</span>
                <span className="flex-none text-xs text-text-2">{new Date(n.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
