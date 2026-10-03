import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { routeRegistry } from '@/app/routeRegistry'
import { checkRouteIntegrity } from '@/app/routeIntegrity'
import { fetchPlatformStats, type PlatformStats } from '@/app/platformStats'
import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'

interface Decision {
  key: string
  glyph: string
  title: string
  body: string
  cta: string
  to: string
  tone: 'warning' | 'accent' | 'danger'
}

const TONE: Record<Decision['tone'], { edge: string; bg: string; ink: string; btn: string }> = {
  warning: { edge: 'border-warning', bg: 'bg-warning-soft', ink: 'text-warning', btn: 'bg-warning' },
  accent: { edge: 'border-accent', bg: 'bg-accent-soft', ink: 'text-accent', btn: 'bg-accent-solid' },
  danger: { edge: 'border-danger', bg: 'bg-danger-soft', ink: 'text-danger', btn: 'bg-danger' },
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`
const ratio = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : null)

/** Mission Control: a few decisions that matter, then the numbers behind them. Everything comes from live platform data. */
export function AdminMissionControl() {
  const { admin } = useAdmin()
  const allowed = !!admin && platformRoleCan(admin.role, 'mission_control')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!allowed) return
    let live = true
    fetchPlatformStats()
      .then((s) => live && setStats(s))
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [allowed])

  if (!allowed) return <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">Your role doesn't include Mission Control.</p>

  const routes = checkRouteIntegrity(routeRegistry)

  const decisions: Decision[] = []
  if (stats) {
    if (stats.identity.kyc_waiting > 0) decisions.push({ key: 'kyc', glyph: '◷', tone: 'warning', title: `${plural(stats.identity.kyc_waiting, 'identity check')} waiting`, body: 'ID documents and selfies are waiting for a person to compare and decide.', cta: 'Review', to: '/admin/kyc' })
    if (stats.accounts.organisation_claims_pending > 0) decisions.push({ key: 'claims', glyph: '◷', tone: 'warning', title: `${plural(stats.accounts.organisation_claims_pending, 'organisation')} awaiting verification`, body: 'Organisations that have asked to be verified before they can confirm records.', cta: 'Review', to: '/admin/verification' })
    if (stats.verification.requests_unrouted_open > 0) decisions.push({ key: 'unrouted', glyph: '→', tone: 'accent', title: `${plural(stats.verification.requests_unrouted_open, 'verification request')} with no institution on PROFILE`, body: 'Nobody else can decide these, so they come to staff.', cta: 'Review', to: '/admin/verification-requests' })
    if (stats.cases.disputes_open > 0) decisions.push({ key: 'disputes', glyph: '!', tone: 'danger', title: `${plural(stats.cases.disputes_open, 'open dispute')}`, body: 'Examine both sides and record a written outcome.', cta: 'Review', to: '/admin/disputes' })
    if (stats.cases.data_requests_open > 0) decisions.push({ key: 'data', glyph: '◷', tone: 'accent', title: `${plural(stats.cases.data_requests_open, 'data request')} open`, body: 'Corrections, consent withdrawals, appeals and account deletions.', cta: 'Review', to: '/admin/data-requests' })
    if (stats.ai.flagged > 0) decisions.push({ key: 'ai', glyph: '!', tone: 'danger', title: `${plural(stats.ai.flagged, 'AI output')} flagged`, body: 'Marked for a closer look in the AI decision log.', cta: 'Review', to: '/admin/ai-decision-log' })
  }

  const kpis = stats
    ? [
        { label: 'ACCOUNTS', value: stats.accounts.total, note: `${stats.accounts.individuals} individuals · ${stats.accounts.organisations} organisations` },
        { label: 'RECORDS THIS WEEK', value: stats.activity.records_7d, note: `${stats.activity.records_total} recorded in total` },
        { label: 'VERIFIED ORGANISATIONS', value: stats.accounts.organisations_verified, note: `of ${stats.accounts.organisations} organisations` },
        { label: 'OPEN VERIFICATION REQUESTS', value: stats.verification.requests_open, note: `${stats.verification.requests_verified} confirmed so far` },
        { label: 'PUBLIC PROFILES', value: stats.accounts.public, note: `${stats.accounts.private} private · ${stats.accounts.discoverable} verified-organisations only` },
        { label: 'OPEN JOBS', value: stats.activity.jobs_open, note: `${stats.activity.communities} communities` },
      ]
    : []

  const trustHealth = stats
    ? [
        { label: 'Identity checks approved', pct: ratio(stats.identity.kyc_approved, stats.identity.kyc_approved + stats.identity.kyc_rejected), detail: `${stats.identity.kyc_approved} approved · ${stats.identity.kyc_rejected} rejected` },
        { label: 'Verification requests confirmed', pct: ratio(stats.verification.requests_verified, stats.verification.requests_verified + stats.verification.requests_rejected), detail: `${stats.verification.requests_verified} confirmed · ${stats.verification.requests_rejected} not confirmed` },
        { label: 'Disputes resolved', pct: ratio(stats.cases.disputes_total - stats.cases.disputes_open, stats.cases.disputes_total), detail: `${stats.cases.disputes_total - stats.cases.disputes_open} of ${stats.cases.disputes_total}` },
        { label: 'Organisations verified', pct: ratio(stats.accounts.organisations_verified, stats.accounts.organisations), detail: `${stats.accounts.organisations_verified} of ${stats.accounts.organisations}` },
      ]
    : []

  function exportSnapshot() {
    if (!stats) return
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), platform: stats, routes: { total: routes.total, healthy: routes.healthyCount, needsAttention: routes.needsAttentionCount, broken: routes.brokenCount } }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profile-snapshot-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const infra: { label: string; glyph: string; value: string; ink: string }[] = [
    { label: 'Route health', glyph: routes.brokenCount + routes.needsAttentionCount === 0 ? '✓' : '⚠', value: `${routes.healthyCount} of ${routes.total} healthy`, ink: routes.brokenCount + routes.needsAttentionCount === 0 ? 'text-success' : 'text-warning' },
    ...(stats ? [{ label: 'Row-level security', glyph: stats.security.tables_without_rls === 0 ? '✓' : '⚠', value: stats.security.tables_without_rls === 0 ? `On for all ${stats.security.tables_total} tables` : `${stats.security.tables_without_rls} tables unprotected`, ink: stats.security.tables_without_rls === 0 ? 'text-success' : 'text-danger' }] : []),
    { label: 'Uptime monitoring', glyph: '–', value: 'Not connected', ink: 'text-text-2' },
    { label: 'Error tracking', glyph: '–', value: 'Not connected', ink: 'text-text-2' },
    { label: 'Email delivery', glyph: '–', value: 'Not configured', ink: 'text-text-2' },
  ]

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-text-2">Platform staff</div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text-0">Mission Control</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/ai-decision-log" className="flex h-9 items-center rounded-lg border border-border-strong bg-surface px-[13px] text-[12.5px] font-medium text-text-0 no-underline">
            AI decision log
          </Link>
          <Link to="/admin/route-integrity" className="flex h-9 items-center rounded-lg border border-border-strong bg-surface px-[13px] text-[12.5px] font-medium text-text-0 no-underline">
            Route integrity
          </Link>
        </div>
      </div>
      <p className="mb-[26px] max-w-[70ch] text-[13px] leading-[1.65] text-text-1">A small number of decisions that matter, not a wall of every metric. What happened, why, and what needs a person.</p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-danger bg-danger-soft p-3 text-sm text-text-0">
          Couldn't load platform data: {error}
        </p>
      )}
      {!stats && !error && <p className="mb-4 text-sm text-text-1">Loading platform data…</p>}

      {stats && (
        <>
          <section className="mb-7" aria-labelledby="needs-decision">
            <h2 id="needs-decision" className="mb-3 text-[12.5px] font-semibold text-text-0">Needs a decision</h2>
            {decisions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing needs a decision right now.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {decisions.map((d) => {
                  const t = TONE[d.tone]
                  return (
                    <div key={d.key} className={`flex flex-wrap items-center gap-3.5 rounded-xl border px-4 py-3.5 ${t.edge} ${t.bg}`}>
                      <span aria-hidden className={`flex-none text-[13px] font-bold ${t.ink}`}>{d.glyph}</span>
                      <div className="min-w-[220px] flex-1">
                        <div className="mb-[3px] text-[13px] font-semibold text-text-0">{d.title}</div>
                        <div className="text-xs leading-relaxed text-text-1">{d.body}</div>
                      </div>
                      <Link to={d.to} className={`flex h-[34px] flex-none items-center rounded-lg px-3.5 text-xs font-semibold text-white no-underline ${t.btn}`}>
                        {d.cta}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                <div className="mb-1.5 font-mono text-[10px] font-medium tracking-[.06em] text-text-2">{k.label}</div>
                <div className="font-mono text-[21px] font-semibold tabular-nums text-text-0">{k.value}</div>
                <div className="mt-1 text-[11px] text-text-1">{k.note}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <section className="min-w-0 flex-[1_1_340px] rounded-[13px] border border-border bg-surface px-5 py-[18px]" aria-labelledby="trust-health">
              <h2 id="trust-health" className="mb-3 text-[13.5px] font-semibold text-text-0">Trust health</h2>
              <div className="flex flex-col gap-[9px]">
                {trustHealth.map((t) => (
                  <div key={t.label}>
                    <div className="mb-1 flex justify-between gap-2">
                      <span className="text-xs text-text-0">{t.label}</span>
                      <span className="font-mono text-[11px] text-text-1">{t.pct === null ? '—' : `${t.pct}%`}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-[3px] bg-surface-sunken">
                      <div className="h-full rounded-[3px] bg-trust" style={{ width: `${t.pct ?? 0}%` }} />
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-text-2">{t.detail}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="min-w-[260px] flex-[1_1_300px] rounded-[13px] border border-border bg-surface px-5 py-[18px]" aria-labelledby="infra">
              <h2 id="infra" className="mb-3 text-[13.5px] font-semibold text-text-0">Infrastructure &amp; security</h2>
              {infra.map((i) => (
                <div key={i.label} className="flex justify-between gap-2 border-b border-border py-2 last:border-b-0">
                  <span className="text-xs text-text-0">{i.label}</span>
                  <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${i.ink}`}>
                    <span aria-hidden>{i.glyph}</span> {i.value}
                  </span>
                </div>
              ))}
            </section>
          </div>

          <div className="mt-[22px] flex flex-wrap gap-4">
            <section className="min-w-[220px] flex-[1_1_260px] rounded-[13px] border border-border bg-surface px-5 py-[18px]">
              <h2 className="mb-2.5 text-[13.5px] font-semibold text-text-0">Export this view</h2>
              <p className="mb-3 text-xs leading-relaxed text-text-1">Download the figures above as a dated snapshot for your records.</p>
              <button type="button" onClick={exportSnapshot} className="h-[38px] rounded-[9px] border border-border-strong bg-surface-sunken px-3.5 text-[12.5px] font-semibold text-text-0">
                Download snapshot
              </button>
              <p className="mt-2 text-[10.5px] text-text-2">Generated {new Date(stats.generated_at).toLocaleString()}</p>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
