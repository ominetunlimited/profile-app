import type { Account, OrgRegistryLevel } from './accountTypes'

/**
 * TEMPORARY, NON-SECURE client-only scaffolding so Sign In and Account
 * Creation can be exercised end-to-end before a real backend exists. This is
 * NOT an authentication system — plaintext credentials sit in localStorage,
 * visible to anyone with devtools on this browser profile. It exists only to
 * make Phase 1 demoable and testable, per the same "flag, don't fake" pattern
 * already applied to AccountContext's dev persistence and the Route Integrity
 * Engine's staff gate. Delete this file wholesale when real backend auth
 * (session cookies, hashed passwords, server-side verification) is built —
 * every call site should be replaced, not extended.
 */
interface DemoAccountRecord {
  email: string
  password: string
  account: Account
}

const STORAGE_KEY = 'profile:demo-accounts'
const KNOWN_DEVICE_KEY = 'profile:known-device'

function readAll(): DemoAccountRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(records: DemoAccountRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function saveDemoAccount(email: string, password: string, account: Account) {
  const records = readAll().filter((r) => r.email.toLowerCase() !== email.toLowerCase())
  records.push({ email: email.toLowerCase(), password, account })
  writeAll(records)
}

export function findDemoAccount(email: string, password: string): Account | null {
  const record = readAll().find((r) => r.email.toLowerCase() === email.trim().toLowerCase() && r.password === password)
  return record ? record.account : null
}

export function emailIsRegistered(email: string): boolean {
  return readAll().some((r) => r.email.toLowerCase() === email.trim().toLowerCase())
}

/** For the staff-only Verification Review queue (§16.5/§50.4 OrgClaimRequest)
 * — every organisation account actually registered on this browser, real
 * accounts only, never fabricated queue entries. */
export function listAllOrganisations(): Extract<Account, { accountType: 'organisation' }>[] {
  return readAll()
    .map((r) => r.account)
    .filter((a): a is Extract<Account, { accountType: 'organisation' }> => a.accountType === 'organisation')
}

/** Approve/reject an org's IOTR claim (§50.4) — updates the stored account
 * record; if that org is the currently active AccountContext session, the
 * caller must also call setAccount to refresh the live session. */
export function setOrganisationRegistryLevel(officialEmail: string, level: OrgRegistryLevel) {
  const records = readAll()
  const idx = records.findIndex((r) => r.account.accountType === 'organisation' && r.account.officialEmail === officialEmail)
  if (idx === -1) return
  const acct = records[idx].account
  if (acct.accountType !== 'organisation') return
  records[idx] = { ...records[idx], account: { ...acct, registryLevel: level } }
  writeAll(records)
}

/**
 * Persists an in-place edit to an already-registered account (e.g. Settings
 * → Profile) without needing to know its password, unlike `saveDemoAccount`.
 * No-ops if the email isn't a registered record — callers should also update
 * the live `AccountContext` session themselves via `setAccount`.
 */
export function updateDemoAccount(email: string, account: Account) {
  const records = readAll()
  const idx = records.findIndex((r) => r.email.toLowerCase() === email.toLowerCase())
  if (idx === -1) return
  records[idx] = { ...records[idx], account }
  writeAll(records)
}

/** §7.2 suspicious-login step-up: deterministic per-browser "unrecognised device"
 * simulation (not Math.random() fabrication) — first sign-in on this browser
 * profile always challenges, matching the Handoff's demonstrated MFA state. */
export function isKnownDevice(): boolean {
  try {
    return localStorage.getItem(KNOWN_DEVICE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markDeviceKnown() {
  try {
    localStorage.setItem(KNOWN_DEVICE_KEY, 'true')
  } catch {
    // best-effort
  }
}
