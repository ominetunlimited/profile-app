import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { COMMUNITY_SEEDS, isMember, memberCount, toggleMembership } from '@/app/communitiesStore'
import { listDiscussionsFor, replyToDiscussion, startDiscussion, type DiscussionPost } from '@/app/discussionStore'
import { findAccountByEmail } from '@/app/demoAccountStore'

const TABS = ['discussions', 'members', 'about'] as const

function authorLabel(email: string): string {
  const account = findAccountByEmail(email)
  return account?.legalName ?? email
}

/** §21.2 Community Detail — discussions/members/about. */
export function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const community = COMMUNITY_SEEDS.find((c) => c.id === id)
  const [tab, setTab] = useState<(typeof TABS)[number]>('discussions')
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [, forceRender] = useState(0)
  const [posts, setPosts] = useState<DiscussionPost[]>(() => (id ? listDiscussionsFor(id) : []))
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  function refreshPosts() {
    if (id) setPosts(listDiscussionsFor(id))
  }

  if (!community) {
    return (
      <AppShell>
        <div className="p-10 text-center text-sm text-text-1">No community found at this address.</div>
      </AppShell>
    )
  }

  const member = isMember(owner, community.id)

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-0">{community.name}</h1>
            <p className="text-sm text-text-1">
              {community.type} · {memberCount(community.id)} member{memberCount(community.id) === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => {
              toggleMembership(owner, community.id)
              forceRender((n) => n + 1)
            }}
            className={`flex-none rounded-lg border px-4 py-2 text-sm font-semibold ${member ? 'border-border-strong text-text-1' : 'border-accent text-accent'}`}
          >
            {member ? 'Leave' : 'Join'}
          </button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize ${tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'discussions' &&
          (member ? (
            <div className="flex flex-col gap-3">
              {!composing ? (
                <button
                  onClick={() => setComposing(true)}
                  className="w-full rounded-lg border border-dashed border-border-strong py-3 text-sm font-medium text-text-1"
                >
                  + Start a discussion
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-surface p-3">
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Share something with ${community.name}…`}
                    rows={3}
                    className="mb-2 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={!draft.trim()}
                      onClick={() => {
                        startDiscussion(community.id, owner, draft.trim())
                        setDraft('')
                        setComposing(false)
                        refreshPosts()
                      }}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Post
                    </button>
                    <button onClick={() => setComposing(false)} className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-1">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
                  No discussions started yet — be the first.
                </div>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="mb-1 text-xs font-semibold text-text-0">{authorLabel(p.authorEmail)}</div>
                    <p className="mb-2 text-sm text-text-1">{p.body}</p>

                    {p.replies.length > 0 && (
                      <div className="mb-2 flex flex-col gap-1.5 border-l-2 border-border pl-3">
                        {p.replies.map((r) => (
                          <div key={r.id} className="text-xs text-text-1">
                            <span className="font-semibold text-text-0">{authorLabel(r.authorEmail)}</span>: {r.body}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={replyDrafts[p.id] ?? ''}
                        onChange={(e) => setReplyDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        placeholder="Reply…"
                        className="flex-1 rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-xs outline-none focus-visible:border-accent"
                      />
                      <button
                        disabled={!(replyDrafts[p.id] ?? '').trim()}
                        onClick={() => {
                          replyToDiscussion(p.id, owner, (replyDrafts[p.id] ?? '').trim())
                          setReplyDrafts((d) => ({ ...d, [p.id]: '' }))
                          refreshPosts()
                        }}
                        className="rounded-lg border border-border-strong px-2.5 py-1.5 text-xs font-semibold text-text-1 disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
              Join to see and start discussions.
            </div>
          ))}

        {tab === 'members' && (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-1">
            {memberCount(community.id) === 0 ? 'No members yet.' : `${memberCount(community.id)} member(s) — member directory isn't built yet in this phase.`}
          </div>
        )}

        {tab === 'about' && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-1">{community.description}</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
