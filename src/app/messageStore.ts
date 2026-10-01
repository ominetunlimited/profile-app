/**
 * Pipeline repair Phase A — real Supabase-backed messaging
 * (`public.conversations` / `conversation_participants` / `messages`, RLS
 * enforced), replacing the old `localStorage` scaffolding. Same cache +
 * Realtime pattern as activityStore.ts/demoAccountStore.ts: reads
 * (`listMessages`, `listConversationsFor`) stay synchronous, backed by a
 * live cache, while writes are real async network calls.
 *
 * One real wrinkle messaging has that activities/accounts don't: RLS's
 * `conversation_participants_insert` policy only lets you insert a row for
 * *yourself* (`participant_email = current_account_email()`) — you can't
 * add the other person to a conversation on their behalf. So `sendMessage`
 * self-registers the sender, but the RECIPIENT only becomes a participant
 * (and can then see the thread) once they actually open it — that's what
 * `joinConversation` is for, called by the UI the moment a conversation
 * view mounts, whether reached via the list or a `?with=` deep link from a
 * notification.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'

export interface MessageRecord {
  id: string
  conversationId: string
  senderEmail: string
  text: string
  sentAt: string
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_email: string
  text: string
  sent_at: string
}

function rowToRecord(r: MessageRow): MessageRecord {
  return { id: r.id, conversationId: r.conversation_id, senderEmail: r.sender_email, text: r.text, sentAt: r.sent_at }
}

// --- Live cache ---------------------------------------------------------
let cache: MessageRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('messages').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: MessageRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  supabase
    .channel('messages-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      if (payload.eventType !== 'DELETE') upsertCacheRow(payload.new as MessageRow)
    })
    .subscribe()
}

export function onMessagesChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useMessagesCacheVersion(): number {
  return useSyncExternalStore(onMessagesChange, () => cacheVersion, () => cacheVersion)
}

const SEP = '::'

/** Canonical, order-independent id for the conversation between two real
 * accounts — both participants resolve to the same thread regardless of
 * who opens it first. */
export function conversationIdFor(emailA: string, emailB: string): string {
  return [emailA.toLowerCase(), emailB.toLowerCase()].sort().join(SEP)
}

export function otherParticipant(conversationId: string, ownerEmail: string): string {
  const [a, b] = conversationId.split(SEP)
  return a === ownerEmail.toLowerCase() ? b : a
}

/**
 * Self-registers `selfEmail` as a participant in this conversation (and
 * creates the conversation row if this is the first time anyone has), then
 * refreshes the cache so any messages already sent to them become visible.
 * Idempotent — safe to call every time a conversation view mounts, not just
 * the first time.
 *
 * Plain inserts, not `.upsert()` with `onConflict`/`ignoreDuplicates` — that
 * path makes PostgREST issue `INSERT ... ON CONFLICT DO NOTHING`, which
 * Postgres evaluates against RLS more strictly than a normal insert and
 * rejects with 42501 here even though the plain-insert policy is a bare
 * `true` (reproduced directly against the API, not just in this app). A
 * plain insert that tolerates the real `23505` duplicate-key error is the
 * robust way to get the same "insert if missing" behavior under RLS.
 */
export async function joinConversation(conversationId: string, selfEmail: string): Promise<void> {
  const { error: convError } = await supabase.from('conversations').insert({ id: conversationId })
  if (convError && convError.code !== '23505') throw convError
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert({ conversation_id: conversationId, participant_email: selfEmail.toLowerCase() })
  if (partError && partError.code !== '23505') throw partError
  await loadCache()
}

export function listMessages(conversationId: string): MessageRecord[] {
  return cache
    .filter((m) => m.conversation_id === conversationId)
    .map(rowToRecord)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
}

export async function sendMessage(conversationId: string, senderEmail: string, text: string): Promise<MessageRecord> {
  await joinConversation(conversationId, senderEmail)
  const { data, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_email: senderEmail, text }).select().single()
  if (error) throw error
  const row = data as MessageRow
  upsertCacheRow(row)
  return rowToRecord(row)
}

export interface ConversationSummary {
  conversationId: string
  otherEmail: string
  lastMessage: MessageRecord
}

/** Every real conversation this owner is a real participant in (per RLS —
 * the cache only ever contains rows they're actually allowed to see), most
 * recently active first. */
export function listConversationsFor(ownerEmail: string): ConversationSummary[] {
  const owner = ownerEmail.toLowerCase()
  const byConversation = new Map<string, MessageRecord[]>()
  for (const row of cache) {
    if (!row.conversation_id.includes(owner)) continue
    const list = byConversation.get(row.conversation_id) ?? []
    list.push(rowToRecord(row))
    byConversation.set(row.conversation_id, list)
  }
  const summaries: ConversationSummary[] = []
  for (const [conversationId, msgs] of byConversation) {
    const sorted = msgs.sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    summaries.push({ conversationId, otherEmail: otherParticipant(conversationId, owner), lastMessage: sorted[sorted.length - 1] })
  }
  return summaries.sort((a, b) => b.lastMessage.sentAt.localeCompare(a.lastMessage.sentAt))
}
