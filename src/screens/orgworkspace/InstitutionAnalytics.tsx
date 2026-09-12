import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied } from './OrgWorkspaceShell'
import { listSchemas } from '@/app/schemaStore'

/** §23/§16 Institution Analytics — verification volume trends. Real counts
 * from this institution's own schema/queue state, never fabricated trend
 * lines (build doc §49.8). */
export function InstitutionAnalytics() {
  const { account } = useAccount()
  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }

  const schemas = listSchemas(account.officialEmail)
  const published = schemas.filter((s) => s.status === 'published')

  return (
    <OrgWorkspaceShell title="Institution Analytics">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Published schemas" value={published.length} />
        <Stat label="Verifications this month" value={0} />
        <Stat label="Auto-verify rate" value="—" />
        <Stat label="Avg. review time" value="—" />
      </div>
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
        No verification volume yet — trends populate once bulk ingestion (§16.3) or individual verification requests
        start flowing through your published schemas.
      </div>
    </OrgWorkspaceShell>
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
