import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey } from '@/app/activityStore'
import { computeTrustScore, TRUST_WEIGHTS } from '@/app/trustScore'
import { hubForOrgType } from '@/app/accountTypes'
import { listJobsByOrg, useJobsCacheVersion } from '@/app/jobStore'
import { listApplicationsForOrg, useApplicationsCacheVersion } from '@/app/applicationStore'
import { listRequestsForIssuerEmail, useVerificationVersion } from '@/app/verificationRequestStore'
import { listStaffFor, useOrgStaffVersion } from '@/app/orgStaffStore'

/**
 * §10.4 Hamburger Menu's "Analytics". Individual accounts get §23.1's
 * INDIVIDUAL_METRICS below. institutional_hub/regulatory_console orgs already
 * have their own dedicated Institution/Government Analytics screens (§16).
 * business_hub and community_hub orgs (Company/Startup/Recruitment
 * Agency/Guild/Cooperative) had neither — a real §23.2 ORG_METRICS gap, now
 * closed by BusinessAnalytics below, computed from this organisation's own data.
 */
export function AnalyticsPage() {
  const { account } = useAccount()
  if (account?.accountType === 'organisation') {
    const hub = hubForOrgType(account.orgType)
    if (hub === 'business_hub' || hub === 'community_hub') return <BusinessAnalytics orgEmail={account.officialEmail} />
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
            A signal counts only once an institution, employer or client has confirmed it. Each line shows what you have earned from that signal out of its maximum.
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {Object.entries(TRUST_WEIGHTS).map(([signal, weight]) => (
              <div key={signal} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-xs">
                <span className="text-text-1">{signal.replace(/_/g, ' ')}</span>
                <span className="font-mono text-text-2">
                  {trust.signals.filter((x) => x.type === signal && x.verified).reduce((sum, x) => sum + x.weight, 0)} / {weight}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

const PIPELINE_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  interview: 'Interview scheduled',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Not progressed',
}

/** §23.2 organisation metrics for business and community organisations, computed from this organisation's own postings, applications, verification requests and staff. */
function BusinessAnalytics({ orgEmail }: { orgEmail: string }) {
  useJobsCacheVersion()
  useApplicationsCacheVersion()
  useVerificationVersion()
  useOrgStaffVersion()
  const jobs = listJobsByOrg(orgEmail)
  const apps = listApplicationsForOrg(orgEmail)
  const requests = listRequestsForIssuerEmail(orgEmail)
  const staff = listStaffFor(orgEmail).filter((m) => m.status === 'active')
  const decided = requests.filter((r) => r.status === 'verified' || r.status === 'rejected')
  const byStatus = new Map<string, number>()
  for (const a of apps) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1)

  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Analytics</h1>
        <p className="mb-6 text-sm text-text-1">Computed from your organisation's own postings, applications, verification requests and staff. Nothing here is estimated.</p>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Open postings" value={jobs.filter((j) => j.status === 'open').length} />
          <Stat label="Applications received" value={apps.length} />
          <Stat label="Verification requests" value={requests.length} sub={decided.length ? `${Math.round((decided.length / requests.length) * 100)}% decided` : undefined} />
          <Stat label="Active staff" value={staff.length} />
        </div>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Hiring pipeline</h2>
          {apps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">No applications yet. They appear here as people apply to your postings.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...byStatus.entries()].map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-40 flex-none truncate text-sm text-text-0">{PIPELINE_LABEL[status] ?? status.replace(/_/g, ' ')}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-accent-solid" style={{ width: `${(count / apps.length) * 100}%` }} />
                  </div>
                  <span className="w-6 flex-none text-right font-mono text-xs text-text-2">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold text-text-0">Posting performance</h2>
          {jobs.length === 0 ? (
            <p className="text-xs text-text-1">You haven't posted an opportunity yet.</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
                <span className="min-w-0 truncate text-text-0">{j.title}</span>
                <span className="flex-none font-mono text-xs text-text-1">
                  {apps.filter((a) => a.jobId === j.id).length} application{apps.filter((a) => a.jobId === j.id).length === 1 ? '' : 's'} · {j.status}
                </span>
              </div>
            ))
          )}
        </section>
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
