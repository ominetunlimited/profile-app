import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { OrgSubPageShell } from './OrgWorkspaceShell'

const TABS = ['sso', 'api'] as const
const TAB_LABEL: Record<(typeof TABS)[number], string> = { sso: 'SSO & provisioning', api: 'API keys' }

/**
 * §16.7/§38.9/§38.18 Enterprise Integrations. SAML single sign-on, SCIM provisioning and API keys all need server-side
 * services PROFILE does not run yet, so this page says so plainly instead of offering buttons that do nothing or keys that
 * would not work. Staff sign in with their own PROFILE accounts and are managed under Staff & roles.
 */
export function EnterpriseIntegrations() {
  const { account } = useAccount()
  const [tab, setTab] = useState<(typeof TABS)[number]>('sso')

  return (
    <OrgSubPageShell title="Integrations" crumb={`${account?.legalName ?? 'Organisation'} · Enterprise workspace`}>
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
              <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">Not available yet</span>
            </div>
            <p className="text-sm text-text-1">
              Signing in through your own identity provider needs a SAML service PROFILE doesn't run yet. Until then, staff sign in with their own PROFILE accounts. Invite them under Staff &amp; roles, where each person gets a role the database enforces.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-1.5 font-semibold text-text-0">SCIM provisioning</div>
            <p className="text-sm text-text-1">
              Not available yet. Staff are added and removed by an administrator under Staff &amp; roles, and every change is written to the audit trail.
            </p>
          </div>
        </div>
      )}

      {tab === 'api' && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-1.5 font-semibold text-text-0">API keys</div>
          <p className="text-sm text-text-1">
            API access isn't open yet, so there are no keys to create. When it opens, keys will be shown once at creation, scoped to the narrowest permission needed (talent search read-only, verification write, or full workspace access), and revocable from here.
          </p>
        </div>
      )}
    </OrgSubPageShell>
  )
}
