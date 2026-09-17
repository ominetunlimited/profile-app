import { findAccountByEmail } from './demoAccountStore'
import { notify } from './notificationStore'

/**
 * §24.1 ActionButtons names 'Connect' for individual-to-individual profile
 * actions — a real request/accept relationship, distinct from
 * followStore.ts's one-way organisation Follow. Modelled as a single
 * directional request record so "who requested" is always known (needed to
 * show the requester "Pending" and the recipient "Accept/Decline"), with a
 * canonical pair key so duplicate requests between the same two people are
 * structurally impossible.
 */
export type ConnectionStatus = 'pending' | 'accepted'

export interface ConnectionRecord {
  id: string
  requesterEmail: string
  recipientEmail: string
  status: ConnectionStatus
  requestedAt: string
  respondedAt: string | null
}

const STORAGE_KEY = 'profile:demo-connections'

function readAll(): ConnectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: ConnectionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

function findBetween(records: ConnectionRecord[], emailA: string, emailB: string): ConnectionRecord | undefined {
  const a = emailA.toLowerCase()
  const b = emailB.toLowerCase()
  return records.find(
    (r) => (r.requesterEmail.toLowerCase() === a && r.recipientEmail.toLowerCase() === b) || (r.requesterEmail.toLowerCase() === b && r.recipientEmail.toLowerCase() === a)
  )
}

export type RelationshipState = 'none' | 'pending_sent' | 'pending_received' | 'connected'

/** From `viewerEmail`'s point of view, looking at `otherEmail`. */
export function relationshipState(viewerEmail: string, otherEmail: string): RelationshipState {
  const record = findBetween(readAll(), viewerEmail, otherEmail)
  if (!record) return 'none'
  if (record.status === 'accepted') return 'connected'
  return record.requesterEmail.toLowerCase() === viewerEmail.toLowerCase() ? 'pending_sent' : 'pending_received'
}

/** No-op on a self-request or a duplicate — the caller only ever reaches
 * this from a 'none' state UI, but the guard is real, not just cosmetic. */
export function sendConnectionRequest(requesterEmail: string, recipientEmail: string): void {
  if (requesterEmail.toLowerCase() === recipientEmail.toLowerCase()) return
  const all = readAll()
  if (findBetween(all, requesterEmail, recipientEmail)) return
  const record: ConnectionRecord = {
    id: crypto.randomUUID(),
    requesterEmail,
    recipientEmail,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    respondedAt: null,
  }
  writeAll([...all, record])
  const requester = findAccountByEmail(requesterEmail)
  notify({ recipientEmail, category: 'community', text: `${requester?.legalName ?? 'Someone'} sent you a connection request.`, deepLink: '/connections' })
}

export function acceptConnectionRequest(viewerEmail: string, otherEmail: string): void {
  const all = readAll()
  const record = findBetween(all, viewerEmail, otherEmail)
  if (!record || record.status === 'accepted') return
  writeAll(all.map((r) => (r.id === record.id ? { ...r, status: 'accepted' as const, respondedAt: new Date().toISOString() } : r)))
  const accepter = findAccountByEmail(viewerEmail)
  const link = accepter && 'username' in accepter && accepter.username ? `/profile/${accepter.username}` : '/connections'
  notify({ recipientEmail: otherEmail, category: 'community', text: `${accepter?.legalName ?? 'Someone'} accepted your connection request.`, deepLink: link })
}

export function removeConnection(viewerEmail: string, otherEmail: string): void {
  const all = readAll()
  const record = findBetween(all, viewerEmail, otherEmail)
  if (!record) return
  writeAll(all.filter((r) => r.id !== record.id))
}

/** Every real connection record this account is party to, either side —
 * the Connections page's real source instead of a permanent empty state. */
export function listConnectionRecordsFor(email: string): ConnectionRecord[] {
  const e = email.toLowerCase()
  return readAll()
    .filter((r) => r.requesterEmail.toLowerCase() === e || r.recipientEmail.toLowerCase() === e)
    .sort((a, b) => (b.respondedAt ?? b.requestedAt).localeCompare(a.respondedAt ?? a.requestedAt))
}

export function connectionCount(email: string): number {
  const e = email.toLowerCase()
  return readAll().filter((r) => r.status === 'accepted' && (r.requesterEmail.toLowerCase() === e || r.recipientEmail.toLowerCase() === e)).length
}

/** Every email this account is connected to — the feed aggregator's real
 * source for "which individuals' public activity belongs in my Home feed". */
export function listConnectedEmails(email: string): string[] {
  const e = email.toLowerCase()
  return readAll()
    .filter((r) => r.status === 'accepted' && (r.requesterEmail.toLowerCase() === e || r.recipientEmail.toLowerCase() === e))
    .map((r) => (r.requesterEmail.toLowerCase() === e ? r.recipientEmail : r.requesterEmail))
}

/**
 * V9 Unified Ecosystem Patch §12 "Connections-in-Common" — genuinely new,
 * no prior equivalent anywhere in this build. `sharedConnections` is real,
 * computed by intersecting both people's real connection lists. `cities` is
 * real too, but limited to what this build actually has evidence for:
 * there is no OrgStaffRecord/staff-affiliation model anywhere yet (see
 * `OrganisationAccount.orgRole`'s own comment in accountTypes.ts), so a
 * "shared organisation/school" claim would be fabricated — omitted rather
 * than faked, same honesty rule as Trust Score and verification badges.
 */
export interface ConnectionsInCommon {
  sharedConnections: string[]
  sharedContext: { cities?: string[] }
}

export function connectionsInCommon(viewerEmail: string, subjectEmail: string): ConnectionsInCommon {
  const viewerConnections = new Set(listConnectedEmails(viewerEmail).map((e) => e.toLowerCase()))
  const sharedConnections = listConnectedEmails(subjectEmail).filter((e) => viewerConnections.has(e.toLowerCase()))

  const viewer = findAccountByEmail(viewerEmail)
  const subject = findAccountByEmail(subjectEmail)
  const cities: string[] = []
  if (viewer?.accountType === 'individual' && subject?.accountType === 'individual' && viewer.city && subject.city && viewer.city.trim().toLowerCase() === subject.city.trim().toLowerCase()) {
    cities.push(subject.city)
  }

  return { sharedConnections, sharedContext: cities.length ? { cities } : {} }
}
