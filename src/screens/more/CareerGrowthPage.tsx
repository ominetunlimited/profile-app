import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey } from '@/app/activityStore'
import { getCvDetails } from '@/app/cvDetailsStore'
import { RecommendationsPanel } from '@/shared/ui/RecommendationsPanel'

/**
 * §10.4 Hamburger Menu's "Career Growth" — a real synthesis view over
 * existing records (CV completeness, activity history, learning, skills),
 * not a new subsystem. Suggestions are computed from actual gaps, same
 * pattern as Home's "Suggested next steps".
 */
export function CareerGrowthPage() {
  const { account } = useAccount()
  if (!account || account.accountType !== 'individual') {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-text-1">Career Growth is available to individual accounts.</div>
      </AppShell>
    )
  }
  const activities = listActivities(ownerKey(account))
  const details = getCvDetails(ownerKey(account))

  const steps: { label: string; to: string }[] = [
    !account.headline ? { label: 'Add a professional headline', to: '/settings' } : null,
    activities.length === 0 ? { label: 'Record your first activity', to: '/home' } : null,
    !details.summaryStatement ? { label: 'Write your CV summary', to: '/career/cv/executive' } : null,
    details.education.length === 0 ? { label: 'Add an education record', to: '/career/cv/executive' } : null,
    activities.every((a) => a.skills.length === 0) ? { label: 'Tag skills on a recorded activity', to: '/home' } : null,
  ].filter((s): s is { label: string; to: string } => !!s)

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Career Growth</h1>
        <p className="mb-6 text-sm text-text-1">One view across CV, Learning, and Opportunities — pulling from your real records, not a separate profile.</p>

        <RecommendationsPanel limit={8} title="Recommended for your career" className="mb-8" />

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Next steps</h2>
          {steps.length === 0 ? (
            <div className="rounded-xl border border-success bg-surface p-4 text-sm text-text-1">Your profile is complete on every check this page runs.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {steps.map((s) => (
                <Link key={s.label} to={s.to} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm text-text-0 hover:border-accent">
                  {s.label} <span className="text-accent">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <GrowthCard title="Learning" body="Courses and progress." to="/learn" />
          <GrowthCard title="CV & Portfolio" body="Keep your evidence current." to="/career/cv/executive" />
          <GrowthCard title="Opportunities" body="Roles matched to your record." to="/opportunities" />
        </div>
      </div>
    </AppShell>
  )
}

function GrowthCard({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
      <div className="mb-1 font-semibold text-text-0">{title}</div>
      <div className="text-sm text-text-1">{body}</div>
    </Link>
  )
}
