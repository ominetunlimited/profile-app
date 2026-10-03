import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Account } from '@/app/accountTypes'
import type { ActivityRecord } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { computeTrustScore } from '@/app/trustScore'
import { myRequestFor, requestSelfTag, useSelfTagsVersion } from '@/app/selfTagStore'
import { getSignedMediaUrl, listMediaFor, useMediaAssetsCacheVersion, type FileCategory, type MediaAsset } from '@/app/mediaAssetStore'
import { resolveTool } from '@/app/toolCatalogue'
import { TrustScoreRing } from './TrustScoreRing'
import { UserAvatar } from './UserAvatar'
import { AttributionSection } from './AttributionSection'
import { ActionBar } from './ActionBar'
import { IconCheck, IconTool } from './icons'

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

  const [tagRole, setTagRole] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  useSelfTagsVersion()
  const tagRequest = (viewerEmail && !isSelf ? myRequestFor(viewerEmail, activity.id) : undefined)

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

      <ActionBar target={{ type: 'activity', id: activity.id }} viewerEmail={viewerEmail} viewerAccount={viewerAccount} authorEmail={activity.ownerEmail} />
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
