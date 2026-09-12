import { useState } from 'react'
import { listAiDecisions, type AiDecisionLogEntry } from '@/app/aiDecisionLogStore'
import { InternalNav } from './InternalNav'

const SURFACES: AiDecisionLogEntry['surface'][] = ['advisor', 'copilot', 'cover_letter', 'opportunity_match']

/**
 * §48 AI Engine governance — an auditable trail of every AI-derived output,
 * per §48.0's "AI-generated content is always labelled as such" and "never
 * bypasses verification" rules. Honestly empty in this build: no AI Gateway
 * (§48.11) exists yet — PROFILE Advisor declines every question rather than
 * fabricating a reply, and Cover Letter is template-assembled from real
 * records, not AI output — so there is nothing real to log. Seeding this
 * with fake entries to look populated would be exactly the kind of
 * fabrication §48.0/§49.8 exist to prevent.
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
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · AI governance</div>
        <h1 className="text-lg font-semibold">AI Decision Log</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Every AI-derived output, what data it accessed, and its review status (§48 AI Engine governance).
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
              This is expected, not a bug: no AI Gateway (§48.11) is connected in this build. PROFILE Advisor
              honestly declines every question instead of fabricating a reply, and Cover Letter drafts are
              template-assembled from your own records, not AI-generated — so there is no real AI output anywhere
              in the product yet to audit. This log has a real write path ready for when one exists.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase text-text-2">{e.surface}</span>
                  <span className="text-xs text-text-2">{new Date(e.timestamp).toLocaleString()}</span>
                </div>
                <p className="mb-1 text-sm text-text-0">{e.output}</p>
                <p className="text-xs text-text-1">Data accessed: {e.dataAccessed.join(', ') || 'none'}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <div className="mb-1.5 font-semibold text-text-0">§48.0 AI Principles this log enforces</div>
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
