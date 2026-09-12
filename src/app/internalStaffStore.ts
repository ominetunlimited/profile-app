/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 *
 * Patch (pre-Phase-7) B9: the Owner role can create unlimited scoped Admins.
 * This mirrors the shape of OrgAdminRoleV3's permission-matrix idea
 * (accountTypes.ts) but for PROFILE's *own* internal staff, not an
 * organisation's — a separate concept, never merged with OrgAdminRoleV3.
 */
export type InternalScope =
  | 'mission_control'
  | 'ai_decision_log'
  | 'route_integrity'
  | 'verification_review'
  | 'content_console'

export const INTERNAL_SCOPES: { value: InternalScope; label: string }[] = [
  { value: 'mission_control', label: 'Mission Control' },
  { value: 'ai_decision_log', label: 'AI Decision Log' },
  { value: 'route_integrity', label: 'Route Integrity Engine' },
  { value: 'verification_review', label: 'Verification Review' },
  { value: 'content_console', label: 'Owner Content Console' },
]

export interface ScopedAdmin {
  id: string
  email: string
  label: string
  scopes: InternalScope[]
  createdAt: string
  createdBy: string
}

const STORAGE_KEY = 'profile:demo-scoped-admins'

function readAll(): ScopedAdmin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(admins: ScopedAdmin[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(admins))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listScopedAdmins(): ScopedAdmin[] {
  return readAll()
}

export function addScopedAdmin(input: { email: string; label: string; scopes: InternalScope[]; createdBy: string }): ScopedAdmin {
  const admin: ScopedAdmin = {
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: input.email,
    label: input.label,
    scopes: input.scopes,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  }
  const all = readAll()
  all.push(admin)
  writeAll(all)
  return admin
}

export function revokeScopedAdmin(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id))
}
