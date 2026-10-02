import { Link } from 'react-router-dom'
import type { Account } from '@/app/accountTypes'
import { getActivityById } from '@/app/activityStore'
import { getCampaignById } from '@/app/adStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { getJobById } from '@/app/jobStore'
import type { RepostRecord } from '@/app/socialStore'
import { ActivityCard } from './ActivityCard'
import { JobCard } from './JobCard'
import { SponsoredCard } from './SponsoredCard'
import { UserAvatar } from './UserAvatar'
import { IconRepost } from './icons'

/**
 * A repost keeps the source: who reposted (and their commentary) on top, the
 * original — fully attributed to its true author, with its own live actions —
 * embedded below. It is a pointer to the original row, never a detached copy,
 * so reactions/comments on it are the original's.
 */
export function RepostCard({ repost, viewerAccount, viewerEmail }: { repost: RepostRecord; viewerAccount: Account | null; viewerEmail: string }) {
  const reposter = findAccountByEmail(repost.reposterEmail)
  const reposterName = reposter?.legalName ?? 'Someone'
  const reposterUsername = reposter && 'username' in reposter ? reposter.username : undefined
  const isSelf = repost.reposterEmail.toLowerCase() === viewerEmail.toLowerCase()

  const activity = repost.originalType === 'activity' ? getActivityById(repost.originalId) : undefined
  const job = repost.originalType === 'job' ? getJobById(repost.originalId) : undefined
  const advert = repost.originalType === 'advert' ? getCampaignById(repost.originalId) : undefined
  if (!activity && !job && !advert) return null // original no longer visible to this viewer

  return (
    <div className="rounded-xl border border-border bg-surface-sunken p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-text-2">
        <IconRepost size={14} />
        <UserAvatar ownerEmail={repost.reposterEmail} name={reposterName} size={20} />
        {reposterUsername ? (
          <Link to={`/profile/${reposterUsername}`} className="font-semibold text-text-0 hover:text-accent">
            {isSelf ? 'You' : reposterName}
          </Link>
        ) : (
          <span className="font-semibold text-text-0">{isSelf ? 'You' : reposterName}</span>
        )}
        <span>reposted · {new Date(repost.createdAt).toLocaleDateString()}</span>
        {repost.visibility !== 'public' && <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">{repost.visibility === 'private' ? 'Only you' : 'Connections'}</span>}
      </div>
      {repost.commentary && <p className="mb-2.5 whitespace-pre-wrap break-words text-sm text-text-0">{repost.commentary}</p>}
      {activity && <ActivityCard activity={activity} viewerAccount={viewerAccount} viewerEmail={viewerEmail} />}
      {job && <JobCard job={job} viewerAccount={viewerAccount} viewerEmail={viewerEmail} />}
      {advert && <SponsoredCard campaign={advert} viewerAccount={viewerAccount} viewerEmail={viewerEmail} />}
    </div>
  )
}
