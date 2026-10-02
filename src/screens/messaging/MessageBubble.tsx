import { useState } from 'react'
import { deleteMessage, getAttachments, getReactions, retrySend, discardFailed, toggleMessageReaction, type ChatMessage } from '@/app/messageStore'
import { REACTIONS } from '@/app/reactionStore'
import { REACTION_ICON } from '@/shared/ui/ActivityCard'
import { RichText } from './richText'
import { AttachmentView } from './AttachmentView'

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function MessageBubble({
  message,
  ownerEmail,
  quoted,
  otherLastReadAt,
  otherOnline,
  selectMode,
  selected,
  onToggleSelect,
  onReply,
  onForward,
  onReport,
  displayName,
}: {
  message: ChatMessage
  ownerEmail: string
  quoted: ChatMessage | undefined
  otherLastReadAt: string | null
  otherOnline: boolean
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  onReply: () => void
  onForward: () => void
  onReport: () => void
  displayName: (email: string) => string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const mine = message.senderEmail.toLowerCase() === ownerEmail.toLowerCase()
  const deleted = Boolean(message.deletedAt)
  const attachments = getAttachments(message.id)
  const reactions = getReactions(message.id)
  const myReaction = reactions.find((r) => r.userEmail === ownerEmail.toLowerCase())?.type
  const grouped = REACTIONS.map((r) => ({ ...r, count: reactions.filter((x) => x.type === r.type).length })).filter((r) => r.count > 0)
  const read = mine && message.status === 'sent' && otherLastReadAt !== null && otherLastReadAt >= message.sentAt

  function status() {
    if (!mine) return null
    if (message.status === 'sending') return <span aria-label="Sending">🕓</span>
    if (message.status === 'failed') return <span aria-label="Failed" className="text-danger">!</span>
    if (read) return <span aria-label="Read" className="text-[#7dd3fc]">✓✓</span>
    if (otherOnline) return <span aria-label="Delivered">✓✓</span>
    return <span aria-label="Sent">✓</span>
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
    setMenuOpen(false)
  }

  return (
    <div className={`group flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`} data-message-id={message.id}>
      {selectMode && (
        <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label="Select message" className="mb-3 flex-none" />
      )}
      <div className={`relative max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-3 py-2 text-sm ${mine ? 'rounded-br-md bg-accent-solid text-white' : 'rounded-bl-md bg-surface-sunken text-text-0'} ${selected ? 'ring-2 ring-accent' : ''}`}>
          {quoted && (
            <div className="mb-1.5 rounded-lg border-s-2 border-current/50 bg-black/10 px-2 py-1 text-xs opacity-90">
              <div className="font-semibold">{displayName(quoted.senderEmail)}</div>
              <div className="line-clamp-2">{quoted.deletedAt ? 'Message deleted' : quoted.text || 'Attachment'}</div>
            </div>
          )}
          {deleted ? (
            <span className="italic opacity-70">This message was deleted</span>
          ) : (
            <>
              {attachments.length > 0 && (
                <div className="mb-1 flex flex-col gap-1.5">
                  {attachments.map((a) => (
                    <AttachmentView key={a.id} attachment={a} />
                  ))}
                </div>
              )}
              {message.kind === 'attachment' && attachments.length === 0 && message.status === 'sent' && <div className="text-xs opacity-70">Loading attachment…</div>}
              {message.text && <RichText text={message.text} />}
            </>
          )}
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-70">
            <span>{timeLabel(message.sentAt)}</span>
            {status()}
          </div>
        </div>

        {grouped.length > 0 && !deleted && (
          <div className="-mt-1.5 flex flex-wrap gap-1 px-1">
            {grouped.map((r) => {
              const Icon = REACTION_ICON[r.type]
              return (
                <button
                  key={r.type}
                  onClick={() => toggleMessageReaction(message.id, ownerEmail, r.type)}
                  aria-label={`${r.label} ${r.count}`}
                  className={`flex items-center gap-0.5 rounded-full border bg-surface px-1.5 py-0.5 text-[10.5px] ${myReaction === r.type ? 'border-accent text-accent' : 'border-border text-text-1'}`}
                >
                  <Icon size={12} />
                  {r.count}
                </button>
              )
            })}
          </div>
        )}

        {message.status === 'failed' && (
          <div className="mt-0.5 flex gap-2 text-[11px]">
            <span className="text-danger">Not sent.</span>
            <button className="font-semibold text-accent" onClick={() => message.clientId && retrySend(message.conversationId, message.clientId)}>
              Retry
            </button>
            <button className="font-semibold text-text-1" onClick={() => message.clientId && discardFailed(message.conversationId, message.clientId)}>
              Discard
            </button>
          </div>
        )}
      </div>

      {!deleted && message.status === 'sent' && !selectMode && (
        <div className="relative flex-none opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Message actions" aria-haspopup="menu" aria-expanded={menuOpen} className="rounded-md px-1.5 py-1 text-text-2 hover:text-text-0">
            ⋯
          </button>
          {menuOpen && (
            <div role="menu" className={`absolute bottom-full z-20 mb-1 w-44 rounded-xl border border-border bg-surface p-1 text-xs shadow-lg ${mine ? 'right-0' : 'left-0'}`}>
              <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { setPickerOpen(true); setMenuOpen(false) }}>
                React
              </button>
              <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { onReply(); setMenuOpen(false) }}>
                Reply
              </button>
              {message.text && (
                <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
              <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { onForward(); setMenuOpen(false) }}>
                Forward
              </button>
              <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { onToggleSelect(); setMenuOpen(false) }}>
                Select
              </button>
              {mine ? (
                <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left text-danger hover:bg-surface-sunken" onClick={() => { deleteMessage(message); setMenuOpen(false) }}>
                  Delete
                </button>
              ) : (
                <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left text-danger hover:bg-surface-sunken" onClick={() => { onReport(); setMenuOpen(false) }}>
                  Report
                </button>
              )}
            </div>
          )}
          {pickerOpen && (
            <div className={`absolute bottom-full z-20 mb-1 flex gap-1 rounded-full border border-border bg-surface p-1 shadow-lg ${mine ? 'right-0' : 'left-0'}`}>
              {REACTIONS.map((r) => {
                const Icon = REACTION_ICON[r.type]
                return (
                  <button
                    key={r.type}
                    aria-label={r.label}
                    title={r.label}
                    onClick={() => {
                      toggleMessageReaction(message.id, ownerEmail, r.type)
                      setPickerOpen(false)
                    }}
                    className={`rounded-full p-1.5 hover:bg-surface-sunken ${myReaction === r.type ? 'text-accent' : 'text-text-1'}`}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
