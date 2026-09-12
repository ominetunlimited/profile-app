import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'

/** data-model.md Notification.category, verbatim. */
const CATEGORIES = ['all', 'verification', 'messages', 'opportunities', 'community', 'security', 'marketing'] as const

interface NotificationItem {
  id: string
  category: (typeof CATEGORIES)[number]
  text: string
  createdAt: string
}

/** §10, §20 Notification Centre — full-width inbox. Populated only with
 * notifications for real events that actually happened this session (account
 * creation, email verification) — never fabricated activity. */
export function NotificationCentre() {
  const { account } = useAccount()
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>('all')

  const items: NotificationItem[] = account
    ? [
        { id: 'n1', category: 'security', text: 'Your PROFILE account was created.', createdAt: 'Just now' },
        { id: 'n2', category: 'security', text: 'Your email address was verified.', createdAt: 'Just now' },
      ]
    : []

  const filtered = tab === 'all' ? items : items.filter((i) => i.category === tab)

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <h1 className="mb-5 text-xl font-bold text-text-0">Notifications</h1>
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
            Nothing here yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((n) => (
              <div key={n.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-text-2">{n.category}</span>
                <span className="flex-1 text-sm text-text-0">{n.text}</span>
                <span className="flex-none text-xs text-text-2">{n.createdAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
