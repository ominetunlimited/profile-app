import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { ActionBar } from '@/shared/ui/ActionBar'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import {
  appealAction,
  communitiesLoaded,
  countsFor,
  createPost,
  getCommunityBySlug,
  inviteFor,
  isAdmin,
  isMod,
  joinCommunity,
  leaveCommunity,
  listMembers,
  listPosts,
  loadPosts,
  membershipOf,
  moderateMember,
  myAppeal,
  pendingRequestFor,
  pinPost,
  postsLoaded,
  removePost,
  reportInCommunity,
  respondToInvite,
  roleOf,
  setMemberRole,
  useCommunitiesVersion,
  type Community,
  type CommunityMember,
  type CommunityPost,
  type CommunityRole,
} from '@/app/communityStore'
import { RichText } from '@/screens/messaging/richText'
import { ChatThread } from '@/screens/messaging/ChatThread'
import { CommunityAvatar, useCommunityImage } from './CommunityAvatar'
import { CommunityManage } from './CommunityManage'

const name = (email: string) => findAccountByEmail(email)?.legalName ?? email
const ROLE_RANK: Record<CommunityRole, number> = { owner: 4, admin: 3, moderator: 2, member: 1 }

/** §21.2 Community Detail — real posts, members, group chat and moderation. */
export function CommunityDetail() {
  const { id: slug } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  useCommunitiesVersion()
  const { account } = useAccount()
  const owner = ownerKey(account)
  const community = slug ? getCommunityBySlug(slug) : undefined
  const role = community ? roleOf(community.id, owner) : null
  const membership = community ? membershipOf(community.id, owner) : undefined
  const banned = membership?.status === 'banned'
  const canRead = !!community && !banned && (community.privacy === 'public' || role !== null)
  const tabParam = params.get('tab') ?? 'posts'

  useEffect(() => {
    if (community && canRead && !postsLoaded(community.id)) void loadPosts(community.id)
  }, [community?.id, canRead])

  const cover = useCommunityImage(community?.coverPath ?? null)

  if (!community) {
    return (
      <AppShell>
        <div className="p-10 text-center text-sm text-text-1">
          {communitiesLoaded() ? 'No community found at this address — it may be private, invite-only, or removed.' : 'Loading…'}
          <div className="mt-3">
            <Link to="/communities" className="font-semibold text-accent">
              ← All communities
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const stats = countsFor(community.id)
  const tabs = [
    ['posts', 'Posts'],
    ...(community.kind === 'group' && role ? [['chat', 'Chat']] : []),
    ...(role ? [['members', 'Members']] : []),
    ['about', 'About'],
    ...(isMod(role) ? [['manage', 'Manage']] : []),
  ] as [string, string][]
  const tab = tabs.some(([k]) => k === tabParam) ? tabParam : 'posts'

  return (
    <AppShell>
      <div className="mx-auto max-w-[800px] px-4 py-6 sm:px-6">
        <Link to="/communities" className="mb-3 inline-block text-sm font-semibold text-accent">
          ← Communities
        </Link>

        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="h-28 w-full bg-gradient-to-r from-accent-soft to-surface-sunken sm:h-36">{cover && <img src={cover} alt="" className="h-full w-full object-cover" />}</div>
          <div className="flex flex-wrap items-start gap-3 p-4">
            <div className="-mt-10 rounded-xl border-2 border-surface bg-surface">
              <CommunityAvatar community={community} size={56} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-text-0">{community.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-2">
                <span>{community.type}</span>·<span>{community.kind === 'group' ? 'Group' : 'Community'}</span>·
                <span>
                  {stats.members} member{stats.members === 1 ? '' : 's'}
                </span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">{community.privacy === 'public' ? 'Public' : community.privacy === 'private' ? 'Private' : 'Invite-only'}</span>
                {community.status === 'suspended' && <span className="rounded-full border border-danger px-1.5 py-0.5 text-[10px] text-danger">Suspended by PROFILE moderators</span>}
                {role && <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold capitalize text-accent">{role}</span>}
              </div>
            </div>
            <MembershipButton community={community} owner={owner} signedIn={!!account} role={role} banned={banned} />
          </div>
        </div>

        {banned && <AppealBox community={community} owner={owner} />}

        {!banned && (
          <>
            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', key); n.delete('post'); return n })}
                  className={`whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm font-semibold ${tab === key ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'posts' && <PostsTab community={community} owner={owner} role={role} canRead={canRead} membership={membership} highlight={params.get('post')} />}
            {tab === 'chat' && role && <ChatThread ownerEmail={owner} conversationId={`community:${community.id}`} groupTitle={community.name} />}
            {tab === 'members' && role && <MembersTab community={community} owner={owner} role={role} />}
            {tab === 'about' && <AboutTab community={community} />}
            {tab === 'manage' && isMod(role) && <CommunityManage community={community} owner={owner} role={role as CommunityRole} />}
          </>
        )}
      </div>
    </AppShell>
  )
}

function MembershipButton({ community, owner, signedIn, role, banned }: { community: Community; owner: string; signedIn: boolean; role: CommunityRole | null; banned: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requested = pendingRequestFor(community.id, owner)
  const invite = inviteFor(community.id, owner)
  if (!signedIn || banned || community.status === 'suspended') return null

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {role ? (
        role !== 'owner' && (
          <button disabled={busy} onClick={() => run(() => leaveCommunity(community.id))} className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-1">
            Leave
          </button>
        )
      ) : requested ? (
        <span className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-2">Request pending</span>
      ) : invite ? (
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => run(() => respondToInvite(invite.id, true))} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
            Accept invitation
          </button>
          <button disabled={busy} onClick={() => run(() => respondToInvite(invite.id, false))} className="text-xs font-semibold text-text-1">
            Decline
          </button>
        </div>
      ) : community.privacy === 'invite_only' ? (
        <span className="text-xs text-text-2">Invite-only</span>
      ) : (
        <button disabled={busy} onClick={() => run(() => joinCommunity(community.id))} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
          {community.privacy === 'public' ? 'Join' : 'Request to join'}
        </button>
      )}
      {error && (
        <p role="alert" className="max-w-[220px] text-right text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function AppealBox({ community, owner }: { community: Community; owner: string }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const existing = myAppeal(community.id, owner)
  return (
    <div className="mb-4 rounded-xl border border-danger bg-surface p-4">
      <h2 className="mb-1 font-semibold text-text-0">You've been banned from this community</h2>
      {existing ? (
        <p className="text-sm text-text-1">Your appeal is with the community's admins.</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-text-1">If you think this was a mistake, you can appeal to the admins once.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="Appeal message" className="mb-2 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm" placeholder="Explain what happened…" />
          {error && <p role="alert" className="mb-2 text-xs text-danger">{error}</p>}
          <button
            disabled={busy || text.trim().length < 5}
            onClick={async () => {
              setBusy(true)
              try {
                await appealAction(community.id, text.trim())
              } catch (e) {
                setError((e as Error).message)
              }
              setBusy(false)
            }}
            className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Submit appeal
          </button>
        </>
      )}
    </div>
  )
}

function PostsTab({ community, owner, role, canRead, membership, highlight }: { community: Community; owner: string; role: CommunityRole | null; canRead: boolean; membership: CommunityMember | undefined; highlight: string | null }) {
  const [draft, setDraft] = useState('')
  const [kind, setKind] = useState<'discussion' | 'announcement'>('discussion')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const posts = listPosts(community.id).filter((p) => !p.deletedAt || isMod(role) || p.authorEmail === owner)
  const muted = !!membership?.mutedUntil && new Date(membership.mutedUntil) > new Date()
  const canPost = role !== null && !muted && community.status === 'active'
  const { account } = useAccount()

  if (!canRead) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
        {community.privacy === 'invite_only' ? 'This community is invite-only.' : 'Join this community to see and take part in its discussions.'}
      </div>
    )
  }

  async function submit() {
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    setError(null)
    try {
      await createPost(community.id, owner, body, kind)
      setDraft('')
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {muted && <p className="rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">You're muted in this community until {new Date(membership!.mutedUntil!).toLocaleString()}.</p>}
      {canPost && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={5000} aria-label="Start a discussion" placeholder="Start a discussion…" className="mb-2 w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus-visible:border-accent" />
          <div className="flex items-center gap-2">
            {isMod(role) && (
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Post type" className="min-h-[34px] rounded-lg border border-border-strong bg-surface px-2 text-xs">
                <option value="discussion">Discussion</option>
                <option value="announcement">Announcement (notifies everyone)</option>
              </select>
            )}
            <div className="flex-1" />
            <button disabled={busy || !draft.trim()} onClick={submit} className="rounded-lg bg-accent-solid px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
              Post
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      )}
      {!postsLoaded(community.id) ? (
        <p className="text-sm text-text-2">Loading discussions…</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">No discussions yet — be the first to start one.</div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} community={community} owner={owner} role={role} viewerAccount={account} highlighted={highlight === p.id} />)
      )}
    </div>
  )
}

function PostCard({ post, community, owner, role, viewerAccount, highlighted }: { post: CommunityPost; community: Community; owner: string; role: CommunityRole | null; viewerAccount: ReturnType<typeof useAccount>['account']; highlighted: boolean }) {
  const [menu, setMenu] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('Spam or scam')
  const ref = useRef<HTMLElement>(null)
  const mine = post.authorEmail.toLowerCase() === owner.toLowerCase()
  const authorRole = listMembers(community.id).find((m) => m.email.toLowerCase() === post.authorEmail.toLowerCase())?.role
  const author = findAccountByEmail(post.authorEmail)
  const username = author && 'username' in author ? author.username : undefined

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlighted])

  return (
    <article ref={ref} className={`rounded-xl border bg-surface p-4 ${highlighted ? 'border-accent ring-2 ring-accent/40' : 'border-border'} ${post.deletedAt ? 'opacity-60' : ''}`}>
      <div className="mb-2 flex items-center gap-2">
        <UserAvatar ownerEmail={post.authorEmail} name={name(post.authorEmail)} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {username ? (
              <Link to={`/profile/${username}`} className="font-semibold text-text-0 hover:text-accent">
                {name(post.authorEmail)}
              </Link>
            ) : (
              <span className="font-semibold text-text-0">{name(post.authorEmail)}</span>
            )}
            {authorRole && authorRole !== 'member' && <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold capitalize text-accent">{authorRole}</span>}
            {post.kind === 'announcement' && <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-warning">Announcement</span>}
            {post.pinned && <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-text-2">Pinned</span>}
          </div>
          <div className="text-[11px] text-text-2">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
        {!post.deletedAt && (
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-label="Post options" aria-haspopup="menu" aria-expanded={menu} className="rounded-md px-2 py-1 text-text-2 hover:text-text-0">
              ⋯
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-surface p-1 text-xs shadow-lg">
                {isMod(role) && (
                  <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { void pinPost(post.id, !post.pinned); setMenu(false) }}>
                    {post.pinned ? 'Unpin' : 'Pin to top'}
                  </button>
                )}
                {(mine || isMod(role)) && (
                  <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left text-danger hover:bg-surface-sunken" onClick={() => { void removePost(post, mine ? '' : 'Removed by moderator'); setMenu(false) }}>
                    Remove
                  </button>
                )}
                {!mine && role && (
                  <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => { setReporting(true); setMenu(false) }}>
                    Report
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {post.deletedAt ? <p className="text-sm italic text-text-2">Removed {isMod(role) ? '(visible to moderators)' : ''}</p> : <div className="mb-2 text-sm text-text-0"><RichText text={post.body} /></div>}
      {reporting && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-surface-sunken p-2 text-xs">
          <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Report reason" className="min-h-[32px] rounded-lg border border-border-strong bg-surface px-1.5">
            {['Spam or scam', 'Harassment or abuse', 'Impersonation', 'Inappropriate content', 'Other'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="rounded-lg bg-accent-solid px-3 py-1.5 font-semibold text-white" onClick={async () => { await reportInCommunity(community.id, 'community_post', post.id, reason).catch(() => {}); setReporting(false) }}>
            Send report
          </button>
          <button className="font-semibold text-text-1" onClick={() => setReporting(false)}>Cancel</button>
        </div>
      )}
      {!post.deletedAt && <ActionBar target={{ type: 'community_post', id: post.id }} viewerEmail={owner} viewerAccount={role ? viewerAccount : null} authorEmail={post.authorEmail} />}
    </article>
  )
}

function MembersTab({ community, owner, role }: { community: Community; owner: string; role: CommunityRole }) {
  const members = listMembers(community.id).filter((m) => m.status === 'active')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    setOpenMenu(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
      <div className="overflow-hidden rounded-xl border border-border">
        {members
          .sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || a.joinedAt.localeCompare(b.joinedAt))
          .map((m) => {
            const mine = m.email.toLowerCase() === owner.toLowerCase()
            const canManageRole = isAdmin(role) && !mine && m.role !== 'owner' && (role === 'owner' || ROLE_RANK[m.role] < 3)
            const canModerate = isMod(role) && !mine && ROLE_RANK[m.role] < ROLE_RANK[role]
            const muted = m.mutedUntil && new Date(m.mutedUntil) > new Date()
            return (
              <div key={m.email} className="flex items-center gap-3 border-b border-border bg-surface px-3.5 py-2.5 last:border-b-0">
                <UserAvatar ownerEmail={m.email} name={name(m.email)} size={30} />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-text-0">{name(m.email)}</span>
                  {mine && <span className="ms-1 text-xs text-text-2">(you)</span>}
                  <div className="text-[11px] text-text-2">
                    <span className="capitalize">{m.role}</span> · joined {new Date(m.joinedAt).toLocaleDateString()}
                    {muted && <span className="ms-1 text-warning">· muted</span>}
                  </div>
                </div>
                {(canManageRole || canModerate) && (
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === m.email ? null : m.email)} aria-label={`Manage ${name(m.email)}`} aria-haspopup="menu" className="rounded-md px-2 py-1 text-text-2 hover:text-text-0">
                      ⋯
                    </button>
                    {openMenu === m.email && (
                      <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-surface p-1 text-xs shadow-lg">
                        {canManageRole && (['admin', 'moderator', 'member'] as const).filter((r) => r !== m.role && (role === 'owner' || r !== 'admin')).map((r) => (
                          <button key={r} role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left capitalize hover:bg-surface-sunken" onClick={() => run(() => setMemberRole(community.id, m.email, r))}>
                            Make {r}
                          </button>
                        ))}
                        {canModerate && (
                          <>
                            <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => run(() => moderateMember(community.id, m.email, 'warn', undefined, 'Warning'))}>Warn</button>
                            {muted ? (
                              <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => run(() => moderateMember(community.id, m.email, 'unmute'))}>Unmute</button>
                            ) : (
                              <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-sunken" onClick={() => run(() => moderateMember(community.id, m.email, 'mute', 24, 'Muted for 24 hours'))}>Mute 24h</button>
                            )}
                            <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left text-danger hover:bg-surface-sunken" onClick={() => run(() => moderateMember(community.id, m.email, 'remove', undefined, 'Removed'))}>Remove</button>
                            <button role="menuitem" className="block w-full rounded-lg px-2.5 py-1.5 text-left text-danger hover:bg-surface-sunken" onClick={() => run(() => moderateMember(community.id, m.email, 'ban', undefined, 'Banned'))}>Ban</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

function AboutTab({ community }: { community: Community }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold text-text-0">About</h2>
        <p className="whitespace-pre-wrap text-sm text-text-1">{community.description || 'No description yet.'}</p>
      </section>
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold text-text-0">Rules</h2>
        <p className="whitespace-pre-wrap text-sm text-text-1">{community.rules || 'No rules have been set.'}</p>
      </section>
      <p className="text-xs text-text-2">
        Created {new Date(community.createdAt).toLocaleDateString()} · Owner: {name(community.ownerEmail)}. Reports go to this community's moderators, and PROFILE moderators retain oversight.
      </p>
    </div>
  )
}
