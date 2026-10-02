import { emitEvent } from './eventBus'

/**
 * §12.6 Trust Passport — design handoff gap audit: PROFILE Profile &
 * Trust.dc.html's whole "share your passport with one party at a time,
 * revoke it later" flow had no real equivalent anywhere in this build.
 * Real, local, persisted share records — same temporary-scaffolding
 * pattern as every other store here. `openedCount` is honestly always 0:
 * there is no real recipient-side session in this build to actually track
 * an open event, so this never fabricates "opened 3 times" the way the
 * mockup's illustrative example does.
 */
export type PassportAccessExpiry = '30_days' | '90_days' | 'until_revoked'

export interface PassportShare {
  id: string
  ownerEmail: string
  sharedWith: string
  accessExpiry: PassportAccessExpiry
  sharedAt: string
  expiresAt: string | null
  revoked: boolean
}

const STORAGE_KEY = 'profile:demo-passport-shares'

function readAll(): PassportShare[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: PassportShare[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

function expiryDate(expiry: PassportAccessExpiry): string | null {
  if (expiry === 'until_revoked') return null
  const days = expiry === '30_days' ? 30 : 90
  return new Date(Date.now() + days * 86400000).toISOString()
}

export function listSharesFor(ownerEmail: string): PassportShare[] {
  const e = ownerEmail.toLowerCase()
  return readAll()
    .filter((s) => s.ownerEmail.toLowerCase() === e && !s.revoked)
    .sort((a, b) => b.sharedAt.localeCompare(a.sharedAt))
}

export function shareTrustPassport(ownerEmail: string, sharedWith: string, accessExpiry: PassportAccessExpiry): PassportShare {
  const record: PassportShare = {
    id: crypto.randomUUID(),
    ownerEmail,
    sharedWith,
    accessExpiry,
    sharedAt: new Date().toISOString(),
    expiresAt: expiryDate(accessExpiry),
    revoked: false,
  }
  writeAll([...readAll(), record])
  return record
}

export function revokePassportShare(id: string, ownerEmail: string): void {
  const all = readAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], revoked: true }
  writeAll(all)
  void emitEvent('passport_revoked', ownerEmail, { deepLink: '/trust-passport', vars: { detail: all[idx].sharedWith } })
}

/** A stable, deterministic, non-fabricated display id — this build has no
 * real PID issuance backend, so this is derived from the owner's own real
 * email rather than a random or invented-looking value re-rolled per
 * render. */
export function displayPid(ownerEmail: string): string {
  let hash = 0
  for (let i = 0; i < ownerEmail.length; i++) hash = (hash * 31 + ownerEmail.charCodeAt(i)) >>> 0
  const hex = hash.toString(16).toUpperCase().padStart(8, '0')
  return `PID-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}
