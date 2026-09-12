import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { COMMUNITY_SEEDS, isMember, memberCount, toggleMembership } from '@/app/communitiesStore'

const TABS = ['messages', 'communities'] as const

/** §20 Messaging System + §21.2 Communities & Groups — combined per the Handoff's
 * single screen; §10.4 also gives Communities its own top-level route
 * (`/communities`), which lands on this tab directly. */
export function MessagingCommunities({ initialTab }: { initialTab?: (typeof TABS)[number] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab ?? 'messages')
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [, forceRender] = useState(0)

  return (
    <AppShell>
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize ${tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'messages' && (
          <div>
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No conversations yet. On the free plan, messaging works between connections — connect with someone
              from their profile to start a thread.
            </div>
            <p className="mt-4 text-center text-xs text-text-2">Hiring · Collaboration · Verification · Partnership · Consulting · Marketplace threads all live here once started.</p>
          </div>
        )}

        {tab === 'communities' && (
          <div className="flex flex-col gap-3">
            {COMMUNITY_SEEDS.map((c) => {
              const member = isMember(owner, c.id)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/communities/${c.id}`} className="font-semibold text-text-0 hover:text-accent">
                      {c.name}
                    </Link>
                    <div className="text-xs text-text-2">
                      {c.type} · {memberCount(c.id)} member{memberCount(c.id) === 1 ? '' : 's'}
                    </div>
                    <p className="mt-1 text-sm text-text-1">{c.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      toggleMembership(owner, c.id)
                      forceRender((n) => n + 1)
                    }}
                    className={`flex-none rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      member ? 'border-border-strong text-text-1' : 'border-accent text-accent'
                    }`}
                  >
                    {member ? 'Leave' : 'Join'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
