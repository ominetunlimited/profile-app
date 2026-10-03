import { useAccount } from '@/app/AccountContext'
import { canAccessGovernmentConsole, canAccessLicenceConfirmationTools } from '@/app/accountTypes'
import { OrgSubPageShell, HubAccessDenied, SectorAccessDenied } from './OrgWorkspaceShell'
import { listRequestsForIssuerEmail, useVerificationVersion } from '@/app/verificationRequestStore'
import { computeIssuerAnalytics, formatDays } from '@/app/orgAnalytics'
import { ListCard, MonthChart, StatCard } from './AnalyticsParts'

/** §23/§16 Government Analytics — licence confirmation trends, computed from the professional-licence requests addressed to this authority.
 * The mockup's "expired, renewal pending" figure needs expiry dates, which no credential on PROFILE records yet, so this shows the
 * licences still awaiting confirmation instead. */
export function GovernmentAnalytics() {
  useVerificationVersion()
  const { account } = useAccount()
  if (!account || !canAccessGovernmentConsole(account)) {
    return <HubAccessDenied requiredHub="regulatory_console" />
  }
  if (!canAccessLicenceConfirmationTools(account)) {
    return <SectorAccessDenied toolName="Government Analytics" scopeDescription="regulatory authorities, licensing boards, and professional councils" />
  }

  const a = computeIssuerAnalytics(listRequestsForIssuerEmail(account.officialEmail).filter((r) => r.moduleKey === 'professional_licence'))

  return (
    <OrgSubPageShell title="Licence confirmation analytics" back={{ to: '/government/me', label: `${account.legalName} workspace` }}>
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        <StatCard label="Confirmed this month" value={a.confirmedThisMonth} />
        <StatCard label="Avg. response time" value={formatDays(a.avgResponseDays)} />
        <StatCard label="Awaiting confirmation" value={a.pending} />
        <StatCard label="Total licences confirmed" value={a.totalConfirmed.toLocaleString()} />
      </div>
      <MonthChart title="Confirmations by month" months={a.months} barClass="bg-accent-solid" />
      <ListCard title="By licence category" rows={a.byType} empty="No licences confirmed yet." suffix=" confirmed" />
    </OrgSubPageShell>
  )
}
