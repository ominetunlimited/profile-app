import { useAccount } from '@/app/AccountContext'
import { canAccessGovernmentConsole } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied } from './OrgWorkspaceShell'

/** §23/§16 Government Analytics — licence confirmation trends. Honest
 * zero-state, same principle as Institution Analytics. */
export function GovernmentAnalytics() {
  const { account } = useAccount()
  if (!account || !canAccessGovernmentConsole(account)) {
    return <HubAccessDenied requiredHub="regulatory_console" />
  }

  return (
    <OrgWorkspaceShell title="Government Analytics">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Licences confirmed" value={0} />
        <Stat label="Institutions accredited" value={0} />
        <Stat label="Audit reports filed" value={0} />
        <Stat label="This month" value={0} />
      </div>
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
        No licence confirmation activity yet.
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
