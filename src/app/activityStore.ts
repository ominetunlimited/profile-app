/**
 * Pipeline repair Phase A — real Supabase-backed `public.activities` (RLS
 * enforced), replacing the old `localStorage` scaffolding. This is the
 * actual "content" S1's bug report was about: a post made on one device now
 * exists in Postgres, not just that browser's own storage.
 *
 * Same pattern as `demoAccountStore.ts`: `postActivity` is a real network
 * write and is `async`, but the read functions (`listActivities`,
 * `getActivityById`, `listFeedFor`) stay synchronous — every screen that
 * renders a feed or activity list calls them inline during render — backed
 * by a live cache populated on load and kept current via Supabase Realtime.
 * `useActivitiesCacheVersion()` lets a component that *memoizes* one of
 * these results (instead of just calling it in the render body) know when
 * to recompute — see HomePage.tsx's feed/count state for the load-bearing
 * example (same class of bug `useAccountsCacheVersion` fixed for Search).
 */
import { useSyncExternalStore } from 'react'
import type { Account } from './accountTypes'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { listFollowedOrgs } from './followStore'
import { listConnectedEmails } from './connectionStore'
import { recordToolReferences } from './providerReferenceStore'

/** Simplified §4.3 Activity — the fields this build's UI actually reads/writes. */
export interface ActivityRecord {
  id: string
  ownerEmail: string
  type: string
  title: string
  description: string
  role?: string
  organisation?: string
  /** Patch (pre-Phase-7) B4: per-entry location — the Master Prompt names
   * WorkEntry but never field-specifies it (§4.6); added since a work
   * entry's location is real, user-enterable data, not an inference. */
  location?: string
  skills: string[]
  /** §4.3/§4.8 — tools are a distinct attribution axis from skills (a tool
   * tag auto-feeds the ToolStack/CV Tools section, a skill doesn't). Kept as
   * free-text tags here rather than the full editorial-controlled Tool
   * registry §4.8 describes — no tool directory/provider-integration
   * backend exists to validate against yet. */
  tools: string[]
  /** §4.3 `collaborators` — real, user-entered names. The spec's
   * `Collaborator[]` links to other PROFILE accounts with an approval step
   * before appearing on the tagged person's own CV; no multi-user backend
   * exists to do that linking/approval yet, so these are honestly
   * unverified free-text names, never presented as a confirmed tag. */
  collaborators: string[]
  cvPortfolioInclude: boolean
  visibility: 'public' | 'connections_only' | 'private'
  createdAt: string
}

interface ActivityRow {
  id: string
  owner_email: string
  type: string
  title: string
  description: string
  role: string | null
  organisation: string | null
  location: string | null
  skills: string[] | null
  tools: string[] | null
  collaborators: string[] | null
  cv_portfolio_include: boolean
  visibility: 'public' | 'connections_only' | 'private'
  created_at: string
}

function rowToRecord(r: ActivityRow): ActivityRecord {
  return {
    id: r.id,
    ownerEmail: r.owner_email,
    type: r.type,
    title: r.title,
    description: r.description,
    role: r.role ?? undefined,
    organisation: r.organisation ?? undefined,
    location: r.location ?? undefined,
    skills: r.skills ?? [],
    tools: r.tools ?? [],
    collaborators: r.collaborators ?? [],
    cvPortfolioInclude: r.cv_portfolio_include,
    visibility: r.visibility,
    createdAt: r.created_at,
  }
}

function recordToRow(record: Omit<ActivityRecord, 'id' | 'createdAt'>): Omit<ActivityRow, 'id' | 'created_at'> {
  return {
    owner_email: record.ownerEmail,
    type: record.type,
    title: record.title,
    description: record.description,
    role: record.role ?? null,
    organisation: record.organisation ?? null,
    location: record.location ?? null,
    skills: record.skills,
    tools: record.tools,
    collaborators: record.collaborators,
    cv_portfolio_include: record.cvPortfolioInclude,
    visibility: record.visibility,
  }
}

// --- Live cache, same pattern as demoAccountStore.ts -------------------
let cache: ActivityRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

export type ActivitiesStatus = 'loading' | 'ready' | 'degraded'
let status: ActivitiesStatus = 'loading'
let lastSyncedAt: string | null = null

async function loadCache() {
  try {
    const { data, error } = await supabase.from('activities').select('*')
    if (error) throw error
    cache = data ?? []
    status = 'ready'
    lastSyncedAt = new Date().toISOString()
  } catch {
    // Keep whatever the cache already holds; the UI shows it as last-synced data.
    status = 'degraded'
  }
  notifyListeners()
}

/** Whether the first load is pending, done, or failed — drives Home's loading and degraded states. */
export function activitiesStatus(): { status: ActivitiesStatus; lastSyncedAt: string | null } {
  return { status, lastSyncedAt }
}

export function retryActivities(): void {
  status = 'loading'
  notifyListeners()
  void loadCache()
}

function upsertCacheRow(row: ActivityRow) {
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
    .channel('activities-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
      if (payload.eventType === 'DELETE') removeCacheRow((payload.old as ActivityRow).id)
      else upsertCacheRow(payload.new as ActivityRow)
    })
    .subscribe(),
  )
}

export function onActivitiesChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useActivitiesCacheVersion(): number {
  return useSyncExternalStore(onActivitiesChange, () => cacheVersion, () => cacheVersion)
}

export function ownerKey(account: Account | null): string {
  if (!account) return ''
  return account.accountType === 'individual' ? account.email : account.officialEmail
}

export function listActivities(ownerEmail: string): ActivityRecord[] {
  return cache
    .filter((a) => a.owner_email === ownerEmail)
    .map(rowToRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function postActivity(input: Omit<ActivityRecord, 'id' | 'createdAt'>): Promise<ActivityRecord> {
  const { data, error } = await supabase.from('activities').insert(recordToRow(input)).select().single()
  if (error) throw error
  const row = data as ActivityRow
  upsertCacheRow(row)
  const record = rowToRecord(row)
  // §1.4 Provider Notification: real, honest "used" logging for any tool
  // that resolves to the real catalogue (toolCatalogue.ts) — never a claim
  // of endorsement, and never invented for a tool with no known provider.
  recordToolReferences(record.id, record.ownerEmail, record.tools)
  return record
}

export function getActivityById(id: string): ActivityRecord | undefined {
  const row = cache.find((a) => a.id === id)
  return row ? rowToRecord(row) : undefined
}

/**
 * §1's real Home feed requirement: not just the signed-in account's own
 * posts, but real activity from accounts they actually have a relationship
 * with — followed organisations (followStore.ts) and connected individuals
 * (connectionStore.ts) — restricted to what that relationship is honestly
 * allowed to see (their `public` activity; a connection additionally sees
 * `connections_only`). The owner always sees their own activity at every
 * visibility level, same as before.
 */
export function listFeedFor(ownerEmail: string): ActivityRecord[] {
  if (!ownerEmail) return []
  const own = ownerEmail.toLowerCase()
  const connectedEmails = new Set(listConnectedEmails(ownerEmail).map((e) => e.toLowerCase()))
  const followedOrgs = new Set(listFollowedOrgs(ownerEmail).map((e) => e.toLowerCase()))

  return cache
    .map(rowToRecord)
    .filter((a) => {
      const authorEmail = a.ownerEmail.toLowerCase()
      if (authorEmail === own) return true
      if (a.visibility === 'private') return false
      if (a.visibility === 'connections_only') return connectedEmails.has(authorEmail)
      // visibility === 'public': only from someone this account actually
      // follows/connects with — a real feed, not "every public post from
      // every account on the browser" (that would never scale past a demo).
      return connectedEmails.has(authorEmail) || followedOrgs.has(authorEmail)
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
