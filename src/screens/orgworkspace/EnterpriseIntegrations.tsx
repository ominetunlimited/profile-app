import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan } from '@/app/accountTypes'
import { OrgSubPageShell } from './OrgWorkspaceShell'
import { Button } from '@/shared/ui/Button'

const TABS = ['sso', 'api'] as const
const TAB_LABEL: Record<(typeof TABS)[number], string> = { sso: 'SSO & provisioning', api: 'API keys' }

interface ApiKey {
  masked: string
  createdAt: string
}

/**
 * §16.7/§38.9/§38.18 Enterprise Integrations — SSO config, API keys.
 * Design handoff gap audit: rebuilt to match PROFILE Enterprise
 * Integrations.dc.html's exact structure (two-tab switcher, a SAML SSO
 * card, a separate SCIM provisioning card, an API-keys table with
 * SCOPE/LAST USED columns and a per-key Revoke button) — the mockup only
 * shows the SSO card's CONNECTED state (a fake "Okta"/Entity ID/ACS URL
 * example); this build has no real SAML/OIDC backend (§38.18), so that
 * state is not reproduced here — showing "Connected" with fabricated
 * provider details would be a real dishonesty, the same class of thing
 * this build refuses everywhere else (Trust Score, verification, AI,
 * payments). The SCIM card's own mockup copy is already an honest
 * "not yet configured" state, so it's used verbatim.
 */
export function EnterpriseIntegrations() {
  const { account } = useAccount()
  const [tab, setTab] = useState<(typeof TABS)[number]>('sso')
  const [keys, setKeys] = useState<ApiKey[]>([])
  const canEdit = account ? orgRoleCan(account, 'editOrgProfile') : false

  return (
    <OrgSubPageShell title="Integrations" crumb={`${account?.legalName ?? 'Organisation'} · Enterprise workspace`}>
      {!canEdit && (
        <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
          Managing SSO and API keys requires super_admin or admin — view only for your role.
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold ${tab === t ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'sso' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-semibold text-text-0">SAML SSO</span>
              <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">Not connected</span>
            </div>
            <p className="mb-3.5 text-sm text-text-1">
              Identity federation requires backend SAML/OIDC support this build doesn't have yet — staff
              sign in with their own PROFILE credentials until it does.
            </p>
            <Button variant="secondary" disabled={!canEdit}>
              Configure SSO
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-1.5 font-semibold text-text-0">SCIM provisioning</div>
            <p className="text-sm text-text-1">
              Not yet configured. Enabling SCIM lets staff accounts be created and deactivated automatically from
              your identity provider.
            </p>
            <Button className="mt-3" disabled={!canEdit}>
              Set up SCIM
            </Button>
          </div>
        </div>
      )}

      {tab === 'api' && (
        <div>
          {keys.length > 0 && (
            <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_1fr_90px] bg-surface-sunken text-[10.5px] font-semibold tracking-wide text-text-2">
                <div className="px-3.5 py-2.5">KEY</div>
                <div className="px-3.5 py-2.5">SCOPE</div>
                <div className="px-3.5 py-2.5">LAST USED</div>
                <div className="px-3.5 py-2.5" />
              </div>
              {keys.map((k) => (
                <div key={k.masked} className="grid grid-cols-[2fr_1fr_1fr_90px] items-center border-t border-border text-xs">
                  <div className="px-3.5 py-2.5 font-mono text-text-0">{k.masked}</div>
                  <div className="px-3.5 py-2.5 text-text-1">Full access</div>
                  <div className="px-3.5 py-2.5 text-text-2">Never used</div>
                  <div className="px-3.5 py-2.5">
                    <button
                      disabled={!canEdit}
                      onClick={() => setKeys((all) => all.filter((existing) => existing.masked !== k.masked))}
                      className="rounded-lg border border-danger bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            disabled={!canEdit}
            onClick={() => setKeys((k) => [...k, { masked: `pk_demo_${crypto.randomUUID().slice(0, 12)}`, createdAt: new Date().toISOString() }])}
            className="mb-4"
          >
            Generate new key
          </Button>
          <p className="text-xs leading-relaxed text-text-1">
            Keys are shown once at creation and never displayed again. Scope each key to the narrowest permission it
            needs — talent search read-only, verification write, or full workspace access.
          </p>
          <p className="mt-2 text-xs text-text-2">
            Real key issuance requires the VXI API backend — these are placeholders to exercise the UI, never
            presented as functioning credentials.
          </p>
        </div>
      )}
    </OrgSubPageShell>
  )
}
