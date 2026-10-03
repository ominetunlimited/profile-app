import { useMemo } from 'react'
import { routeRegistry } from '@/app/routeRegistry'
import { checkRouteIntegrity, type RouteHealthRow } from '@/app/routeIntegrity'

const TONE = { success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-warning', danger: 'bg-danger-soft text-danger' } as const

/** Every registered route and whether it is in good order. Computed from the live route registry. */
export function AdminRouteIntegrity() {
  const report = useMemo(() => checkRouteIntegrity(routeRegistry), [])
  const flagged = report.rows.filter((r) => r.status !== 'Healthy')

  const stats = [
    { label: 'REGISTERED ROUTES', value: report.total, ink: 'text-text-0' },
    { label: 'HEALTHY', value: report.healthyCount, ink: 'text-success' },
    { label: 'NEEDS ATTENTION', value: report.needsAttentionCount, ink: report.needsAttentionCount ? 'text-warning' : 'text-success' },
    { label: 'BROKEN', value: report.brokenCount, ink: report.brokenCount ? 'text-danger' : 'text-success' },
  ]

  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-text-2">Platform staff · engineering</div>
      <h1 className="mb-1.5 text-[26px] font-bold leading-tight tracking-tight text-text-0">Route Integrity Engine</h1>
      <p className="mb-[22px] max-w-[74ch] text-[13px] leading-[1.65] text-text-1">
        Every registered route, checked: does it exist, render, handle its states, and stay reachable from real navigation. No button in the product should point somewhere this table doesn't know about.
      </p>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[11px] border border-border bg-surface px-3.5 py-3 shadow-sm">
            <div className="mb-[5px] font-mono text-[9.5px] font-medium tracking-[.06em] text-text-2">{s.label}</div>
            <div className={`font-mono text-[19px] font-semibold tabular-nums ${s.ink}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {report.duplicatePaths.length > 0 && (
        <div role="alert" className="mb-4 rounded-r-[10px] border-l-[3px] border-danger bg-danger-soft px-4 py-3.5 text-sm text-text-0">
          Duplicate paths: {report.duplicatePaths.join(', ')}
        </div>
      )}

      <div className="overflow-x-auto rounded-[13px] border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <caption className="sr-only">Full route registry with per-route render, auth and state health</caption>
          <thead>
            <tr className="bg-surface-sunken text-[10.5px] font-semibold tracking-[.04em] text-text-2">
              <th scope="col" className="px-3 py-[9px]">ROUTE</th>
              <th scope="col" className="px-3 py-[9px]">MODULE</th>
              <th scope="col" className="w-[90px] px-3 py-[9px] text-center">RENDERS</th>
              <th scope="col" className="w-[90px] px-3 py-[9px] text-center">AUTH</th>
              <th scope="col" className="w-[90px] px-3 py-[9px] text-center">STATES</th>
              <th scope="col" className="w-[130px] px-3 py-[9px]">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r: RouteHealthRow) => (
              <tr key={r.path} className="border-t border-border bg-surface">
                <td className="px-3 py-[9px] font-mono text-[11.5px] text-text-0">{r.path}</td>
                <td className="px-3 py-[9px] text-text-1">{r.module}</td>
                <td className="px-3 py-[9px] text-center">{r.renders}</td>
                <td className="px-3 py-[9px] text-center">{r.auth}</td>
                <td className="px-3 py-[9px] text-center">{r.states}</td>
                <td className="px-3 py-[9px]">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE[r.status === 'Healthy' ? 'success' : r.status === 'Needs attention' ? 'warning' : 'danger']}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {flagged.length === 0 ? (
        <div className="mt-[18px] rounded-r-[10px] border-l-[3px] border-success bg-success-soft px-4 py-3.5 text-xs text-text-0">No broken references.</div>
      ) : (
        <div className="mt-[18px] rounded-r-[10px] border-l-[3px] border-warning bg-warning-soft px-4 py-3.5">
          <div className="mb-[5px] text-[12.5px] font-semibold text-text-0">{flagged.length} route{flagged.length === 1 ? '' : 's'} flagged for review</div>
          <p className="font-mono text-[11.5px] leading-[1.7] text-text-1">{flagged.map((r) => r.path).join('  ·  ')}</p>
        </div>
      )}
    </div>
  )
}
