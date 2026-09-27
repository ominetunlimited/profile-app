import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { ActivityCard } from '@/shared/ui/ActivityCard'
import { useAccount } from '@/app/AccountContext'
import { getActivityById, ownerKey, useActivitiesCacheVersion } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'

/**
 * §18 Profile → Activity → Profile loop's missing link: clicking an
 * activity from the feed or a profile previously went nowhere real. This is
 * the same ActivityCard the feed and profile use (§26 — one model, not a
 * second competing detail view), just alone on its own page so Share's
 * copied link actually resolves to something.
 */
export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { account } = useAccount()
  // Pipeline repair Phase A: a shared/notification link can land here before
  // the activities cache's initial fetch resolves — without depending on
  // this, that first render's "not found" would never recheck.
  useActivitiesCacheVersion()
  const activity = id ? getActivityById(id) : undefined

  if (!activity) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Activity not found</h1>
          <p className="text-sm text-text-1">This activity doesn't exist on this browser, or has been removed.</p>
          <Link to="/home" className="mt-2 text-sm font-semibold text-accent">
            Back to Home
          </Link>
        </div>
      </AppShell>
    )
  }

  const author = findAccountByEmail(activity.ownerEmail)
  const isSelf = !!account && ownerKey(account).toLowerCase() === activity.ownerEmail.toLowerCase()
  const canView = isSelf || activity.visibility === 'public' || activity.visibility === 'connections_only'

  if (!canView) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">This activity is private</h1>
          <p className="text-sm text-text-1">Only its owner can view it.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
        <Link to={author && 'username' in author && author.username ? `/profile/${author.username}` : '/home'} className="mb-4 inline-block text-sm font-semibold text-accent">
          ← {author ? `Back to ${author.legalName}'s profile` : 'Back'}
        </Link>
        <ActivityCard activity={activity} viewerAccount={account} viewerEmail={ownerKey(account)} />
      </div>
    </AppShell>
  )
}
