import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { canAccessGovernmentConsole, sectorForOrgType, orgRoleCan, type OrgAdminRoleV3 } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied, type OrgNavItem } from './OrgWorkspaceShell'
import { ownerKey } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { listRequestsForIssuerEmail, setVerificationRequestStatus, useVerificationVersion, type VerificationRequest } from '@/app/verificationRequestStore'
import { ACCESS_LABEL, inviteStaffBulk, listStaffFor, revokeStaff, MAX_STAFF } from '@/app/orgStaffStore'
import { listAuditLogFor, logOrgAction } from '@/app/orgAuditLogStore'

/** Analytics is a real separate route in this build — see the identical
 * note in InstitutionWorkspace.tsx. */
const TABS = ['licences', 'compliance', 'staff', 'audit', 'settings'] as const
const TAB_LABEL: Record<(typeof TABS)[number], string> = {
  licences: 'Licence confirmations',
  compliance: 'Compliance exports',
  staff: 'Staff & roles',
  audit: 'Audit trail',
  settings: 'Settings',
}

const ORG_ROLES: OrgAdminRoleV3[] = ['admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer']

function statusDisplay(status: VerificationRequest['status']): { label: string; bg: string; ink: string } {
  if (status === 'verified') return { label: 'Confirmed', bg: 'bg-success-soft', ink: 'text-success' }
  if (status === 'rejected') return { label: 'Rejected', bg: 'bg-danger-soft', ink: 'text-danger' }
  return { label: 'Pending confirmation', bg: 'bg-warning-soft', ink: 'text-warning' }
}

/** §16.5/§23 Government Console — design handoff gap audit rebuild. Read
 * PROFILE Government Workspace.dc.html directly: 6 nav sections (this build
 * previously had only 2 — Console/Analytics), a card-list "Licence
 * confirmations" view (not Institution's bulk checkbox table — the mockup
 * deliberately uses a different, single-action-per-card layout here), and
 * Staff/Audit reusing "the same pattern as the Organisation and Institution
 * workspaces" per the mockup's own note.
 *
 * Flagged substitution: the mockup's fixture licences carry fabricated
 * issued/expires years and an "Expired — renewal pending" status. This
 * build's real VerificationRequest has no expiry field at all (no credential
 * in this system tracks an expiry date yet), so that status and those dates
 * are never reproduced — real cards show only what's real: module,
 * identifier, holder, submission date, and actual status. "Licence
 * confirmations" scope is restricted to moduleKey 'professional_licence',
 * matching the gold banner's own "authorised licence category" wording. */
export function GovernmentWorkspace() {
  const { account } = useAccount()
  // §34.2a — "Licence confirmations"/"Compliance exports" only ever operate
  // on moduleKey 'professional_licence', which is regulatory_body sector's
  // module (Regulatory Authority/Licensing Board/Professional Council), not
  // government_agency's (Government Ministry/Agency — whose own modules,
  // country_adapter_tools/iotr/regulatory_licensing_workflows, have no
  // screen built yet in this release). A government_agency account defaults
  // to 'staff', the first tab real for every regulatory_console member.
  const isLicenceSector = !!account && account.accountType === 'organisation' && sectorForOrgType(account.orgType) === 'regulatory_body'
  const [tab, setTab] = useState<(typeof TABS)[number]>(isLicenceSector ? 'licences' : 'staff')
  const owner = account ? ownerKey(account) : ''
  const canAppointRoles = account ? orgRoleCan(account, 'appointRoles') : false

  useVerificationVersion()
  const requests = account?.accountType === 'organisation' ? listRequestsForIssuerEmail(account.officialEmail).filter((r) => r.moduleKey === 'professional_licence') : []
  const [actionError, setActionError] = useState<string | null>(null)
  const [staff, setStaff] = useState(() => listStaffFor(owner))
  const [auditLog, setAuditLog] = useState(() => listAuditLogFor(owner))
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkRole, setBulkRole] = useState<OrgAdminRoleV3>('verification_officer')
  const [invitesSent, setInvitesSent] = useState(false)

  if (!account || !canAccessGovernmentConsole(account)) {
    return <HubAccessDenied requiredHub="regulatory_console" />
  }

  function toCsv(rows: VerificationRequest[]): string {
    const header = 'record,person,submitted,status\n'
    const body = rows
      .map((r) => [r.moduleName, findAccountByEmail(r.ownerEmail)?.legalName ?? r.ownerEmail, r.submittedAt, r.status].map((v) => `"${v}"`).join(','))
      .join('\n')
    return header + body
  }

  function downloadBlob(content: string, type: string, filename: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const navItems: OrgNavItem[] = [
    ...(isLicenceSector
      ? [
          { key: 'licences', label: TAB_LABEL.licences, active: tab === 'licences', onSelect: () => setTab('licences') },
          { key: 'analytics', label: 'Analytics', active: false, to: '/government/me/analytics' },
          { key: 'compliance', label: TAB_LABEL.compliance, active: tab === 'compliance', onSelect: () => setTab('compliance') },
        ]
      : []),
    { key: 'staff', label: TAB_LABEL.staff, active: tab === 'staff', onSelect: () => setTab('staff') },
    { key: 'audit', label: TAB_LABEL.audit, active: tab === 'audit', onSelect: () => setTab('audit') },
    { key: 'settings', label: TAB_LABEL.settings, active: tab === 'settings', onSelect: () => setTab('settings') },
  ]

  return (
    <OrgWorkspaceShell title={TAB_LABEL[tab]} navItems={navItems}>
      {isLicenceSector ? (
        <div className="mb-6 flex gap-2 rounded-lg border border-gold bg-gold-soft p-3 text-sm text-text-0">
          <span className="flex-none font-semibold text-gold">ⓘ</span>
          <p>
            Regulatory scope only. This workspace never accesses individual accounts directly — every action here
            operates on records already submitted for confirmation within your authorised licence category.
          </p>
        </div>
      ) : (
        <div className="mb-6 flex gap-2 rounded-lg border border-border-strong bg-surface-sunken p-3 text-sm text-text-1">
          <span className="flex-none font-semibold text-text-2">ⓘ</span>
          <p>
            Licence confirmations, Compliance exports, and Analytics are scoped to regulatory authorities, licensing
            boards, and professional councils. {account.legalName}'s own sector modules — country adapter
            tools, IOTR, and regulatory licensing workflows — aren't built yet in this release. Staff, audit, and
            settings below are available now.
          </p>
        </div>
      )}

      {tab === 'licences' &&
        (requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No professional-licence submissions naming {account.legalName} as issuer yet — real requests appear here
            the moment someone's Trust Passport submission resolves to this authority.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {actionError && (
              <p role="alert" className="text-xs text-danger">
                {actionError}
              </p>
            )}
            {requests.map((r) => {
              const person = findAccountByEmail(r.ownerEmail)
              const s = statusDisplay(r.status)
              const actionable = r.status !== 'verified' && r.status !== 'rejected'
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
                  <div className="min-w-[200px] flex-1">
                    <span className="block text-sm font-semibold text-text-0">
                      {r.moduleName} <span className="font-mono text-xs font-normal text-text-2">{r.identifierValue}</span>
                    </span>
                    <span className="block text-[11.5px] text-text-1">
                      {person?.legalName ?? r.ownerEmail} · submitted {new Date(r.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.ink}`}>{s.label}</span>
                  {actionable && (
                    <button
                      onClick={async () => {
                        setActionError(null)
                        try {
                          await setVerificationRequestStatus(r.id, 'verified')
                          logOrgAction(owner, `Confirmed licence for ${person?.legalName ?? r.ownerEmail} (${r.moduleName}).`)
                          setAuditLog(listAuditLogFor(owner))
                        } catch (e) {
                          setActionError((e as Error).message)
                        }
                      }}
                      className="h-[34px] rounded-lg bg-accent-solid px-3.5 text-xs font-semibold text-white"
                    >
                      Confirm licence
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}

      {tab === 'compliance' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ExportCard
            title="Licensed engineers registry"
            body="Full list of confirmed licences within this ministry's authority, exportable for public registry publication."
            onGenerate={() => downloadBlob(toCsv(requests.filter((r) => r.status === 'verified')), 'text/csv', 'licensed-registry.csv')}
          />
          <ExportCard
            title="Rejected licences"
            body="For cross-agency compliance checks. This build has no expiry tracking yet, so only rejected requests are included here."
            onGenerate={() => downloadBlob(toCsv(requests.filter((r) => r.status === 'rejected')), 'text/csv', 'rejected-licences.csv')}
          />
          <ExportCard
            title="Regulatory audit trail"
            body="Every confirmation, rejection and revocation, with the officer responsible."
            onGenerate={() => downloadBlob(auditLog.map((a) => `${a.at}\t${a.text}`).join('\n'), 'text/plain', 'regulatory-audit-trail.txt')}
          />
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <p className="mb-4 text-sm text-text-1">
            Up to {MAX_STAFF} staff members. Roles use this build's real permission system — the role
            you grant is the role that actually gates what they can do.
          </p>
          {!canAppointRoles ? (
            <div className="rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
              Appointing staff roles requires super_admin or admin — view only for your role.
            </div>
          ) : (
            <div className="mb-3.5 flex flex-wrap gap-2">
              <input
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="Paste emails, comma-separated, to invite in bulk"
                className="min-h-[40px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
              />
              <select value={bulkRole} onChange={(e) => setBulkRole(e.target.value as OrgAdminRoleV3)} className="min-h-[40px] rounded-lg border border-border-strong bg-surface px-2.5 text-sm">
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <button
                disabled={!bulkEmails.trim()}
                onClick={() => {
                  const created = inviteStaffBulk(owner, account.legalName, bulkEmails, bulkRole)
                  if (created.length > 0) logOrgAction(owner, `Invited ${created.map((c) => c.staffEmail).join(', ')} as ${bulkRole.replace(/_/g, ' ')}.`)
                  setBulkEmails('')
                  setStaff(listStaffFor(owner))
                  setAuditLog(listAuditLogFor(owner))
                  setInvitesSent(true)
                }}
                className="rounded-lg bg-accent-solid px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Send invites
              </button>
            </div>
          )}
          {invitesSent && (
            <div className="mb-3 rounded-lg border border-success bg-success-soft px-3.5 py-2 text-xs font-medium text-success">
              Invites sent — pending acceptance shown below.
            </div>
          )}
          {staff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">No staff invited yet.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[2fr_1fr_1fr_80px] bg-surface-sunken text-[11px] font-semibold tracking-wide text-text-2">
                <div className="px-3.5 py-2.5">STAFF</div>
                <div className="px-3.5 py-2.5">ROLE</div>
                <div className="px-3.5 py-2.5">ACCESS</div>
                <div className="px-3.5 py-2.5" />
              </div>
              {staff.map((s) => (
                <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr_80px] items-center border-t border-border bg-surface text-xs">
                  <div className="px-3.5 py-2.5 text-text-0">{s.staffEmail}</div>
                  <div className="px-3.5 py-2.5 capitalize text-text-1">{s.role.replace(/_/g, ' ')}</div>
                  <div className="px-3.5 py-2.5">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent">{s.status === 'invited' ? 'Pending acceptance' : ACCESS_LABEL[s.role]}</span>
                  </div>
                  <div className="px-3.5 py-2.5">
                    {canAppointRoles && (
                      <button
                        onClick={() => {
                          revokeStaff(s.id)
                          logOrgAction(owner, `Removed ${s.staffEmail} (${s.role.replace(/_/g, ' ')}).`)
                          setStaff(listStaffFor(owner))
                          setAuditLog(listAuditLogFor(owner))
                        }}
                        className="text-[11px] font-semibold text-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'audit' &&
        (auditLog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">No actions recorded yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {auditLog.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-surface p-3 text-xs">
                <span className="mr-2 font-mono text-text-2">{new Date(a.at).toLocaleString()}</span>
                <span className="text-text-0">{a.text}</span>
              </div>
            ))}
          </div>
        ))}

      {tab === 'settings' && (
        <Link to="/settings?tab=organisation" className="inline-flex h-[42px] items-center rounded-lg bg-accent-solid px-4 text-sm font-semibold text-white">
          Open workspace settings →
        </Link>
      )}
    </OrgWorkspaceShell>
  )
}

function ExportCard({ title, body, onGenerate }: { title: string; body: string; onGenerate: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 text-[13px] font-semibold text-text-0">{title}</div>
      <p className="mb-2.5 text-[11.5px] leading-relaxed text-text-1">{body}</p>
      <button onClick={onGenerate} className="rounded-lg border border-border-strong bg-surface-sunken px-3 py-1.5 text-[11.5px] font-semibold text-text-0">
        Generate export
      </button>
    </div>
  )
}
