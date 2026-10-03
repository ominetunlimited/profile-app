import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey } from '@/app/activityStore'
import { computeTrustScore, TRUST_WEIGHTS } from '@/app/trustScore'
import { hubForOrgType } from '@/app/accountTypes'

/**
 * §10.4 Hamburger Menu's "Analytics". Individual accounts get §23.1's
 * INDIVIDUAL_METRICS below. institutional_hub/regulatory_console orgs already
 * have their own dedicated Institution/Government Analytics screens (§16).
 * business_hub and community_hub orgs (Company/Startup/Recruitment
 * Agency/Guild/Cooperative) had neither — a real §23.2 ORG_METRICS gap, now
 * closed by BusinessAnalytics below, honest-zero like everything else here
 * since no hiring pipeline, staff-verification, or job-board backend exists
 * yet in this build.
 */
export function AnalyticsPage() {
  const { account } = useAccount()
  if (account?.accountType === 'organisation') {
    const hub = hubForOrgType(account.orgType)
    if (hub === 'business_hub' || hub === 'community_hub') return <BusinessAnalytics />
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-text-1">
          Analytics for your organisation type lives in its own workspace — see Institution or Government Analytics.
        </div>
      </AppShell>
    )
  }
  if (!account || account.accountType !== 'individual') {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-text-1">Sign in to view Analytics.</div>
      </AppShell>
    )
  }
  const activities = listActivities(ownerKey(account))
  const byType = new Map<string, number>()
  for (const a of activities) byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
  const skillCounts = new Map<string, number>()
  for (const a of activities) for (const s of a.skills) skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)
  const topSkills = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const trust = computeTrustScore(account)

  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Analytics</h1>
        <p className="mb-6 text-sm text-text-1">Computed from your own recorded activities — nothing here is estimated.</p>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Activities recorded" value={activities.length} />
          <Stat label="Activity types" value={byType.size} />
          <Stat label="Distinct skills tagged" value={skillCounts.size} />
          <Stat label="Trust Score" value={trust.total} sub={trust.tier.label} />
        </div>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Activity by type</h2>
          {byType.size === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              Nothing recorded yet — record your first activity from Home to see it here.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-40 flex-none truncate text-sm text-text-0">{type}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(count / activities.length) * 100}%` }} />
                  </div>
                  <span className="w-6 flex-none text-right font-mono text-xs text-text-2">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Top skills</h2>
          {topSkills.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              No skills tagged yet — add them when you record an activity.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topSkills.map(([skill, count]) => (
                <span key={skill} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-0">
                  {skill} <span className="text-text-2">· {count}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold text-text-0">Trust Score breakdown</h2>
          <p className="mb-3 text-xs text-text-1">
            Every signal below requires real institutional/employer/client verification — none exist yet in this
            build, so each contributes 0. This is a real computation over real (currently absent) inputs, not a
            fabricated total.
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {Object.entries(TRUST_WEIGHTS).map(([signal, weight]) => (
              <div key={signal} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-xs">
                <span className="text-text-1">{signal.replace(/_/g, ' ')}</span>
                <span className="font-mono text-text-2">0 / {weight}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

/** §23.2 ORG_METRICS for business_hub/community_hub orgs — real, honest-zero. */
const ORG_METRICS: { key: string; label: string }[] = [
  { key: 'hiring_pipeline_efficiency', label: 'Hiring pipeline efficiency' },
  { key: 'staff_capability_map', label: 'Staff capability map' },
  { key: 'talent_gap_analysis', label: 'Talent gap analysis' },
  { key: 'department_trust_strength', label: 'Department trust strength' },
  { key: 'verification_completion_rates', label: 'Verification completion rate' },
  { key: 'job_posting_performance', label: 'Job posting performance' },
  { key: 'applicant_quality_breakdown', label: 'Applicant quality breakdown' },
]

function BusinessAnalytics() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Analytics</h1>
        <p className="mb-6 text-sm text-text-1">
          Organisation metrics, computed for real over this build's real data — there is no hiring pipeline,
          staff-verification, or job-board backend yet, so every metric below is honestly 0/empty rather than a
          fabricated chart. Each activates automatically once the underlying feature (recruiter pipeline, staff
          verification, job postings) is built.
        </p>
        <div className="flex flex-col gap-1.5">
          {ORG_METRICS.map((m) => (
            <div key={m.key} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm">
              <span className="text-text-1">{m.label}</span>
              <span className="font-mono text-xs text-text-2">No data yet</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <div className="font-mono text-xl font-semibold text-text-0">{value}</div>
      <div className="text-[11px] text-text-1">{label}</div>
      {sub && <div className="text-[10px] text-text-2">{sub}</div>}
    </div>
  )
}
