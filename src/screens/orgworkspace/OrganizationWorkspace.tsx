import { useState } from 'react'
import { OrgWorkspaceShell } from './OrgWorkspaceShell'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan } from '@/app/accountTypes'

const TABS = ['talent-search', 'requests', 'staff'] as const

/** §16/§42 Organization Workspace — talent search, requests, staff. */
export function OrganizationWorkspace() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('talent-search')
  const { account } = useAccount()
  const [query, setQuery] = useState('')
  const canManageHiring = account ? orgRoleCan(account, 'manageHiring') : false

  return (
    <OrgWorkspaceShell title="Organization Workspace">
      <div role="tablist" className="mb-6 flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold capitalize ${tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'talent-search' && (
        <div>
          {!canManageHiring && (
            <div className="mb-4 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
              Your role ({account?.accountType === 'organisation' ? account.orgRole : ''}) doesn't include hiring
              management (§42.2) — you can browse, but posting or pipeline actions are read-only for you.
            </div>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified candidates by skill, trust tier, or profession…"
            className="mb-4 min-h-[44px] w-full rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
          />
          <div className="mb-4 flex flex-wrap gap-1.5">
            {['Verified Identity', 'Verified Education', 'Verified Employment', 'Verified Skills'].map((f) => (
              <span key={f} className="rounded-full border border-border px-3 py-1 text-xs text-text-1">
                {f}
              </span>
            ))}
          </div>
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No candidates match yet — this is a real, ranked search over verified profiles once individuals exist to
            match against in this build.
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          No verification or affiliation requests yet.
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <p className="mb-4 text-sm text-text-1">
            §42.3: staff join via an accept-before-active OrgStaffRecord — no standalone admin accounts.
          </p>
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No staff invited yet. Inviting staff requires a matching-email registration flow not yet built in this
            phase.
          </div>
        </div>
      )}
    </OrgWorkspaceShell>
  )
}
