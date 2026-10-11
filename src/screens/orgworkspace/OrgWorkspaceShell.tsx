import { Link } from 'react-router-dom'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import type { ReactNode } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ORG_TRUST_STATUS_LABEL, hubForOrgType, type Account } from '@/app/accountTypes'
import { BRAND } from '@/shared/brand/assets'
import { IconCheck, IconClose } from '@/shared/ui/icons'

const HUB_LABEL: Record<string, string> = {
  business_hub: 'Business hub',
  institutional_hub: 'Institution hub',
  regulatory_console: 'Government console',
}

/** A workspace's own section nav item — either a real route (`to`, e.g.
 * Analytics/Schemas which are genuinely separate pages) or an in-page tab
 * switch (`onSelect`), matching how each of PROFILE Organization/Institution/
 * Government Workspace.dc.html's own `nav` array mixes both. */
export interface OrgNavItem {
  key: string
  label: string
  active: boolean
  to?: string
  onSelect?: () => void
}

/**
 * Shared Org Workspace shell (build doc §6: "build the shared Org Workspace
 * shell first, then layer sector-scoped module visibility on top of it — do
 * not fork a separate codebase per sector"). Every /org, /institution,
 * /government route renders through this one shell.
 *
 * Design handoff gap audit: rebuilt from a top pill-tab bar to the real
 * left-sidebar nav every one of PROFILE Organization/Institution/Government
 * Workspace.dc.html actually specifies (200-210px fixed rail, logo + org
 * name, stacked nav buttons with a small bordered-square bullet, an
 * identity chip pinned to the bottom via a dashed top border) — confirmed
 * by re-reading all three source files directly, not assumed from memory.
 * The mockups' own persona identity chip ("Registrar's Office · Admin",
 * "Ngozi Abara · Admin") is illustrative; this build's OrganisationAccount
 * has no separate signed-in-staff-person identity distinct from the
 * account itself, so the real equivalent shown is the account's own
 * officialEmail and orgRole.
 */
export function OrgWorkspaceShell({ title, navItems, children }: { title: string; navItems: OrgNavItem[]; children: ReactNode }) {
  const { account } = useAccount()
  if (!account || account.accountType !== 'organisation') return null
  const hub = hubForOrgType(account.orgType)

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-97px)] flex-col sm:flex-row">
        <nav className="flex flex-none flex-row gap-1 overflow-x-auto border-b border-border bg-surface-sunken p-2.5 sm:w-[210px] sm:flex-col sm:gap-0.5 sm:overflow-visible sm:border-b-0 sm:border-e sm:p-3">
          <div className="mb-3.5 hidden items-center gap-2 px-2 sm:flex">
            <img src={BRAND.mark} alt="" className="h-[22px] w-auto" />
            <span className="truncate text-[12.5px] font-bold text-text-0">{account.legalName}</span>
          </div>
          {navItems.map((item) => {
            const inner = (
              <>
                <span className={`h-3.5 w-3.5 flex-none rounded ${item.active ? 'border-[1.5px] border-accent' : 'border-[1.5px] border-text-1'}`} />
                <span className={`whitespace-nowrap text-xs ${item.active ? 'font-semibold text-accent' : 'text-text-1'}`}>{item.label}</span>
              </>
            )
            const cls = `flex min-h-[38px] flex-none items-center gap-2.5 rounded-lg px-2.5 text-left ${item.active ? 'bg-accent-soft' : ''}`
            return item.to ? (
              <Link key={item.key} to={item.to} className={cls}>
                {inner}
              </Link>
            ) : (
              <button key={item.key} onClick={item.onSelect} className={cls}>
                {inner}
              </button>
            )
          })}
          <div className="mt-auto hidden items-center gap-2 border-t border-dashed border-border-strong pt-3 ps-2 sm:flex">
            <UserAvatar ownerEmail={account.officialEmail} name={account.legalName} size={26} />
            <span className="truncate text-[11.5px] text-text-1">
              {account.officialEmail} · {account.orgRole.replace(/_/g, ' ')}
            </span>
          </div>
        </nav>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-0 sm:text-2xl">{title}</h1>
            <StatusBadge account={account} />
          </div>
          <p className="mb-5 text-sm text-text-1">
            {account.orgType} · {HUB_LABEL[hub] ?? hub.replace(/_/g, ' ')}
          </p>
          {children}
        </div>
      </div>
    </AppShell>
  )
}

/**
 * A handful of workspace pages reached via "Open X →" links (Institution/
 * Government Analytics, Recruiter Workflow, Credential Schema Builder,
 * Enterprise Integrations) are standalone pages in their own mockups — no
 * sidebar, just a small breadcrumb label or a "← <org> workspace" back-link
 * above the title. Confirmed by reading each file directly rather than
 * assumed from the sidebar-shell pattern the three main workspace screens
 * use.
 */
export function OrgSubPageShell({
  crumb,
  back,
  title,
  children,
}: {
  crumb?: string
  back?: { to: string; label: string }
  title: string
  children: ReactNode
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
        {back && (
          <Link to={back.to} className="mb-2.5 inline-block text-sm font-semibold text-accent">
            ← {back.label}
          </Link>
        )}
        {crumb && <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-2">{crumb}</div>}
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">{title}</h1>
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
          <Condition ok={verifiedOk} label="Registry status is 'verified'" />
        </div>
        <p className="text-sm text-text-1">
          {!verifiedOk && 'A PROFILE team member confirms your domain and registration before this unlocks — no shortcut, not even for admins.'}
        </p>
      </div>
    </AppShell>
  )
}

/**
 * §34.2a sector gating — a finer-grained denial than HubAccessDenied for a
 * tool that's real for only part of a shared hub (e.g. Credential Schema
 * Builder / Institution Analytics are University/Polytechnic/College/
 * School-specific within institutional_hub; Recruiter Hub is company-sector
 * only within business_hub; Licence confirmations is regulatory_body-only
 * within regulatory_console). Shown only once hub(+verified, where that
 * applies) already passed — this is the next condition down, not a
 * replacement for HubAccessDenied. `scopeDescription` names exactly which
 * sector(s) the tool IS real for, since that differs per caller.
 */
export function SectorAccessDenied({ toolName, scopeDescription }: { toolName: string; scopeDescription: string }) {
  const { account } = useAccount()
  if (!account || account.accountType !== 'organisation') return null
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="mb-3 text-lg font-semibold text-text-0">{toolName} isn't available for {account.orgType} accounts</h1>
        <p className="text-sm text-text-1">
          This tool is scoped to {scopeDescription} — a {account.orgType.toLowerCase()} account's hub access covers other
          tools, not this one.
        </p>
      </div>
    </AppShell>
  )
}

function Condition({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-2.5 ${ok ? 'border-success' : 'border-warning'}`}>
      {ok ? <IconCheck size={16} className="flex-none text-success" /> : <IconClose size={16} className="flex-none text-warning" />}
      <span className="text-text-0">{label}</span>
    </div>
  )
}
