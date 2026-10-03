import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools, canAccessUniversityTools } from '@/app/accountTypes'
import { OrgSubPageShell, HubAccessDenied, SectorAccessDenied } from './OrgWorkspaceShell'
import { listRequestsForIssuerEmail, useVerificationVersion } from '@/app/verificationRequestStore'
import { computeIssuerAnalytics, formatDays } from '@/app/orgAnalytics'
import { ListCard, MonthChart, StatCard } from './AnalyticsParts'

/** §23/§16 Institution Analytics — computed from the requests addressed to this institution, never estimated. */
export function InstitutionAnalytics() {
  useVerificationVersion()
  const { account } = useAccount()
  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }
  // §34.2a — institution_excellence_dashboard is a university_or_school module, not every institutional_hub org type's.
  if (!canAccessUniversityTools(account)) {
    return <SectorAccessDenied toolName="Institution Analytics" scopeDescription="universities, polytechnics, colleges, and schools" />
  }

  const a = computeIssuerAnalytics(listRequestsForIssuerEmail(account.officialEmail))
  const change = a.confirmedLastMonth > 0 ? Math.round(((a.confirmedThisMonth - a.confirmedLastMonth) / a.confirmedLastMonth) * 100) : null
  const respDelta = a.avgResponseDays != null && a.avgResponseDaysLastMonth != null ? a.avgResponseDays - a.avgResponseDaysLastMonth : null

  return (
    <OrgSubPageShell title="Verification analytics" back={{ to: '/institution/me', label: `${account.legalName} workspace` }}>
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        <StatCard label="Confirmed this month" value={a.confirmedThisMonth} delta={change == null ? undefined : `${change >= 0 ? '+' : ''}${change}%`} tone={change != null && change >= 0 ? 'good' : 'neutral'} />
        <StatCard label="Avg. response time" value={formatDays(a.avgResponseDays)} delta={respDelta == null ? undefined : `${respDelta <= 0 ? '' : '+'}${respDelta.toFixed(1)}d`} tone={respDelta != null && respDelta <= 0 ? 'good' : 'neutral'} />
        <StatCard label="Rejection rate" value={a.rejectionRate == null ? '—' : `${a.rejectionRate.toFixed(1)}%`} />
        <StatCard label="Total records confirmed" value={a.totalConfirmed.toLocaleString()} delta="all-time" />
      </div>

      <MonthChart title="Verification volume, last 12 months" months={a.months} barClass="bg-trust" />

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-[1_1_300px] rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 text-[13.5px] font-semibold text-text-0">Response time distribution</div>
          {a.responseBands == null ? (
            <p className="text-xs text-text-1">Appears once you have confirmed your first record.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {a.responseBands.map((r) => (
                <div key={r.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs text-text-0">{r.label}</span>
                    <span className="font-mono text-[11px] font-medium text-text-1">{r.share}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-accent-solid" style={{ width: `${r.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-[230px] flex-[1_1_260px]">
          <ListCard title="By credential type" rows={a.byType} empty="No confirmed records yet." />
        </div>
      </div>
      {a.pending > 0 && <p className="mt-4 text-xs text-text-1">{a.pending} request{a.pending === 1 ? ' is' : 's are'} waiting for a decision in your verification inbox.</p>}
    </OrgSubPageShell>
  )
}
