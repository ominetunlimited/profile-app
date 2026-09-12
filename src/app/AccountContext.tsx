import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Account, OrgHubProfile, Sector } from './accountTypes'
import { hubForOrgType, sectorForOrgType } from './accountTypes'

/**
 * Patch (pre-Phase-7) B9: 'owner' added alongside the existing generic
 * 'internal_staff' — Owner is the one role that can create/scope/revoke
 * other Admins (internalStaffStore.ts's ScopedAdmin records), everything
 * else that already checked `staffRole === 'internal_staff'` now also
 * accepts 'owner' (owner is a superset, never a separate silo).
 */
export type StaffRole = 'internal_staff' | 'owner' | null

interface AccountContextValue {
  account: Account | null
  /** null when signed out; distinct from any external account type (build doc §3.4). */
  staffRole: StaffRole
  hub: OrgHubProfile | null
  sector: Sector | null
  setAccount: (account: Account | null) => void
  setStaffRole: (role: StaffRole) => void
}

const AccountContext = createContext<AccountContextValue | null>(null)

/**
 * Dev-only persistence so the AccountSwitcher's pick survives a full page
 * navigation/reload — there's no real session yet (Phase 1 replaces this with
 * a server-backed session). Never treat sessionStorage as an auth boundary.
 */
const STORAGE_KEY = 'profile:dev-account-state'

function loadPersisted(): { account: Account | null; staffRole: StaffRole } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { account: null, staffRole: null }
    return JSON.parse(raw)
  } catch {
    return { account: null, staffRole: null }
  }
}

function persist(account: Account | null, staffRole: StaffRole) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ account, staffRole }))
  } catch {
    // sessionStorage unavailable — dev convenience only, safe to no-op.
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const initial = loadPersisted()
  const [account, setAccount] = useState<Account | null>(initial.account)
  const [staffRole, setStaffRole] = useState<StaffRole>(initial.staffRole)

  // Single effect over both fields — avoids the two setters' persist() calls
  // clobbering each other with stale closure state when called back-to-back.
  useEffect(() => {
    persist(account, staffRole)
  }, [account, staffRole])

  const value = useMemo<AccountContextValue>(() => {
    const hub = account?.accountType === 'organisation' ? hubForOrgType(account.orgType) : null
    const sector = account?.accountType === 'organisation' ? sectorForOrgType(account.orgType) : null
    return { account, staffRole, hub, sector, setAccount, setStaffRole }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, staffRole])

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

/** The single shared AccountContext source (build doc §7) — never re-derive locally. */
export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used within AccountProvider')
  return ctx
}
