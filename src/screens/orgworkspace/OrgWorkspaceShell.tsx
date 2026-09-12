import { Link, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ORG_TRUST_STATUS_LABEL, hubForOrgType, type Account } from '@/app/accountTypes'

/**
 * Shared Org Workspace shell (build doc §6: "build the shared Org Workspace
 * shell first, then layer sector-scoped module visibility on top of it — do
 * not fork a separate codebase per sector"). Every /org, /institution,
 * /government route renders through this one header/nav, with which nav
 * links show driven by the account's actual hub — not per-route duplication.
 */
export function OrgWorkspaceShell({ title, children }: { title: string; children: ReactNode }) {
  const { account } = useAccount()
  const { id } = useParams<{ id: string }>()
  if (!account || account.accountType !== 'organisation') return null
  const hub = hubForOrgType(account.orgType)
  const orgId = id ?? 'me'

  const links: { to: string; label: string; show: boolean }[] = [
    { to: `/org/${orgId}/talent`, label: 'Talent', show: hub === 'business_hub' || hub === 'community_hub' },
    { to: `/institution/${orgId}`, label: 'Verification Queue', show: hub === 'institutional_hub' },
    { to: `/institution/${orgId}/schemas`, label: 'Schemas', show: hub === 'institutional_hub' },
    { to: `/institution/${orgId}/analytics`, label: 'Analytics', show: hub === 'institutional_hub' },
    { to: `/government/${orgId}`, label: 'Console', show: hub === 'regulatory_console' },
    { to: `/government/${orgId}/analytics`, label: 'Analytics', show: hub === 'regulatory_console' },
    { to: `/org/${orgId}/recruiter`, label: 'Recruiter', show: hub === 'business_hub' },
    { to: `/org/${orgId}/integrations`, label: 'Integrations', show: true },
  ]

  return (
    <AppShell>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-text-0">{account.legalName}</h1>
            <StatusBadge account={account} />
          </div>
          <p className="mb-4 text-sm text-text-1">
            {account.orgType} · {hub}
          </p>
          <nav className="flex flex-wrap gap-1.5">
            {links
              .filter((l) => l.show)
              .map((l) => (
                <Link key={l.to} to={l.to} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-1 hover:border-accent hover:text-text-0">
                  {l.label}
                </Link>
              ))}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h2 className="mb-5 text-lg font-bold text-text-0">{title}</h2>
        {children}
      </div>
    </AppShell>
  )
}

function StatusBadge({ account }: { account: Extract<Account, { accountType: 'organisation' }> }) {
  const verified = account.registryLevel === 'verified'
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${verified ? 'border-success text-success' : 'border-warning text-warning'}`}>
      {ORG_TRUST_STATUS_LABEL[account.registryLevel]}
    </span>
  )
}

/** §10.5/§3.3 hard rule, rendered as a real screen rather than a bare denial —
 * explains exactly which condition is unmet, since "registryLevel==='verified'
 * AND hub match, both required" is easy to half-satisfy during a demo. */
export function HubAccessDenied({ requiredHub }: { requiredHub: 'institutional_hub' | 'regulatory_console' }) {
  const { account } = useAccount()
  if (!account || account.accountType !== 'organisation') return null
  const hub = hubForOrgType(account.orgType)
  const hubOk = hub === requiredHub
  const verifiedOk = account.registryLevel === 'verified'
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="mb-3 text-lg font-semibold text-text-0">
          {requiredHub === 'institutional_hub' ? 'Institution Hub' : 'Government Console'} access requires both conditions
        </h1>
        <div className="mx-auto mb-4 flex max-w-xs flex-col gap-2 text-left text-sm">
          <Condition ok={hubOk} label={`Organisation type maps to ${requiredHub}`} />
          <Condition ok={verifiedOk} label="Registry status is 'verified' (§50.4 IOTR)" />
        </div>
        <p className="text-sm text-text-1">
          {!verifiedOk && 'A PROFILE team member confirms your domain and registration before this unlocks — no shortcut, not even for admins.'}
        </p>
      </div>
    </AppShell>
  )
}

function Condition({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-2.5 ${ok ? 'border-success' : 'border-warning'}`}>
      <span className={ok ? 'text-success' : 'text-warning'}>{ok ? '✓' : '✕'}</span>
      <span className="text-text-0">{label}</span>
    </div>
  )
}

