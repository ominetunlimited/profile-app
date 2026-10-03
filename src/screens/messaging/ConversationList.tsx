import { useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { listConversations, useChatVersion } from '@/app/messageStore'
import { findAccountByEmail } from '@/app/demoAccountStore'

function displayNameFor(email: string): string {
  return findAccountByEmail(email)?.legalName ?? email
}

function preview(c: ReturnType<typeof listConversations>[number], me: string): string {
  const m = c.lastMessage
  if (!m) return 'No messages yet'
  if (m.deleted) return 'Message deleted'
  const body = m.text || (m.kind === 'attachment' ? '📎 Attachment' : '')
  return `${m.senderEmail === me.toLowerCase() ? 'You: ' : ''}${body}`
}

export function ConversationList({ ownerEmail, onOpen }: { ownerEmail: string; onOpen: (conversationId: string) => void }) {
  useChatVersion()
  const [showArchived, setShowArchived] = useState(false)
  const [search, setSearch] = useState('')
  const all = listConversations().filter((c) => c.lastMessage !== null && !c.conversationId.startsWith('community:'))
  const archivedCount = all.filter((c) => c.archived).length
  const q = search.trim().toLowerCase()
  const conversations = all.filter((c) => c.archived === showArchived).filter((c) => !q || displayNameFor(c.otherEmail).toLowerCase().includes(q) || (c.lastMessage?.text ?? '').toLowerCase().includes(q))

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" aria-label="Search conversations" className="min-h-[40px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent" />
        {(archivedCount > 0 || showArchived) && (
          <button onClick={() => setShowArchived((v) => !v)} className="flex-none rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-1">
            {showArchived ? 'Inbox' : `Archived (${archivedCount})`}
          </button>
        )}
      </div>
      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          {showArchived ? 'No archived conversations.' : 'No conversations yet. Message someone from their profile to start a real thread.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <button key={c.conversationId} onClick={() => onOpen(c.conversationId)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:border-accent">
              <UserAvatar ownerEmail={c.otherEmail} name={displayNameFor(c.otherEmail)} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`truncate ${c.unreadCount > 0 ? 'font-bold' : 'font-semibold'} text-text-0`}>{displayNameFor(c.otherEmail)}</span>
                  {c.muted && <span aria-label="Muted" title="Muted" className="text-xs text-text-2">🔕</span>}
                </div>
                <p className={`truncate text-sm ${c.unreadCount > 0 ? 'font-medium text-text-0' : 'text-text-1'}`}>{preview(c, ownerEmail)}</p>
              </div>
              <div className="flex flex-none flex-col items-end gap-1">
                <span className="text-xs text-text-2">{c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleDateString() : ''}</span>
                {c.unreadCount > 0 && (
                  <span aria-label={`${c.unreadCount} unread`} className="min-w-[20px] rounded-full bg-accent-solid px-1.5 text-center text-[11px] font-bold leading-5 text-white">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
