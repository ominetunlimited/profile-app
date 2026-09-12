/**
 * §11.1's ActivityCard names a real <CommentSection /> in its Actions row —
 * previously unbuilt anywhere in this codebase. Real, persisted comments
 * per activity, same client-only scaffolding pattern as reactionStore.ts.
 */
export interface CommentRecord {
  id: string
  activityId: string
  authorEmail: string
  text: string
  createdAt: string
}

const STORAGE_KEY = 'profile:demo-comments'

function readAll(): CommentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: CommentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listComments(activityId: string): CommentRecord[] {
  return readAll()
    .filter((c) => c.activityId === activityId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function commentCount(activityId: string): number {
  return readAll().filter((c) => c.activityId === activityId).length
}

export function postComment(activityId: string, authorEmail: string, text: string): CommentRecord {
  const record: CommentRecord = { id: crypto.randomUUID(), activityId, authorEmail, text, createdAt: new Date().toISOString() }
  writeAll([...readAll(), record])
  return record
}
