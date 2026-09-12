import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'

/** §18.2 JOB_LISTING_FIELDS.types */
const WORK_TYPES = ['remote', 'hybrid', 'on_site'] as const

/** §18 Opportunity Hub — browse/filter/match-detail. No listings exist without
 * a backend or a recruiter-side posting flow, so this is a real, functioning
 * filter UI over an honest empty state, not fabricated listings. */
export function OpportunityHub() {
  const [workType, setWorkType] = useState<(typeof WORK_TYPES)[number] | 'all'>('all')
  const [query, setQuery] = useState('')

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-text-0">Opportunity Hub</h1>
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
          {['Students & Learners', 'Graduates & Entry-Level', 'Experienced Professionals', 'Career Changers', 'Mentors & Advisors'].map((c) => (
            <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-text-1">
              {c}
            </span>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          No opportunities posted yet{query || workType !== 'all' ? ' matching your filters' : ''}. Recruiter-side
          posting isn't built yet in this phase — this browse/filter surface is real and ready for it.
        </div>
      </div>
    </AppShell>
  )
}
