/**
 * Notifications read model + preferences (migration 0009). Rows are created
 * only by the server-side engine (see eventBus.ts / emit_notification and the
 * trg_notify_* triggers) — the client never composes notification text. RLS:
 * a recipient can read and mark only their own. Same cache + Realtime pattern
 * as the other stores; grouped notifications arrive as UPDATE events on the
 * same row, so the cache upserts rather than appends.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

export type NotificationCategory =
  | 'social'
  | 'messages'
  | 'professional'
  | 'opportunities'
  | 'verification'
  | 'profile'
  | 'community'
  | 'career'
  | 'security'
  | 'system'
  | 'marketing'

export interface NotificationRecord {
  id: string
  recipientEmail: string
  category: NotificationCategory
  text: string
  deepLink: string
  createdAt: string
  read: boolean
  eventType: string | null
  actorEmail: string | null
  /** >1 when several people's identical actions were folded into this one row. */
  groupCount: number
}

interface NotificationRow {
  id: string
  recipient_email: string
  category: NotificationCategory
  text: string
  deep_link: string
  created_at: string
  read: boolean
  event_type: string | null
  actor_email: string | null
  group_count: number | null
}

function rowToRecord(r: NotificationRow): NotificationRecord {
  return {
    id: r.id,
    recipientEmail: r.recipient_email,
    category: r.category,
    text: r.text,
    deepLink: r.deep_link,
    createdAt: r.created_at,
    read: r.read,
    eventType: r.event_type,
    actorEmail: r.actor_email,
    groupCount: r.group_count ?? 1,
  }
}

export interface CategoryPreference {
  category: NotificationCategory
  inApp: boolean
  email: boolean
  push: boolean
}

/** What users can control. `locked` categories can never be switched off in-app. */
export const PREFERENCE_CATEGORIES: { category: NotificationCategory; label: string; description: string; locked?: boolean }[] = [
  { category: 'social', label: 'Social activity', description: 'Reactions, comments, replies, mentions, reposts, recommendations, follows and credits.' },
  { category: 'messages', label: 'Messages', description: 'New messages and reactions to your messages.' },
  { category: 'professional', label: 'Connections & network', description: 'Connection requests, mentorship and workspace invitations.' },
  { category: 'opportunities', label: 'Jobs & applications', description: 'New opportunities, application updates, recruiter activity and interviews.' },
  { category: 'verification', label: 'Verification & trust', description: 'Verification updates and trust changes.' },
  { category: 'profile', label: 'Profile', description: 'Profile suggestions and activity on your profile.' },
  { category: 'community', label: 'Communities & groups', description: 'Invitations, approvals, announcements and moderation notices.' },
  { category: 'career', label: 'Career growth', description: 'Learning recommendations, goal reminders and roadmap updates.' },
  { category: 'marketing', label: 'Product news', description: 'Occasional news about PROFILE.' },
  { category: 'security', label: 'Security & account', description: 'Sign-in alerts and account changes. Always on.', locked: true },
  { category: 'system', label: 'Important notices', description: 'Essential platform notices. Always on.', locked: true },
]

// --- Live cache -----------------------------------------------------
// RLS means this cache only ever contains the signed-in caller's own
// notifications, regardless of the blanket select('*') below.
let cache: NotificationRow[] = []
let prefs: CategoryPreference[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const [n, p] = await Promise.all([
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('notification_preferences').select('*'),
  ])
  cache = (n.data ?? []) as NotificationRow[]
  prefs = ((p.data ?? []) as { category: NotificationCategory; in_app: boolean; email: boolean; push: boolean }[]).map((r) => ({ category: r.category, inApp: r.in_app, email: r.email, push: r.push }))
  notifyListeners()
}

function upsertCacheRow(row: NotificationRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [row, ...cache]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

if (typeof window !== 'undefined') {
  void loadCache()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void loadCache()
  })
  joinRealtime(() =>
    supabase
      .channel('notifications-cache')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType !== 'DELETE') upsertCacheRow(payload.new as NotificationRow)
      })
      .subscribe(),
  )
}

export function onNotificationsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useNotificationsCacheVersion(): number {
  return useSyncExternalStore(onNotificationsChange, () => cacheVersion, () => cacheVersion)
}

export function listNotifications(email: string): NotificationRecord[] {
  const e = email.toLowerCase()
  return cache
    .filter((n) => n.recipient_email.toLowerCase() === e)
    .map(rowToRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function unreadCount(email: string): number {
  return listNotifications(email).filter((n) => !n.read).length
}

export async function markRead(id: string): Promise<void> {
  const row = cache.find((r) => r.id === id)
  if (row && !row.read) upsertCacheRow({ ...row, read: true })
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function markAllRead(email: string): Promise<void> {
  const e = email.toLowerCase()
  cache = cache.map((r) => (r.recipient_email.toLowerCase() === e ? { ...r, read: true } : r))
  notifyListeners()
  await supabase.rpc('mark_all_notifications_read')
}

// --- Preferences ----------------------------------------------------
export function getPreference(category: NotificationCategory): CategoryPreference {
  return prefs.find((p) => p.category === category) ?? { category, inApp: true, email: true, push: true }
}

export async function setPreference(email: string, category: NotificationCategory, patch: Partial<Omit<CategoryPreference, 'category'>>): Promise<void> {
  const next = { ...getPreference(category), ...patch }
  const locked = PREFERENCE_CATEGORIES.find((c) => c.category === category)?.locked
  if (locked) next.inApp = true
  prefs = [...prefs.filter((p) => p.category !== category), next]
  notifyListeners()
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_email: email, category, in_app: next.inApp, email: next.email, push: next.push }, { onConflict: 'user_email,category' })
  if (error) {
    await loadCache()
    throw error
  }
}
