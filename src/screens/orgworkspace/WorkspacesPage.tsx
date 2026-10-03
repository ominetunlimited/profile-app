import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { ACCESS_LABEL, listMyInvitations, listMyMemberships, respondToInvitation, endMembership, useOrgStaffVersion } from '@/app/orgStaffStore'
import { findAccountByEmail, useAccountsCacheVersion } from '@/app/demoAccountStore'

/** Workspaces you have been invited to, and the ones you work in. */
export function WorkspacesPage() {
  const { account } = useAccount()
  const me = ownerKey(account)
  useOrgStaffVersion()
  useAccountsCacheVersion()
  const invitations = me ? listMyInvitations(me) : []
  const memberships = me ? listMyMemberships(me) : []
  const [error, setError] = useState<string | null>(null)
  const orgName = (email: string) => findAccountByEmail(email)?.legalName ?? email

  async function respond(id: string, accept: boolean) {
    setError(null)
    try {
      await respondToInvitation(id, accept)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  async function leave(id: string) {
    setError(null)
    try {
      await endMembership(id)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const canVerify = (role: string) => ['admin', 'verification_officer', 'credential_manager', 'compliance_officer'].includes(role)

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 pb-16 pt-8 sm:px-6">
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Workspaces</h1>
        <p className="mb-6 text-sm text-text-1">Organisations that have invited you to help run their workspace, and the ones you already work in.</p>
        {error && (
          <p role="alert" className="mb-4 text-xs text-danger">
            {error}
          </p>
        )}

        <section className="mb-8" aria-labelledby="invites">
          <h2 id="invites" className="mb-3 text-[13px] font-semibold text-text-0">Invitations</h2>
          {invitations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">No invitations waiting.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {invitations.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft p-4">
                  <div className="min-w-[200px] flex-1">
                    <div className="text-sm font-semibold text-text-0">{orgName(i.orgEmail)}</div>
                    <div className="text-xs text-text-1">
                      invited you as <span className="font-medium capitalize">{i.role.replace(/_/g, ' ')}</span> · {ACCESS_LABEL[i.role]}
                    </div>
                  </div>
                  <button onClick={() => void respond(i.id, true)} className="h-9 rounded-lg bg-accent-solid px-3.5 text-xs font-semibold text-white">
                    Accept
                  </button>
                  <button onClick={() => void respond(i.id, false)} className="h-9 rounded-lg border border-border-strong bg-surface px-3.5 text-xs font-semibold text-text-0">
                    Decline
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="mine">
          <h2 id="mine" className="mb-3 text-[13px] font-semibold text-text-0">Your workspaces</h2>
          {memberships.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">You don't work in any organisation workspace yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {memberships.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
                  <div className="min-w-[200px] flex-1">
                    <div className="text-sm font-semibold text-text-0">{orgName(m.orgEmail)}</div>
                    <div className="text-xs text-text-1">
                      <span className="capitalize">{m.role.replace(/_/g, ' ')}</span> · {ACCESS_LABEL[m.role]}
                    </div>
                  </div>
                  {canVerify(m.role) && (
                    <Link to={`/verification-inbox?org=${encodeURIComponent(m.orgEmail)}`} className="rounded-lg bg-accent-solid px-3 py-2 text-xs font-semibold text-white no-underline">
                      Verification inbox
                    </Link>
                  )}
                  <button onClick={() => void leave(m.id)} className="text-xs font-semibold text-danger">
                    Leave
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
