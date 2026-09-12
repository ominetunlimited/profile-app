import { useAccount } from '@/app/AccountContext'
import type { OrgAdminRoleV3, OrganisationType, OrgRegistryLevel } from '@/app/accountTypes'
import { ORGANISATION_TYPES } from '@/app/accountTypes'
import { ensureGovernmentFixtureSeeded, ensureInstitutionFixtureSeeded, ensureOminetDigitalSeeded, ensureOminiNfawaSeeded } from './seedDemoData'

const ORG_ADMIN_ROLES: OrgAdminRoleV3[] = ['super_admin', 'admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer']
const REGISTRY_LEVELS: OrgRegistryLevel[] = ['verified', 'recognized', 'user_submitted', 'rejected']

/**
 * Dev-only tool for exercising every gate combination without repeating the
 * real Sign In / Account Creation flow (§8) each time, and for staff role and
 * org-internal roles, neither of which has a self-serve entry point yet
 * (§3.4 internal-only; §42's multi-seat invite flow isn't built). Not part of
 * the shipped product.
 */
export function AccountSwitcher() {
  const { account, staffRole, hub, setAccount, setStaffRole } = useAccount()
  const isOrg = account?.accountType === 'organisation'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-wrap items-center gap-3 border-t border-border-strong bg-surface px-4 py-2 font-mono text-xs text-text-1">
      <span className="text-text-2">PROFILE DEMO</span>
      <button
        className="rounded border border-accent px-2 py-1 font-semibold text-accent hover:bg-surface-sunken"
        onClick={() => {
          const seeded = ensureOminiNfawaSeeded()
          setAccount(seeded)
          setStaffRole(null)
        }}
      >
        👤 Omini Nfawa · @ominet
      </button>
      <button
        className="rounded border border-accent px-2 py-1 font-semibold text-accent hover:bg-surface-sunken"
        onClick={() => {
          const seeded = ensureOminetDigitalSeeded()
          setAccount(seeded)
          setStaffRole(null)
        }}
      >
        🏢 Ominet Digital · @ominetdigital
      </button>
      <button
        className="rounded border border-border px-2 py-1 text-text-1 hover:border-accent"
        onClick={() => {
          setAccount(ensureInstitutionFixtureSeeded())
          setStaffRole(null)
        }}
      >
        🎓 Institution fixture (test)
      </button>
      <button
        className="rounded border border-border px-2 py-1 text-text-1 hover:border-accent"
        onClick={() => {
          setAccount(ensureGovernmentFixtureSeeded())
          setStaffRole(null)
        }}
      >
        🏛️ Government fixture (test)
      </button>
      <span className="text-text-2">|</span>
      <span className="text-text-2">DEV ACCOUNT SWITCHER</span>
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={() => {
          setAccount(null)
          setStaffRole(null)
        }}
      >
        Signed out
      </button>
      <button
        className="rounded border border-border px-2 py-1 hover:border-accent"
        onClick={() => {
          setAccount({
            accountType: 'individual',
            pathway: 'professional',
            legalName: 'Dev Test User',
            username: 'devtestuser',
            headline: 'Dev Test Headline',
            email: 'dev@example.com',
            country: 'Nigeria',
          })
          setStaffRole(null)
        }}
      >
        Individual (quick-set)
      </button>
      <select
        className="rounded border border-border bg-surface px-2 py-1"
        value={isOrg ? account.orgType : ''}
        onChange={(e) => {
          const orgType = e.target.value as OrganisationType
          if (!orgType) return
          setAccount({
            accountType: 'organisation',
            orgType,
            legalName: `Dev Test ${orgType}`,
            officialEmail: 'admin@devtest.org',
            country: 'Nigeria',
            registryLevel: 'verified',
            orgRole: 'super_admin',
          })
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
        onClick={() => document.documentElement.classList.toggle('dark')}
      >
        Toggle theme
      </button>
      <span className="ml-auto text-text-2">
        current: {staffRole ?? account?.accountType ?? 'signed out'}
        {isOrg ? ` (${account.orgType} → ${hub}, ${account.registryLevel}, ${account.orgRole})` : ''}
      </span>
    </div>
  )
}
