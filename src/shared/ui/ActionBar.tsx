import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Account } from '@/app/accountTypes'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { getMyReaction, getReactionCounts, REACTIONS, setMyReaction, useReactionsCacheVersion, type ReactionType } from '@/app/reactionStore'
import { commentCountOn, deleteComment, listCommentsOn, postCommentOn, useCommentsCacheVersion, type CommentRecord } from '@/app/commentStore'
import {
  endorsementsFor,
  getEngagement,
  getMyRepost,
  hasEndorsed,
  isBookmarked,
  removeRepost,
  repostTarget,
  targetLink,
  targetTitle,
  toggleBookmark,
  toggleEndorsement,
  useSocialCacheVersion,
  type ActionTargetType,
  type OriginalType,
  type RepostVisibility,
} from '@/app/socialStore'
import { listConversations, sendMessage, useChatVersion } from '@/app/messageStore'
import { REACTION_ICON } from './reactionIcons'
import { UserAvatar } from './UserAvatar'
import { IconBookmark, IconMessage, IconRepost, IconShare, IconStar } from './icons'

type ActionTarget = { type: ActionTargetType; id: string }

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

function ActionButton({ label, active, count, onClick, children, expanded }: { label: string; active?: boolean; count?: number; onClick: () => void; children: ReactNode; expanded?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-surface-sunken ${active ? 'text-accent' : 'text-text-2'}`}
    >
      {children}
      {count !== undefined && count > 0 && <span className="text-[11px]">{count}</span>}
    </button>
  )
}

/**
 * One action row for every shareable thing on the platform (activity, job,
 * advert): react, comment, repost (optionally with your own commentary),
 * share (link / send in a message), save, recommend. Everything is a real,
 * RLS-guarded write; counts come from anonymised aggregate views.
 */
export function ActionBar({
  target,
  viewerEmail,
  viewerAccount,
  authorEmail,
  defaultCommentsOpen = false,
}: {
  target: ActionTarget
  viewerEmail: string
  viewerAccount: Account | null
  authorEmail: string
  defaultCommentsOpen?: boolean
}) {
  useReactionsCacheVersion()
  useCommentsCacheVersion()
  useSocialCacheVersion()
  const { type, id } = target
  const signedIn = !!viewerAccount && !!viewerEmail
  const isOwn = authorEmail.toLowerCase() === viewerEmail.toLowerCase()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [repostOpen, setRepostOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [recommendOpen, setRecommendOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen)
  const [error, setError] = useState<string | null>(null)
  const pickerRef = useOutsideClose(pickerOpen, () => setPickerOpen(false))
  const repostRef = useOutsideClose(repostOpen, () => setRepostOpen(false))
  const shareRef = useOutsideClose(shareOpen, () => setShareOpen(false))
  const recommendRef = useOutsideClose(recommendOpen, () => setRecommendOpen(false))

  const myReaction = signedIn ? getMyReaction(type, id, viewerEmail) : null
  const activeReaction = REACTIONS.find((r) => r.type === myReaction)
  const totalReactions = Object.values(getReactionCounts(type, id)).reduce((a, b) => a + b, 0)
  const engagement = getEngagement(type, id)
  const comments = Math.max(commentCountOn(type, id), engagement.comments)
  const canRepost = type !== 'community_post'
  const myRepost = signedIn && canRepost ? getMyRepost(type, id, viewerEmail) : undefined
  const saved = signedIn && isBookmarked(viewerEmail, type, id)
  const recommended = signedIn && hasEndorsed(viewerEmail, type, id)
  const recommenders = endorsementsFor(type, id)

  async function guard(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as { message?: string })?.message || 'That did not go through. Please try again.')
    }
  }

  const ReactIcon = REACTION_ICON[activeReaction?.type ?? 'appreciate']

  return (
    <div>
      <div className="relative flex flex-wrap items-center gap-0.5 border-t border-border pt-2 text-text-2">
        <div className="relative" ref={pickerRef}>
          <ActionButton label={activeReaction ? `Your reaction: ${activeReaction.label}. Change reaction` : 'React'} active={!!activeReaction} count={totalReactions} expanded={pickerOpen} onClick={() => signedIn && setPickerOpen((v) => !v)}>
            <ReactIcon size={16} />
            <span className="hidden sm:inline">{activeReaction?.label ?? 'React'}</span>
          </ActionButton>
          {pickerOpen && (
            <div role="menu" aria-label="Choose a reaction" className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-border-strong bg-surface p-1 shadow-lg">
              {REACTIONS.map((r) => {
                const Icon = REACTION_ICON[r.type]
                return (
                  <button
                    key={r.type}
                    role="menuitemradio"
                    aria-checked={myReaction === r.type}
                    aria-label={r.label}
                    title={r.label}
                    onClick={() => {
                      setPickerOpen(false)
                      void guard(() => setMyReaction(type, id, viewerEmail, r.type as ReactionType))
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full hover:scale-110 hover:bg-surface-sunken ${myReaction === r.type ? 'bg-surface-sunken text-accent' : ''}`}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <ActionButton label="Comment" count={comments} expanded={commentsOpen} onClick={() => setCommentsOpen((v) => !v)}>
          <IconMessage size={16} />
          <span className="hidden sm:inline">Comment</span>
        </ActionButton>

        {canRepost && (
        <div className="relative" ref={repostRef}>
          <ActionButton label={myRepost ? 'You reposted this' : 'Repost'} active={!!myRepost} count={engagement.reposts} expanded={repostOpen} onClick={() => signedIn && setRepostOpen((v) => !v)}>
            <IconRepost size={16} />
            <span className="hidden sm:inline">{myRepost ? 'Reposted' : 'Repost'}</span>
          </ActionButton>
          {repostOpen && canRepost && (
            <RepostMenu
              target={target as { type: OriginalType; id: string }}
              viewerEmail={viewerEmail}
              isOwn={isOwn}
              existing={myRepost}
              onClose={() => setRepostOpen(false)}
              onError={setError}
            />
          )}
        </div>
        )}

        <div className="relative" ref={shareRef}>
          <ActionButton label="Share" expanded={shareOpen} onClick={() => setShareOpen((v) => !v)}>
            <IconShare size={16} />
            <span className="hidden sm:inline">Share</span>
          </ActionButton>
          {shareOpen && <ShareMenu target={target} viewerEmail={viewerEmail} signedIn={signedIn} onClose={() => setShareOpen(false)} />}
        </div>

        <ActionButton label={saved ? 'Remove from saved' : 'Save'} active={saved} onClick={() => signedIn && void guard(() => toggleBookmark(viewerEmail, type, id))}>
          <IconBookmark size={16} filled={saved} />
          <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
        </ActionButton>

        <div className="relative" ref={recommendRef}>
          <ActionButton
            label={recommended ? 'Remove your recommendation' : 'Recommend'}
            active={recommended}
            count={engagement.endorsements}
            expanded={recommendOpen}
            onClick={() => {
              if (!signedIn) return
              if (recommended) void guard(() => toggleEndorsement(viewerEmail, type, id))
              else setRecommendOpen((v) => !v)
            }}
          >
            <IconStar size={16} filled={recommended} />
            <span className="hidden sm:inline">{recommended ? 'Recommended' : 'Recommend'}</span>
          </ActionButton>
          {recommendOpen && (
            <RecommendPopover
              onCancel={() => setRecommendOpen(false)}
              onConfirm={(note) => {
                setRecommendOpen(false)
                void guard(() => toggleEndorsement(viewerEmail, type, id, note))
              }}
            />
          )}
        </div>
      </div>

      {recommenders.length > 0 && (
        <p className="mt-1.5 text-[11px] text-text-2">
          Recommended by{' '}
          {recommenders
            .slice(0, 3)
            .map((r) => findAccountByEmail(r.userEmail)?.legalName ?? 'someone')
            .join(', ')}
          {recommenders.length > 3 ? ` and ${recommenders.length - 3} more` : ''}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
      {commentsOpen && <CommentThread type={type} id={id} viewerEmail={viewerEmail} canComment={signedIn} />}
    </div>
  )
}

function RepostMenu({ target, viewerEmail, isOwn, existing, onClose, onError }: { target: ActionTarget; viewerEmail: string; isOwn: boolean; existing: ReturnType<typeof getMyRepost>; onClose: () => void; onError: (m: string | null) => void }) {
  const [composing, setComposing] = useState(false)
  const [commentary, setCommentary] = useState(existing?.commentary ?? '')
  const [visibility, setVisibility] = useState<RepostVisibility>(existing?.visibility ?? 'public')
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    onError(null)
    try {
      await fn()
      onClose()
    } catch (e) {
      onError((e as { message?: string })?.message || 'Could not repost.')
      setBusy(false)
    }
  }

  if (isOwn) {
    return (
      <div role="menu" className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-xl border border-border bg-surface p-3 text-xs text-text-1 shadow-lg">
        You can't repost your own post.
      </div>
    )
  }
  return (
    <div role="menu" className="absolute bottom-full left-0 z-10 mb-1 w-72 max-w-[85vw] rounded-xl border border-border bg-surface p-1.5 text-xs shadow-lg">
      {!composing ? (
        <>
          {!existing && (
            <button role="menuitem" disabled={busy} className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-surface-sunken" onClick={() => void run(() => repostTarget({ me: viewerEmail, type: target.type, id: target.id }))}>
              <span className="font-semibold text-text-0">Repost</span>
              <span className="block text-text-2">Share to your followers with attribution</span>
            </button>
          )}
          <button role="menuitem" className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-surface-sunken" onClick={() => setComposing(true)}>
            <span className="font-semibold text-text-0">{existing ? 'Edit your comment' : 'Repost with your thoughts'}</span>
            <span className="block text-text-2">Add your own commentary above the original</span>
          </button>
          {existing && (
            <button role="menuitem" disabled={busy} className="block w-full rounded-lg px-2.5 py-2 text-left text-danger hover:bg-surface-sunken" onClick={() => void run(() => removeRepost(existing.id))}>
              Undo repost
            </button>
          )}
        </>
      ) : (
        <div className="p-1.5">
          <textarea
            autoFocus
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add your thoughts…"
            aria-label="Your commentary"
            className="mb-2 w-full resize-none rounded-lg border border-border-strong bg-surface px-2.5 py-2 text-sm outline-none focus-visible:border-accent"
          />
          <div className="flex items-center gap-2">
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as RepostVisibility)} aria-label="Who can see this repost" className="min-h-[32px] flex-1 rounded-lg border border-border-strong bg-surface px-1.5 text-xs">
              <option value="public">Public</option>
              <option value="connections_only">Connections only</option>
              <option value="private">Only me</option>
            </select>
            <button disabled={busy} onClick={() => void run(() => repostTarget({ me: viewerEmail, type: target.type, id: target.id, commentary, visibility }))} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {existing ? 'Save' : 'Repost'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShareMenu({ target, viewerEmail, signedIn, onClose }: { target: ActionTarget; viewerEmail: string; signedIn: boolean; onClose: () => void }) {
  useChatVersion()
  const [copied, setCopied] = useState(false)
  const [picking, setPicking] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const url = `${window.location.origin}${targetLink(target.type, target.id)}`
  const title = targetTitle(target.type, target.id)
  const conversations = listConversations().filter((c) => c.lastMessage)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div role="menu" className="absolute bottom-full left-0 z-10 mb-1 w-64 max-w-[85vw] rounded-xl border border-border bg-surface p-1.5 text-xs shadow-lg">
      {!picking ? (
        <>
          <button
            role="menuitem"
            className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-surface-sunken"
            onClick={() => {
              void navigator.clipboard?.writeText(url).catch(() => {})
              setCopied(true)
              setTimeout(onClose, 900)
            }}
          >
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          {signedIn && (
            <button role="menuitem" className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-surface-sunken" onClick={() => setPicking(true)}>
              Send in a message…
            </button>
          )}
          {canNativeShare && (
            <button role="menuitem" className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-surface-sunken" onClick={() => { void navigator.share({ title, url }).catch(() => {}); onClose() }}>
              Share via device…
            </button>
          )}
        </>
      ) : sentTo ? (
        <p className="p-2 text-text-1">Sent to {sentTo}.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-2 text-text-2">No conversations yet — start one from someone's profile.</p>
          ) : (
            conversations.map((c) => {
              const name = findAccountByEmail(c.otherEmail)?.legalName ?? c.otherEmail
              return (
                <button
                  key={c.conversationId}
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-surface-sunken"
                  onClick={async () => {
                    await sendMessage(c.conversationId, viewerEmail, `${title}\n${url}`, { kind: 'shared_item' })
                    setSentTo(name)
                    setTimeout(onClose, 1200)
                  }}
                >
                  <UserAvatar ownerEmail={c.otherEmail} name={name} size={22} />
                  <span className="truncate">{name}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function RecommendPopover({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (note: string) => void }) {
  const [note, setNote] = useState('')
  return (
    <div role="dialog" aria-label="Recommend" className="absolute bottom-full left-0 z-10 mb-1 w-64 max-w-[85vw] rounded-xl border border-border bg-surface p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-text-0">Recommend this</p>
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Why? (optional)" aria-label="Recommendation note" className="mb-2 min-h-[34px] w-full rounded-lg border border-border-strong bg-surface px-2.5 text-xs outline-none focus-visible:border-accent" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-xs font-semibold text-text-1">
          Cancel
        </button>
        <button onClick={() => onConfirm(note)} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
          Recommend
        </button>
      </div>
    </div>
  )
}

export function CommentThread({ type, id, viewerEmail, canComment }: { type: ActionTargetType; id: string; viewerEmail: string; canComment: boolean }) {
  useCommentsCacheVersion()
  const all = listCommentsOn(type, id)
  const top = all.filter((c) => !c.parentId)
  const repliesOf = (parentId: string) => all.filter((c) => c.parentId === parentId)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<CommentRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const text = draft.trim()
    if (!text || !viewerEmail) return
    setDraft('')
    const parent = replyTo
    setReplyTo(null)
    setError(null)
    try {
      // Replies are one level deep: replying to a reply attaches to its root.
      await postCommentOn(type, id, viewerEmail, text, parent ? parent.parentId ?? parent.id : null)
    } catch (e) {
      setDraft(text)
      setError((e as { message?: string })?.message || 'Could not post your comment.')
    }
  }

  function row(c: CommentRecord, nested: boolean) {
    const a = findAccountByEmail(c.authorEmail)
    const name = a?.legalName ?? 'Someone'
    return (
      <div key={c.id} className={`flex items-start gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-sm ${nested ? 'ms-8' : ''}`}>
        <UserAvatar ownerEmail={c.authorEmail} name={name} size={24} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-text-0">{name}</span> <span className="whitespace-pre-wrap break-words text-text-1">{c.text}</span>
          <div className="mt-0.5 flex gap-3 text-[11px] text-text-2">
            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
            {canComment && (
              <button className="font-semibold hover:text-text-0" onClick={() => setReplyTo(c)}>
                Reply
              </button>
            )}
            {c.authorEmail.toLowerCase() === viewerEmail.toLowerCase() && (
              <button className="font-semibold text-danger" onClick={() => void deleteComment(c.id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 border-t border-border pt-2">
      {top.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {top.map((c) => (
            <div key={c.id} className="flex flex-col gap-1.5">
              {row(c, false)}
              {repliesOf(c.id).map((r) => row(r, true))}
            </div>
          ))}
        </div>
      )}
      {canComment && (
        <div>
          {replyTo && (
            <div className="mb-1 flex items-center justify-between rounded-md bg-surface-sunken px-2 py-1 text-[11px] text-text-1">
              <span>Replying to {findAccountByEmail(replyTo.authorEmail)?.legalName ?? 'Someone'}</span>
              <button onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
              placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
              aria-label="Write a comment"
              className="min-h-[36px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
            />
            <button onClick={() => void submit()} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
              Post
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
