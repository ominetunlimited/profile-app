import { useState } from 'react'
import { IconSearch } from '@/shared/ui/icons'
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

export function ConversationList({ ownerEmail, onOpen, activeId }: { ownerEmail: string; onOpen: (conversationId: string) => void; activeId?: string | null }) {
  useChatVersion()
  const [showArchived, setShowArchived] = useState(false)
  const [search, setSearch] = useState('')
  const all = listConversations().filter((c) => c.lastMessage !== null && !c.conversationId.startsWith('community:'))
  const archivedCount = all.filter((c) => c.archived).length
  const q = search.trim().toLowerCase()
  const conversations = all.filter((c) => c.archived === showArchived).filter((c) => !q || displayNameFor(c.otherEmail).toLowerCase().includes(q) || (c.lastMessage?.text ?? '').toLowerCase().includes(q))

  const unreadTotal = all.reduce((n, c) => n + c.unreadCount, 0)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-text-0">Messages{unreadTotal > 0 && <span className="ms-2 rounded-full bg-accent-solid px-1.5 py-0.5 align-middle text-[10px] font-bold text-white">{unreadTotal}</span>}</h2>
          {(archivedCount > 0 || showArchived) && (
            <button onClick={() => setShowArchived((v) => !v)} className="rounded-lg px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft">
              {showArchived ? 'Inbox' : `Archived (${archivedCount})`}
            </button>
          )}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-2"><IconSearch size={14} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" aria-label="Search conversations" className="min-h-[38px] w-full rounded-xl border border-border bg-surface-sunken ps-8 pe-3 text-xs outline-none focus-visible:border-accent" />
        </div>
      </div>
      {conversations.length === 0 ? (
        <div className="m-4 rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
          {showArchived ? 'No archived conversations.' : 'No conversations yet. Message someone from their profile to start a real thread.'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const active = activeId === c.conversationId
            return (
              <button key={c.conversationId} onClick={() => onOpen(c.conversationId)} aria-current={active ? 'true' : undefined} className={`flex w-full items-start gap-3 border-b border-border border-s-2 px-4 py-3.5 text-left transition-colors hover:bg-surface-sunken ${active ? 'border-s-accent bg-accent-soft' : 'border-s-transparent'}`}>
                <UserAvatar ownerEmail={c.otherEmail} name={displayNameFor(c.otherEmail)} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.unreadCount > 0 ? 'font-extrabold' : 'font-bold'} text-text-0`}>{displayNameFor(c.otherEmail)}{c.muted && <span aria-label="Muted" title="Muted" className="ms-1 text-xs text-text-2">🔕</span>}</span>
                    <span className="flex-none text-[10px] text-text-2">{c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={`truncate text-xs ${c.unreadCount > 0 ? 'font-medium text-text-0' : 'text-text-1'}`}>{preview(c, ownerEmail)}</p>
                    {c.unreadCount > 0 && (
                      <span aria-label={`${c.unreadCount} unread`} className="flex h-5 min-w-[20px] flex-none items-center justify-center rounded-full bg-accent-solid px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
