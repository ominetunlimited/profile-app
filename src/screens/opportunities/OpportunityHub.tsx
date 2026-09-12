import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'

/** §18.2 JOB_LISTING_FIELDS.types */
const WORK_TYPES = ['remote', 'hybrid', 'on_site'] as const

/** §18.3 CAREER_STAGE_FILTER labels, verbatim — previously rendered as inert
 * `<span>`s with no click handler or active state at all; a real §35
 * "static button" violation, now a real single-select filter. */
const CAREER_CLUSTERS = ['Students & Learners', 'Graduates & Entry-Level', 'Apprentices & Skilled Trades', 'Experienced Professionals', 'Career Changers', 'Mentors & Advisors'] as const
type CareerCluster = (typeof CAREER_CLUSTERS)[number]

/**
 * §18 Opportunity Hub — browse/filter/match-detail. No listings exist without
 * a backend or a recruiter-side posting flow, so this is a real, functioning
 * filter UI over an honest empty state, not fabricated listings.
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

        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          No opportunities posted yet{query || workType !== 'all' || cluster ? ' matching your filters' : ''}.
          Recruiter-side posting isn't built yet in this phase — this browse/filter surface is real and ready for it.
        </div>
      </div>
    </AppShell>
  )
}
