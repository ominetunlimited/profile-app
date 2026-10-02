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
            <ChatThread ownerEmail={owner} conversationId={openConversationId} onBack={() => setOpenConversationId(null)} />
          ) : (
            <ConversationList ownerEmail={owner} onOpen={setOpenConversationId} />
          ))}

        {tab === 'communities' && <CommunityDirectory />}
      </div>
    </AppShell>
  )
}
