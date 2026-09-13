import { findAccountByEmail } from './demoAccountStore'
import { notify } from './notificationStore'

/**
 * Organisation Follow — §4.2's org-notification table lists 'Org Follow' as
 * a real event ('follow.event → org.followerAlert'), and §24.1's individual
 * ActionButtons spec names 'Connect' (connectionStore.ts) rather than
 * 'Follow' for individual-to-individual relationships. So this store is
 * specifically the one-way, no-approval relationship a viewer forms with an
 * ORGANISATION (matches §24.2's own <Stats> 'Followers' count) — not a
 * general-purpose social follow graph.
 */
export interface FollowRecord {
  followerEmail: string
  orgEmail: string
  followedAt: string
}

const STORAGE_KEY = 'profile:demo-follows'

function readAll(): FollowRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: FollowRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function isFollowing(followerEmail: string, orgEmail: string): boolean {
  const f = followerEmail.toLowerCase()
  const o = orgEmail.toLowerCase()
  return readAll().some((r) => r.followerEmail.toLowerCase() === f && r.orgEmail.toLowerCase() === o)
}

export function followOrg(followerEmail: string, orgEmail: string): void {
  if (followerEmail.toLowerCase() === orgEmail.toLowerCase()) return
  if (isFollowing(followerEmail, orgEmail)) return
  writeAll([...readAll(), { followerEmail, orgEmail, followedAt: new Date().toISOString() }])
  // §4.2's own notification table: 'follow.event → org.followerAlert'.
  const follower = findAccountByEmail(followerEmail)
  const link = follower && 'username' in follower && follower.username ? `/profile/${follower.username}` : '/notifications'
  notify({ recipientEmail: orgEmail, category: 'community', text: `${follower?.legalName ?? 'Someone'} started following your organisation.`, deepLink: link })
}

export function unfollowOrg(followerEmail: string, orgEmail: string): void {
  const f = followerEmail.toLowerCase()
  const o = orgEmail.toLowerCase()
  writeAll(readAll().filter((r) => !(r.followerEmail.toLowerCase() === f && r.orgEmail.toLowerCase() === o)))
}

export function followerCount(orgEmail: string): number {
  const o = orgEmail.toLowerCase()
  return readAll().filter((r) => r.orgEmail.toLowerCase() === o).length
}

/** Every org email this account follows — the feed aggregator's real source
 * for "which orgs' public activity belongs in my Home feed". */
export function listFollowedOrgs(followerEmail: string): string[] {
  const f = followerEmail.toLowerCase()
  return readAll()
    .filter((r) => r.followerEmail.toLowerCase() === f)
    .map((r) => r.orgEmail)
}

/** The reverse lookup — every real follower of this org, for real
 * "new job posted" notifications instead of a blast to every account. */
export function listFollowersOf(orgEmail: string): string[] {
  const o = orgEmail.toLowerCase()
  return readAll()
    .filter((r) => r.orgEmail.toLowerCase() === o)
    .map((r) => r.followerEmail)
}
