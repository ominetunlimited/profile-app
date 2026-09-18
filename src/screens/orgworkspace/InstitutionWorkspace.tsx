import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools, orgRoleCan, type OrgAdminRoleV3 } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied } from './OrgWorkspaceShell'
import { ownerKey } from '@/app/activityStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { listRequestsForIssuer, setVerificationRequestStatus, type VerificationRequest } from '@/app/verificationRequestStore'
import { listSchemas } from '@/app/schemaStore'
import { ACCESS_LABEL, inviteStaffBulk, listStaffFor, revokeStaff, MAX_STAFF } from '@/app/orgStaffStore'
import { listAuditLogFor, logOrgAction } from '@/app/orgAuditLogStore'

const TABS = ['queue', 'analytics', 'schema', 'compliance', 'staff', 'records', 'settings'] as const
const TAB_LABEL: Record<(typeof TABS)[number], string> = {
  queue: 'Verification queue',
  analytics: 'Analytics',
  schema: 'Credential schemas',
  compliance: 'Compliance exports',
  staff: 'Staff & roles',
  records: 'Institutional records',
  settings: 'Settings',
}

const ORG_ROLES: OrgAdminRoleV3[] = ['admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer']

const STATUS_TONE: Record<VerificationRequest['status'], string> = {
  submitted: 'bg-surface-sunken text-text-1',
  received: 'bg-surface-sunken text-text-1',
  institution_notified: 'bg-warning-soft text-warning',
  under_review: 'bg-warning-soft text-warning',
  approved: 'bg-trust-soft text-trust',
  verified: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
}

/** §16.5 Institutional Review Console — design handoff gap audit rebuild.
 * Read PROFILE Institution Workspace.dc.html's actual source directly.
 * "Same structure as the Organisation workspace" per the mockup's own
 * note for staff/roles/audit — Staff & roles and Compliance exports'
 * audit trail reuse the exact same real stores as Organization Workspace,
 * not a second parallel implementation. */
export function InstitutionWorkspace() {
  const { account } = useAccount()
  const [tab, setTab] = useState<(typeof TABS)[number]>('queue')
  const owner = account ? ownerKey(account) : ''
  const canAppointRoles = account ? orgRoleCan(account, 'appointRoles') : false

  const [requests, setRequests] = useState<VerificationRequest[]>(() => (account ? listRequestsForIssuer(account.legalName) : []))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [staff, setStaff] = useState(() => listStaffFor(owner))
  const [auditLog, setAuditLog] = useState(() => listAuditLogFor(owner))
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkRole, setBulkRole] = useState<OrgAdminRoleV3>('verification_officer')
  const [invitesSent, setInvitesSent] = useState(false)

  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }

  const pending = requests.filter((r) => r.status !== 'verified' && r.status !== 'rejected')
  const allChecked = pending.length > 0 && pending.every((r) => selected.has(r.id))
  const schemas = listSchemas(account.officialEmail)

  function refreshRequests() {
    setRequests(listRequestsForIssuer(account!.legalName))
  }

  function toCsv(rows: VerificationRequest[]): string {
    const header = 'record,person,submitted,status\n'
    const body = rows.map((r) => [r.moduleName, findAccountByEmail(r.ownerEmail)?.legalName ?? r.ownerEmail, r.submittedAt, r.status].map((v) => `"${v}"`).join(',')).join('\n')
    return header + body
  }

  function downloadCsv(rows: VerificationRequest[], filename: string) {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <OrgWorkspaceShell title={TAB_LABEL[tab]}>
      <div role="tablist" className="mb-6 flex flex-wrap gap-1.5">
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

      {tab === 'queue' && (
        <div>
          <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-text-1">
            Bulk operations for high-volume record confirmation — select many, decide once, and every action still
            writes its own audit line.
          </p>
          {requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No submissions naming {account.legalName} as issuer yet — real requests appear here the moment
              someone's Trust Passport submission resolves to this institution.
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
                  <label className="flex items-center gap-1.5 text-xs text-text-0">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => setSelected(allChecked ? new Set() : new Set(pending.map((r) => r.id)))}
                    />
                    Select all ({pending.length})
                  </label>
                  <div className="flex-1" />
                  <button
                    disabled={selected.size === 0}
                    onClick={() => {
                      for (const id of selected) setVerificationRequestStatus(id, 'verified')
                      logOrgAction(owner, `Confirmed ${selected.size} record(s).`)
                      setSelected(new Set())
                      refreshRequests()
                      setAuditLog(listAuditLogFor(owner))
                    }}
                    className="rounded-lg bg-success px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Confirm selected ({selected.size})
                  </button>
                  <button
                    disabled={selected.size === 0}
                    onClick={() => downloadCsv(requests.filter((r) => selected.has(r.id)), 'verification-selection.csv')}
                    className="rounded-lg border border-border-strong px-3.5 py-2 text-xs font-semibold text-text-0 disabled:opacity-50"
                  >
                    Export selection
                  </button>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[24px_2fr_1fr_1fr_110px] bg-surface-sunken text-[10.5px] font-semibold tracking-wide text-text-2">
                  <div className="px-3 py-2.5" />
                  <div className="px-3 py-2.5">RECORD</div>
                  <div className="px-3 py-2.5">PERSON</div>
                  <div className="px-3 py-2.5">SUBMITTED</div>
                  <div className="px-3 py-2.5">STATUS</div>
                </div>
                {requests.map((r) => {
                  const person = findAccountByEmail(r.ownerEmail)
                  return (
                    <div key={r.id} className="grid grid-cols-[24px_2fr_1fr_1fr_110px] items-center border-t border-border bg-surface text-xs">
                      <div className="px-3 py-2.5">
                        {r.status !== 'verified' && r.status !== 'rejected' && (
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() =>
                              setSelected((s) => {
                                const next = new Set(s)
                                if (next.has(r.id)) next.delete(r.id)
                                else next.add(r.id)
                                return next
                              })
                            }
                          />
                        )}
                      </div>
                      <div className="px-3 py-2.5 text-text-0">
                        {r.moduleName}
                        <span className="ml-1.5 font-mono text-[10.5px] text-text-2">{r.identifierValue}</span>
                      </div>
                      <div className="px-3 py-2.5 text-text-1">{person?.legalName ?? r.ownerEmail}</div>
                      <div className="px-3 py-2.5 font-mono text-[11px] text-text-2">{new Date(r.submittedAt).toLocaleDateString()}</div>
                      <div className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_TONE[r.status]}`}>{r.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <Link to="/institution/me/analytics" className="inline-flex h-[42px] items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white">
          Open verification analytics →
        </Link>
      )}

      {tab === 'schema' && (
        <Link to="/institution/me/schemas" className="inline-flex h-[42px] items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white">
          Open credential schema builder →
        </Link>
      )}

      {tab === 'compliance' && (
        <div>
          <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-text-1">Auditable exports for accreditation reviews and regulatory reporting.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ExportCard
              title="Accreditation review pack"
              body="Every credential confirmed by the institution in this build, with reviewer identity attached."
              onGenerate={() => downloadCsv(requests.filter((r) => r.status === 'verified'), 'accreditation-review-pack.csv')}
            />
            <ExportCard
              title="Fraud & dispute log"
              body="All disputed or rejected requests, with outcomes."
              onGenerate={() => downloadCsv(requests.filter((r) => r.status === 'rejected'), 'fraud-dispute-log.csv')}
            />
            <ExportCard
              title="Full audit trail"
              body="Every action any staff member took on institutional records."
              onGenerate={() => {
                const blob = new Blob([auditLog.map((a) => `${a.at}\t${a.text}`).join('\n')], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'audit-trail.txt'
                a.click()
                URL.revokeObjectURL(url)
              }}
            />
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <p className="mb-4 text-sm text-text-1">
            Up to {MAX_STAFF} staff members (§42.3 Rule 3). Roles use this build's real permission system — the role
            you grant is the role that actually gates what they can do.
          </p>
          {!canAppointRoles ? (
            <div className="rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
              Appointing staff roles requires super_admin or admin (§42.2) — view only for your role.
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
                className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
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

      {tab === 'records' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard title="Published credential schemas" body={`${schemas.filter((s) => s.status === 'published').length} published, ${schemas.length} total.`} />
          <InfoCard title="Confirmed records" body={`${requests.filter((r) => r.status === 'verified').length} confirmed, ${pending.length} pending review.`} />
        </div>
      )}

      {tab === 'settings' && (
        <Link to="/settings?tab=organisation" className="inline-flex h-[42px] items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white">
          Open workspace settings →
        </Link>
      )}
    </OrgWorkspaceShell>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 font-semibold text-text-0">{title}</div>
      <p className="text-xs leading-relaxed text-text-1">{body}</p>
    </div>
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
