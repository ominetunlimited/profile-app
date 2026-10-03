import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/**
 * Blog, news and announcements, stored on the server (public.content_posts). Staff with content access write them in the
 * Admin Centre; everyone else only ever receives posts that are published and meant for them (public, signed-in, individual or
 * organisation audience), enforced by the database.
 */
export type OwnerContentType = 'news' | 'blog' | 'announcement'
export type OwnerContentAudience = 'public' | 'individual' | 'organisation' | 'all_signed_in'
export type OwnerContentStatus = 'draft' | 'scheduled' | 'published'

export interface OwnerContentPostV1 {
  id: string
  type: OwnerContentType
  title: string
  body: string
  coverImage: string
  tags: string[]
  audience: OwnerContentAudience
  status: OwnerContentStatus
  scheduledFor: string | null
  publishedAt: string | null
  authorId: string
  authorLabel: string
  createdAt: string
  updatedAt: string
}


interface Row {
  id: string
  type: OwnerContentType
  title: string
  body: string
  cover_image: string
  tags: string[]
  audience: OwnerContentAudience
  status: OwnerContentStatus
  scheduled_for: string | null
  published_at: string | null
  author_id: string
  author_label: string
  created_at: string
  updated_at: string
}

const table = createServerTable<Row>('content_posts', { orderBy: 'updated_at' })
export const useOwnerContentVersion = table.useVersion

const toPost = (r: Row): OwnerContentPostV1 => ({
  id: r.id,
  type: r.type,
  title: r.title,
  body: r.body,
  coverImage: r.cover_image,
  tags: r.tags,
  audience: r.audience,
  // A scheduled post whose time has come counts as published (the database already shows it to readers).
  status: r.status === 'scheduled' && r.scheduled_for && new Date(r.scheduled_for) <= new Date() ? 'published' : r.status,
  scheduledFor: r.scheduled_for,
  publishedAt: r.published_at ?? (r.status === 'scheduled' && r.scheduled_for && new Date(r.scheduled_for) <= new Date() ? r.scheduled_for : null),
  authorId: r.author_id,
  authorLabel: r.author_label,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export function listOwnerContent(): OwnerContentPostV1[] {
  return table.rows().map(toPost).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export type OwnerContentDraftInput = {
  type: OwnerContentType
  title: string
  body: string
  coverImage: string
  tags: string[]
  audience: OwnerContentAudience
  scheduledFor: string | null
  authorId: string
  authorLabel: string
}

export function createOwnerContentDraft(input: OwnerContentDraftInput): OwnerContentPostV1 {
  const now = new Date().toISOString()
  const row: Row = {
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title,
    body: input.body,
    cover_image: input.coverImage,
    tags: input.tags,
    audience: input.audience,
    status: input.scheduledFor ? 'scheduled' : 'draft',
    scheduled_for: input.scheduledFor,
    published_at: null,
    author_id: input.authorId,
    author_label: input.authorLabel,
    created_at: now,
    updated_at: now,
  }
  table.set([row, ...table.rows()])
  void persist(table, () => supabase.from('content_posts').insert(row)).catch(() => undefined)
  return toPost(row)
}

export function publishOwnerContent(id: string): void {
  const now = new Date().toISOString()
  table.set(table.rows().map((r) => (r.id === id ? { ...r, status: 'published' as const, published_at: now, updated_at: now } : r)))
  void persist(table, () => supabase.from('content_posts').update({ status: 'published', published_at: now, updated_at: now }).eq('id', id)).catch(() => undefined)
}

export function deleteOwnerContent(id: string): void {
  table.set(table.rows().filter((r) => r.id !== id))
  void persist(table, () => supabase.from('content_posts').delete().eq('id', id)).catch(() => undefined)
}
