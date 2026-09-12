import { useAccount } from '@/app/AccountContext'
import { canAccessGovernmentConsole } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied } from './OrgWorkspaceShell'

/** §10.5 GOVERNMENT_CONSOLE_FEATURES, verbatim — one-directional: never for
 * individual, business_hub, or community_hub, regardless of trust score or
 * plan tier (build doc §3.3). */
const FEATURES = [
  { title: 'National credential validation', body: 'Confirm licences and credentials issued or recognised at national level.' },
  { title: 'Regulatory verification', body: 'Verify professional licence and regulatory-body affiliation claims.' },
  { title: 'Institutional accreditation', body: 'Accredit or de-accredit institutions within this jurisdiction.' },
  { title: 'Audit reports', body: 'Compliance reporting across every verification this console has issued.' },
  { title: 'Trust network oversight', body: 'Oversight of the verification network this console participates in.' },
]

export function GovernmentWorkspace() {
  const { account } = useAccount()

  if (!account || !canAccessGovernmentConsole(account)) {
    return <HubAccessDenied requiredHub="regulatory_console" />
  }

  return (
    <OrgWorkspaceShell title="Government Console">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-1.5 font-semibold text-text-0">{f.title}</div>
            <p className="mb-3 text-xs leading-relaxed text-text-1">{f.body}</p>
            <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken p-3 text-center text-xs text-text-1">
              No records yet.
            </div>
          </div>
        ))}
      </div>
    </OrgWorkspaceShell>
  )
}
