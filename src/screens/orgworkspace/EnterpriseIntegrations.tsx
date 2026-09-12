import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan } from '@/app/accountTypes'
import { OrgWorkspaceShell } from './OrgWorkspaceShell'
import { Button } from '@/shared/ui/Button'

/** §16.7/§38.9/§38.18 Enterprise Integrations — SSO config, API keys. Real UI;
 * a "generated" key is clearly labeled demo-only, never presented as a
 * working credential no backend actually issued. */
export function EnterpriseIntegrations() {
  const { account } = useAccount()
  const [keys, setKeys] = useState<string[]>([])
  const canEdit = account ? orgRoleCan(account, 'editOrgProfile') : false

  return (
    <OrgWorkspaceShell title="Enterprise Integrations">
      {!canEdit && (
        <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
          Managing SSO and API keys requires super_admin or admin (§42.2) — view only for your role.
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 font-semibold text-text-0">Single Sign-On</div>
        <p className="mb-3 text-sm text-text-1">Not configured. Identity federation (§38.18) requires backend SAML/OIDC support not yet built.</p>
        <Button variant="secondary" disabled={!canEdit}>
          Configure SSO
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-text-0">API keys</span>
          <Button
            disabled={!canEdit}
            onClick={() => setKeys((k) => [...k, `pk_demo_${crypto.randomUUID().slice(0, 12)}`])}
          >
            Generate key
          </Button>
        </div>
        {keys.length === 0 ? (
          <p className="text-sm text-text-1">No API keys yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {keys.map((k) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-warning bg-surface-sunken p-2.5 font-mono text-xs">
                <span className="text-text-0">{k}</span>
                <span className="text-warning">demo only — not a working credential</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-text-2">
          Real key issuance requires the VXI API backend (§16.7) — these are placeholders to exercise the UI, never
          presented as functioning credentials.
        </p>
      </div>
    </OrgWorkspaceShell>
  )
}
