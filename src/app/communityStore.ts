/**
 * Real communities & groups (migration 0011), replacing the old localStorage
 * `communitiesStore`/`discussionStore`. Reads are synchronous over a live
 * cache (same pattern as every other store); every privileged write is a
 * SECURITY DEFINER RPC that re-checks the caller's role in Postgres, so the
 * client can't grant itself anything — the role helpers below only decide
 * which buttons to *show*.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

export const GROUP_TYPES = ['Guild', 'Trade Association', 'Industry Network', 'Research Group', 'Learning Cohort', 'Mentorship Circle', 'Professional Community'] as const
export type GroupType = (typeof GROUP_TYPES)[number]
export type CommunityPrivacy = 'public' | 'private' | 'invite_only'
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member'

export const PRIVACY_LABEL: Record<CommunityPrivacy, string> = {
  public: 'Public — anyone can read and join',
  private: 'Private — anyone can find it; joining needs approval',
  invite_only: 'Invite-only — hidden; members are invited',
}

export interface Community {
  id: string
  slug: string
  name: string
  kind: 'community' | 'group'
  type: GroupType
  description: string
  rules: string
  privacy: CommunityPrivacy
  ownerEmail: string
  avatarPath: string | null
  coverPath: string | null
  status: 'active' | 'suspended'
  createdAt: string
}
export interface CommunityMember {
  communityId: string
  email: string
  role: CommunityRole
  status: 'active' | 'banned'
  mutedUntil: string | null
  joinedAt: string
}
export interface CommunityPost {
  id: string
  communityId: string
  authorEmail: string
  kind: 'discussion' | 'announcement'
  body: string
  pinned: boolean
  createdAt: string
  deletedAt: string | null
}
export interface JoinRequest { id: string; communityId: string; requesterEmail: string; message: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }
export interface CommunityInvite { id: string; communityId: string; inviteeEmail: string; invitedBy: string; status: 'pending' | 'accepted' | 'declined'; createdAt: string }
export interface Appeal { id: string; communityId: string; memberEmail: string; message: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }
export interface AuditEntry { id: string; communityId: string; actor: string; action: string; target: string | null; detail: string | null; createdAt: string }
export interface CommunityReport { id: string; communityId: string; reporterEmail: string; targetType: string; targetId: string; reason: string; status: string; createdAt: string }

interface Row { [k: string]: unknown }
const s = (v: unknown) => v as string
const sn = (v: unknown) => (v ?? null) as string | null

const toCommunity = (r: Row): Community => ({
  id: s(r.id), slug: s(r.slug), name: s(r.name), kind: r.kind as Community['kind'], type: r.type as GroupType, description: s(r.description), rules: s(r.rules),
  privacy: r.privacy as CommunityPrivacy, ownerEmail: s(r.owner_email), avatarPath: sn(r.avatar_path), coverPath: sn(r.cover_path), status: r.status as Community['status'], createdAt: s(r.created_at),
})
const toMember = (r: Row): CommunityMember => ({ communityId: s(r.community_id), email: s(r.member_email), role: r.role as CommunityRole, status: r.status as CommunityMember['status'], mutedUntil: sn(r.muted_until), joinedAt: s(r.joined_at) })
const toPost = (r: Row): CommunityPost => ({ id: s(r.id), communityId: s(r.community_id), authorEmail: s(r.author_email), kind: r.kind as CommunityPost['kind'], body: s(r.body), pinned: Boolean(r.pinned), createdAt: s(r.created_at), deletedAt: sn(r.deleted_at) })

// --- Cache ---------------------------------------------------------------
let communities: Community[] = []
let members: CommunityMember[] = []
let posts: CommunityPost[] = []
const loadedPosts = new Set<string>()
let requests: JoinRequest[] = []
let invites: CommunityInvite[] = []
let appeals: Appeal[] = []
let audit: AuditEntry[] = []
let reports: CommunityReport[] = []
let counts = new Map<string, { members: number; posts: number }>()
let loaded = false
let version = 0
const listeners = new Set<() => void>()
function bump() {
  version++
  listeners.forEach((fn) => fn())
}
export function onCommunitiesChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function useCommunitiesVersion(): number {
  return useSyncExternalStore(onCommunitiesChange, () => version, () => version)
}

async function loadMeta() {
  const [c, m, r, i, a, l, rep, cnt] = await Promise.all([
    supabase.from('communities').select('*'),
    supabase.from('community_members').select('*'),
    supabase.from('community_join_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('community_invites').select('*').order('created_at', { ascending: false }),
    supabase.from('community_appeals').select('*').order('created_at', { ascending: false }),
    supabase.from('community_audit_log').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('content_reports').select('*').not('community_id', 'is', null).order('created_at', { ascending: false }),
    supabase.rpc('community_counts'),
  ])
  communities = ((c.data ?? []) as Row[]).map(toCommunity)
  members = ((m.data ?? []) as Row[]).map(toMember)
  requests = ((r.data ?? []) as Row[]).map((x) => ({ id: s(x.id), communityId: s(x.community_id), requesterEmail: s(x.requester_email), message: s(x.message), status: x.status as JoinRequest['status'], createdAt: s(x.created_at) }))
  invites = ((i.data ?? []) as Row[]).map((x) => ({ id: s(x.id), communityId: s(x.community_id), inviteeEmail: s(x.invitee_email), invitedBy: s(x.invited_by), status: x.status as CommunityInvite['status'], createdAt: s(x.created_at) }))
  appeals = ((a.data ?? []) as Row[]).map((x) => ({ id: s(x.id), communityId: s(x.community_id), memberEmail: s(x.member_email), message: s(x.message), status: x.status as Appeal['status'], createdAt: s(x.created_at) }))
  audit = ((l.data ?? []) as Row[]).map((x) => ({ id: s(x.id), communityId: s(x.community_id), actor: s(x.actor), action: s(x.action), target: sn(x.target), detail: sn(x.detail), createdAt: s(x.created_at) }))
  reports = ((rep.data ?? []) as Row[]).map((x) => ({ id: s(x.id), communityId: s(x.community_id), reporterEmail: s(x.reporter_email), targetType: s(x.target_type), targetId: s(x.target_id), reason: s(x.reason), status: s(x.status), createdAt: s(x.created_at) }))
  counts = new Map(((cnt.data ?? []) as { community_id: string; members: number; posts: number }[]).map((x) => [x.community_id, { members: x.members, posts: x.posts }]))
  loaded = true
  bump()
}

let metaTimer: ReturnType<typeof setTimeout> | null = null
function scheduleMeta() {
  if (metaTimer) return
  metaTimer = setTimeout(() => {
    metaTimer = null
    void loadMeta()
  }, 250)
}

export async function loadPosts(communityId: string): Promise<void> {
  const { data } = await supabase.from('community_posts').select('*').eq('community_id', communityId).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(60)
  posts = [...posts.filter((p) => p.communityId !== communityId), ...((data ?? []) as Row[]).map(toPost)]
  loadedPosts.add(communityId)
  bump()
}

function upsertPost(row: Row) {
  const p = toPost(row)
  if (!loadedPosts.has(p.communityId)) return
  posts = [...posts.filter((x) => x.id !== p.id), p]
  bump()
}

if (typeof window !== 'undefined') {
  void loadMeta()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      loadedPosts.clear()
      posts = []
      void loadMeta()
    }
  })
  joinRealtime(() => {
    let ch = supabase.channel('communities-cache')
    for (const table of ['communities', 'community_members', 'community_join_requests', 'community_invites', 'community_appeals', 'community_audit_log']) {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleMeta)
    }
    ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, (p) => {
      if (p.eventType !== 'DELETE') upsertPost(p.new as Row)
      scheduleMeta() // keeps post counts fresh
    })
    return ch.subscribe()
  })
}

// --- Reads ---------------------------------------------------------------
export function communitiesLoaded(): boolean {
  return loaded
}
export function listCommunities(): Community[] {
  return [...communities].sort((a, b) => a.name.localeCompare(b.name))
}
export function getCommunityBySlug(slug: string): Community | undefined {
  return communities.find((c) => c.slug === slug || c.id === slug)
}
export function getCommunity(id: string): Community | undefined {
  return communities.find((c) => c.id === id)
}
export function membershipOf(communityId: string, email: string): CommunityMember | undefined {
  return members.find((m) => m.communityId === communityId && m.email.toLowerCase() === email.toLowerCase())
}
export function roleOf(communityId: string, email: string): CommunityRole | null {
  const m = membershipOf(communityId, email)
  return m && m.status === 'active' ? m.role : null
}
export function isMod(role: CommunityRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator'
}
export function isAdmin(role: CommunityRole | null): boolean {
  return role === 'owner' || role === 'admin'
}
export function myCommunities(email: string): Community[] {
  return listCommunities().filter((c) => roleOf(c.id, email) !== null)
}
export function countsFor(communityId: string): { members: number; posts: number } {
  return counts.get(communityId) ?? { members: 0, posts: 0 }
}
export function listMembers(communityId: string): CommunityMember[] {
  return members.filter((m) => m.communityId === communityId).sort((a, b) => b.role.length - a.role.length || a.joinedAt.localeCompare(b.joinedAt))
}
export function listPosts(communityId: string): CommunityPost[] {
  return posts
    .filter((p) => p.communityId === communityId)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
}
export function postById(id: string): CommunityPost | undefined {
  return posts.find((p) => p.id === id)
}
export function postsLoaded(communityId: string): boolean {
  return loadedPosts.has(communityId)
}
export function pendingRequestFor(communityId: string, email: string): JoinRequest | undefined {
  return requests.find((r) => r.communityId === communityId && r.status === 'pending' && r.requesterEmail.toLowerCase() === email.toLowerCase())
}
export function pendingRequests(communityId: string): JoinRequest[] {
  return requests.filter((r) => r.communityId === communityId && r.status === 'pending')
}
export function inviteFor(communityId: string, email: string): CommunityInvite | undefined {
  return invites.find((i) => i.communityId === communityId && i.status === 'pending' && i.inviteeEmail.toLowerCase() === email.toLowerCase())
}
export function myPendingInvites(email: string): CommunityInvite[] {
  return invites.filter((i) => i.status === 'pending' && i.inviteeEmail.toLowerCase() === email.toLowerCase())
}
export function pendingAppeals(communityId: string): Appeal[] {
  return appeals.filter((a) => a.communityId === communityId && a.status === 'pending')
}
export function myAppeal(communityId: string, email: string): Appeal | undefined {
  return appeals.find((a) => a.communityId === communityId && a.status === 'pending' && a.memberEmail.toLowerCase() === email.toLowerCase())
}
export function auditFor(communityId: string): AuditEntry[] {
  return audit.filter((a) => a.communityId === communityId)
}
export function reportsFor(communityId: string): CommunityReport[] {
  return reports.filter((r) => r.communityId === communityId)
}
export function allReports(): CommunityReport[] {
  return reports
}

// --- Actions -------------------------------------------------------------
async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  await loadMeta()
  return data as T
}

export interface CreateCommunityInput {
  name: string
  kind: 'community' | 'group'
  type: GroupType
  description: string
  rules: string
  privacy: CommunityPrivacy
}
export async function createCommunity(input: CreateCommunityInput): Promise<string> {
  return rpc<string>('create_community', { p_name: input.name, p_kind: input.kind, p_type: input.type, p_description: input.description, p_rules: input.rules, p_privacy: input.privacy })
}
export const joinCommunity = (id: string) => rpc<'joined' | 'requested' | 'already_member'>('join_community', { cid: id })
export const decideJoinRequest = (id: string, approve: boolean) => rpc('decide_join_request', { rid: id, approve })
export const inviteToCommunity = (id: string, email: string) => rpc('invite_to_community', { cid: id, invitee: email })
export const respondToInvite = (id: string, accept: boolean) => rpc('respond_community_invite', { iid: id, accept })
export const leaveCommunity = (id: string) => rpc('leave_community', { cid: id })
export const deleteCommunity = (id: string) => rpc('delete_community', { cid: id })
export const setMemberRole = (id: string, email: string, role: Exclude<CommunityRole, 'owner'>) => rpc('set_member_role', { cid: id, target: email, new_role: role })
export const transferOwnership = (id: string, email: string) => rpc('transfer_community_ownership', { cid: id, target: email })
export const moderateMember = (id: string, email: string, action: 'warn' | 'mute' | 'unmute' | 'remove' | 'ban' | 'unban', hours?: number, reason = '') =>
  rpc('moderate_member', { cid: id, target: email, act: action, hours: hours ?? null, reason })
export const pinPost = (postId: string, pin: boolean) => rpc('set_post_pinned', { pid: postId, pin }).then(() => loadMeta())
export const reportInCommunity = (id: string, targetType: 'community_post' | 'user', targetId: string, why: string) => rpc('report_community_content', { cid: id, ttype: targetType, tid: targetId, why })
export const appealAction = (id: string, why: string) => rpc('appeal_community_action', { cid: id, why })
export const decideAppeal = (id: string, approve: boolean) => rpc('decide_community_appeal', { aid: id, approve })

export async function removePost(post: CommunityPost, reason = ''): Promise<void> {
  const { error } = await supabase.rpc('delete_community_post', { pid: post.id, reason })
  if (error) throw new Error(error.message)
  posts = posts.map((p) => (p.id === post.id ? { ...p, deletedAt: new Date().toISOString() } : p))
  bump()
}

export async function createPost(communityId: string, authorEmail: string, body: string, kind: 'discussion' | 'announcement'): Promise<void> {
  const { data, error } = await supabase.from('community_posts').insert({ community_id: communityId, author_email: authorEmail, body, kind }).select().single()
  if (error) throw new Error(error.message.includes('row-level security') ? "You can't post here right now (are you muted or no longer a member?)." : error.message)
  upsertPost(data as Row)
  scheduleMeta()
}

export async function updateCommunitySettings(id: string, patch: Partial<Pick<Community, 'name' | 'description' | 'rules' | 'privacy' | 'type'>>): Promise<void> {
  const { error } = await supabase.from('communities').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
  await loadMeta()
}

export async function uploadCommunityImage(communityId: string, which: 'avatar' | 'cover', file: File): Promise<void> {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) throw new Error('Choose an image under 5MB.')
  const path = `${communityId}/${which}-${crypto.randomUUID()}`
  const up = await supabase.storage.from('community-media').upload(path, file, { contentType: file.type })
  if (up.error) throw new Error(up.error.message)
  const { error } = await supabase.from('communities').update(which === 'avatar' ? { avatar_path: path } : { cover_path: path }).eq('id', communityId)
  if (error) throw new Error(error.message)
  await loadMeta()
}

const urlCache = new Map<string, { url: string; expiresAt: number }>()
export async function getCommunityImageUrl(path: string): Promise<string | null> {
  const hit = urlCache.get(path)
  if (hit && hit.expiresAt > Date.now() + 30_000) return hit.url
  const { data, error } = await supabase.storage.from('community-media').createSignedUrl(path, 3600)
  if (error || !data) return null
  urlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 3600_000 })
  return data.signedUrl
}

// --- Platform staff oversight (Admin Centre) -----------------------------
export const staffSetCommunityStatus = (id: string, status: 'active' | 'suspended', why: string) => rpc('staff_set_community_status', { cid: id, new_status: status, why })
export const staffRemovePost = (postId: string, why: string) => rpc('staff_remove_community_post', { pid: postId, why })
export async function staffResolveReport(id: string, status: 'reviewing' | 'actioned' | 'dismissed'): Promise<void> {
  const { error } = await supabase.from('content_reports').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  await loadMeta()
}
