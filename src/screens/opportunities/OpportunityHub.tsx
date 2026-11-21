import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { listOpenJobs, orgDisplayName, useJobsCacheVersion } from '@/app/jobStore'
import { listActiveCampaignsForPlacement, useCampaignsCacheVersion } from '@/app/adStore'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'
import { JobCard } from '@/shared/ui/JobCard'
import { useAccount } from '@/app/AccountContext'
import { ownerKey, useActivitiesCacheVersion } from '@/app/activityStore'
import { matchJob, recordedSkills } from '@/app/opportunityMatch'

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
  const [workTypes, setWorkTypes] = useState<Set<(typeof WORK_TYPES)[number]>>(() => new Set(WORK_TYPES))
  const [minMatch, setMinMatch] = useState(0)
  const [query, setQuery] = useState('')
  const [cluster, setCluster] = useState<CareerCluster | null>(pinnedCluster ?? null)
  useJobsCacheVersion()
  useCampaignsCacheVersion()
  useActivitiesCacheVersion()
  const { account } = useAccount()
  const viewer = ownerKey(account)
  const isIndividual = account?.accountType === 'individual'
  const mySkills = isIndividual ? recordedSkills(viewer) : []

  // A paid 'opportunities' placement renders as a labelled card at the top of the list.
  const sponsoredCampaigns = listActiveCampaignsForPlacement('opportunities')

  const q = query.trim().toLowerCase()
  const jobs = listOpenJobs()
    .map((j) => ({ job: j, match: isIndividual ? matchJob(mySkills, j) : null }))
    .filter(({ job: j, match }) => {
      if (!workTypes.has(j.workType)) return false
      if (minMatch > 0 && (match?.pct ?? 0) < minMatch) return false
      if (!q) return true
      return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || j.requiredSkills.some((s) => s.toLowerCase().includes(q)) || orgDisplayName(j.orgEmail).toLowerCase().includes(q)
    })
    .sort((x, y) => (y.match?.pct ?? -1) - (x.match?.pct ?? -1))

  const filtered = !!q || minMatch > 0 || workTypes.size < WORK_TYPES.length
  const resetFilters = () => {
    setQuery('')
    setMinMatch(0)
    setWorkTypes(new Set(WORK_TYPES))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-8">
        <header className="mb-6">
          <h1 className="text-[clamp(24px,3.4vw,34px)] font-bold leading-tight tracking-tight text-text-0">{title ?? 'Opportunity Hub'}</h1>
          <p className="mt-1.5 max-w-[60ch] text-[14px] leading-relaxed text-text-1">
            Apply with your verified profile. Listings are ranked by how your recorded work fits, never by attention.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
          <aside className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-4 lg:sticky lg:top-20" aria-label="Filters">
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-1">Type</div>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((t) => (
                  <label
                    key={t}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium capitalize focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
                      workTypes.has(t) ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'
                    }`}
                  >
                    <input
                      className="sr-only"
                      type="checkbox"
                      checked={workTypes.has(t)}
                      onChange={() =>
                        setWorkTypes((prev) => {
                          const next = new Set(prev)
                          if (next.has(t)) next.delete(t)
                          else next.add(t)
                          return next
                        })
                      }
                    />
                    {t.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="min-match" className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-text-1">Minimum match</label>
              <input id="min-match" type="range" min={0} max={100} value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))} disabled={!isIndividual} className="w-full accent-[var(--profile-bright-blue)]" />
              <div className="text-[11px] text-text-1">{isIndividual ? `${minMatch}%+` : 'Sign in with an individual account to filter by match.'}</div>
            </div>
            <p className="border-t border-border pt-3 text-[11.5px] leading-relaxed text-text-1">
              Match is computed from the skills on your recorded work against each listing's required skills — never from follower counts or profile views.
            </p>
          </aside>

          <div className="min-w-0 flex-1 basis-[420px]">
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, skill, or organisation…"
                aria-label="Search opportunities"
                className="min-h-[48px] flex-1 rounded-xl border border-border-strong bg-surface px-4 text-[15px] outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>

            <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {CAREER_CLUSTERS.map((c) => (
                <button
                  key={c}
                  disabled={!!pinnedCluster}
                  onClick={() => setCluster((current) => (current === c ? null : c))}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium disabled:opacity-100 ${
                    cluster === c ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <p className="mb-3 text-[12.5px] text-text-1" role="status" aria-live="polite">
              {jobs.length} {jobs.length === 1 ? 'opportunity' : 'opportunities'}
              {filtered && (
                <button onClick={resetFilters} className="ml-2 font-semibold text-accent underline-offset-2 hover:underline">
                  Clear filters
                </button>
              )}
            </p>

            {sponsoredCampaigns[0] && (
              <div className="mb-3">
                <SponsoredCard campaign={sponsoredCampaigns[0]} viewerAccount={account} viewerEmail={viewer} />
              </div>
            )}

            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-strong bg-surface-sunken p-12 text-center text-sm text-text-1">
                No opportunities posted yet{query || minMatch > 0 || workTypes.size < WORK_TYPES.length ? ' matching your filters' : ''}.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map(({ job, match }) => (
                  <JobCard key={job.id} job={job} viewerAccount={account} viewerEmail={viewer} matchPct={match?.pct} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
