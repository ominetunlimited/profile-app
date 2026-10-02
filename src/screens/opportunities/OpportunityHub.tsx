import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { listOpenJobs, orgDisplayName, useJobsCacheVersion } from '@/app/jobStore'
import { listActiveCampaignsForPlacement, useCampaignsCacheVersion } from '@/app/adStore'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'
import { JobCard } from '@/shared/ui/JobCard'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'

/** §18.2 JOB_LISTING_FIELDS.types */
const WORK_TYPES = ['remote', 'hybrid', 'on_site'] as const

/** §18.3 CAREER_STAGE_FILTER labels, verbatim — previously rendered as inert
 * `<span>`s with no click handler or active state at all; a real §35
 * "static button" violation, now a real single-select filter. */
const CAREER_CLUSTERS = ['Students & Learners', 'Graduates & Entry-Level', 'Apprentices & Skilled Trades', 'Experienced Professionals', 'Career Changers', 'Mentors & Advisors'] as const
type CareerCluster = (typeof CAREER_CLUSTERS)[number]

/**
 * §18 Opportunity Hub — browse/filter/apply. Previously honestly empty
 * because no recruiter-side posting flow existed anywhere in this build;
 * jobStore.ts (built for RecruiterWorkflow.tsx's real "Post job" form) now
 * gives this a real source. Career-stage cluster selection stays visual
 * only for now — JobListing doesn't capture a target-cluster field yet, so
 * filtering by it would either do nothing honestly or fake a match; query
 * and work-type filtering are real.
 *
 * `pinnedCluster` implements §18.5's Student Opportunity Hub / Graduate
 * Launchpad — named, linkable, bookmarkable sub-routes over this same data
 * and matching logic (no second opportunity system), with their cluster
 * filter pre-applied and locked rather than just pre-selected, since a
 * university/recruiter deep link should land exactly where it promised.
 */
export function OpportunityHub({ pinnedCluster, title }: { pinnedCluster?: CareerCluster; title?: string } = {}) {
  const [workType, setWorkType] = useState<(typeof WORK_TYPES)[number] | 'all'>('all')
  const [query, setQuery] = useState('')
  const [cluster, setCluster] = useState<CareerCluster | null>(pinnedCluster ?? null)
  useJobsCacheVersion()
  useCampaignsCacheVersion()
  const { account } = useAccount()

  // V9 Unified Ecosystem Patch §10 — an advertiser paying for the
  // 'opportunities' placement was previously charged for a surface that
  // never rendered anything (only home_feed did); this closes that gap.
  const sponsoredCampaigns = listActiveCampaignsForPlacement('opportunities')

  const q = query.trim().toLowerCase()
  const jobs = listOpenJobs().filter((j) => {
    if (workType !== 'all' && j.workType !== workType) return false
    if (!q) return true
    return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || j.requiredSkills.some((s) => s.toLowerCase().includes(q)) || orgDisplayName(j.orgEmail).toLowerCase().includes(q)
  })

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-text-0">{title ?? 'Opportunity Hub'}</h1>
        <p className="mb-6 text-sm text-text-1">
          PROFILE is the application. One-tap apply submits your verified profile, trust score, and relevant
          activities — never a separate CV upload.
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, skill, or organisation…"
            className="min-h-[42px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
          />
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value as typeof workType)}
            className="min-h-[42px] rounded-lg border border-border-strong bg-surface px-3 text-sm"
          >
            <option value="all">Any work type</option>
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {CAREER_CLUSTERS.map((c) => (
            <button
              key={c}
              disabled={!!pinnedCluster}
              onClick={() => setCluster((current) => (current === c ? null : c))}
              className={`rounded-full border px-3 py-1 text-xs disabled:opacity-100 ${
                cluster === c ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {sponsoredCampaigns[0] && (
          <div className="mb-2">
            <SponsoredCard campaign={sponsoredCampaigns[0]} viewerAccount={account} viewerEmail={ownerKey(account)} />
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No opportunities posted yet{query || workType !== 'all' ? ' matching your filters' : ''}.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} viewerAccount={account} viewerEmail={ownerKey(account)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
