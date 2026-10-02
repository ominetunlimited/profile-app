import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Account } from '@/app/accountTypes'
import type { ActivityRecord } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { computeTrustScore } from '@/app/trustScore'
import { getMyReaction, getReactionCounts, onReactionsChange, setMyReaction, REACTIONS, type ReactionType } from '@/app/reactionStore'
import { listComments, onCommentsChange, postComment } from '@/app/commentStore'
import { myRequestFor, requestSelfTag } from '@/app/selfTagStore'
import { getSignedMediaUrl, listMediaFor, useMediaAssetsCacheVersion, type FileCategory, type MediaAsset } from '@/app/mediaAssetStore'
import { resolveTool } from '@/app/toolCatalogue'
import { TrustScoreRing } from './TrustScoreRing'
import { UserAvatar } from './UserAvatar'
import { AttributionSection } from './AttributionSection'
import { IconCheck, IconHammer, IconLightbulb, IconLink, IconMedal, IconMegaphone, IconMessage, IconSeedling, IconThumbsUp, IconTool, type IconProps } from './icons'

export const REACTION_ICON: Record<ReactionType, ComponentType<IconProps>> = {
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

  // Pipeline repair Phase A: reactions/comments caches load asynchronously
  // (and can receive a Realtime push) — without this, a card rendered
  // before the initial fetch resolves would freeze at 0 reactions/comments.
  useEffect(() => {
    return onReactionsChange(() => {
      setMyReactionState(getMyReaction(activity.id, viewerEmail))
      setCounts(getReactionCounts(activity.id))
    })
  }, [activity.id, viewerEmail])

  useEffect(() => {
    return onCommentsChange(() => setComments(listComments(activity.id)))
  }, [activity.id])

  const activeReaction = REACTIONS.find((r) => r.type === myReaction)
  const totalReactions = Object.values(counts).reduce((sum, n) => sum + n, 0)

  async function react(type: ReactionType) {
    setPickerOpen(false)
    await setMyReaction(activity.id, viewerEmail, type)
    setMyReactionState(getMyReaction(activity.id, viewerEmail))
    setCounts(getReactionCounts(activity.id))
  }

  async function submitComment() {
    if (!commentDraft.trim() || !viewerEmail) return
    const text = commentDraft.trim()
    setCommentDraft('')
    await postComment(activity.id, viewerEmail, text)
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
          <UserAvatar ownerEmail={activity.ownerEmail} name={authorName} size={36} />
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
      <MediaGallery activityId={activity.id} />
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
                const commentAuthorName = commentAuthor?.legalName ?? 'Someone'
                return (
                  <div key={c.id} className="flex items-start gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-sm">
                    <UserAvatar ownerEmail={c.authorEmail} name={commentAuthorName} size={24} className="mt-0.5" />
                    <span>
                      <span className="font-semibold text-text-0">{commentAuthorName}</span>{' '}
                      <span className="text-text-1">{c.text}</span>
                    </span>
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
              <button onClick={submitComment} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
                Post
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

const FILE_CATEGORY_LABEL: Record<FileCategory, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  pdf: 'PDF',
  docx: 'Word',
  pptx: 'PowerPoint',
  xlsx: 'Excel',
  epub: 'EPUB',
  other: 'File',
}

/** Real attachments from the Composer's "Add files" (mediaAssetStore.ts) —
 * inline for image/video/audio, a signed-URL view/download link for
 * documents. Reacts to the live media cache so an upload that's still in
 * flight when this card first renders appears without a reload. */
function MediaGallery({ activityId }: { activityId: string }) {
  useMediaAssetsCacheVersion()
  const assets = listMediaFor('activity', activityId)
  if (assets.length === 0) return null
  return (
    <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {assets.map((asset) => (
        <MediaThumb key={asset.id} asset={asset} />
      ))}
    </div>
  )
}

function MediaThumb({ asset }: { asset: MediaAsset }) {
  const [url, setUrl] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    // Images show the small thumbnail variant in the feed; the larger preview only loads on open.
    getSignedMediaUrl(asset, 3600, asset.fileCategory === 'image' ? 'thumb' : 'original').then((signed) => {
      if (!cancelled) setUrl(signed)
    })
    return () => {
      cancelled = true
    }
  }, [asset.id])

  const loadingBox = <div className="h-28 animate-pulse rounded-lg bg-surface-sunken" title={asset.fileName} />

  if (asset.fileCategory === 'image') {
    return url ? (
      <>
        <button
          type="button"
          onClick={async () => setViewing(await getSignedMediaUrl(asset, 3600, 'preview'))}
          aria-label={`View ${asset.fileName}`}
          className="block h-28 w-full overflow-hidden rounded-lg border border-border"
        >
          <img src={url} alt={asset.fileName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </button>
        {viewing && (
          <div role="dialog" aria-modal="true" aria-label={asset.fileName} onClick={() => setViewing(null)} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4">
            <img src={viewing} alt={asset.fileName} className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </>
    ) : (
      loadingBox
    )
  }
  if (asset.fileCategory === 'video') {
    return url ? <video src={url} controls className="h-28 w-full rounded-lg border border-border bg-black object-cover" /> : loadingBox
  }
  if (asset.fileCategory === 'audio') {
    return (
      <div className="col-span-2 rounded-lg border border-border bg-surface-sunken p-2 sm:col-span-3">
        <audio src={url ?? undefined} controls className="w-full" />
      </div>
    )
  }
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noreferrer"
      title={asset.copyrightId}
      className="flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface-sunken p-2 text-center text-xs hover:border-accent"
    >
      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-2">{FILE_CATEGORY_LABEL[asset.fileCategory]}</span>
      <span className="line-clamp-2 break-all text-text-0">{asset.fileName}</span>
    </a>
  )
}
