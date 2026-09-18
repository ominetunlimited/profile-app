import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Account } from '@/app/accountTypes'
import type { ActivityRecord } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { computeTrustScore } from '@/app/trustScore'
import { getMyReaction, getReactionCounts, setMyReaction, REACTIONS, type ReactionType } from '@/app/reactionStore'
import { listComments, postComment } from '@/app/commentStore'
import { myRequestFor, requestSelfTag } from '@/app/selfTagStore'
import { resolveTool } from '@/app/toolCatalogue'
import { TrustScoreRing } from './TrustScoreRing'
import { AttributionSection } from './AttributionSection'
import { IconCheck, IconHammer, IconLightbulb, IconLink, IconMedal, IconMegaphone, IconMessage, IconSeedling, IconThumbsUp, IconTool, type IconProps } from './icons'

const REACTION_ICON: Record<ReactionType, ComponentType<IconProps>> = {
  appreciate: IconThumbsUp,
  respect: IconMedal,
  insightful: IconLightbulb,
  support: IconSeedling,
  skilled: IconHammer,
  well_explained: IconMegaphone,
}

/**
 * §11.1 ActivityCard, unified — previously HomePage.tsx had its own
 * ActivityCard (own-feed only, no clickable author, all 6 reactions always
 * expanded, no comments) and ProfilePage.tsx had a second, differently-
 * shaped ActivityRow (self-tag only, no reactions/comments at all). Per
 * §26's "no duplicate data models" rule, this is the one real card every
 * surface (Home feed, Profile's activity list, Activity Detail) renders
 * from — same reactions, same comments, same author resolution, same
 * self-tag affordance, everywhere an ActivityRecord appears.
 */
export function ActivityCard({ activity, viewerAccount, viewerEmail }: { activity: ActivityRecord; viewerAccount: Account | null; viewerEmail: string }) {
  const author = findAccountByEmail(activity.ownerEmail)
  const authorName = author?.legalName ?? activity.organisation ?? 'Unknown'
  const authorUsername = author && 'username' in author ? author.username : undefined
  const authorTrust = computeTrustScore(author ?? null)
  const isSelf = activity.ownerEmail.toLowerCase() === viewerEmail.toLowerCase()

  const [myReaction, setMyReactionState] = useState(() => getMyReaction(activity.id, viewerEmail))
  const [counts, setCounts] = useState(() => getReactionCounts(activity.id))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState(() => listComments(activity.id))
  const [commentDraft, setCommentDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [tagRole, setTagRole] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagRequest, setTagRequest] = useState(() => (viewerEmail && !isSelf ? myRequestFor(viewerEmail, activity.id) : undefined))
  const reactionWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    function onOutside(e: MouseEvent) {
      if (reactionWrapRef.current && !reactionWrapRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [pickerOpen])

  const activeReaction = REACTIONS.find((r) => r.type === myReaction)
  const totalReactions = Object.values(counts).reduce((sum, n) => sum + n, 0)

  function react(type: ReactionType) {
    setMyReaction(activity.id, viewerEmail, type)
    setMyReactionState(getMyReaction(activity.id, viewerEmail))
    setCounts(getReactionCounts(activity.id))
    setPickerOpen(false)
  }

  function submitComment() {
    if (!commentDraft.trim() || !viewerEmail) return
    postComment(activity.id, viewerEmail, commentDraft.trim())
    setCommentDraft('')
    setComments(listComments(activity.id))
  }

  function share() {
    const url = `${window.location.origin}/activity/${activity.id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const AuthorLink = ({ children, className }: { children: ReactNode; className?: string }) =>
    authorUsername ? (
      <Link to={`/profile/${authorUsername}`} className={className}>
        {children}
      </Link>
    ) : (
      <span className={className}>{children}</span>
    )

  return (
    <article className="ds-card-hover rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <AuthorLink className="flex-none">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {authorName.slice(0, 1).toUpperCase()}
          </span>
        </AuthorLink>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <AuthorLink className="truncate text-sm font-semibold text-text-0 hover:text-accent">{authorName}</AuthorLink>
            {author?.accountType === 'individual' && (
              <span className="rounded-full border border-trust px-1.5 py-0.5 text-[9.5px] font-medium capitalize text-trust">{author.pathway}</span>
            )}
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-text-2">{activity.type}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-2">
            {authorUsername && <span>@{authorUsername}</span>}
            <span>·</span>
            <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <TrustScoreRing trust={authorTrust} size={28} />
      </div>

      <Link to={`/activity/${activity.id}`} className="mb-1 block font-semibold text-text-0 hover:text-accent">
        {activity.title}
      </Link>
      {activity.description && <p className="mb-2 text-sm text-text-1">{activity.description}</p>}
      {activity.role && <p className="mb-2 text-xs text-text-2">Role: {activity.role}{activity.location ? ` · ${activity.location}` : ''}</p>}
      {activity.skills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {activity.skills.map((s) => (
            <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-text-1">
              {s}
            </span>
          ))}
        </div>
      )}
      {activity.tools.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {activity.tools.map((t) => {
            const resolved = resolveTool(t)
            return resolved ? (
              <Link
                key={t}
                to={`/tool/${resolved.id}`}
                title={resolved.provider ? `Used — made by ${resolved.provider.name}` : 'Used'}
                className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-text-1 hover:border-accent hover:text-accent"
              >
                <IconTool size={12} className="inline-block align-[-1.5px]" /> {resolved.canonicalName}
                {resolved.provider ? ` · ${resolved.provider.name}` : ''}
              </Link>
            ) : (
              <span key={t} className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10.5px] text-text-2">
                <IconTool size={12} className="inline-block align-[-1.5px]" /> {t}
              </span>
            )
          })}
        </div>
      )}
      {activity.collaborators.length > 0 && <p className="mb-2 text-xs text-text-2">With {activity.collaborators.join(', ')} (self-reported)</p>}

      <AttributionSection activityId={activity.id} activityOwnerEmail={activity.ownerEmail} isSelf={isSelf} viewerEmail={viewerEmail} />

      {!isSelf && viewerAccount && (
        <div className="mb-2">
          {tagRequest ? (
            <span className="text-xs text-text-2">
              {tagRequest.status === 'requested' && 'Tag request sent — waiting for approval.'}
              {tagRequest.status === 'approved' && (
                <span className="inline-flex items-center gap-1">
                  <IconCheck size={12} /> Tag approved
                </span>
              )}
              {tagRequest.status === 'rejected' && 'Tag request declined'}
            </span>
          ) : showTagInput ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                value={tagRole}
                onChange={(e) => setTagRole(e.target.value)}
                placeholder="Your role in this"
                className="min-h-[30px] rounded-md border border-border-strong bg-surface px-2 text-xs"
              />
              <button
                onClick={() => {
                  requestSelfTag({
                    requesterEmail: viewerEmail,
                    requesterName: viewerAccount.legalName,
                    activityId: activity.id,
                    activityOwnerEmail: activity.ownerEmail,
                    activityTitle: activity.title,
                    role: tagRole || 'Collaborator',
                  })
                  setTagRequest(myRequestFor(viewerEmail, activity.id))
                }}
                className="text-xs font-semibold text-accent"
              >
                Send
              </button>
            </div>
          ) : (
            <button onClick={() => setShowTagInput(true)} className="text-xs font-semibold text-accent">
              + Tag Me
            </button>
          )}
        </div>
      )}

      <div className="relative flex items-center gap-1 border-t border-border pt-2 text-text-2">
        <div className="relative" ref={reactionWrapRef}>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-label={activeReaction ? `Your reaction: ${activeReaction.label}. Change reaction` : 'React'}
            aria-expanded={pickerOpen}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-surface-sunken ${activeReaction ? 'text-accent' : 'text-text-2'}`}
          >
            {(() => {
              const ActiveIcon = REACTION_ICON[activeReaction?.type ?? 'appreciate']
              return <ActiveIcon size={16} />
            })()}
            <span className="hidden sm:inline">{activeReaction?.label ?? 'React'}</span>
            {totalReactions > 0 && <span className="text-[11px]">{totalReactions}</span>}
          </button>
          {pickerOpen && (
            <div
              role="menu"
              aria-label="Choose a reaction"
              className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-border-strong bg-surface p-1 shadow-lg"
            >
              {REACTIONS.map((r) => {
                const ReactionIcon = REACTION_ICON[r.type]
                return (
                  <button
                    key={r.type}
                    role="menuitemradio"
                    aria-checked={myReaction === r.type}
                    aria-label={r.label}
                    title={r.label}
                    onClick={() => react(r.type)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full hover:scale-110 hover:bg-surface-sunken ${myReaction === r.type ? 'bg-surface-sunken text-accent' : ''}`}
                  >
                    <ReactionIcon size={18} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-label="Comment"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-surface-sunken"
        >
          <IconMessage size={16} />
          <span className="hidden sm:inline">Comment</span>
          {comments.length > 0 && <span className="text-[11px]">{comments.length}</span>}
        </button>

        <button onClick={share} aria-label="Copy link to this activity" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-surface-sunken">
          <IconLink size={16} />
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-2 border-t border-border pt-2">
          {comments.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              {comments.map((c) => {
                const commentAuthor = findAccountByEmail(c.authorEmail)
                return (
                  <div key={c.id} className="rounded-lg bg-surface-sunken px-3 py-2 text-sm">
                    <span className="font-semibold text-text-0">{commentAuthor?.legalName ?? 'Someone'}</span>{' '}
                    <span className="text-text-1">{c.text}</span>
                  </div>
                )
              })}
            </div>
          )}
          {viewerAccount && (
            <div className="flex gap-2">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitComment()
                }}
                placeholder="Write a comment…"
                aria-label="Write a comment"
                className="min-h-[36px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
              />
              <button onClick={submitComment} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">
                Post
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
