import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { listAllOrganisations, setOrganisationRegistryLevel } from '@/app/demoAccountStore'
import { ORG_TRUST_STATUS_LABEL, hubForOrgType } from '@/app/accountTypes'

/**
 * §16, §26 — PROFILE-staff review of workspace claim requests (§50.4
 * OrgClaimRequest), distinct from an institution's own internal verification
 * console (§16.5, InstitutionWorkspace) — this is PROFILE reviewing
 * *organisations*, not an institution reviewing individuals' credentials.
 * Lists every real organisation account registered in this browser (via the
 * signup wizard) that isn't yet 'verified' — never fabricated queue entries.
 */
export function VerificationReview() {
  const [orgs, setOrgs] = useState(() => listAllOrganisations())
  const pending = orgs.filter((o) => o.registryLevel !== 'verified' && o.registryLevel !== 'rejected')

  function decide(email: string, level: 'verified' | 'rejected') {
    setOrganisationRegistryLevel(email, level)
    setOrgs(listAllOrganisations())
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-text-0">Verification Review</h1>
        <p className="mb-6 text-sm text-text-1">PROFILE-staff review of organisation workspace claim requests (§50.4 IOTR).</p>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No pending organisation claims. Sign up an organisation account (via /auth?mode=signup) on this browser
            to see a real entry here.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((org) => (
              <div key={org.officialEmail} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-text-0">{org.legalName}</div>
                    <div className="text-xs text-text-1">
                      {org.orgType} → {hubForOrgType(org.orgType)} · {org.officialEmail}
                    </div>
                  </div>
                  <span className="rounded-full border border-warning px-2 py-0.5 text-[10.5px] font-semibold text-warning">
                    {ORG_TRUST_STATUS_LABEL[org.registryLevel]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide(org.officialEmail, 'verified')} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">
                    Approve → verified
                  </button>
                  <button onClick={() => decide(org.officialEmail, 'rejected')} className="rounded-lg border border-danger px-3 py-1.5 text-xs font-semibold text-danger">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
