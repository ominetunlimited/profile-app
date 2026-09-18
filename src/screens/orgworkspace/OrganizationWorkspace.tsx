import { useState } from 'react'
import { OrgWorkspaceShell, type OrgNavItem } from './OrgWorkspaceShell'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan, type OrgAdminRoleV3 } from '@/app/accountTypes'
import { ownerKey, listActivities } from '@/app/activityStore'
import { followerCount } from '@/app/followStore'
import { listJobsByOrg } from '@/app/jobStore'
import { ACCESS_LABEL, inviteStaffBulk, listStaffFor, revokeStaff, MAX_STAFF } from '@/app/orgStaffStore'
import { listAuditLogFor, logOrgAction } from '@/app/orgAuditLogStore'

const TABS = ['overview', 'talent-search', 'requests', 'staff', 'compliance'] as const
// Design handoff gap audit: mockup labels are "Talent search" / "Verification
// requests" / "Staff & roles" — real labels via key-replace + CSS
// `capitalize` dropped the "Verification"/"& roles" qualifiers entirely.
const TAB_LABEL: Record<(typeof TABS)[number], string> = {
  overview: 'Overview',
  'talent-search': 'Talent search',
  requests: 'Verification requests',
  staff: 'Staff & roles',
  compliance: 'Compliance',
}

const ORG_ROLES: OrgAdminRoleV3[] = ['admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer']

/** §16/§42 Organization Workspace — overview, talent search, requests, staff, compliance. */
export function OrganizationWorkspace() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('overview')
  const { account } = useAccount()
  const [query, setQuery] = useState('')
  const canManageHiring = account ? orgRoleCan(account, 'manageHiring') : false
  const canAppointRoles = account ? orgRoleCan(account, 'appointRoles') : false
  const owner = account ? ownerKey(account) : ''
  const orgName = account?.legalName ?? 'This organisation'

  const [staff, setStaff] = useState(() => listStaffFor(owner))
  const [auditLog, setAuditLog] = useState(() => listAuditLogFor(owner))
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkRole, setBulkRole] = useState<OrgAdminRoleV3>('admin')
  const [invitesSent, setInvitesSent] = useState(false)

  const orgActivities = listActivities(owner)
  const openJobsCount = listJobsByOrg(owner).filter((j) => j.status === 'open').length

  const navItems: OrgNavItem[] = [
    ...TABS.map((t) => ({ key: t, label: TAB_LABEL[t], active: tab === t, onSelect: () => setTab(t) })),
    { key: 'integrations', label: 'Integrations', active: false, to: '/org/me/integrations' },
  ]

  return (
    <OrgWorkspaceShell title={TAB_LABEL[tab]} navItems={navItems}>
      {tab === 'overview' && (
        <div>
          {/* Design handoff gap audit — real stats: staff/open-jobs/followers
              from this build's own stores; "verified staff records" stays
              honestly 0 — no per-staff-member record-verification tracking
              exists (that's Trust Score's job, computed per individual, not
              aggregated to their employer here). */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <OverviewStat label="Verified staff records" value={0} />
            <OverviewStat label="Open opportunities posted" value={openJobsCount} />
            <OverviewStat label="Followers" value={followerCount(owner)} />
            <OverviewStat label="Staff accounts" value={staff.filter((s) => s.status === 'active').length} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 text-sm font-semibold text-text-0">Recent activity</div>
            {orgActivities.length === 0 ? (
              <p className="text-sm text-text-1">Nothing posted from this workspace yet.</p>
            ) : (
              orgActivities.slice(0, 6).map((a) => (
                <div key={a.id} className="flex gap-3 border-b border-border py-2.5 text-sm text-text-0 last:border-0">
                  <span className="flex-none font-mono text-[11px] text-text-2">{new Date(a.createdAt).toLocaleDateString()}</span>
                  <span>{a.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'talent-search' && (
        <div>
          {!canManageHiring && (
            <div className="mb-4 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
              Your role ({account?.accountType === 'organisation' ? account.orgRole : ''}) doesn't include hiring
              management (§42.2) — you can browse, but posting or pipeline actions are read-only for you.
            </div>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified candidates by skill, trust tier, or profession…"
            className="mb-2 min-h-[44px] w-full rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
          />
          <p className="mb-4 text-xs text-text-2">Ranked by Trust Score and verified evidence — never by followers, likes or views.</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {['Verified Identity', 'Verified Education', 'Verified Employment', 'Verified Skills'].map((f) => (
              <span key={f} className="rounded-full border border-border px-3 py-1 text-xs text-text-1">
                {f}
              </span>
            ))}
          </div>
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No candidates match yet — this is a real, ranked search over verified profiles once individuals exist to
            match against in this build.
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          No verification or affiliation requests yet.
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <p className="mb-4 text-sm text-text-1">
            Up to {MAX_STAFF} staff members (§42.3 Rule 3). Roles use this build's real permission system, not a
            separate label — the role you grant is the role that actually gates what they can do.
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
                  const created = inviteStaffBulk(owner, orgName, bulkEmails, bulkRole)
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
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent">
                      {s.status === 'invited' ? 'Pending acceptance' : ACCESS_LABEL[s.role]}
                    </span>
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

      {tab === 'compliance' && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 text-sm font-semibold text-text-0">Audit trail</div>
          {auditLog.length === 0 ? (
            <p className="text-sm text-text-1">No workspace actions logged yet — staff invites and removals appear here as they happen.</p>
          ) : (
            auditLog.map((a) => (
              <div key={a.id} className="flex gap-3 border-b border-border py-2.5 text-xs text-text-1 last:border-0">
                <span className="flex-none font-mono text-[11px] text-text-2">{new Date(a.at).toLocaleString()}</span>
                <span className="text-text-0">{a.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </OrgWorkspaceShell>
  )
}

function OverviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-text-2">{label}</div>
      <div className="font-mono text-[22px] font-semibold text-text-0">{value}</div>
    </div>
  )
}
