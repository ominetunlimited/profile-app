/**
 * Pipeline repair Phase A — real Supabase-backed `public.follows` (RLS:
 * public select, self insert/delete), replacing the old `localStorage`
 * scaffolding. This is what makes the Home feed's "which orgs' activity
 * belongs in my feed" (activityStore.ts's listFeedFor) actually consistent
 * across devices — same cache + Realtime pattern as the other stores.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { findAccountByEmail } from './demoAccountStore'
import { notify } from './notificationStore'

export interface FollowRecord {
  followerEmail: string
  orgEmail: string
  followedAt: string
}

interface FollowRow {
  follower_email: string
  org_email: string
  followed_at: string
}

// --- Live cache ---------------------------------------------------------
let cache: FollowRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('follows').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: FollowRow) {
  const idx = cache.findIndex((r) => r.follower_email === row.follower_email && r.org_email === row.org_email)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

function removeCacheRow(followerEmail: string, orgEmail: string) {
  cache = cache.filter((r) => !(r.follower_email === followerEmail && r.org_email === orgEmail))
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  supabase
    .channel('follows-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
      if (payload.eventType === 'DELETE') removeCacheRow((payload.old as FollowRow).follower_email, (payload.old as FollowRow).org_email)
      else upsertCacheRow(payload.new as FollowRow)
    })
    .subscribe()
}

export function onFollowsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useFollowsCacheVersion(): number {
  return useSyncExternalStore(onFollowsChange, () => cacheVersion, () => cacheVersion)
}

export function isFollowing(followerEmail: string, orgEmail: string): boolean {
  const f = followerEmail.toLowerCase()
  const o = orgEmail.toLowerCase()
  return cache.some((r) => r.follower_email.toLowerCase() === f && r.org_email.toLowerCase() === o)
}

export async function followOrg(followerEmail: string, orgEmail: string): Promise<void> {
  if (followerEmail.toLowerCase() === orgEmail.toLowerCase()) return
  if (isFollowing(followerEmail, orgEmail)) return
  const { data, error } = await supabase.from('follows').insert({ follower_email: followerEmail, org_email: orgEmail }).select().single()
  if (error) throw error
  upsertCacheRow(data as FollowRow)
  // §4.2's own notification table: 'follow.event → org.followerAlert'.
  const follower = findAccountByEmail(followerEmail)
  const link = follower && 'username' in follower && follower.username ? `/profile/${follower.username}` : '/notifications'
  notify({ recipientEmail: orgEmail, category: 'community', text: `${follower?.legalName ?? 'Someone'} started following your organisation.`, deepLink: link })
}

export async function unfollowOrg(followerEmail: string, orgEmail: string): Promise<void> {
  await supabase.from('follows').delete().eq('follower_email', followerEmail).eq('org_email', orgEmail)
  removeCacheRow(followerEmail, orgEmail)
}

export function followerCount(orgEmail: string): number {
  const o = orgEmail.toLowerCase()
  return cache.filter((r) => r.org_email.toLowerCase() === o).length
}

/** Every org email this account follows — the feed aggregator's real source
 * for "which orgs' public activity belongs in my Home feed". */
export function listFollowedOrgs(followerEmail: string): string[] {
  const f = followerEmail.toLowerCase()
  return cache.filter((r) => r.follower_email.toLowerCase() === f).map((r) => r.org_email)
}

/** The reverse lookup — every real follower of this org, for real
 * "new job posted" notifications instead of a blast to every account. */
export function listFollowersOf(orgEmail: string): string[] {
  const o = orgEmail.toLowerCase()
  return cache.filter((r) => r.org_email.toLowerCase() === o).map((r) => r.follower_email)
}
