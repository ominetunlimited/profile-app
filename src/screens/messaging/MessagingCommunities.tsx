import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { conversationIdFor, setChatUser, startConversationWith } from '@/app/messageStore'
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
          <div className="md:grid md:min-h-[max(480px,70dvh)] md:grid-cols-[300px_minmax(0,1fr)] md:gap-4">
            <div className={openConversationId ? 'hidden md:block' : ''}>
              <ConversationList ownerEmail={owner} onOpen={setOpenConversationId} />
            </div>
            <div className={openConversationId ? '' : 'hidden md:block'}>
              {openConversationId ? (
                <ChatThread ownerEmail={owner} conversationId={openConversationId} onBack={() => setOpenConversationId(null)} />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-[13px] border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
                  Select a conversation to read it, or message someone from their profile.
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
