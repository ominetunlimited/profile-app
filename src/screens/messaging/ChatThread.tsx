import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { IconChevronLeft } from '@/shared/ui/icons'
import {
  blockUser,
  deleteMessage,
  getConnectionState,
  hasEarlier,
  isBlockedByMe,
  listConversations,
  listMessages,
  loadEarlier,
  openConversation,
  reportContent,
  searchMessages,
  sendMessage,
  setActiveConversation,
  setArchived,
  setMuted,
  summaryFor,
  unblockUser,
  useChatVersion,
  otherParticipant,
  type ChatMessage,
} from '@/app/messageStore'
import { useConversationChannel } from '@/app/chatChannel'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { ChatComposer } from './ChatComposer'
import { MessageBubble } from './MessageBubble'

function displayNameFor(email: string): string {
  return findAccountByEmail(email)?.legalName ?? email
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function ChatThread({ ownerEmail, conversationId, onBack, groupTitle, embedded = false }: { ownerEmail: string; conversationId: string; onBack?: () => void; groupTitle?: string; embedded?: boolean }) {
  const isGroup = !!groupTitle
  useChatVersion()
  const otherEmail = isGroup ? '' : otherParticipant(conversationId, ownerEmail)
  const { typing, online, emitTyping } = useConversationChannel(conversationId, ownerEmail)
  const messages = listMessages(conversationId)
  const summary = summaryFor(conversationId)
  const blocked = !isGroup && isBlockedByMe(otherEmail)
  const otherOnline = isGroup ? online.length > 0 : online.includes(otherEmail.toLowerCase())
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChatMessage[] | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [forwarding, setForwarding] = useState<ChatMessage[] | null>(null)
  const [reporting, setReporting] = useState<{ type: 'message' | 'user'; id: string } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const stickBottom = useRef(true)
  const prevHeight = useRef<number | null>(null)

  useEffect(() => {
    void openConversation(conversationId)
    setActiveConversation(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId])

  // Keep pinned to the newest message unless the reader scrolled up; preserve
  // position when older history is prepended.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    if (prevHeight.current !== null) {
      el.scrollTop = el.scrollHeight - prevHeight.current
      prevHeight.current = null
    } else if (stickBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  })

  const onScroll = useCallback(() => {
    const el = scroller.current
    if (!el) return
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages])
  const typingNow = isGroup ? typing.length > 0 : typing.includes(otherEmail.toLowerCase())
  const typingLabel = isGroup ? `${typing.map((e) => displayNameFor(e)).join(', ')} ${typing.length > 1 ? 'are' : 'is'} typing…` : `${displayNameFor(otherEmail)} is typing…`

  async function runSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 2) return setResults(null)
    setResults(await searchMessages(conversationId, q))
  }

  function toggleSelect(id: string) {
    setSelectMode(true)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectMode(false)
      return next
    })
  }
  const selectedMessages = messages.filter((m) => selected.has(m.id))

  async function forwardTo(targetConversationId: string) {
    const list = forwarding ?? []
    setForwarding(null)
    for (const m of list) {
      const body = m.text ? `↪ Forwarded:\n${m.text}` : '↪ Forwarded an attachment'
      await sendMessage(targetConversationId, ownerEmail, body)
    }
    setSelectMode(false)
    setSelected(new Set())
    setNotice('Forwarded.')
    setTimeout(() => setNotice(null), 2000)
  }

  let lastDay = ''

  return (
    <div className={embedded ? 'flex h-full min-h-0 flex-col bg-surface' : 'flex h-[70vh] flex-col rounded-xl border border-border bg-surface'}>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="text-sm font-semibold text-accent" aria-label="Back to conversations">
            <IconChevronLeft size={18} />
          </button>
        )}
        {!isGroup && <UserAvatar ownerEmail={otherEmail} name={displayNameFor(otherEmail)} size={36} />}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-text-0">{isGroup ? groupTitle : displayNameFor(otherEmail)}</div>
          <div className="h-4 text-[11px] text-text-2" aria-live="polite">
            {typingNow ? <span className="text-accent">{typingLabel}</span> : otherOnline ? (isGroup ? `${online.length} online` : 'Online') : ''}
          </div>
        </div>
        {selectMode ? (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-text-1">{selected.size} selected</span>
            <button onClick={() => navigator.clipboard?.writeText(selectedMessages.map((m) => m.text).filter(Boolean).join('\n'))} className="text-accent">Copy</button>
            <button onClick={() => setForwarding(selectedMessages)} className="text-accent">Forward</button>
            {selectedMessages.every((m) => m.senderEmail.toLowerCase() === ownerEmail.toLowerCase()) && (
              <button onClick={async () => { for (const m of selectedMessages) await deleteMessage(m); setSelectMode(false); setSelected(new Set()) }} className="text-danger">Delete</button>
            )}
            <button onClick={() => { setSelectMode(false); setSelected(new Set()) }} className="text-text-1">Cancel</button>
          </div>
        ) : (
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Conversation options" aria-haspopup="menu" aria-expanded={menuOpen} className="rounded-md px-2 py-1 text-text-1 hover:text-text-0">
              ⋯
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-surface p-1 text-xs shadow-lg">
                <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false) }}>
                  Search in conversation
                </button>
                <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { void setMuted(conversationId, !summary?.muted); setMenuOpen(false) }}>
                  {summary?.muted ? 'Unmute notifications' : 'Mute notifications'}
                </button>
                <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { void setArchived(conversationId, !summary?.archived); setMenuOpen(false); onBack?.() }}>
                  {summary?.archived ? 'Unarchive' : 'Archive'}
                </button>
                {!isGroup && (
                  <>
                    <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { void (blocked ? unblockUser(otherEmail) : blockUser(otherEmail)); setMenuOpen(false) }}>
                      {blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left text-danger hover:bg-surface-sunken" onClick={() => { setReporting({ type: 'user', id: otherEmail }); setMenuOpen(false) }}>
                      Report user
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {getConnectionState() === 'reconnecting' && (
        <div role="status" className="bg-warning-soft px-3 py-1 text-center text-xs font-medium text-warning">
          Reconnecting… messages will sync automatically.
        </div>
      )}
      {notice && <div role="status" className="bg-success-soft px-3 py-1 text-center text-xs font-medium text-success">{notice}</div>}

      {searchOpen && (
        <div className="border-b border-border p-2">
          <input autoFocus value={query} onChange={(e) => void runSearch(e.target.value)} placeholder="Search this conversation…" aria-label="Search this conversation" className="min-h-[36px] w-full rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent" />
          {results && (
            <div className="mt-2 max-h-40 overflow-y-auto text-xs">
              {results.length === 0 ? <p className="p-2 text-text-2">No matches.</p> : results.map((r) => (
                <div key={r.id} className="rounded-lg p-2 hover:bg-surface-sunken">
                  <span className="font-semibold">{displayNameFor(r.senderEmail)}</span> · <span className="text-text-2">{new Date(r.sentAt).toLocaleString()}</span>
                  <div className="truncate text-text-1">{r.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto bg-surface px-4 py-5 md:px-5">
        {hasEarlier(conversationId) && (
          <div className="mb-3 text-center">
            <button
              onClick={() => {
                prevHeight.current = scroller.current?.scrollHeight ?? null
                void loadEarlier(conversationId)
              }}
              className="rounded-full border border-border-strong px-3 py-1 text-xs font-semibold text-text-1"
            >
              Load earlier messages
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <p className="text-center text-sm text-text-1">{isGroup ? 'No messages yet — start the conversation with the group.' : 'Say hello — this is a real, private thread between you two.'}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((m) => {
              const label = dayLabel(m.sentAt)
              const showDay = label !== lastDay
              lastDay = label
              return (
                <div key={m.id} className="flex flex-col gap-2.5">
                  {showDay && <div className="self-center rounded-full bg-surface-sunken px-3 py-0.5 text-[11px] font-medium text-text-2">{label}</div>}
                  <MessageBubble
                    message={m}
                    ownerEmail={ownerEmail}
                    quoted={m.replyTo ? byId.get(m.replyTo) : undefined}
                    otherLastReadAt={isGroup ? null : summary?.otherLastReadAt ?? null}
                    otherOnline={otherOnline}
                    selectMode={selectMode}
                    selected={selected.has(m.id)}
                    onToggleSelect={() => toggleSelect(m.id)}
                    onReply={() => setReplyTo(m)}
                    onForward={() => setForwarding([m])}
                    onReport={() => setReporting({ type: 'message', id: m.id })}
                    displayName={displayNameFor}
                    showSender={isGroup}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {blocked ? (
        <div className="border-t border-border p-3 text-center text-sm text-text-1">
          You blocked {displayNameFor(otherEmail)}.{' '}
          <button className="font-semibold text-accent" onClick={() => void unblockUser(otherEmail)}>
            Unblock
          </button>{' '}
          to send messages.
        </div>
      ) : (
        <ChatComposer ownerEmail={ownerEmail} conversationId={conversationId} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} emitTyping={emitTyping} displayName={displayNameFor} />
      )}

      {forwarding && (
        <div role="dialog" aria-modal="true" aria-label="Forward to" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setForwarding(null)}>
          <div className="max-h-[70vh] w-[min(420px,100%)] overflow-y-auto rounded-2xl border border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 font-semibold text-text-0">Forward to…</div>
            {listConversations().filter((c) => c.conversationId !== conversationId).length === 0 ? (
              <p className="text-sm text-text-1">No other conversations to forward to.</p>
            ) : (
              listConversations().filter((c) => c.conversationId !== conversationId).map((c) => (
                <button key={c.conversationId} onClick={() => void forwardTo(c.conversationId)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-sunken">
                  {displayNameFor(c.otherEmail)}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {reporting && <ReportDialog target={reporting} onClose={() => setReporting(null)} onDone={() => { setReporting(null); setNotice('Report sent to PROFILE moderators.'); setTimeout(() => setNotice(null), 2500) }} />}
    </div>
  )
}

function ReportDialog({ target, onClose, onDone }: { target: { type: 'message' | 'user'; id: string }; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('Spam or scam')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div role="dialog" aria-modal="true" aria-label="Report" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-[min(380px,100%)] rounded-2xl border border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 font-semibold text-text-0">Report {target.type === 'message' ? 'message' : 'user'}</div>
        <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" className="mb-3 min-h-[40px] w-full rounded-lg border border-border-strong bg-surface px-2 text-sm">
          {['Spam or scam', 'Harassment or abuse', 'Impersonation', 'Inappropriate content', 'Other'].map((r) => <option key={r}>{r}</option>)}
        </select>
        {error && <p role="alert" className="mb-2 text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-semibold">Cancel</button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await reportContent(target.type, target.id, reason)
                onDone()
              } catch {
                setError('Could not send the report. Please try again.')
                setBusy(false)
              }
            }}
            className="rounded-lg bg-accent-solid px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send report
          </button>
        </div>
      </div>
    </div>
  )
}
