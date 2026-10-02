/**
 * Real-time messaging (migration 0007). Same cache + Realtime +
 * `useSyncExternalStore` pattern as the other stores, hardened for chat:
 *
 * - Conversations are started atomically server-side (`start_conversation`
 *   RPC adds BOTH participants), so a recipient receives the first message
 *   live without ever having opened the thread.
 * - Sends are optimistic and idempotent: each carries a `client_id` (unique
 *   per conversation in the DB), so a retry or a duplicated realtime event
 *   can never create a second copy.
 * - History is paginated (50 per page) — no unbounded loads. The
 *   conversation list + unread counts come from one RPC (`my_conversations`).
 * - A global Realtime channel keeps caches live; on reconnect / tab refocus /
 *   coming back online it re-syncs whatever was missed.
 * - Typing + presence are NOT here (no DB writes) — see chatChannel.ts.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { sha256Hex } from './mediaAssetStore'
import { makeImageVariants, audioDurationSeconds } from './imageProcessing'
import type { ChatFileCategory } from './fileValidation'
import type { ReactionType } from './reactionStore'

export type MessageKind = 'text' | 'attachment' | 'shared_item'
export type SendStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage {
  id: string
  conversationId: string
  senderEmail: string
  text: string
  sentAt: string
  clientId: string | null
  replyTo: string | null
  deletedAt: string | null
  kind: MessageKind
  status: SendStatus
}

/** Back-compat alias for older call sites. */
export type MessageRecord = ChatMessage

export interface MessageAttachment {
  id: string
  messageId: string
  ownerEmail: string
  storagePath: string
  previewPath: string | null
  thumbPath: string | null
  fileName: string
  mimeType: string
  category: ChatFileCategory | string
  sizeBytes: number
  width: number | null
  height: number | null
  durationSeconds: number | null
}

export interface MessageReaction {
  messageId: string
  userEmail: string
  type: ReactionType
}

export interface ConversationSummary {
  conversationId: string
  otherEmail: string
  lastMessage: { id: string; text: string; senderEmail: string; sentAt: string; kind: MessageKind; deleted: boolean } | null
  unreadCount: number
  muted: boolean
  archived: boolean
  myLastReadAt: string
  otherLastReadAt: string | null
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_email: string
  text: string
  sent_at: string
  client_id: string | null
  reply_to: string | null
  deleted_at: string | null
  kind: MessageKind
}
interface AttachmentRow {
  id: string
  message_id: string
  owner_email: string
  storage_path: string
  preview_path: string | null
  thumb_path: string | null
  file_name: string
  mime_type: string
  file_category: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
}
interface ReactionRow {
  message_id: string
  user_email: string
  type: ReactionType
}

const PAGE = 50
const SEP = '::'

function rowToMessage(r: MessageRow): ChatMessage {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderEmail: r.sender_email,
    text: r.text,
    sentAt: r.sent_at,
    clientId: r.client_id,
    replyTo: r.reply_to,
    deletedAt: r.deleted_at,
    kind: r.kind,
    status: 'sent',
  }
}
function rowToAttachment(r: AttachmentRow): MessageAttachment {
  return {
    id: r.id,
    messageId: r.message_id,
    ownerEmail: r.owner_email,
    storagePath: r.storage_path,
    previewPath: r.preview_path,
    thumbPath: r.thumb_path,
    fileName: r.file_name,
    mimeType: r.mime_type,
    category: r.file_category,
    sizeBytes: Number(r.size_bytes),
    width: r.width,
    height: r.height,
    durationSeconds: r.duration_seconds === null ? null : Number(r.duration_seconds),
  }
}

// --- State ---------------------------------------------------------------
let me = ''
let version = 0
const listeners = new Set<() => void>()
let summaries: ConversationSummary[] = []
const messagesByConv = new Map<string, ChatMessage[]>()
const hasMoreByConv = new Map<string, boolean>()
const attachmentsByMessage = new Map<string, MessageAttachment[]>()
const reactionsByMessage = new Map<string, MessageReaction[]>()
let blockedByMe = new Set<string>()
let activeConversationId: string | null = null
let connection: 'online' | 'reconnecting' = 'online'

function bump() {
  version++
  listeners.forEach((fn) => fn())
}
export function onChatChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function useChatVersion(): number {
  return useSyncExternalStore(onChatChange, () => version, () => version)
}
/** Back-compat names used by older screens. */
export const onMessagesChange = onChatChange
export const useMessagesCacheVersion = useChatVersion
export function getConnectionState() {
  return connection
}

export function setChatUser(email: string) {
  const next = email.toLowerCase()
  if (next === me) return
  me = next
  if (me) void refreshAll()
}

export function setActiveConversation(id: string | null) {
  activeConversationId = id
  if (id) void markConversationRead(id)
}

// --- Helpers -------------------------------------------------------------
export function conversationIdFor(emailA: string, emailB: string): string {
  return [emailA.toLowerCase(), emailB.toLowerCase()].sort().join(SEP)
}
export function otherParticipant(conversationId: string, ownerEmail: string): string {
  const [a, b] = conversationId.split(SEP)
  return a === ownerEmail.toLowerCase() ? b : a
}

function sortMessages(list: ChatMessage[]): ChatMessage[] {
  return list.sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id))
}

/** Idempotent merge: match by id, then by client_id (replacing an optimistic copy). */
function upsertMessage(m: ChatMessage) {
  const list = messagesByConv.get(m.conversationId)
  if (!list) return // thread not opened yet — summary refresh covers the list view
  let idx = list.findIndex((x) => x.id === m.id)
  if (idx === -1 && m.clientId) idx = list.findIndex((x) => x.clientId === m.clientId)
  if (idx === -1) list.push(m)
  else list[idx] = m
  messagesByConv.set(m.conversationId, sortMessages(list))
}

let summaryTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSummaryRefresh() {
  if (summaryTimer) return
  summaryTimer = setTimeout(() => {
    summaryTimer = null
    void refreshSummaries()
  }, 250)
}

// --- Loading -------------------------------------------------------------
export async function refreshSummaries(): Promise<void> {
  const { data, error } = await supabase.rpc('my_conversations')
  if (error || !data) return
  summaries = (data as Record<string, unknown>[]).map((r) => ({
    conversationId: r.conversation_id as string,
    otherEmail: (r.other_email as string | null) ?? otherParticipant(r.conversation_id as string, me),
    lastMessage: r.last_message_id
      ? {
          id: r.last_message_id as string,
          text: r.last_text as string,
          senderEmail: r.last_sender as string,
          sentAt: r.last_sent_at as string,
          kind: r.last_kind as MessageKind,
          deleted: Boolean(r.last_deleted),
        }
      : null,
    unreadCount: Number(r.unread_count),
    muted: Boolean(r.muted),
    archived: Boolean(r.archived),
    myLastReadAt: r.my_last_read_at as string,
    otherLastReadAt: (r.other_last_read_at as string | null) ?? null,
  }))
  bump()
}

async function loadBlocks() {
  const { data } = await supabase.from('user_blocks').select('blocked_email')
  blockedByMe = new Set((data ?? []).map((r: { blocked_email: string }) => r.blocked_email))
  bump()
}

async function hydrateExtras(messageIds: string[]) {
  if (messageIds.length === 0) return
  const [atts, reacts] = await Promise.all([
    supabase.from('message_attachments').select('*').in('message_id', messageIds),
    supabase.from('message_reactions').select('*').in('message_id', messageIds),
  ])
  for (const id of messageIds) {
    attachmentsByMessage.delete(id)
    reactionsByMessage.delete(id)
  }
  for (const r of (atts.data ?? []) as AttachmentRow[]) {
    const a = rowToAttachment(r)
    attachmentsByMessage.set(a.messageId, [...(attachmentsByMessage.get(a.messageId) ?? []), a])
  }
  for (const r of (reacts.data ?? []) as ReactionRow[]) {
    reactionsByMessage.set(r.message_id, [...(reactionsByMessage.get(r.message_id) ?? []), { messageId: r.message_id, userEmail: r.user_email, type: r.type }])
  }
}

export async function openConversation(conversationId: string): Promise<void> {
  if (messagesByConv.has(conversationId)) return
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(PAGE)
  const rows = ((data ?? []) as MessageRow[]).reverse()
  messagesByConv.set(conversationId, sortMessages(rows.map(rowToMessage)))
  hasMoreByConv.set(conversationId, rows.length === PAGE)
  await hydrateExtras(rows.map((r) => r.id))
  bump()
}

export async function loadEarlier(conversationId: string): Promise<void> {
  const list = messagesByConv.get(conversationId) ?? []
  const oldest = list.find((m) => m.status === 'sent')
  if (!oldest) return
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .lt('sent_at', oldest.sentAt)
    .order('sent_at', { ascending: false })
    .limit(PAGE)
  const rows = ((data ?? []) as MessageRow[]).reverse()
  for (const r of rows) upsertMessage(rowToMessage(r))
  hasMoreByConv.set(conversationId, rows.length === PAGE)
  await hydrateExtras(rows.map((r) => r.id))
  bump()
}

export function hasEarlier(conversationId: string): boolean {
  return hasMoreByConv.get(conversationId) ?? false
}

async function refreshAll() {
  await Promise.all([refreshSummaries(), loadBlocks()])
}

/** Re-fetch the newest page of every open thread — recovers anything missed while offline. */
async function resync() {
  await refreshSummaries()
  for (const conversationId of messagesByConv.keys()) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .limit(PAGE)
    const rows = (data ?? []) as MessageRow[]
    for (const r of rows) upsertMessage(rowToMessage(r))
    await hydrateExtras(rows.map((r) => r.id))
  }
  bump()
  if (activeConversationId) void markConversationRead(activeConversationId)
}

// --- Reads ---------------------------------------------------------------
export function listMessages(conversationId: string): ChatMessage[] {
  return messagesByConv.get(conversationId) ?? []
}
export function listConversations(): ConversationSummary[] {
  return summaries
}
/** Back-compat for the old owner-scoped signature. */
export function listConversationsFor(_ownerEmail: string): ConversationSummary[] {
  return summaries
}
export function getAttachments(messageId: string): MessageAttachment[] {
  return attachmentsByMessage.get(messageId) ?? []
}
export function getReactions(messageId: string): MessageReaction[] {
  return reactionsByMessage.get(messageId) ?? []
}
export function unreadTotal(): number {
  return summaries.reduce((n, s) => n + (s.muted || s.archived ? 0 : s.unreadCount), 0)
}
export function isBlockedByMe(email: string): boolean {
  return blockedByMe.has(email.toLowerCase())
}
export function summaryFor(conversationId: string): ConversationSummary | undefined {
  return summaries.find((s) => s.conversationId === conversationId)
}

// --- Writes --------------------------------------------------------------
export async function startConversationWith(otherEmail: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_conversation', { other_email: otherEmail })
  if (error) throw error
  await refreshSummaries()
  return data as string
}

async function ensureConversation(conversationId: string, senderEmail: string) {
  // Group chats (community:<id>) are created and populated server-side with the community.
  if (conversationId.startsWith('community:') || summaryFor(conversationId)) return
  await startConversationWith(otherParticipant(conversationId, senderEmail))
}

export interface AttachmentInput {
  file: File | Blob
  fileName: string
  category: ChatFileCategory
}

export interface SendOptions {
  replyTo?: string | null
  attachments?: AttachmentInput[]
  kind?: MessageKind
  onProgress?: (done: number, total: number) => void
}

async function uploadAttachment(senderEmail: string, input: AttachmentInput) {
  const base = `${senderEmail.toLowerCase()}/${crypto.randomUUID()}`
  const mime = input.file.type || 'application/octet-stream'
  const hash = await sha256Hex(input.file)
  const original = `${base}/original`
  const up = await supabase.storage.from('message-media').upload(original, input.file, { contentType: mime })
  if (up.error) throw up.error
  let previewPath: string | null = null
  let thumbPath: string | null = null
  let width: number | null = null
  let height: number | null = null
  let duration: number | null = null
  if (input.category === 'image') {
    const variants = await makeImageVariants(input.file as File).catch(() => null)
    if (variants) {
      previewPath = `${base}/preview`
      thumbPath = `${base}/thumb`
      const [p, t] = await Promise.all([
        supabase.storage.from('message-media').upload(previewPath, variants.preview, { contentType: variants.preview.type }),
        supabase.storage.from('message-media').upload(thumbPath, variants.thumb, { contentType: variants.thumb.type }),
      ])
      if (p.error || t.error) {
        previewPath = null
        thumbPath = null
      }
      width = variants.width
      height = variants.height
    }
  } else if (input.category === 'audio') {
    duration = await audioDurationSeconds(input.file)
  }
  return {
    storage_path: original,
    preview_path: previewPath,
    thumb_path: thumbPath,
    file_name: input.fileName,
    mime_type: mime,
    file_category: input.category,
    size_bytes: input.file.size,
    content_hash: hash,
    width,
    height,
    duration_seconds: duration,
  }
}

async function doInsert(clientId: string, conversationId: string, senderEmail: string, text: string, opts: SendOptions, uploaded: Awaited<ReturnType<typeof uploadAttachment>>[]) {
  const kind: MessageKind = opts.kind ?? (uploaded.length > 0 ? 'attachment' : 'text')
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_email: senderEmail, text, client_id: clientId, reply_to: opts.replyTo ?? null, kind })
    .select()
    .single()
  let row: MessageRow
  if (error) {
    // 23505 = our own retry already landed: fetch the existing row instead of failing.
    if (error.code !== '23505') throw error
    const existing = await supabase.from('messages').select('*').eq('conversation_id', conversationId).eq('client_id', clientId).single()
    if (existing.error) throw existing.error
    row = existing.data as MessageRow
  } else {
    row = data as MessageRow
  }
  if (uploaded.length > 0) {
    const { data: atts, error: attErr } = await supabase
      .from('message_attachments')
      .insert(uploaded.map((u) => ({ ...u, message_id: row.id, owner_email: senderEmail })))
      .select()
    if (attErr && attErr.code !== '23505') throw attErr
    for (const a of (atts ?? []) as AttachmentRow[]) {
      const att = rowToAttachment(a)
      attachmentsByMessage.set(att.messageId, [...(attachmentsByMessage.get(att.messageId) ?? []).filter((x) => x.id !== att.id), att])
    }
  }
  upsertMessage(rowToMessage(row))
  scheduleSummaryRefresh()
  bump()
  return row
}

const pendingUploads = new Map<string, Awaited<ReturnType<typeof uploadAttachment>>[]>()
const pendingOpts = new Map<string, SendOptions>()

export async function sendMessage(conversationId: string, senderEmail: string, text: string, opts: SendOptions = {}): Promise<ChatMessage> {
  setChatUser(senderEmail)
  await ensureConversation(conversationId, senderEmail)
  const clientId = crypto.randomUUID()
  if (!messagesByConv.has(conversationId)) await openConversation(conversationId)
  const optimistic: ChatMessage = {
    id: `local:${clientId}`,
    conversationId,
    senderEmail: senderEmail.toLowerCase(),
    text,
    sentAt: new Date().toISOString(),
    clientId,
    replyTo: opts.replyTo ?? null,
    deletedAt: null,
    kind: opts.kind ?? ((opts.attachments?.length ?? 0) > 0 ? 'attachment' : 'text'),
    status: 'sending',
  }
  upsertMessage(optimistic)
  pendingOpts.set(clientId, opts)
  bump()
  return runSend(optimistic)
}

async function runSend(optimistic: ChatMessage): Promise<ChatMessage> {
  const clientId = optimistic.clientId as string
  const opts = pendingOpts.get(clientId) ?? {}
  try {
    let uploaded = pendingUploads.get(clientId)
    if (!uploaded) {
      uploaded = []
      const files = opts.attachments ?? []
      for (let i = 0; i < files.length; i++) {
        opts.onProgress?.(i, files.length)
        uploaded.push(await uploadAttachment(optimistic.senderEmail, files[i]))
      }
      opts.onProgress?.(files.length, files.length)
      pendingUploads.set(clientId, uploaded)
    }
    const row = await doInsert(clientId, optimistic.conversationId, optimistic.senderEmail, optimistic.text, opts, uploaded)
    pendingUploads.delete(clientId)
    pendingOpts.delete(clientId)
    return rowToMessage(row)
  } catch (err) {
    upsertMessage({ ...optimistic, status: 'failed' })
    bump()
    throw err
  }
}

export async function retrySend(conversationId: string, clientId: string): Promise<void> {
  const msg = messagesByConv.get(conversationId)?.find((m) => m.clientId === clientId && m.status === 'failed')
  if (!msg) return
  upsertMessage({ ...msg, status: 'sending' })
  bump()
  try {
    await runSend(msg)
  } catch {
    /* status already set back to failed */
  }
}

export async function discardFailed(conversationId: string, clientId: string): Promise<void> {
  const list = messagesByConv.get(conversationId)
  if (!list) return
  messagesByConv.set(conversationId, list.filter((m) => !(m.clientId === clientId && m.status === 'failed')))
  pendingUploads.delete(clientId)
  pendingOpts.delete(clientId)
  bump()
}

export async function deleteMessage(message: ChatMessage): Promise<void> {
  const deletedAt = new Date().toISOString()
  const { error } = await supabase.from('messages').update({ deleted_at: deletedAt }).eq('id', message.id)
  if (error) throw error
  upsertMessage({ ...message, deletedAt })
  scheduleSummaryRefresh()
  bump()
}

export async function toggleMessageReaction(messageId: string, userEmail: string, type: ReactionType): Promise<void> {
  const email = userEmail.toLowerCase()
  const current = (reactionsByMessage.get(messageId) ?? []).find((r) => r.userEmail === email)
  const without = (reactionsByMessage.get(messageId) ?? []).filter((r) => r.userEmail !== email)
  if (current?.type === type) {
    reactionsByMessage.set(messageId, without)
    bump()
    const { error } = await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_email', email)
    if (error) throw error
    return
  }
  reactionsByMessage.set(messageId, [...without, { messageId, userEmail: email, type }])
  bump()
  const { error } = await supabase.from('message_reactions').upsert({ message_id: messageId, user_email: email, type }, { onConflict: 'message_id,user_email' })
  if (error) throw error
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const s = summaryFor(conversationId)
  if (s && s.unreadCount > 0) {
    s.unreadCount = 0
    bump()
  }
  await supabase.rpc('mark_conversation_read', { conv: conversationId })
}

export async function setMuted(conversationId: string, muted: boolean): Promise<void> {
  const { error } = await supabase.from('conversation_participants').update({ muted }).eq('conversation_id', conversationId).eq('participant_email', me)
  if (error) throw error
  const s = summaryFor(conversationId)
  if (s) s.muted = muted
  bump()
}

export async function setArchived(conversationId: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from('conversation_participants').update({ archived }).eq('conversation_id', conversationId).eq('participant_email', me)
  if (error) throw error
  const s = summaryFor(conversationId)
  if (s) s.archived = archived
  bump()
}

export async function blockUser(email: string): Promise<void> {
  const { error } = await supabase.from('user_blocks').insert({ blocker_email: me, blocked_email: email.toLowerCase() })
  if (error && error.code !== '23505') throw error
  blockedByMe.add(email.toLowerCase())
  bump()
}
export async function unblockUser(email: string): Promise<void> {
  const { error } = await supabase.from('user_blocks').delete().eq('blocker_email', me).eq('blocked_email', email.toLowerCase())
  if (error) throw error
  blockedByMe.delete(email.toLowerCase())
  bump()
}

export async function reportContent(targetType: 'message' | 'user', targetId: string, reason: string): Promise<void> {
  const { error } = await supabase.from('content_reports').insert({ reporter_email: me, target_type: targetType, target_id: targetId, reason })
  if (error) throw error
}

export async function searchMessages(conversationId: string, query: string): Promise<ChatMessage[]> {
  const q = query.trim().replace(/[%_]/g, (c) => `\\${c}`)
  if (!q) return []
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .ilike('text', `%${q}%`)
    .order('sent_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as MessageRow[]).map(rowToMessage)
}

// --- Private media (signed, expiring URLs) -------------------------------
const signedCache = new Map<string, { url: string; expiresAt: number }>()
export async function getAttachmentUrl(att: MessageAttachment, variant: 'original' | 'preview' | 'thumb'): Promise<string | null> {
  const path = variant === 'thumb' ? att.thumbPath ?? att.previewPath ?? att.storagePath : variant === 'preview' ? att.previewPath ?? att.storagePath : att.storagePath
  const cached = signedCache.get(path)
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.url
  const { data, error } = await supabase.storage.from('message-media').createSignedUrl(path, 3600)
  if (error || !data) return null
  signedCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 3600_000 })
  return data.signedUrl
}

// --- Realtime wiring -----------------------------------------------------
function handleMessageEvent(eventType: string, row: MessageRow) {
  const m = rowToMessage(row)
  upsertMessage(m)
  const s = summaryFor(m.conversationId)
  if (eventType === 'INSERT') {
    if (!s) {
      scheduleSummaryRefresh() // brand-new conversation from someone else
    } else {
      s.lastMessage = { id: m.id, text: m.text, senderEmail: m.senderEmail, sentAt: m.sentAt, kind: m.kind, deleted: false }
      if (m.senderEmail !== me) {
        if (activeConversationId === m.conversationId && document.visibilityState === 'visible') void markConversationRead(m.conversationId)
        else s.unreadCount += 1
      }
      summaries = [...summaries].sort((a, b) => (b.lastMessage?.sentAt ?? '').localeCompare(a.lastMessage?.sentAt ?? ''))
    }
  } else {
    scheduleSummaryRefresh()
  }
  bump()
}

let wasDown = false
let globalChannel: ReturnType<typeof supabase.channel> | null = null

/** (Re)join the global channel. Must run AFTER the session JWT is applied to
 * the realtime socket — postgres_changes is RLS-filtered per the token it was
 * joined with, so joining on the anon key (as happens on a page reload, before
 * the stored session loads) silently delivers nothing. */
function connectGlobalChannel() {
  if (globalChannel) void supabase.removeChannel(globalChannel)
  globalChannel = supabase
    .channel('chat-global')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (p) => {
      if (p.eventType !== 'DELETE') handleMessageEvent(p.eventType, p.new as MessageRow)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_attachments' }, (p) => {
      if (p.eventType === 'DELETE') return
      const a = rowToAttachment(p.new as AttachmentRow)
      attachmentsByMessage.set(a.messageId, [...(attachmentsByMessage.get(a.messageId) ?? []).filter((x) => x.id !== a.id), a])
      bump()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (p) => {
      if (p.eventType === 'DELETE') {
        const old = p.old as Partial<ReactionRow>
        if (old.message_id && old.user_email) {
          reactionsByMessage.set(old.message_id, (reactionsByMessage.get(old.message_id) ?? []).filter((r) => r.userEmail !== old.user_email))
        }
      } else {
        const r = p.new as ReactionRow
        reactionsByMessage.set(r.message_id, [...(reactionsByMessage.get(r.message_id) ?? []).filter((x) => x.userEmail !== r.user_email), { messageId: r.message_id, userEmail: r.user_email, type: r.type }])
      }
      bump()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, (p) => {
      if (p.eventType === 'DELETE') return
      const row = p.new as { conversation_id: string; participant_email: string; last_read_at: string }
      const s = summaryFor(row.conversation_id)
      if (!s) {
        scheduleSummaryRefresh()
        return
      }
      if (row.participant_email === s.otherEmail) s.otherLastReadAt = row.last_read_at
      bump()
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        connection = 'online'
        if (wasDown) void resync()
        wasDown = false
        bump()
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        wasDown = true
        connection = 'reconnecting'
        bump()
      }
    })
}

if (typeof window !== 'undefined') {
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) supabase.realtime.setAuth(data.session.access_token)
    connectGlobalChannel()
  })

  window.addEventListener('online', () => {
    // Back on the network: clear the banner optimistically and re-sync what we
    // missed. If the socket is genuinely dead, the channel's CLOSED/ERROR
    // status flips it straight back to "reconnecting".
    connection = 'online'
    bump()
    void resync()
  })
  window.addEventListener('offline', () => {
    connection = 'reconnecting'
    bump()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && me) void resync()
  })
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) supabase.realtime.setAuth(session.access_token)
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') connectGlobalChannel()
    if (event === 'SIGNED_OUT') {
      me = ''
      summaries = []
      messagesByConv.clear()
      attachmentsByMessage.clear()
      reactionsByMessage.clear()
      blockedByMe = new Set()
      bump()
    } else if (me && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
      void refreshAll()
    }
  })
}
