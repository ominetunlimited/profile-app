/**
 * V9 Unified Ecosystem Patch §8 — every community rendered membership/about
 * content with no way to actually start a thread ("be the first" was a dead
 * end with nothing behind it). Real, local, persisted discussion posts per
 * community — same temporary-scaffolding pattern as every other store in
 * this build (commentStore.ts, notificationStore.ts, etc.), not a fabricated
 * seed of fake conversation.
 */
export interface DiscussionReply {
  id: string
  authorEmail: string
  body: string
  createdAt: string
}

export interface DiscussionPost {
  id: string
  communityId: string
  authorEmail: string
  body: string
  createdAt: string
  replies: DiscussionReply[]
}

const STORAGE_KEY = 'profile:demo-community-discussions'

function readAll(): DiscussionPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalize) : []
  } catch {
    return []
  }
}

function normalize(p: Partial<DiscussionPost>): DiscussionPost {
  return {
    id: p.id ?? crypto.randomUUID(),
    communityId: p.communityId ?? '',
    authorEmail: p.authorEmail ?? '',
    body: p.body ?? '',
    createdAt: p.createdAt ?? new Date().toISOString(),
    replies: Array.isArray(p.replies) ? p.replies : [],
  }
}

function writeAll(posts: DiscussionPost[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listDiscussionsFor(communityId: string): DiscussionPost[] {
  return readAll()
    .filter((p) => p.communityId === communityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function startDiscussion(communityId: string, authorEmail: string, body: string): DiscussionPost {
  const post: DiscussionPost = {
    id: crypto.randomUUID(),
    communityId,
    authorEmail,
    body,
    createdAt: new Date().toISOString(),
    replies: [],
  }
  writeAll([...readAll(), post])
  return post
}

export function replyToDiscussion(postId: string, authorEmail: string, body: string): void {
  const all = readAll()
  const idx = all.findIndex((p) => p.id === postId)
  if (idx === -1) return
  const reply: DiscussionReply = { id: crypto.randomUUID(), authorEmail, body, createdAt: new Date().toISOString() }
  all[idx] = { ...all[idx], replies: [...all[idx].replies, reply] }
  writeAll(all)
}
