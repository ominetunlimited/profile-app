/**
 * Platform-wide social actions (migration 0008): reposts with commentary,
 * bookmarks, recommendations (endorsements) and anonymised engagement counts,
 * for activities, jobs and adverts alike. Same cache + Realtime +
 * `useSyncExternalStore` pattern as the other stores. Every write is a real
 * row guarded by RLS (the target must be visible to the actor; blocked pairs
 * can't repost each other).
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { getActivityById } from './activityStore'
import { getJobById } from './jobStore'
import { getCampaignById } from './adStore'
import { getCommunity, postById } from './communityStore'
import { listConnectedEmails } from './connectionStore'
import { listFollowedOrgs } from './followStore'

export type SocialTargetType = 'activity' | 'job' | 'advert' | 'repost' | 'community_post'
export type OriginalType = Exclude<SocialTargetType, 'repost' | 'community_post'>
/** Everything the shared ActionBar can act on (community posts can't be reposted out of their community). */
export type ActionTargetType = OriginalType | 'community_post'
export type RepostVisibility = 'public' | 'connections_only' | 'private'

export interface RepostRecord {
  id: string
  reposterEmail: string
  originalType: OriginalType
  originalId: string
  originalAuthorEmail: string
  commentary: string | null
  visibility: RepostVisibility
  status: 'active' | 'removed'
  createdAt: string
}

interface RepostRow {
  id: string
  reposter_email: string
  original_type: OriginalType
  original_id: string
  original_author_email: string
  commentary: string | null
  visibility: RepostVisibility
  status: 'active' | 'removed'
  created_at: string
}
interface BookmarkRow {
  user_email: string
  target_type: SocialTargetType
  target_id: string
  created_at: string
}
interface EndorsementRow {
  user_email: string
  target_type: SocialTargetType
  target_id: string
  note: string | null
  created_at: string
}
interface CountRow {
  target_type: SocialTargetType
  target_id: string
  kind: 'comment' | 'repost' | 'endorsement'
  total: number
}

export interface Endorsement {
  userEmail: string
  targetType: SocialTargetType
  targetId: string
  note: string | null
  createdAt: string
}

const rowToRepost = (r: RepostRow): RepostRecord => ({
  id: r.id,
  reposterEmail: r.reposter_email,
  originalType: r.original_type,
  originalId: r.original_id,
  originalAuthorEmail: r.original_author_email,
  commentary: r.commentary,
  visibility: r.visibility,
  status: r.status,
  createdAt: r.created_at,
})

// --- Caches --------------------------------------------------------------
let reposts: RepostRow[] = []
let bookmarks: BookmarkRow[] = []
let endorsements: EndorsementRow[] = []
let counts: CountRow[] = []
let version = 0
const listeners = new Set<() => void>()
function bump() {
  version++
  listeners.forEach((fn) => fn())
}
export function onSocialChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function useSocialCacheVersion(): number {
  return useSyncExternalStore(onSocialChange, () => version, () => version)
}

async function loadAll() {
  const [r, b, e, c] = await Promise.all([
    supabase.from('reposts').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('bookmarks').select('*'),
    supabase.from('endorsements').select('*'),
    supabase.from('engagement_counts').select('*'),
  ])
  reposts = (r.data ?? []) as RepostRow[]
  bookmarks = (b.data ?? []) as BookmarkRow[]
  endorsements = (e.data ?? []) as EndorsementRow[]
  counts = (c.data ?? []) as CountRow[]
  bump()
}

let reloadTimer: ReturnType<typeof setTimeout> | null = null
// Counts are an aggregate view (no Realtime of its own) — any change to a
// source table triggers one debounced refresh instead of a request per event.
function scheduleReload() {
  if (reloadTimer) return
  reloadTimer = setTimeout(() => {
    reloadTimer = null
    void loadAll()
  }, 300)
}

if (typeof window !== 'undefined') {
  void loadAll()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void loadAll()
  })
  joinRealtime(() => {
    let ch = supabase.channel('social-cache')
    for (const table of ['reposts', 'bookmarks', 'endorsements', 'comments']) {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleReload)
    }
    return ch.subscribe()
  })
}

// --- Target resolution ---------------------------------------------------
export function targetAuthor(type: SocialTargetType, id: string): string | null {
  if (type === 'activity') return getActivityById(id)?.ownerEmail ?? null
  if (type === 'job') return getJobById(id)?.orgEmail ?? null
  if (type === 'advert') return getCampaignById(id)?.advertiserEmail ?? null
  if (type === 'community_post') return postById(id)?.authorEmail ?? null
  const rp = reposts.find((r) => r.id === id)
  return rp?.reposter_email ?? null
}
export function targetTitle(type: SocialTargetType, id: string): string {
  if (type === 'activity') return getActivityById(id)?.title ?? 'a post'
  if (type === 'job') return getJobById(id)?.title ?? 'a job'
  if (type === 'advert') return getCampaignById(id)?.title ?? 'an advert'
  if (type === 'community_post') return postById(id)?.body.slice(0, 50) ?? 'a community post'
  const rp = reposts.find((r) => r.id === id)
  return rp ? targetTitle(rp.original_type, rp.original_id) : 'a post'
}
export function targetLink(type: SocialTargetType, id: string): string {
  if (type === 'activity') return `/activity/${id}`
  if (type === 'job') return `/job/${id}`
  if (type === 'community_post') {
    const post = postById(id)
    const c = post ? getCommunity(post.communityId) : undefined
    return c ? `/communities/${c.slug}?post=${id}` : '/communities'
  }
  if (type === 'repost') {
    const rp = reposts.find((r) => r.id === id)
    return rp ? targetLink(rp.original_type, rp.original_id) : '/home'
  }
  return '/home'
}

// --- Reposts -------------------------------------------------------------
export function listReposts(): RepostRecord[] {
  return reposts.filter((r) => r.status === 'active').map(rowToRepost)
}
export function listRepostsBy(email: string): RepostRecord[] {
  const e = email.toLowerCase()
  return listReposts().filter((r) => r.reposterEmail.toLowerCase() === e)
}
/** Reposts that belong in this account's feed: their own, plus reposts made by
 * people/organisations they actually connect with or follow. */
export function listFeedRepostsFor(ownerEmail: string): RepostRecord[] {
  if (!ownerEmail) return []
  const own = ownerEmail.toLowerCase()
  const network = new Set([...listConnectedEmails(ownerEmail), ...listFollowedOrgs(ownerEmail)].map((e) => e.toLowerCase()))
  return listReposts().filter((r) => r.reposterEmail.toLowerCase() === own || (r.visibility !== 'private' && network.has(r.reposterEmail.toLowerCase())))
}
export function getRepostById(id: string): RepostRecord | undefined {
  const r = reposts.find((x) => x.id === id)
  return r ? rowToRepost(r) : undefined
}
export function getMyRepost(type: SocialTargetType, id: string, me: string): RepostRecord | undefined {
  const source = type === 'repost' ? getRepostById(id) : undefined
  const t = type === 'repost' ? source?.originalType : type
  const oid = type === 'repost' ? source?.originalId : id
  const row = reposts.find((r) => r.status === 'active' && r.original_type === t && r.original_id === oid && r.reposter_email.toLowerCase() === me.toLowerCase())
  return row ? rowToRepost(row) : undefined
}

/** Reposting a repost reposts the underlying original (never a chain of copies),
 * so attribution always points at the true source. */
export async function repostTarget(input: { me: string; type: SocialTargetType; id: string; commentary?: string; visibility?: RepostVisibility }): Promise<RepostRecord> {
  let type: OriginalType
  let id: string
  if (input.type === 'repost') {
    const rp = getRepostById(input.id)
    if (!rp) throw new Error('That post is no longer available.')
    type = rp.originalType
    id = rp.originalId
  } else if (input.type === 'community_post') {
    throw new Error("Community posts can't be reposted outside their community.")
  } else {
    type = input.type
    id = input.id
  }
  const author = targetAuthor(type, id)
  if (!author) throw new Error('That post is no longer available.')
  const commentary = input.commentary?.trim() ? input.commentary.trim() : null
  const { data, error } = await supabase
    .from('reposts')
    .upsert(
      { reposter_email: input.me, original_type: type, original_id: id, original_author_email: author, commentary, visibility: input.visibility ?? 'public', status: 'active' },
      { onConflict: 'reposter_email,original_type,original_id' },
    )
    .select()
    .single()
  if (error) throw error
  const row = data as RepostRow
  reposts = [row, ...reposts.filter((r) => r.id !== row.id)]
  bump()
  scheduleReload()
  return rowToRepost(row)
}

export async function removeRepost(id: string): Promise<void> {
  const { error } = await supabase.from('reposts').delete().eq('id', id)
  if (error) throw error
  reposts = reposts.filter((r) => r.id !== id)
  bump()
  scheduleReload()
}

// --- Bookmarks -----------------------------------------------------------
export function isBookmarked(me: string, type: SocialTargetType, id: string): boolean {
  return bookmarks.some((b) => b.target_type === type && b.target_id === id && b.user_email.toLowerCase() === me.toLowerCase())
}
export function listBookmarks(me: string): { type: SocialTargetType; id: string; createdAt: string }[] {
  return bookmarks
    .filter((b) => b.user_email.toLowerCase() === me.toLowerCase())
    .map((b) => ({ type: b.target_type, id: b.target_id, createdAt: b.created_at }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export async function toggleBookmark(me: string, type: SocialTargetType, id: string): Promise<void> {
  if (isBookmarked(me, type, id)) {
    bookmarks = bookmarks.filter((b) => !(b.target_type === type && b.target_id === id && b.user_email.toLowerCase() === me.toLowerCase()))
    bump()
    const { error } = await supabase.from('bookmarks').delete().eq('user_email', me).eq('target_type', type).eq('target_id', id)
    if (error) throw error
  } else {
    bookmarks = [...bookmarks, { user_email: me, target_type: type, target_id: id, created_at: new Date().toISOString() }]
    bump()
    const { error } = await supabase.from('bookmarks').insert({ user_email: me, target_type: type, target_id: id })
    if (error) {
      await loadAll()
      throw error
    }
  }
}

// --- Recommendations -----------------------------------------------------
export function hasEndorsed(me: string, type: SocialTargetType, id: string): boolean {
  return endorsements.some((e) => e.target_type === type && e.target_id === id && e.user_email.toLowerCase() === me.toLowerCase())
}
export function endorsementsFor(type: SocialTargetType, id: string): Endorsement[] {
  return endorsements
    .filter((e) => e.target_type === type && e.target_id === id)
    .map((e) => ({ userEmail: e.user_email, targetType: e.target_type, targetId: e.target_id, note: e.note, createdAt: e.created_at }))
}
export async function toggleEndorsement(me: string, type: SocialTargetType, id: string, note?: string): Promise<void> {
  if (hasEndorsed(me, type, id)) {
    endorsements = endorsements.filter((e) => !(e.target_type === type && e.target_id === id && e.user_email.toLowerCase() === me.toLowerCase()))
    bump()
    const { error } = await supabase.from('endorsements').delete().eq('user_email', me).eq('target_type', type).eq('target_id', id)
    if (error) throw error
    scheduleReload()
    return
  }
  const cleanNote = note?.trim() ? note.trim() : null
  endorsements = [...endorsements, { user_email: me, target_type: type, target_id: id, note: cleanNote, created_at: new Date().toISOString() }]
  bump()
  const { error } = await supabase.from('endorsements').insert({ user_email: me, target_type: type, target_id: id, note: cleanNote })
  if (error) {
    await loadAll()
    throw error
  }
  scheduleReload()
}

// --- Counts --------------------------------------------------------------
export function getEngagement(type: SocialTargetType, id: string): { comments: number; reposts: number; endorsements: number } {
  const n = (kind: CountRow['kind']) => counts.find((c) => c.target_type === type && c.target_id === id && c.kind === kind)?.total ?? 0
  return { comments: n('comment'), reposts: n('repost'), endorsements: n('endorsement') }
}
