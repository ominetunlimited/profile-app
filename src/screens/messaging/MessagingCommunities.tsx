import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { COMMUNITY_SEEDS, isMember, memberCount, toggleMembership } from '@/app/communitiesStore'
import { conversationIdFor, joinConversation, listConversationsFor, listMessages, onMessagesChange, otherParticipant, sendMessage } from '@/app/messageStore'
import { findAccountByEmail } from '@/app/demoAccountStore'

const TABS = ['messages', 'communities'] as const

function displayNameFor(email: string): string {
  return findAccountByEmail(email)?.legalName ?? email
}

/** §20 Messaging System + §21.2 Communities & Groups — combined per the Handoff's
 * single screen; §10.4 also gives Communities its own top-level route
 * (`/communities`), which lands on this tab directly. */
export function MessagingCommunities({ initialTab }: { initialTab?: (typeof TABS)[number] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab ?? 'messages')
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [, forceRender] = useState(0)
  const [params] = useSearchParams()
  const withEmail = params.get('with')
  const [openConversationId, setOpenConversationId] = useState<string | null>(() => (withEmail ? conversationIdFor(owner, withEmail) : null))

  return (
    <AppShell>
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-text-0">Messages &amp; Communities</h1>
        <div className="mb-6 flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setOpenConversationId(null)
              }}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize ${tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'messages' &&
          (openConversationId ? (
            <ConversationThread ownerEmail={owner} conversationId={openConversationId} onBack={() => setOpenConversationId(null)} />
          ) : (
            <ConversationList ownerEmail={owner} onOpen={setOpenConversationId} />
          ))}

        {tab === 'communities' && (
          <div className="flex flex-col gap-3">
            {COMMUNITY_SEEDS.map((c) => {
              const member = isMember(owner, c.id)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/communities/${c.id}`} className="font-semibold text-text-0 hover:text-accent">
                      {c.name}
                    </Link>
                    <div className="text-xs text-text-2">
                      {c.type} · {memberCount(c.id)} member{memberCount(c.id) === 1 ? '' : 's'}
                    </div>
                    <p className="mt-1 text-sm text-text-1">{c.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      toggleMembership(owner, c.id)
                      forceRender((n) => n + 1)
                    }}
                    className={`flex-none rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      member ? 'border-border-strong text-text-1' : 'border-accent text-accent'
                    }`}
                  >
                    {member ? 'Leave' : 'Join'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ConversationList({ ownerEmail, onOpen }: { ownerEmail: string; onOpen: (conversationId: string) => void }) {
  const [, forceRender] = useState(0)
  // Pipeline repair Phase A: the messages cache loads asynchronously (and
  // can receive a Realtime push) — without this, a conversation list opened
  // before the initial fetch resolves would freeze empty.
  useEffect(() => onMessagesChange(() => forceRender((n) => n + 1)), [])
  const conversations = listConversationsFor(ownerEmail)

  if (conversations.length === 0) {
    return (
      <div>
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          No conversations yet. Message someone from their profile to start a real thread.
        </div>
        <p className="mt-4 text-center text-xs text-text-2">Hiring · Collaboration · Verification · Partnership · Consulting · Marketplace threads all live here once started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((c) => (
        <button
          key={c.conversationId}
          onClick={() => onOpen(c.conversationId)}
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-left hover:border-accent"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-text-0">{displayNameFor(c.otherEmail)}</div>
            <p className="truncate text-sm text-text-1">
              {c.lastMessage.senderEmail === ownerEmail ? 'You: ' : ''}
              {c.lastMessage.text}
            </p>
          </div>
          <span className="flex-none text-xs text-text-2">{new Date(c.lastMessage.sentAt).toLocaleDateString()}</span>
        </button>
      ))}
    </div>
  )
}

function ConversationThread({ ownerEmail, conversationId, onBack }: { ownerEmail: string; conversationId: string; onBack: () => void }) {
  const [messages, setMessages] = useState(() => listMessages(conversationId))
  const [draft, setDraft] = useState('')
  const otherEmail = otherParticipant(conversationId, ownerEmail)

  useEffect(() => {
    // Opening a thread is the real self-registration step for the recipient
    // side of RLS (see messageStore.ts's joinConversation) — without this,
    // a conversation someone else started would never become visible here.
    joinConversation(conversationId, ownerEmail).then(() => setMessages(listMessages(conversationId)))
    return onMessagesChange(() => setMessages(listMessages(conversationId)))
  }, [conversationId, ownerEmail])

  async function handleSend() {
    if (!draft.trim()) return
    const text = draft.trim()
    setDraft('')
    await sendMessage(conversationId, ownerEmail, text)
    setMessages(listMessages(conversationId))
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <button onClick={onBack} className="text-sm font-semibold text-accent">
          ←
        </button>
        <span className="font-semibold text-text-0">{displayNameFor(otherEmail)}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-text-1">Say hello — this is a real, private thread between you two.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.senderEmail.toLowerCase() === ownerEmail.toLowerCase()
              return (
                <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? 'ml-auto bg-accent-solid text-white' : 'bg-surface-sunken text-text-0'}`}>
                  {m.text}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          placeholder="Type a message…"
          className="min-h-[42px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
        />
        <button onClick={handleSend} className="rounded-lg bg-accent-solid px-4 py-2 text-sm font-semibold text-white">
          Send
        </button>
      </div>
    </div>
  )
}
