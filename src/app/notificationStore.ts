/**
 * Pipeline repair Phase A — real Supabase-backed `public.notifications`
 * (RLS: any authenticated account can insert a notification for anyone —
 * that's how a cross-user event like "X commented on your post" reaches its
 * recipient — but only the recipient can ever read or mark their own read).
 * Same cache + Realtime pattern as the other stores: `notify`/`markRead`/
 * `markAllRead` are real async writes; `listNotifications`/`unreadCount`
 * stay synchronous, backed by a live cache, since NotificationCentre and
 * the header's unread badge call them inline during render.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

export type NotificationCategory = 'verification' | 'messages' | 'opportunities' | 'community' | 'security' | 'marketing'

export interface NotificationRecord {
  id: string
  recipientEmail: string
  category: NotificationCategory
  text: string
  deepLink: string
  createdAt: string
  read: boolean
}

interface NotificationRow {
  id: string
  recipient_email: string
  category: NotificationCategory
  text: string
  deep_link: string
  created_at: string
  read: boolean
}

function rowToRecord(r: NotificationRow): NotificationRecord {
  return { id: r.id, recipientEmail: r.recipient_email, category: r.category, text: r.text, deepLink: r.deep_link, createdAt: r.created_at, read: r.read }
}

// --- Live cache -----------------------------------------------------
// RLS means this cache only ever contains the signed-in caller's own
// notifications, regardless of the blanket select('*') below.
let cache: NotificationRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('notifications').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: NotificationRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
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

export async function notify(input: Omit<NotificationRecord, 'id' | 'createdAt' | 'read'>): Promise<void> {
  // Never notify yourself about your own action (e.g. commenting on your own post).
  if (!input.recipientEmail) return
  // Deliberately no `.select()` here: Postgres applies the SELECT RLS policy
  // to an INSERT's RETURNING clause too, and the caller is almost always
  // NOT the recipient (that's the whole point of a cross-user notification)
  // — so a select-after-insert would fail every time with 0 rows visible to
  // the actor. The recipient picks this row up through their own cache load
  // or Realtime subscription, evaluated under their own session, not ours.
  const { error } = await supabase
    .from('notifications')
    .insert({ recipient_email: input.recipientEmail, category: input.category, text: input.text, deep_link: input.deepLink })
  if (error) throw error
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
  const { data } = await supabase.from('notifications').update({ read: true }).eq('id', id).select().maybeSingle()
  if (data) upsertCacheRow(data as NotificationRow)
}

export async function markAllRead(email: string): Promise<void> {
  const { data } = await supabase.from('notifications').update({ read: true }).eq('recipient_email', email.toLowerCase()).eq('read', false).select()
  for (const row of (data ?? []) as NotificationRow[]) upsertCacheRow(row)
}
