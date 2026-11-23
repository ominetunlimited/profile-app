import { ProfileLogoAnimated } from '@/shared/ui/ProfileLogoAnimated'
import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'
import { listAiDecisions, reviewAiDecision, type AiDecisionLogEntry } from '@/app/aiDecisionLogStore'

const SURFACES: AiDecisionLogEntry['surface'][] = ['advisor', 'copilot', 'cover_letter', 'opportunity_match']
const SURFACE_LABEL: Record<AiDecisionLogEntry['surface'], string> = { advisor: 'Advisor', copilot: 'Copilot', cover_letter: 'Cover letter', opportunity_match: 'Opportunity match' }
const REVIEW_TONE: Record<AiDecisionLogEntry['reviewStatus'], string> = {
  unreviewed: 'bg-surface-sunken text-text-1',
  reviewed: 'bg-success-soft text-success',
  flagged: 'bg-danger-soft text-danger',
}
const REVIEW_LABEL: Record<AiDecisionLogEntry['reviewStatus'], string> = { unreviewed: 'Not reviewed', reviewed: 'Reviewed', flagged: 'Flagged' }

/** Every AI-generated output that touched a real user, what it was allowed to see, and whether a person has looked at it. */
export function AdminAiDecisionLog() {
  const { admin } = useAdmin()
  const allowed = !!admin && platformRoleCan(admin.role, 'mission_control')
  const [entries, setEntries] = useState<AiDecisionLogEntry[] | null>(null)
  const [filter, setFilter] = useState<'all' | AiDecisionLogEntry['surface']>('all')
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setEntries(await listAiDecisions())
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])
  useEffect(() => {
    if (allowed) void load()
  }, [allowed, load])

  if (!allowed) return <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">Your role doesn't include the AI decision log.</p>

  const all = entries ?? []
  const filtered = filter === 'all' ? all : all.filter((e) => e.surface === filter)
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
  const stats = [
    { label: 'AI OUTPUTS (7D)', value: all.filter((e) => new Date(e.timestamp).getTime() > weekAgo).length, ink: 'text-text-0' },
    { label: 'FLAGGED FOR REVIEW', value: all.filter((e) => e.reviewStatus === 'flagged').length, ink: 'text-warning' },
    { label: 'REVIEWED', value: all.filter((e) => e.reviewStatus === 'reviewed').length, ink: 'text-success' },
    { label: 'NOT YET REVIEWED', value: all.filter((e) => e.reviewStatus === 'unreviewed').length, ink: 'text-text-0' },
  ]

  async function review(id: string, status: 'reviewed' | 'flagged' | 'unreviewed') {
    setBusyId(id)
    setError(null)
    try {
      await reviewAiDecision(id, status)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
    setBusyId(null)
  }

  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-text-2">Platform staff · governance</div>
      <h1 className="mb-1.5 text-[26px] font-bold leading-tight tracking-tight text-text-0">AI decision log</h1>
      <p className="mb-[22px] max-w-[74ch] text-[13px] leading-[1.65] text-text-1">
        Every AI-generated output that touched a real user, with what it was allowed to see and whether a person has looked at it. Advisor never fabricates a credential — this is the audit trail that lets you check.
      </p>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[11px] border border-border bg-surface px-3.5 py-3 shadow-sm">
            <div className="mb-[5px] font-mono text-[9.5px] font-medium tracking-[.06em] text-text-2">{s.label}</div>
            <div className={`font-mono text-[19px] font-semibold tabular-nums ${s.ink}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['all', ...SURFACES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold ${filter === s ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}
          >
            {s === 'all' ? 'All' : SURFACE_LABEL[s]}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-xs text-danger">
          {error}
        </p>
      )}

      {entries === null && !error ? (
        <div className="flex justify-center py-6"><ProfileLogoAnimated state="loading" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          <p className="mb-1 font-semibold text-text-0">No AI decisions logged yet.</p>
          <p className="mx-auto max-w-md">PROFILE Advisor adds an entry here every time someone asks it a question. Cover letters are assembled from a person's own records rather than written by AI, so they never appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[13px] border border-border">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[110px_1.4fr_1fr_150px_170px] bg-surface-sunken text-[10.5px] font-semibold tracking-[.04em] text-text-2">
              <div className="px-3 py-[9px]">SURFACE</div>
              <div className="px-3 py-[9px]">OUTPUT</div>
              <div className="px-3 py-[9px]">DATA ACCESSED</div>
              <div className="px-3 py-[9px]">USER</div>
              <div className="px-3 py-[9px]">REVIEW</div>
            </div>
            {filtered.map((e) => (
              <div key={e.id} className="grid grid-cols-[110px_1.4fr_1fr_150px_170px] items-start border-t border-border bg-surface text-xs">
                <div className="px-3 py-[9px] text-text-1">
                  {SURFACE_LABEL[e.surface]}
                  <div className="mt-0.5 text-[10px] text-text-2">{new Date(e.timestamp).toLocaleString()}</div>
                </div>
                <div className="line-clamp-4 whitespace-pre-line px-3 py-[9px] text-text-0">{e.output}</div>
                <div className="px-3 py-[9px] text-[11px] text-text-1">{e.dataAccessed.join(', ') || 'none'}</div>
                <div className="truncate px-3 py-[9px] font-mono text-[11px] text-text-1" title={e.userId}>{e.userId}</div>
                <div className="flex flex-col items-start gap-1.5 px-3 py-[9px]">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${REVIEW_TONE[e.reviewStatus]}`}>{REVIEW_LABEL[e.reviewStatus]}</span>
                  <span className="flex flex-wrap gap-1">
                    {e.reviewStatus !== 'reviewed' && (
                      <button disabled={busyId === e.id} onClick={() => void review(e.id, 'reviewed')} className="rounded border border-border-strong px-1.5 py-0.5 text-[10.5px] font-semibold text-text-1 hover:text-text-0 disabled:opacity-50">
                        Mark reviewed
                      </button>
                    )}
                    {e.reviewStatus !== 'flagged' && (
                      <button disabled={busyId === e.id} onClick={() => void review(e.id, 'flagged')} className="rounded border border-danger px-1.5 py-0.5 text-[10.5px] font-semibold text-danger disabled:opacity-50">
                        Flag
                      </button>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-[18px] rounded-r-[10px] border-l-[3px] border-warning bg-warning-soft px-4 py-3.5">
        <div className="mb-[5px] text-[12.5px] font-semibold text-text-0">AI principles</div>
        <p className="text-xs leading-relaxed text-text-1">
          AI may generate, organise and suggest — never fabricate experience, qualifications or achievements. An inference is never silently turned into a verified fact. Every AI output is labelled as such, and the person remains the owner and final editor. AI never bypasses verification: verification is institutional, not algorithmic.
        </p>
      </div>
    </div>
  )
}
