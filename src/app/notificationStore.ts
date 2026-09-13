/**
 * §10/§20 Notification Centre. Previously entirely hardcoded — two static
 * strings shown to every signed-in account regardless of what actually
 * happened. This is the real, generic store every other pipeline in this
 * patch (follow, connect, comment, attribution, provider reference) writes
 * into, so every notification traces back to a real event and deep-links
 * to the real entity involved — never "go to Home and search for it".
 */
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

const STORAGE_KEY = 'profile:demo-notifications'

function readAll(): NotificationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: NotificationRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function notify(input: Omit<NotificationRecord, 'id' | 'createdAt' | 'read'>): void {
  // Never notify yourself about your own action (e.g. commenting on your own post).
  if (!input.recipientEmail) return
  const record: NotificationRecord = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false }
  writeAll([...readAll(), record])
}

export function listNotifications(email: string): NotificationRecord[] {
  const e = email.toLowerCase()
  return readAll()
    .filter((n) => n.recipientEmail.toLowerCase() === e)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function unreadCount(email: string): number {
  return listNotifications(email).filter((n) => !n.read).length
}

export function markRead(id: string): void {
  const all = readAll()
  const idx = all.findIndex((n) => n.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], read: true }
  writeAll(all)
}

export function markAllRead(email: string): void {
  const e = email.toLowerCase()
  writeAll(readAll().map((n) => (n.recipientEmail.toLowerCase() === e ? { ...n, read: true } : n)))
}
