/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 *
 * Patch (pre-Phase-7) B8: OwnerContentPostV1 backs the new Owner Content
 * Console (news/blog/announcements composer, staff-only) and is the intended
 * eventual source for the public Blog & News page (screens/public/BlogNews.tsx),
 * which today renders a real, honest empty state because nothing populates it.
 * Wiring BlogNews to read from here is left for when a real publish pipeline
 * exists — this store only tracks what staff have drafted/published so far.
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

const STORAGE_KEY = 'profile:demo-owner-content'

function readAll(): OwnerContentPostV1[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(posts: OwnerContentPostV1[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listOwnerContent(): OwnerContentPostV1[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
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
  const post: OwnerContentPostV1 = {
    id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    status: input.scheduledFor ? 'scheduled' : 'draft',
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  const all = readAll()
  all.push(post)
  writeAll(all)
  return post
}

export function publishOwnerContent(id: string): void {
  const all = readAll()
  const idx = all.findIndex((p) => p.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  writeAll(all)
}

export function deleteOwnerContent(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id))
}
