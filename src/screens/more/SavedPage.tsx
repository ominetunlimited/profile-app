import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { getActivityById, ownerKey, useActivitiesCacheVersion } from '@/app/activityStore'
import { getJobById, useJobsCacheVersion } from '@/app/jobStore'
import { getCampaignById, useCampaignsCacheVersion } from '@/app/adStore'
import { getRepostById, listBookmarks, useSocialCacheVersion } from '@/app/socialStore'
import { ActivityCard } from '@/shared/ui/ActivityCard'
import { JobCard } from '@/shared/ui/JobCard'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'
import { RepostCard } from '@/shared/ui/RepostCard'

/** Everything this account has saved — activities, jobs, adverts, reposts. Items
 * whose source is no longer visible to them are quietly omitted (RLS decides). */
export function SavedPage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  useSocialCacheVersion()
  useActivitiesCacheVersion()
  useJobsCacheVersion()
  useCampaignsCacheVersion()
  const items = listBookmarks(owner)

  const cards = items
    .map((b) => {
      if (b.type === 'activity') {
        const a = getActivityById(b.id)
        return a ? <ActivityCard key={`a-${b.id}`} activity={a} viewerAccount={account} viewerEmail={owner} /> : null
      }
      if (b.type === 'job') {
        const j = getJobById(b.id)
        return j ? <JobCard key={`j-${b.id}`} job={j} viewerAccount={account} viewerEmail={owner} /> : null
      }
      if (b.type === 'advert') {
        const c = getCampaignById(b.id)
        return c ? <SponsoredCard key={`d-${b.id}`} campaign={c} viewerAccount={account} viewerEmail={owner} /> : null
      }
      const r = getRepostById(b.id)
      return r ? <RepostCard key={`r-${b.id}`} repost={r} viewerAccount={account} viewerEmail={owner} /> : null
    })
    .filter(Boolean)

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-xl font-bold text-text-0">Saved</h1>
        <p className="mb-6 text-sm text-text-1">Posts, jobs and adverts you've bookmarked. Only you can see this list.</p>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            Nothing saved yet — tap <strong>Save</strong> on any post, job or advert to keep it here.
          </div>
        ) : (
          <div className="flex flex-col gap-4">{cards}</div>
        )}
      </div>
    </AppShell>
  )
}
