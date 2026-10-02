import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import type { Account, OrgRegistryLevel } from './accountTypes'

/**
 * Pipeline repair Phase A — real Supabase Auth + `public.accounts` (RLS-backed),
 * replacing the old `localStorage` scaffolding this file used to be. This is
 * what makes S1/S2/S3 (accounts and content invisible across users/devices)
 * actually fixed: `accounts` rows live in Postgres, readable by every browser
 * per the `public select` RLS policy in supabase/migrations/0001_init.sql,
 * not just the one that created them.
 *
 * Signup/sign-in/update/password functions are genuinely `async` now — they
 * are real network calls, and every call site already invokes them from an
 * event handler or effect, so adding `await` there is mechanical. The *read*
 * functions (`listAllAccounts`, `findAccountByEmail`, `findAccountByUsername`,
 * `listAllOrganisations`, `emailIsRegistered`) stay synchronous on purpose:
 * ~30 screens/components call them inline during render (e.g. `ActivityCard`
 * resolving an author's name), and forcing those to `async` would mean
 * rewriting every one of those components' data flow, not just adding
 * `await`. Instead they read a module-level cache that's populated once on
 * load and kept live via a Supabase Realtime subscription — so a component
 * reading `findAccountByEmail` gets real, live, cross-device data without
 * itself needing to know a network call is involved, exactly as it did not
 * need to know `localStorage` was involved before.
 */

interface AccountRow {
  id: string
  email: string
  account_type: 'individual' | 'organisation'
  legal_name: string
  username: string | null
  country: string
  pathway: string | null
  career_stage: string | null
  preferred_display_name: string | null
  headline: string | null
  city: string | null
  state_or_region: string | null
  linked_in_url: string | null
  external_website_url: string | null
  phone: string | null
  org_type: string | null
  official_email: string | null
  registry_level: string | null
  org_role: string | null
}

type OrganisationAccountShape = Extract<Account, { accountType: 'organisation' }>
type IndividualAccountShape = Extract<Account, { accountType: 'individual' }>

function rowToAccount(row: AccountRow): Account {
  if (row.account_type === 'organisation') {
    return {
      accountType: 'organisation',
      orgType: row.org_type as OrganisationAccountShape['orgType'],
      legalName: row.legal_name,
      username: row.username ?? undefined,
      officialEmail: row.official_email ?? row.email,
      country: row.country,
      registryLevel: (row.registry_level ?? 'user_submitted') as OrgRegistryLevel,
      orgRole: row.org_role as OrganisationAccountShape['orgRole'],
    }
  }
  return {
    accountType: 'individual',
    pathway: row.pathway as IndividualAccountShape['pathway'],
    careerStage: (row.career_stage as IndividualAccountShape['careerStage']) ?? undefined,
    legalName: row.legal_name,
    preferredDisplayName: row.preferred_display_name ?? undefined,
    username: row.username ?? undefined,
    headline: row.headline ?? undefined,
    email: row.email,
    country: row.country,
    city: row.city ?? undefined,
    stateOrRegion: row.state_or_region ?? undefined,
    linkedInUrl: row.linked_in_url ?? undefined,
    externalWebsiteUrl: row.external_website_url ?? undefined,
    phone: row.phone ?? undefined,
  }
}

function accountToRow(account: Account): Omit<AccountRow, 'id'> {
  const base = {
    email: account.accountType === 'individual' ? account.email : account.officialEmail,
    account_type: account.accountType,
    legal_name: account.legalName,
    username: account.username ?? null,
    country: account.country,
    pathway: null as string | null,
    career_stage: null as string | null,
    preferred_display_name: null as string | null,
    headline: null as string | null,
    city: null as string | null,
    state_or_region: null as string | null,
    linked_in_url: null as string | null,
    external_website_url: null as string | null,
    phone: null as string | null,
    org_type: null as string | null,
    official_email: null as string | null,
    registry_level: null as string | null,
    org_role: null as string | null,
  }
  if (account.accountType === 'organisation') {
    return { ...base, org_type: account.orgType, official_email: account.officialEmail, registry_level: account.registryLevel, org_role: account.orgRole }
  }
  return {
    ...base,
    pathway: account.pathway,
    career_stage: account.careerStage ?? null,
    preferred_display_name: account.preferredDisplayName ?? null,
    headline: account.headline ?? null,
    city: account.city ?? null,
    state_or_region: account.stateOrRegion ?? null,
    linked_in_url: account.linkedInUrl ?? null,
    external_website_url: account.externalWebsiteUrl ?? null,
    phone: account.phone ?? null,
  }
}

// --- Live cache -------------------------------------------------------
// Populated once on load, then kept current by a Realtime subscription so
// every sync reader below sees accounts created/edited on *other* devices
// without a page reload — not just its own writes.
let cache: AccountRow[] = []
let cacheReady = false
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('accounts').select('*')
  cache = data ?? []
  cacheReady = true
  notifyListeners()
}

function upsertCacheRow(row: AccountRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

function removeCacheRow(id: string) {
  cache = cache.filter((r) => r.id !== id)
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  joinRealtime(() =>
    supabase
    .channel('accounts-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, (payload) => {
      if (payload.eventType === 'DELETE') removeCacheRow((payload.old as AccountRow).id)
      else upsertCacheRow(payload.new as AccountRow)
    })
    .subscribe(),
  )
}

/** Lets a component re-render once the cache's first load lands, or a live
 * update arrives from another device — e.g. Global Search re-querying once
 * accounts actually exist, instead of only reading a momentarily-empty
 * cache on first paint (same transient state `localStorage` had too). */
export function onAccountsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function accountsCacheReady(): boolean {
  return cacheReady
}

/**
 * For code that needs a trustworthy answer from `emailIsRegistered` before
 * doing something that can't be undone cheaply (like attempting a signup) —
 * without this, a caller running right after page load can read the cache
 * before its first fetch resolves, see no accounts at all, and try to
 * sign up an email that's actually already registered (a real 422 from
 * Supabase, reproduced by the dev account-switcher's very first click).
 */
export function waitForAccountsCacheReady(): Promise<void> {
  if (cacheReady) return Promise.resolve()
  return new Promise((resolve) => {
    const unsubscribe = onAccountsChange(() => {
      if (cacheReady) {
        unsubscribe()
        resolve()
      }
    })
  })
}

/**
 * The React-idiomatic way to consume the cache: a component that reads
 * `listAllAccounts()`/`findAccountByEmail()`/etc. inside a `useMemo` or
 * `useState` initializer only recomputes when ITS OWN dependencies change —
 * none of which include this module's private cache, so a memo built before
 * the initial fetch (or a later Realtime push) resolves stays stale forever.
 * Depending on this hook's return value fixes that: it changes every time
 * the cache does, so including it in a dependency array (or just calling it
 * to force a subscription) makes the component re-render/recompute exactly
 * when the underlying data actually changed. `CommandPalette`'s `people`
 * list is the load-bearing example — Global Search is literally what S1/S2
 * are about.
 */
export function useAccountsCacheVersion(): number {
  return useSyncExternalStore(onAccountsChange, () => cacheVersion, () => cacheVersion)
}

/** §8 registration — real signup (Supabase Auth) + the `accounts` row in one
 * call, mirroring the old save-then-done shape call sites already expect. */
export async function saveDemoAccount(email: string, password: string, account: Account): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('An account already exists with this email — try signing in instead.')
  }
  const userId = data.user?.id
  if (!userId) throw new Error('Sign-up did not return a session — check Supabase Auth settings.')
  const row = { id: userId, ...accountToRow(account) }
  const { error: insertError } = await supabase.from('accounts').insert(row)
  if (insertError) throw insertError
  upsertCacheRow(row)
}

/** §7.1 sign-in — real password auth, returns the matching `accounts` row. */
export async function findDemoAccount(email: string, password: string): Promise<Account | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error || !data.user) return null
  let row = cache.find((r) => r.id === data.user!.id)
  if (!row) {
    const { data: fetched } = await supabase.from('accounts').select('*').eq('id', data.user.id).maybeSingle()
    if (fetched) {
      row = fetched as AccountRow
      upsertCacheRow(row)
    }
  }
  return row ? rowToAccount(row) : null
}

/**
 * For dev-only tooling (AccountSwitcher, seedDemoData) that sets the app's
 * `AccountContext` directly instead of going through the real Sign In form —
 * a real shortcut for exercising account states, but one that still needs a
 * REAL Supabase session underneath, since RLS now enforces every write
 * against `current_account_email()` (the authenticated caller), not
 * whatever the UI merely displays as "signed in". Without this, switching to
 * an already-registered dev account left the browser had no real session,
 * so anything it tried to write (like seeding demo activities) was silently
 * attempted as an anonymous caller and rejected by RLS. No-ops if already
 * signed in as this exact email.
 */
export async function ensureSignedInAs(email: string, password: string): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const currentEmail = data.session?.user?.email?.toLowerCase()
  if (currentEmail === email.trim().toLowerCase()) return
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

/**
 * Snapshot the currently active session so it can be restored later via
 * `restoreSession` — for a flow that has to briefly act as a *different*
 * account mid-way through (e.g. AccountCreationWizard creating an
 * organisation, then needing the human founder's own session back to call
 * `followOrg`, which RLS ties to `current_account_email()`). Works without
 * ever needing that account's password again, unlike `ensureSignedInAs`.
 */
export async function captureSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function restoreSession(session: Session | null): Promise<void> {
  if (!session) return
  await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
}

export function emailIsRegistered(email: string): boolean {
  const target = email.trim().toLowerCase()
  if (!target) return false
  return cache.some((r) => r.email.toLowerCase() === target)
}

/** For the staff-only Verification Review queue (§16.5/§50.4 OrgClaimRequest)
 * — every organisation account actually registered, real accounts only,
 * across every browser/device now (not just this one). */
export function listAllOrganisations(): Extract<Account, { accountType: 'organisation' }>[] {
  return cache.filter((r) => r.account_type === 'organisation').map((r) => rowToAccount(r)) as Extract<Account, { accountType: 'organisation' }>[]
}

/** §17 Discover/Search's real "directory" — every registered account, visible
 * cross-user/cross-device via the `accounts` table's public-select RLS
 * policy. This is the direct fix for S1/S2: Global Search (CommandPalette.tsx)
 * and Home's suggestions now see accounts created on any device. */
export function listAllAccounts(): Account[] {
  return cache.map(rowToAccount)
}

/** Shared username→account lookup — used by ProfilePage's cross-account
 * viewing and the CV-request pipeline (cvRequestStore.ts). */
export function findAccountByUsername(username: string | undefined): Account | undefined {
  if (!username) return undefined
  const row = cache.find((r) => r.username === username)
  return row ? rowToAccount(row) : undefined
}

/** Same lookup, keyed by the owner email messageStore.ts/activityStore.ts use
 * internally — for resolving a display name for a conversation partner who
 * may not have a username to look up by. */
export function findAccountByEmail(email: string | undefined): Account | undefined {
  if (!email) return undefined
  const target = email.trim().toLowerCase()
  const row = cache.find((r) => r.email.toLowerCase() === target)
  return row ? rowToAccount(row) : undefined
}

/** Approve/reject an org's IOTR claim (§50.4) — updates the stored account
 * record; if that org is the currently active AccountContext session, the
 * caller must also call setAccount to refresh the live session. */
export async function setOrganisationRegistryLevel(officialEmail: string, level: OrgRegistryLevel): Promise<void> {
  const { data } = await supabase.from('accounts').update({ registry_level: level }).eq('official_email', officialEmail).select().maybeSingle()
  if (data) upsertCacheRow(data as AccountRow)
}

/**
 * Persists an in-place edit to an already-registered account (e.g. Settings
 * → Profile) without needing to know its password, unlike `saveDemoAccount`.
 * No-ops if the email isn't a registered record — callers should also update
 * the live `AccountContext` session themselves via `setAccount`.
 */
export async function updateDemoAccount(email: string, account: Account): Promise<void> {
  const { data } = await supabase.from('accounts').update(accountToRow(account)).eq('email', email.toLowerCase()).select().maybeSingle()
  if (data) upsertCacheRow(data as AccountRow)
}

const KNOWN_DEVICE_KEY = 'profile:known-device'

/** §7.2 suspicious-login step-up: deterministic per-browser "unrecognised device"
 * simulation (not Math.random() fabrication) — first sign-in on this browser
 * profile always challenges, matching the Handoff's demonstrated MFA state.
 * Stays localStorage-only: this is about *this browser*, not account data. */
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

/**
 * §7.3 Account Recovery — path 1 (email reset link). Sends a real Supabase
 * Auth recovery email; the link lands on /auth/reset-password
 * (AccountRecoveryFlow.tsx's ResetPasswordCallback), which is where the new
 * password actually gets set via `supabase.auth.updateUser`. Never throws
 * or reveals whether the email is registered — same generic-response
 * principle a real backend uses.
 */
export async function resetPassword(email: string): Promise<void> {
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
}

/** §7.4 Settings → Security's password-change form — re-authenticates with
 * the current password first, then sets the new one via Supabase Auth. */
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email: email.trim(), password: currentPassword })
  if (reauthError) return false
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return !error
}
