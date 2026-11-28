import { useState } from 'react'
import { deleteMessage, getAttachments, getReactions, retrySend, discardFailed, toggleMessageReaction, type ChatMessage } from '@/app/messageStore'
import { REACTIONS } from '@/app/reactionStore'
import { REACTION_ICON } from '@/shared/ui/reactionIcons'
import { RichText } from './richText'
import { AttachmentView } from './AttachmentView'
import { CClock, CCopy, CForward, CMore, CReply, CSelect, CSmile, CTicks, CTrash, CFlag } from './chatIcons'
import { ChatMenu, MenuItem } from './ChatMenu'

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
  showSender = false,
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
  showSender?: boolean
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
    if (message.status === 'sending') return <span aria-label="Sending" className="inline-flex"><CClock size={12} /></span>
    if (message.status === 'failed') return <span aria-label="Failed" className="inline-flex font-bold text-[#FFB4AB]">!</span>
    if (read) return <span aria-label="Read" className="inline-flex text-[#7DF3FF]"><CTicks double size={15} /></span>
    if (otherOnline) return <span aria-label="Delivered" className="inline-flex"><CTicks double size={15} /></span>
    return <span aria-label="Sent" className="inline-flex"><CTicks size={15} /></span>
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
      <div className={`relative max-w-[78%] md:max-w-[72%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-[20px] px-3.5 py-2 text-[14px] leading-relaxed shadow-sm ${mine ? 'rounded-ee-md bg-gradient-to-br from-[#1565D8] to-[#0A2E8A] text-white' : 'rounded-es-md border border-border bg-surface text-text-0'} ${selected ? 'ring-2 ring-accent' : ''}`}>
          {showSender && !mine && <div className="mb-0.5 text-[11px] font-semibold text-accent">{displayName(message.senderEmail)}</div>}
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
          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${mine ? 'text-white/75' : 'text-text-2'}`}>
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
        <div className="relative flex flex-none items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <button onClick={() => setPickerOpen((v) => !v)} aria-label="React" title="React" className="flex h-7 w-7 items-center justify-center rounded-full text-text-2 hover:bg-surface-sunken hover:text-text-0"><CSmile size={16} /></button>
          <button onClick={onReply} aria-label="Reply" title="Reply" className="flex h-7 w-7 items-center justify-center rounded-full text-text-2 hover:bg-surface-sunken hover:text-text-0"><CReply size={16} /></button>
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Message actions" aria-haspopup="menu" aria-expanded={menuOpen} title="More" className="flex h-7 w-7 items-center justify-center rounded-full text-text-2 hover:bg-surface-sunken hover:text-text-0"><CMore size={16} /></button>
          <ChatMenu open={menuOpen} onClose={() => setMenuOpen(false)} align={mine ? 'right' : 'left'} up label="Message actions">
            {message.text && <MenuItem icon={<CCopy size={17} />} onClick={copy}>{copied ? 'Copied' : 'Copy'}</MenuItem>}
            <MenuItem icon={<CForward size={17} />} onClick={() => { onForward(); setMenuOpen(false) }}>Forward</MenuItem>
            <MenuItem icon={<CSelect size={17} />} onClick={() => { onToggleSelect(); setMenuOpen(false) }}>Select</MenuItem>
            {mine ? (
              <MenuItem danger icon={<CTrash size={17} />} onClick={() => { deleteMessage(message); setMenuOpen(false) }}>Delete</MenuItem>
            ) : (
              <MenuItem danger icon={<CFlag size={17} />} onClick={() => { onReport(); setMenuOpen(false) }}>Report</MenuItem>
            )}
          </ChatMenu>
          {pickerOpen && (
            <div className={`absolute bottom-full z-20 mb-2 flex gap-0.5 rounded-full border border-border bg-surface p-1.5 shadow-xl ${mine ? 'right-0' : 'left-0'}`}>
              {REACTIONS.map((r) => {
                const Icon = REACTION_ICON[r.type]
                return (
                  <button key={r.type} aria-label={r.label} title={r.label} onClick={() => { toggleMessageReaction(message.id, ownerEmail, r.type); setPickerOpen(false) }} className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-surface-sunken ${myReaction === r.type ? 'bg-accent-soft text-accent' : 'text-text-1'}`}>
                    <Icon size={19} />
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
