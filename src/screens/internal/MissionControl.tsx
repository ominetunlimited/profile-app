import { Link } from 'react-router-dom'
import { routeRegistry } from '@/app/routeRegistry'
import { checkRouteIntegrity } from '@/app/routeIntegrity'
import { listAllOrganisations } from '@/app/demoAccountStore'
import { InternalNav } from './InternalNav'

/**
 * §50.12 PROFILE Mission Control — the owner intelligence layer. §50.12.1's
 * 9 domains are each a *synthesis view over an existing data source*, never
 * new telemetry collection — this build has no backend observability stack,
 * revenue ledger, support-ticket system, or AI Gateway, so most domains are
 * honestly empty. Where this build genuinely has real local data (accounts,
 * activities, disputes, route health, creator templates), the briefing uses
 * it — real counts, not the spec's illustrative "18,429 new users" example.
 * Deterministically computed, not AI-generated (§48.0/§50.12.5: never
 * fabricate a metric) — same honesty pattern as Cover Letter's
 * template-assembly.
 */
export function MissionControl() {
  const routeReport = checkRouteIntegrity(routeRegistry)
  const orgs = listAllOrganisations()
  const pendingClaims = orgs.filter((o) => o.registryLevel === 'user_submitted')

  const accountsRegistered = readCount('profile:demo-accounts')
  const activitiesRecorded = readCount('profile:demo-activities')
  const disputesFiled = readCount('profile:demo-disputes')
  const creatorTemplates = readArray<{ status: string; earnings: number }>('profile:demo-creator-templates')
  const publishedTemplates = creatorTemplates.filter((t) => t.status === 'published')
  const totalCreatorEarnings = creatorTemplates.reduce((sum, t) => sum + (t.earnings ?? 0), 0)

  return (
    <div className="min-h-screen bg-bg text-text-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <InternalNav />
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · Owner intelligence layer</div>
        <h1 className="text-lg font-semibold">Mission Control</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Synthesis over this build's real local data — not a fabricated briefing. Most of §50.12's 9 intelligence
          domains have no backend telemetry source to synthesise yet, and say so rather than inventing numbers.
        </p>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-8 rounded-xl border-l-4 border-accent bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-text-0">Daily Briefing</h2>
            <span className="font-mono text-xs text-text-2">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Accounts registered" value={accountsRegistered} />
            <Metric label="Activities recorded" value={activitiesRecorded} />
            <Metric label="Disputes filed" value={disputesFiled} />
            <Metric label="Creator templates published" value={publishedTemplates.length} />
          </div>
          <p className="text-xs text-text-2">
            Computed directly from this browser's local demo data, not AI-generated — no AI Gateway (§48.11) or
            backend telemetry exists in this build (§50.12.5's "never fabricate a metric" rule, applied literally).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Priority decisions</h2>
          {pendingClaims.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              Nothing needs your attention today.
            </div>
          ) : (
            <Link
              to="/internal/verification-review"
              className="flex items-center justify-between rounded-xl border border-warning bg-surface-sunken p-4 hover:border-accent"
            >
              <div>
                <div className="font-semibold text-text-0">
                  {pendingClaims.length} organisation{pendingClaims.length === 1 ? '' : 's'} awaiting verification claim
                </div>
                <div className="text-xs text-text-1">Trust Intelligence · Recommended: Verification team</div>
              </div>
              <span className="text-accent">Review →</span>
            </Link>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-text-0">Intelligence domains</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DomainCard title="Growth Intelligence" real body={`${accountsRegistered} account(s) registered on this browser.`} />
            <DomainCard
              title="Trust Intelligence"
              real
              body={`${disputesFiled} dispute(s) filed, ${pendingClaims.length} organisation claim(s) pending.`}
              link={{ to: '/internal/dispute-review', label: 'Open Dispute Review' }}
            />
            <DomainCard title="Business Intelligence" real body={`${publishedTemplates.length} published creator template(s), ₦${totalCreatorEarnings.toLocaleString()} tracked earnings.`} />
            <DomainCard title="Infrastructure Intelligence" real body={`${routeReport.healthyCount}/${routeReport.total} routes healthy.`} link={{ to: '/internal/route-integrity', label: 'Open Route Integrity Engine' }} />
            <DomainCard title="Copilot Intelligence" real body="0 AI decisions logged — no AI Gateway connected yet." link={{ to: '/internal/ai-decision-log', label: 'Open AI Decision Log' }} />
            <DomainCard title="User Health Intelligence" body="Requires §50.9.3 Profile Health Dashboard data aggregated across a real user base — not available from a single-browser demo." />
            <DomainCard title="Enterprise Intelligence" body="Requires real SSO/API integration usage (§38.18) — this build's integrations are demo placeholders." />
            <DomainCard title="Security Intelligence" body="Requires §37.16 production monitoring — no backend exists to monitor." />
            <DomainCard title="Operational Intelligence" body="Requires deployment/CI-CD and SRE telemetry (§50.11) — not applicable to a local dev build." />
            <DomainCard title="Customer Intelligence" body="Requires real support-ticket data (§37.26.9) — none exists yet." />
          </div>
        </section>
      </main>
    </div>
  )
}

function readCount(key: string): number {
  return readArray(key).length
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-sunken p-3">
      <div className="font-mono text-2xl font-semibold text-text-0">{value}</div>
      <div className="text-[11px] text-text-1">{label}</div>
    </div>
  )
}

function DomainCard({ title, body, real, link }: { title: string; body: string; real?: boolean; link?: { to: string; label: string } }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-semibold text-text-0">{title}</span>
        {!real && <span className="rounded-full border border-border-strong px-2 py-0.5 text-[9.5px] uppercase text-text-2">No telemetry source</span>}
      </div>
      <p className="mb-2 text-xs leading-relaxed text-text-1">{body}</p>
      {link && (
        <Link to={link.to} className="text-xs font-semibold text-accent">
          {link.label} →
        </Link>
      )}
    </div>
  )
}
