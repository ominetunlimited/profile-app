import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { conversationIdFor, setChatUser, startConversationWith } from '@/app/messageStore'
import { IconMessage } from '@/shared/ui/icons'
import { ChatThread } from './ChatThread'
import { ConversationList } from './ConversationList'
import { CommunityDirectory } from '@/screens/communities/CommunityDirectory'

const TABS = ['messages', 'communities'] as const

/** §20 Messaging System + §21.2 Communities & Groups — combined per the Handoff's
 * single screen; §10.4 also gives Communities its own top-level route
 * (`/communities`), which lands on this tab directly. */
export function MessagingCommunities({ initialTab }: { initialTab?: (typeof TABS)[number] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab ?? 'messages')
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [params] = useSearchParams()
  const withEmail = params.get('with')
  const [openConversationId, setOpenConversationId] = useState<string | null>(null)

  useEffect(() => {
    setChatUser(owner)
  }, [owner])

  // `?with=` deep link (from a profile / notification): create the conversation
  // atomically server-side (both participants), then open it.
  useEffect(() => {
    if (!withEmail || !owner) return
    startConversationWith(withEmail)
      .then((id) => setOpenConversationId(id))
      .catch(() => setOpenConversationId(conversationIdFor(owner, withEmail)))
  }, [withEmail, owner])

  return (
    <AppShell>
      <div className={`mx-auto px-4 pb-16 pt-7 sm:px-8 ${tab === 'messages' ? 'max-w-[1180px]' : 'max-w-[800px]'}`}>
        <h1 className="mb-2 text-[26px] font-bold leading-tight tracking-tight text-text-0">Messages &amp; Communities</h1>
        <div role="tablist" className="mb-5 mt-4 flex gap-5 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setOpenConversationId(null)
              }}
              role="tab"
              aria-selected={tab === t}
              className={`-mb-px border-b-2 pb-3 text-[12.5px] capitalize ${tab === t ? 'border-accent font-semibold text-text-0' : 'border-transparent font-normal text-text-1'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'messages' && (
          <div className="flex h-[calc(100dvh-15rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-surface">
            <div className={`${openConversationId ? 'hidden md:flex' : 'flex'} w-full flex-none flex-col border-border md:w-[320px] md:border-r`}>
              <ConversationList ownerEmail={owner} onOpen={setOpenConversationId} activeId={openConversationId} />
            </div>
            <div className={`${openConversationId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
              {openConversationId ? (
                <ChatThread embedded ownerEmail={owner} conversationId={openConversationId} onBack={() => setOpenConversationId(null)} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"><IconMessage size={22} /></span>
                  <p className="text-sm font-semibold text-text-0">Select a conversation</p>
                  <p className="max-w-xs text-xs text-text-1">Open a thread to read it, or message someone from their profile to start a private conversation.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'communities' && <CommunityDirectory />}
      </div>
    </AppShell>
  )
}
