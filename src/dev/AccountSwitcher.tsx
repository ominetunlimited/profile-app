import { useState } from 'react'
import { setColourMode, resolvedIsDark } from '@/app/theme'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import type { Account, OrgAdminRoleV3, OrganisationType, OrgRegistryLevel } from '@/app/accountTypes'
import { ORGANISATION_TYPES } from '@/app/accountTypes'
import { ensureGovernmentFixtureSeeded, ensureInstitutionFixtureSeeded, ensureOminetDigitalSeeded, ensureOminiNfawaSeeded } from './seedDemoData'
import { emailIsRegistered, ensureSignedInAs, saveDemoAccount, updateDemoAccount, waitForAccountsCacheReady } from '@/app/demoAccountStore'
import { supabase } from '@/app/supabaseClient'

const QUICK_SET_PASSWORD = 'Quick-set-9!'

/** §24/§40's "same underlying data architecture, never fake the demo" rule
 * applies to this quick-set tool too — previously these two accounts only
 * ever existed as in-memory AccountContext state, never registered in
 * demoAccountStore.ts, so Search/`/profile/:username`/Connect/Follow from
 * any OTHER account could never find them at all. */
async function registerQuickSet(email: string, account: Account) {
  await waitForAccountsCacheReady()
  if (!emailIsRegistered(email)) {
    await saveDemoAccount(email, QUICK_SET_PASSWORD, account)
  } else {
    await ensureSignedInAs(email, QUICK_SET_PASSWORD)
    await updateDemoAccount(email, account)
  }
}

const ORG_ADMIN_ROLES: OrgAdminRoleV3[] = ['super_admin', 'admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer']
const REGISTRY_LEVELS: OrgRegistryLevel[] = ['verified', 'recognized', 'user_submitted', 'rejected']

/**
 * Dev-only tool for exercising every gate combination without repeating the
 * real Sign In / Account Creation flow (§8) each time, and for staff role and
 * org-internal roles, neither of which has a self-serve entry point yet
 * (§3.4 internal-only; §42's multi-seat invite flow isn't built). Not part of
 * the shipped product.
 *
 * At phone width this bar's ~15 buttons/selects used to wrap into a fixed
 * strip nearly 40% of the viewport tall, permanently covering the real app
 * on every screen with no way to dismiss it — a real problem for anyone
 * actually viewing the demo on a phone. Below `sm`, it now defaults to a
 * small collapsed pill; tapping it opens the full switcher as a scrollable
 * bottom sheet capped at 70vh, with its own close control. Desktop is
 * unchanged (there's room for the inline bar).
 */
export function AccountSwitcher() {
  const { account, staffRole, hub, setAccount, setStaffRole } = useAccount()
  const navigate = useNavigate()
  const isOrg = account?.accountType === 'organisation'
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="fixed bottom-3 right-3 z-50 rounded-full border border-accent bg-surface px-3 py-2 font-mono text-[11px] font-semibold text-accent shadow-lg sm:hidden"
      >
        {expanded ? 'Close demo ✕' : 'Demo ⚙'}
      </button>
      <div
        className={`${expanded ? 'flex flex-col items-stretch gap-2' : 'hidden'} fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto border-t border-border-strong bg-surface px-4 py-3 font-mono text-xs text-text-1 sm:flex sm:max-h-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:overflow-visible sm:py-2`}
      >
        <button onClick={() => setExpanded(false)} className="self-end rounded border border-border px-2 py-1 text-[11px] font-semibold sm:hidden">
          Close ✕
        </button>
        <span className="text-text-2">PROFILE DEMO</span>
      <button
        className="rounded border border-accent px-2 py-1 font-semibold text-accent hover:bg-surface-sunken"
        onClick={async () => {
          const seeded = await ensureOminiNfawaSeeded()
          setAccount(seeded)
          setStaffRole(null)
          navigate('/home')
        }}
      >
        👤 Omini Nfawa · @ominet
      </button>
      <button
        className="rounded border border-accent px-2 py-1 font-semibold text-accent hover:bg-surface-sunken"
        onClick={async () => {
          const seeded = await ensureOminetDigitalSeeded()
          setAccount(seeded)
          setStaffRole(null)
          navigate('/home')
        }}
      >
        🏢 Ominet Digital · @ominetdigital
      </button>
      <button
        className="rounded border border-border px-2 py-1 text-text-1 hover:border-accent"
        onClick={async () => {
          setAccount(await ensureInstitutionFixtureSeeded())
          setStaffRole(null)
          navigate('/home')
        }}
      >
        🎓 Institution fixture (test)
      </button>
      <button
        className="rounded border border-border px-2 py-1 text-text-1 hover:border-accent"
        onClick={async () => {
          setAccount(await ensureGovernmentFixtureSeeded())
          setStaffRole(null)
          navigate('/home')
        }}
      >
        🏛️ Government fixture (test)
      </button>
      <span className="text-text-2">|</span>
      <span className="text-text-2">DEV ACCOUNT SWITCHER</span>
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={async () => {
          await supabase.auth.signOut()
          setAccount(null)
          setStaffRole(null)
        }}
      >
        Signed out
      </button>
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={async () => {
          const acct: Account = {
            accountType: 'individual',
            pathway: 'professional',
            legalName: 'Dev Test User',
            username: 'devtestuser',
            headline: 'Dev Test Headline',
            email: 'dev@example.com',
            country: 'Nigeria',
          }
          await registerQuickSet(acct.email, acct)
          setAccount(acct)
          setStaffRole(null)
        }}
      >
        Individual (quick-set)
      </button>
      <select
        className="rounded border border-border bg-surface px-2 py-1"
        value={isOrg ? account.orgType : ''}
        onChange={async (e) => {
          const orgType = e.target.value as OrganisationType
          if (!orgType) return
          const acct: Account = {
            accountType: 'organisation',
            orgType,
            legalName: `Dev Test ${orgType}`,
            username: `devtest${orgType.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            officialEmail: 'admin@devtest.org',
            country: 'Nigeria',
            registryLevel: 'verified',
            orgRole: 'super_admin',
          }
          await registerQuickSet(acct.officialEmail, acct)
          setAccount(acct)
          setStaffRole(null)
        }}
      >
        <option value="">Organisation (quick-set)…</option>
        {ORGANISATION_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {isOrg && (
        <>
          <label className="flex items-center gap-1">
            registry:
            <select
              className="rounded border border-border bg-surface px-1.5 py-1"
              value={account.registryLevel}
              onChange={(e) => setAccount({ ...account, registryLevel: e.target.value as OrgRegistryLevel })}
            >
              {REGISTRY_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            role:
            <select
              className="rounded border border-border bg-surface px-1.5 py-1"
              value={account.orgRole}
              onChange={(e) => setAccount({ ...account, orgRole: e.target.value as OrgAdminRoleV3 })}
            >
              {ORG_ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={() => {
          setStaffRole('internal_staff')
          setAccount(null)
        }}
      >
        PROFILE staff
      </button>
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={() => {
          setStaffRole('owner')
          setAccount(null)
        }}
      >
        PROFILE owner
      </button>
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={() => setColourMode(resolvedIsDark() ? 'light' : 'dark')}
      >
        Toggle theme
      </button>
      <span className="sm:ml-auto text-text-2">
        current: {staffRole ?? account?.accountType ?? 'signed out'}
        {isOrg ? ` (${account.orgType} → ${hub}, ${account.registryLevel}, ${account.orgRole})` : ''}
      </span>
      </div>
    </>
  )
}
