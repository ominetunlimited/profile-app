/**
 * Pipeline repair Phase A — real Supabase-backed `public.connections` (RLS:
 * visible/updatable/deletable by either participant, insertable only by the
 * requester), replacing the old `localStorage` scaffolding. Same cache +
 * Realtime pattern as the other stores. This is what makes the Home feed's
 * "who am I connected to" (activityStore.ts's listFeedFor) actually
 * consistent across devices.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { findAccountByEmail } from './demoAccountStore'

export type ConnectionStatus = 'pending' | 'accepted'

export interface ConnectionRecord {
  id: string
  requesterEmail: string
  recipientEmail: string
  status: ConnectionStatus
  requestedAt: string
  respondedAt: string | null
}

interface ConnectionRow {
  id: string
  requester_email: string
  recipient_email: string
  status: ConnectionStatus
  requested_at: string
  responded_at: string | null
}

function rowToRecord(r: ConnectionRow): ConnectionRecord {
  return { id: r.id, requesterEmail: r.requester_email, recipientEmail: r.recipient_email, status: r.status, requestedAt: r.requested_at, respondedAt: r.responded_at }
}

// --- Live cache ---------------------------------------------------------
let cache: ConnectionRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('connections').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: ConnectionRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

function removeCacheRow(id: string) {
  cache = cache.filter((r) => r.id !== id)
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  joinRealtime(() =>
    supabase
    .channel('connections-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, (payload) => {
      if (payload.eventType === 'DELETE') removeCacheRow((payload.old as ConnectionRow).id)
      else upsertCacheRow(payload.new as ConnectionRow)
    })
    .subscribe(),
  )
}

export function onConnectionsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useConnectionsCacheVersion(): number {
  return useSyncExternalStore(onConnectionsChange, () => cacheVersion, () => cacheVersion)
}

function findBetween(emailA: string, emailB: string): ConnectionRow | undefined {
  const a = emailA.toLowerCase()
  const b = emailB.toLowerCase()
  return cache.find(
    (r) => (r.requester_email.toLowerCase() === a && r.recipient_email.toLowerCase() === b) || (r.requester_email.toLowerCase() === b && r.recipient_email.toLowerCase() === a)
  )
}

export type RelationshipState = 'none' | 'pending_sent' | 'pending_received' | 'connected'

/** From `viewerEmail`'s point of view, looking at `otherEmail`. */
export function relationshipState(viewerEmail: string, otherEmail: string): RelationshipState {
  const record = findBetween(viewerEmail, otherEmail)
  if (!record) return 'none'
  if (record.status === 'accepted') return 'connected'
  return record.requester_email.toLowerCase() === viewerEmail.toLowerCase() ? 'pending_sent' : 'pending_received'
}

/** No-op on a self-request or a duplicate — the caller only ever reaches
 * this from a 'none' state UI, but the guard is real, not just cosmetic. */
export async function sendConnectionRequest(requesterEmail: string, recipientEmail: string): Promise<void> {
  if (requesterEmail.toLowerCase() === recipientEmail.toLowerCase()) return
  if (findBetween(requesterEmail, recipientEmail)) return
  const { data, error } = await supabase.from('connections').insert({ requester_email: requesterEmail, recipient_email: recipientEmail }).select().single()
  if (error) throw error
  upsertCacheRow(data as ConnectionRow)
}

export async function acceptConnectionRequest(viewerEmail: string, otherEmail: string): Promise<void> {
  const record = findBetween(viewerEmail, otherEmail)
  if (!record || record.status === 'accepted') return
  const { data } = await supabase.from('connections').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', record.id).select().maybeSingle()
  if (!data) return
  upsertCacheRow(data as ConnectionRow)
}

export async function removeConnection(viewerEmail: string, otherEmail: string): Promise<void> {
  const record = findBetween(viewerEmail, otherEmail)
  if (!record) return
  await supabase.from('connections').delete().eq('id', record.id)
  removeCacheRow(record.id)
}

/** Every real connection record this account is party to, either side —
 * the Connections page's real source instead of a permanent empty state. */
export function listConnectionRecordsFor(email: string): ConnectionRecord[] {
  const e = email.toLowerCase()
  return cache
    .filter((r) => r.requester_email.toLowerCase() === e || r.recipient_email.toLowerCase() === e)
    .map(rowToRecord)
    .sort((a, b) => (b.respondedAt ?? b.requestedAt).localeCompare(a.respondedAt ?? a.requestedAt))
}

export function connectionCount(email: string): number {
  const e = email.toLowerCase()
  return cache.filter((r) => r.status === 'accepted' && (r.requester_email.toLowerCase() === e || r.recipient_email.toLowerCase() === e)).length
}

/** Every email this account is connected to — the feed aggregator's real
 * source for "which individuals' public activity belongs in my Home feed". */
export function listConnectedEmails(email: string): string[] {
  const e = email.toLowerCase()
  return cache
    .filter((r) => r.status === 'accepted' && (r.requester_email.toLowerCase() === e || r.recipient_email.toLowerCase() === e))
    .map((r) => (r.requester_email.toLowerCase() === e ? r.recipient_email : r.requester_email))
}

/**
 * V9 Unified Ecosystem Patch §12 "Connections-in-Common".
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
