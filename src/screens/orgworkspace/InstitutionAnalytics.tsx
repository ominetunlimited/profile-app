import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools, canAccessUniversityTools } from '@/app/accountTypes'
import { OrgSubPageShell, HubAccessDenied, SectorAccessDenied } from './OrgWorkspaceShell'
import { listSchemas, useSchemasVersion } from '@/app/schemaStore'

/** §23/§16 Institution Analytics — verification volume trends. Real counts
 * from this institution's own schema/queue state, never fabricated trend
 * lines (build doc §49.8). */
export function InstitutionAnalytics() {
  useSchemasVersion()
  const { account } = useAccount()
  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }
  // §34.2a — institution_excellence_dashboard is a university_or_school
  // module, not every institutional_hub org type's.
  if (!canAccessUniversityTools(account)) {
    return <SectorAccessDenied toolName="Institution Analytics" scopeDescription="universities, polytechnics, colleges, and schools" />
  }

  const schemas = listSchemas(account.officialEmail)
  const published = schemas.filter((s) => s.status === 'published')

  return (
    <OrgSubPageShell title="Analytics" back={{ to: '/institution/me', label: `${account.legalName} workspace` }}>
      {/* Design handoff gap audit: real stat labels tracked different
          metrics than PROFILE Institution Analytics.dc.html specifies —
          relabelled to match exactly. Values stay honest (0/—), unlike the
          mockup's illustrative populated example (312 confirmed, 3.4d avg,
          etc.) — no real verification pipeline flows through this build's
          schemas yet, and "published schemas" is this file's own real,
          additional metric the mockup doesn't show but is kept since it's
          real data, not a replacement for one of the four spec'd stats. */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Confirmed this month" value={0} />
        <Stat label="Avg. response time" value="—" />
        <Stat label="Rejection rate" value="—" />
        <Stat label="Total records confirmed" value={0} />
      </div>
      <p className="mb-6 text-xs text-text-2">{published.length} published schema{published.length === 1 ? '' : 's'} on this institution's account.</p>
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
        No verification volume yet — trends populate once bulk ingestion or individual verification requests
        start flowing through your published schemas.
      </div>
    </OrgSubPageShell>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <div className="mb-1 font-mono text-[10px] tracking-wide text-text-2">{label.toUpperCase()}</div>
      <div className="font-mono text-xl font-semibold text-text-0">{value}</div>
    </div>
  )
}
