/**
 * Pipeline repair Phase A — real Supabase-backed `public.comments` (RLS:
 * visible to whoever can see the parent activity — public/owner/accepted
 * connection, mirroring activities' own visibility rule). Same cache +
 * Realtime pattern as activityStore.ts.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { getActivityById } from './activityStore'
import { findAccountByEmail } from './demoAccountStore'
import { notify } from './notificationStore'

/**
 * §11.1's ActivityCard names a real <CommentSection /> in its Actions row.
 */
export interface CommentRecord {
  id: string
  activityId: string
  authorEmail: string
  text: string
  createdAt: string
}

interface CommentRow {
  id: string
  activity_id: string
  author_email: string
  text: string
  created_at: string
}

function rowToRecord(r: CommentRow): CommentRecord {
  return { id: r.id, activityId: r.activity_id, authorEmail: r.author_email, text: r.text, createdAt: r.created_at }
}

// --- Live cache ---------------------------------------------------------
let cache: CommentRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('comments').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: CommentRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  supabase
    .channel('comments-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
      if (payload.eventType !== 'DELETE') upsertCacheRow(payload.new as CommentRow)
    })
    .subscribe()
}

export function onCommentsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useCommentsCacheVersion(): number {
  return useSyncExternalStore(onCommentsChange, () => cacheVersion, () => cacheVersion)
}

export function listComments(activityId: string): CommentRecord[] {
  return cache
    .filter((c) => c.activity_id === activityId)
    .map(rowToRecord)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function commentCount(activityId: string): number {
  return cache.filter((c) => c.activity_id === activityId).length
}

export async function postComment(activityId: string, authorEmail: string, text: string): Promise<CommentRecord> {
  const { data, error } = await supabase.from('comments').insert({ activity_id: activityId, author_email: authorEmail, text }).select().single()
  if (error) throw error
  const row = data as CommentRow
  upsertCacheRow(row)
  const record = rowToRecord(row)

  const activity = getActivityById(activityId)
  if (activity && activity.ownerEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    const commenter = findAccountByEmail(authorEmail)
    notify({
      recipientEmail: activity.ownerEmail,
      category: 'community',
      text: `${commenter?.legalName ?? 'Someone'} commented on "${activity.title}".`,
      deepLink: `/activity/${activityId}`,
    })
  }
  return record
}
