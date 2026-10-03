import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan, type OrgAdminRoleV3 } from '@/app/accountTypes'
import { ACCESS_LABEL, endMembership, inviteStaffBulk, listStaffFor, MAX_STAFF, useOrgStaffVersion, type InviteResult } from '@/app/orgStaffStore'
import { useAccountsCacheVersion } from '@/app/demoAccountStore'

const ORG_ROLES: OrgAdminRoleV3[] = ['admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer']

/** Staff & roles, shared by every organisation workspace. Invitations are delivered in-app; roles are enforced by the database. */
export function StaffPanel() {
  const { account } = useAccount()
  useOrgStaffVersion()
  useAccountsCacheVersion()
  const org = account?.accountType === 'organisation' ? account : null
  const canAppoint = org ? orgRoleCan(org, 'appointRoles') : false
  const staff = org ? listStaffFor(org.officialEmail) : []
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState<OrgAdminRoleV3>(ORG_ROLES[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InviteResult | null>(null)

  if (!org) return null

  async function send() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const r = await inviteStaffBulk(emails, role)
      setResult(r)
      if (r.invited.length > 0) setEmails('')
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  async function remove(id: string) {
    setError(null)
    try {
      await endMembership(id)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-1">
        Up to {MAX_STAFF} staff members. The role you give someone is enforced by the database: it decides what they can open and decide for this organisation.
      </p>
      {!canAppoint ? (
        <div className="rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">Appointing staff roles requires the super admin or admin role — view only for yours.</div>
      ) : (
        <div className="mb-3.5 flex flex-wrap gap-2">
          <input
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Paste emails, comma-separated, to invite in bulk"
            aria-label="Emails to invite"
            className="min-h-[40px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as OrgAdminRoleV3)} aria-label="Role" className="min-h-[40px] rounded-lg border border-border-strong bg-surface px-2.5 text-sm">
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <button disabled={!emails.trim() || busy} onClick={() => void send()} className="rounded-lg bg-accent-solid px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {busy ? 'Sending…' : 'Send invites'}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mb-3 text-xs text-danger">
          {error}
        </p>
      )}
      {result && (
        <div role="status" className="mb-3 rounded-lg border border-border bg-surface-sunken px-3.5 py-2.5 text-xs text-text-0">
          {result.invited.length > 0 && (
            <p className="mb-1 font-medium text-success">
              {result.invited.length} invitation{result.invited.length === 1 ? '' : 's'} sent. {result.emailed ? 'Each person has been emailed, and people with a PROFILE account also see it under Workspaces.' : "Email delivery isn't set up on this platform yet, so nobody was emailed: people with a PROFILE account see it under Workspaces, and anyone without one sees it when they sign up with that email. Let them know directly."}
            </p>
          )}
          {result.skipped.length > 0 && <p className="text-text-1">Already on the roster or over the limit: {result.skipped.join(', ')}.</p>}
          {result.invalid.length > 0 && <p className="text-danger">Not valid email addresses: {result.invalid.join(', ')}.</p>}
        </div>
      )}
      {staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">No staff invited yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_90px_80px] bg-surface-sunken text-[11px] font-semibold tracking-wide text-text-2">
              <div className="px-3.5 py-2.5">STAFF</div>
              <div className="px-3.5 py-2.5">ROLE</div>
              <div className="px-3.5 py-2.5">ACCESS</div>
              <div className="px-3.5 py-2.5">STATUS</div>
              <div className="px-3.5 py-2.5" />
            </div>
            {staff.map((s) => (
              <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr_90px_80px] items-center border-t border-border bg-surface text-xs">
                <div className="truncate px-3.5 py-2.5 text-text-0">{s.staffEmail}</div>
                <div className="px-3.5 py-2.5 capitalize text-text-1">{s.role.replace(/_/g, ' ')}</div>
                <div className="px-3.5 py-2.5">
                  <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10.5px] font-medium text-text-1">{ACCESS_LABEL[s.role]}</span>
                </div>
                <div className="px-3.5 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${s.status === 'active' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>{s.status === 'active' ? 'Active' : 'Invited'}</span>
                </div>
                <div className="px-3.5 py-2.5">
                  {canAppoint && (
                    <button onClick={() => void remove(s.id)} aria-label={`Remove ${s.staffEmail}`} className="text-[11px] font-semibold text-danger">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
