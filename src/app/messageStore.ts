/**
 * §20 Messaging System. Previously entirely decorative: "No conversations
 * yet" was a permanently hardcoded empty state with no real thread/message
 * store anywhere in this build — a real message could never be sent between
 * two real accounts registered on this browser, even the ones a person
 * creates specifically to test messaging (a demo account and a real one, or
 * two real accounts). This is the real, basic version: persisted text
 * messages between two real accounts, no fabricated delivery. What §20 asks
 * for beyond this — real-time delivery, typing indicators, read receipts,
 * end-to-end encryption, file/voice/contract attachments — genuinely needs
 * backend infrastructure (a socket/push channel, server-held keys) this
 * client-only build doesn't have, so those stay honestly absent rather than
 * faked. §20's planRules.free 'connections_only' restriction also isn't
 * enforced here: no connections/social-graph store exists yet either
 * (ConnectionsPage.tsx), and ProfilePage's own Message button already
 * offers messaging to any real viewed account regardless — gating a real
 * feature behind an unbuilt one would just recreate the same dead end.
 */
export interface MessageRecord {
  id: string
  conversationId: string
  senderEmail: string
  text: string
  sentAt: string
}

const STORAGE_KEY = 'profile:demo-messages'
const SEP = '::'

function readAll(): MessageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: MessageRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

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

export function listMessages(conversationId: string): MessageRecord[] {
  return readAll()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
}

export function sendMessage(conversationId: string, senderEmail: string, text: string): MessageRecord {
  const record: MessageRecord = { id: crypto.randomUUID(), conversationId, senderEmail, text, sentAt: new Date().toISOString() }
  writeAll([...readAll(), record])
  return record
}

export interface ConversationSummary {
  conversationId: string
  otherEmail: string
  lastMessage: MessageRecord
}

/** Every real conversation this owner is a real participant in, most
 * recently active first — derived from the message list itself rather than
 * a separate conversations table, since a conversation only really exists
 * once a first message has actually been sent. */
export function listConversationsFor(ownerEmail: string): ConversationSummary[] {
  const owner = ownerEmail.toLowerCase()
  const byConversation = new Map<string, MessageRecord[]>()
  for (const m of readAll()) {
    if (!m.conversationId.includes(owner)) continue
    const list = byConversation.get(m.conversationId) ?? []
    list.push(m)
    byConversation.set(m.conversationId, list)
  }
  const summaries: ConversationSummary[] = []
  for (const [conversationId, msgs] of byConversation) {
    const sorted = msgs.sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    summaries.push({ conversationId, otherEmail: otherParticipant(conversationId, owner), lastMessage: sorted[sorted.length - 1] })
  }
  return summaries.sort((a, b) => b.lastMessage.sentAt.localeCompare(a.lastMessage.sentAt))
}
