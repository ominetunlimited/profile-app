import { useMemo } from 'react'
import { routeRegistry } from '@/app/routeRegistry'
import { checkRouteIntegrity, type RouteHealthRow } from '@/app/routeIntegrity'
import { InternalNav } from './InternalNav'

/**
 * §49.3 — the full dashboard (Phase 5), not Phase 0's scaffolding table.
 * Layout matches `PROFILE Route Integrity Engine.dc.html` exactly (stats row
 * + Route/Module/Renders/Auth/Empty-Err/Status table + a broken-reference
 * callout), but every number is computed from the live registry — never the
 * Handoff's illustrative 214/211/2/1 sample figures.
 */
export function RouteIntegrityEngine() {
  const report = useMemo(() => checkRouteIntegrity(routeRegistry), [])

  return (
    <div className="min-h-screen bg-bg text-text-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <InternalNav />
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · Owner / platform engineering</div>
        <h1 className="text-lg font-semibold">Route Integrity Engine</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Every registered route, checked continuously: does it exist, render, handle its states, and stay reachable
          from real navigation. No button in the product should point somewhere this table doesn't know about.
        </p>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Registered routes" value={report.total} />
          <Stat label="Healthy" value={report.healthyCount} tone="success" />
          <Stat label="Needs attention" value={report.needsAttentionCount} tone={report.needsAttentionCount ? 'warning' : 'success'} />
          <Stat label="Broken" value={report.brokenCount} tone={report.brokenCount ? 'danger' : 'success'} />
        </div>

        {report.duplicatePaths.length > 0 && (
          <div role="alert" aria-live="polite" className="mb-6 rounded-lg border-l-4 border-danger bg-surface-sunken p-4 text-sm">
            Duplicate paths detected: {report.duplicatePaths.join(', ')}
          </div>
        )}

        <div className="mb-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">Full route registry with per-route render/auth/state health</caption>
            <thead>
              <tr className="border-b border-border-strong bg-surface-sunken text-[10.5px] font-semibold uppercase tracking-wide text-text-2">
                <th scope="col" className="px-3 py-2.5">
                  Route
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Module
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Renders
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Auth
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Empty/Err
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <RouteRow key={r.path} row={r} />
              ))}
            </tbody>
          </table>
        </div>

        {report.needsAttentionCount === 0 && report.brokenCount === 0 ? (
          <div className="mb-6 rounded-lg border-l-4 border-success bg-surface-sunken p-4 text-sm text-text-0">
            No broken references. The Handoff's own flagged gap
            (<span className="font-mono text-xs">/mission-control/executive-copilots</span>) is registered, not
            dangling — it renders a "being finished" shell rather than a dead link.
          </div>
        ) : (
          report.rows
            .filter((r) => r.status === 'Needs attention')
            .map((r) => (
              <div key={r.path} className="mb-3 rounded-lg border-l-4 border-warning bg-surface-sunken p-4 text-sm">
                <p className="font-mono text-xs text-text-2">{r.path}</p>
                <p className="mt-1 text-text-1">{routeRegistry.find((rr) => rr.path === r.path)?.note ?? 'Flagged for review.'}</p>
              </div>
            ))
        )}

        <details className="rounded-xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-text-0">
            All {report.flagged.length} documented design decisions (route renames, dual-purpose routes, discrepancy flags)
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {report.flagged.map((route) => (
              <div key={route.path} className="border-t border-border pt-3 first:border-0 first:pt-0">
                <p className="font-mono text-xs text-text-2">{route.path}</p>
                <p className="mt-1 text-xs text-text-1">{route.note}</p>
              </div>
            ))}
          </div>
        </details>
      </main>
    </div>
  )
}

function RouteRow({ row }: { row: RouteHealthRow }) {
  const statusTone = row.status === 'Healthy' ? 'success' : row.status === 'Needs attention' ? 'warning' : 'danger'
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 font-mono text-[11.5px] text-text-0">{row.path}</td>
      <td className="px-3 py-2 text-text-1">{row.module}</td>
      <td className="px-3 py-2 text-center">{row.renders}</td>
      <td className="px-3 py-2 text-center">{row.auth}</td>
      <td className="px-3 py-2 text-center">{row.states}</td>
      <td className="px-3 py-2">
        <StatusBadge label={row.status} tone={statusTone} />
      </td>
    </tr>
  )
}

// Design handoff gap audit: mockup status pills are a solid soft-tint
// fill with no border; real rendered as a bordered outline on transparent
// background instead — fixed now that the -soft tokens exist to fill with.
function StatusBadge({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>{label}</span>
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'success' ? 'text-success' : 'text-text-0'
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="font-mono text-xs uppercase tracking-wide text-text-2">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}
