import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'

const FILTERS = ['all', 'cv', 'portfolio'] as const
// Design handoff gap audit: CSS `capitalize` only uppercases the first
// letter of the raw filter key, producing "Cv"/"Portfolio" instead of the
// mockup's "CV templates"/"Portfolio templates" — real display labels.
const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = { all: 'All', cv: 'CV templates', portfolio: 'Portfolio templates' }

/** §19.1/§38.12 Creator Marketplace — buyer-side browse. Real filter UI over
 * an honest empty state: no multi-user backend exists yet for other creators
 * to have published anything here (same pattern as Opportunity Hub). */
export function CreatorMarketplace() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
        <Link to="/career/advisor" className="mb-3 inline-block text-sm font-semibold text-accent">
          ← Creator Hub
        </Link>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Template marketplace</h1>
        <p className="mb-5 max-w-[70ch] text-sm text-text-1">
          Browse CV and portfolio templates published by other PROFILE creators. Each purchase supports the person
          who built it.
        </p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold ${filter === f ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          No {filter === 'all' ? '' : filter + ' '}templates published by other creators yet. Publish your own from the{' '}
          <Link to="/career/advisor" className="font-semibold text-accent">
            Creator Hub
          </Link>
          .
        </div>
      </div>
    </AppShell>
  )
}
