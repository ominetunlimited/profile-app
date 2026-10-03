import { useState } from 'react'
import { listAiDecisions, type AiDecisionLogEntry } from '@/app/aiDecisionLogStore'
import { InternalNav } from './InternalNav'

const SURFACES: AiDecisionLogEntry['surface'][] = ['advisor', 'copilot', 'cover_letter', 'opportunity_match']

/**
 * §48 AI Engine governance — an auditable trail of every AI-derived output,
 * per §48.0's "AI-generated content is always labelled as such" and "never
 * bypasses verification" rules. Real entries now exist: PROFILE Advisor
 * (api/advisor.ts, a real Anthropic API call) logs one here after every
 * reply. Cover Letter remains template-assembled from real records, not AI
 * output, so it logs nothing — that's correct, not a gap. Empty until the
 * first real Advisor question is asked; seeding this with fake entries to
 * look populated would be exactly the kind of fabrication §48.0/§49.8 exist
 * to prevent.
 */
export function AIDecisionLog() {
  const [entries] = useState(() => listAiDecisions())
  const [filter, setFilter] = useState<'all' | AiDecisionLogEntry['surface']>('all')

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.surface === filter)

  return (
    <div className="min-h-screen bg-bg text-text-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <InternalNav />
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · Owner / governance</div>
        <h1 className="text-lg font-semibold">AI decision log</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Every AI-generated output that touched a real user, with what it was allowed to see and whether a human
          flagged it. Advisor never fabricates a credential — this is the audit trail proving it.
        </p>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-1.5">
          {(['all', ...SURFACES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold capitalize ${filter === s ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            <p className="mb-1 font-semibold text-text-0">No AI decisions logged yet.</p>
            <p className="mx-auto max-w-md">
              PROFILE Advisor logs a real entry here every time someone asks it a question — none has been
              asked yet on this deployment, or the deployment has no ANTHROPIC_API_KEY configured. Cover Letter
              drafts are template-assembled from your own records, not AI-generated, so they never log here — that's
              correct, not a gap.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase text-text-2">{e.surface}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ${
                        e.reviewStatus === 'flagged' ? 'bg-danger-soft text-danger' : e.reviewStatus === 'reviewed' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                      }`}
                    >
                      {e.reviewStatus}
                    </span>
                  </div>
                  <span className="text-xs text-text-2">{new Date(e.timestamp).toLocaleString()}</span>
                </div>
                <p className="mb-1 text-sm text-text-0">{e.output}</p>
                <p className="text-xs text-text-1">
                  User: <span className="font-mono">{e.userId}</span> · Data accessed: {e.dataAccessed.join(', ') || 'none'}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-xl border-l-4 border-warning bg-warning-soft p-4">
          <div className="mb-1.5 font-semibold text-text-0">Policy rule enforced automatically — AI Principles</div>
          <p className="text-xs leading-relaxed text-text-1">
            AI may generate, organise, and suggest — never fabricate experience, qualifications, or achievements. An
            inference is never silently converted into a verified fact. Every AI output is labelled as such, and the
            user remains owner and final editor of it. AI never bypasses verification — verification is
            institutional, not algorithmic.
          </p>
        </div>
      </main>
    </div>
  )
}
