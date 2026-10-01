import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAccount } from './AccountContext'
import { useAdmin } from './AdminContext'
import type { OrgHubProfile } from './accountTypes'

function Denied({ reason }: { reason: string }) {
  return (
    <div role="alert" className="p-8 text-center text-text-1">
      <p className="font-mono text-sm">Access denied: {reason}</p>
    </div>
  )
}

/** §34.2 ROUTE_GUARD: redirectOnFail '/auth', statePreservation via ?return= query param. */
function useAuthRedirect() {
  const location = useLocation()
  const returnTo = encodeURIComponent(location.pathname + location.search)
  return <Navigate to={`/auth?return=${returnTo}`} replace />
}

export function RequireAuthenticated({ children }: { children: ReactNode }) {
  const { account, staffRole } = useAccount()
  const redirect = useAuthRedirect()
  if (!account && !staffRole) return redirect
  return <>{children}</>
}

export function RequireIndividual({ children }: { children: ReactNode }) {
  const { account } = useAccount()
  const redirect = useAuthRedirect()
  if (!account) return redirect
  if (account.accountType !== 'individual') return <Denied reason="individual accounts only" />
  return <>{children}</>
}

/** Structural gate for organisation-only surfaces — never imports the CV renderer. */
export function RequireOrganisation({
  children,
  hub,
}: {
  children: ReactNode
  hub?: OrgHubProfile | OrgHubProfile[]
}) {
  const { account, hub: accountHub } = useAccount()
  const redirect = useAuthRedirect()
  if (!account) return redirect
  if (account.accountType !== 'organisation') return <Denied reason="organisation accounts only" />
  const allowedHubs = hub ? (Array.isArray(hub) ? hub : [hub]) : null
  if (allowedHubs && (!accountHub || !allowedHubs.includes(accountHub))) {
    return <Denied reason={`requires ${allowedHubs.join(' or ')}`} />
  }
  return <>{children}</>
}

/**
 * Real Admin Centre: a signed-in, active `platform_admins` row (any role)
 * satisfies this exactly like the old dev-only `staffRole` did — so every
 * existing internal screen (Mission Control, Content Console, etc.) is
 * reachable by a genuine admin in production now, not just via the
 * dev-only AccountSwitcher. Both paths are checked independently; neither
 * depends on the other.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { staffRole } = useAccount()
  const { admin, loading } = useAdmin()
  if (loading) return null
  if (staffRole !== 'internal_staff' && staffRole !== 'owner' && !admin) return <Denied reason="PROFILE staff only" />
  return <>{children}</>
}

/** B9: Owner-only surfaces (Admin Management) — a strict subset of RequireStaff.
 * `super_administrator` is the real-admin equivalent of the dev-only 'owner'. */
export function RequireOwner({ children }: { children: ReactNode }) {
  const { staffRole } = useAccount()
  const { admin, loading } = useAdmin()
  if (loading) return null
  if (staffRole !== 'owner' && admin?.role !== 'super_administrator') return <Denied reason="PROFILE Owner only" />
  return <>{children}</>
}
