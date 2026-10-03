import { useState } from 'react'
import { listAllDisputes, resolveDispute, type DisputeRecord } from '@/app/disputeStore'
import { InternalNav } from './InternalNav'

const OPEN_STATUSES: DisputeRecord['status'][] = ['submitted', 'under_review', 'escalated', 'independent_review']
const RESOLUTIONS: DisputeRecord['status'][] = ['upheld', 'corrected', 'removed', 'escalated', 'independent_review']

/**
 * §26 ADMIN_MODULES's trust_score_dispute_management. DisputeAppeal.tsx
 * already lets a user file a real dispute (§50.1) and Mission Control
 * already surfaced a raw count, but nothing let staff actually act on one —
 * disputes could be filed and then sit forever. This closes that: every
 * real filed dispute, across every owner, with real status transitions.
 */
export function DisputeReview() {
  const [disputes, setDisputes] = useState(() => listAllDisputes())
  const open = disputes.filter((d) => OPEN_STATUSES.includes(d.status))
  const resolved = disputes.filter((d) => !OPEN_STATUSES.includes(d.status))

  function decide(id: string, status: DisputeRecord['status']) {
    resolveDispute(id, status)
    setDisputes(listAllDisputes())
  }

  return (
    <div className="min-h-screen bg-bg text-text-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <InternalNav />
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · Trust Intelligence</div>
        <h1 className="text-lg font-semibold">Dispute Review</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Every dispute a user has actually filed, across every account on this browser — real records, real
          status transitions, all documented and timestamped under the platform's enforcement rules.
        </p>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-6 py-8">
        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Open ({open.length})</h2>
          {open.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No open disputes. File one from a Trust Score breakdown or verification decision to see a real entry
              here.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {open.map((d) => (
                <div key={d.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-warning px-2 py-0.5 text-[10.5px] font-semibold capitalize text-warning">{d.disputeType.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-text-2">{new Date(d.submittedAt).toLocaleString()}</span>
                  </div>
                  <p className="mb-1 text-xs text-text-2">Filed by {d.ownerEmail} · target: {d.targetId} · status: {d.status.replace(/_/g, ' ')}</p>
                  <p className="mb-3 text-sm text-text-0">{d.reason}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {RESOLUTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => decide(d.id, r)}
                        className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-semibold capitalize text-text-1 hover:border-accent hover:text-accent"
                      >
                        {r.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {resolved.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold text-text-0">Resolved ({resolved.length})</h2>
            <div className="flex flex-col gap-2">
              {resolved.map((d) => (
                <div key={d.id} className="rounded-lg border border-border bg-surface-sunken p-3 text-xs text-text-1">
                  <span className="font-semibold capitalize text-text-0">{d.disputeType.replace(/_/g, ' ')}</span> · {d.ownerEmail} ·{' '}
                  <span className="capitalize">{d.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
