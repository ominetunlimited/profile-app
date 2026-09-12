/** Temporary client-only scaffolding, same caveats as demoAccountStore.ts. */
export interface FeedbackEntry {
  id: string
  ownerEmail: string
  category: 'bug' | 'idea' | 'praise' | 'other'
  message: string
  createdAt: string
}

const STORAGE_KEY = 'profile:demo-feedback'

function readAll(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(entries: FeedbackEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listFeedback(ownerEmail: string): FeedbackEntry[] {
  return readAll()
    .filter((f) => f.ownerEmail === ownerEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function submitFeedback(input: { ownerEmail: string; category: FeedbackEntry['category']; message: string }): FeedbackEntry {
  const entry: FeedbackEntry = { id: `fb-${Date.now()}`, ...input, createdAt: new Date().toISOString() }
  const all = readAll()
  all.push(entry)
  writeAll(all)
  return entry
}
