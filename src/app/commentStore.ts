/**
 * Real Supabase-backed `public.comments`, polymorphic since migration 0008:
 * a comment targets an activity, job, advert or repost, and may reply to
 * another comment (one level shown in the UI). RLS makes a comment visible
 * exactly where its target is visible (and hides blocked pairs). Same cache +
 * Realtime pattern as the other stores.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { findAccountByEmail } from './demoAccountStore'
import { notify } from './notificationStore'
import { targetAuthor, targetLink, targetTitle, type SocialTargetType } from './socialStore'

export interface CommentRecord {
  id: string
  targetType: SocialTargetType
  targetId: string
  authorEmail: string
  text: string
  createdAt: string
  parentId: string | null
}

interface CommentRow {
  id: string
  target_type: SocialTargetType
  target_id: string
  author_email: string
  text: string
  created_at: string
  parent_comment_id: string | null
}

const rowToRecord = (r: CommentRow): CommentRecord => ({
  id: r.id,
  targetType: r.target_type,
  targetId: r.target_id,
  authorEmail: r.author_email,
  text: r.text,
  createdAt: r.created_at,
  parentId: r.parent_comment_id,
})

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
  cache = (data ?? []) as CommentRow[]
  notifyListeners()
}

function upsertCacheRow(row: CommentRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
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
      .channel('comments-cache')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id?: string }).id
          if (id) {
            cache = cache.filter((r) => r.id !== id && r.parent_comment_id !== id)
            notifyListeners()
          }
        } else {
          upsertCacheRow(payload.new as CommentRow)
        }
      })
      .subscribe(),
  )
}

export function onCommentsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useCommentsCacheVersion(): number {
  return useSyncExternalStore(onCommentsChange, () => cacheVersion, () => cacheVersion)
}

export function listCommentsOn(type: SocialTargetType, id: string): CommentRecord[] {
  return cache
    .filter((c) => c.target_type === type && c.target_id === id)
    .map(rowToRecord)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function commentCountOn(type: SocialTargetType, id: string): number {
  return cache.filter((c) => c.target_type === type && c.target_id === id).length
}

export async function postCommentOn(type: SocialTargetType, id: string, authorEmail: string, text: string, parentId?: string | null): Promise<CommentRecord> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      target_type: type,
      target_id: id,
      activity_id: type === 'activity' ? id : null,
      author_email: authorEmail,
      text,
      parent_comment_id: parentId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  const row = data as CommentRow
  upsertCacheRow(row)

  const commenter = findAccountByEmail(authorEmail)?.legalName ?? 'Someone'
  const title = targetTitle(type, id)
  const link = targetLink(type, id)
  const notified = new Set<string>([authorEmail.toLowerCase()])
  // Reply → tell the person being replied to; always tell the content's author.
  if (parentId) {
    const parent = cache.find((c) => c.id === parentId)
    if (parent && !notified.has(parent.author_email.toLowerCase())) {
      notified.add(parent.author_email.toLowerCase())
      void notify({ recipientEmail: parent.author_email, category: 'community', text: `${commenter} replied to your comment on "${title}".`, deepLink: link })
    }
  }
  const author = targetAuthor(type, id)
  if (author && !notified.has(author.toLowerCase())) {
    void notify({ recipientEmail: author, category: 'community', text: `${commenter} commented on "${title}".`, deepLink: link })
  }
  return rowToRecord(row)
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
  cache = cache.filter((r) => r.id !== id && r.parent_comment_id !== id)
  notifyListeners()
}
