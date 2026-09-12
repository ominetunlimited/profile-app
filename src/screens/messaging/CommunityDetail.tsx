import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { COMMUNITY_SEEDS, isMember, memberCount, toggleMembership } from '@/app/communitiesStore'

const TABS = ['discussions', 'members', 'about'] as const

/** §21.2 Community Detail — discussions/members/about. */
export function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const community = COMMUNITY_SEEDS.find((c) => c.id === id)
  const [tab, setTab] = useState<(typeof TABS)[number]>('discussions')
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [, forceRender] = useState(0)

  if (!community) {
    return (
      <AppShell>
        <div className="p-10 text-center text-sm text-text-1">No community found at this address.</div>
      </AppShell>
    )
  }

  const member = isMember(owner, community.id)

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-0">{community.name}</h1>
            <p className="text-sm text-text-1">
              {community.type} · {memberCount(community.id)} member{memberCount(community.id) === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => {
              toggleMembership(owner, community.id)
              forceRender((n) => n + 1)
            }}
            className={`flex-none rounded-lg border px-4 py-2 text-sm font-semibold ${member ? 'border-border-strong text-text-1' : 'border-accent text-accent'}`}
          >
            {member ? 'Leave' : 'Join'}
          </button>
        </div>

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

        {tab === 'discussions' &&
          (member ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
              No discussions started yet — be the first.
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
              Join to see and start discussions.
            </div>
          ))}

        {tab === 'members' && (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-1">
            {memberCount(community.id) === 0 ? 'No members yet.' : `${memberCount(community.id)} member(s) — member directory isn't built yet in this phase.`}
          </div>
        )}

        {tab === 'about' && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-1">{community.description}</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
