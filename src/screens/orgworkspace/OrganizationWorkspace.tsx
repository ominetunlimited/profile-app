import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { listAllAccounts, useAccountsCacheVersion } from '@/app/demoAccountStore'
import { useActivitiesCacheVersion } from '@/app/activityStore'
import { listRequestsForIssuerEmail, personName, useVerificationVersion } from '@/app/verificationRequestStore'
import { listStaffFor, useOrgStaffVersion } from '@/app/orgStaffStore'
import { OrgWorkspaceShell, type OrgNavItem } from './OrgWorkspaceShell'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan } from '@/app/accountTypes'
import { ownerKey, listActivities } from '@/app/activityStore'
import { followerCount } from '@/app/followStore'
import { listJobsByOrg } from '@/app/jobStore'
import { StaffPanel } from './StaffPanel'
import { listAuditLogFor, useOrgAuditVersion } from '@/app/orgAuditLogStore'

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

/** §16/§42 Organization Workspace — overview, talent search, requests, staff, compliance. */
export function OrganizationWorkspace() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('overview')
  const { account } = useAccount()
  const canManageHiring = account ? orgRoleCan(account, 'manageHiring') : false
  const owner = account ? ownerKey(account) : ''

  useOrgAuditVersion()
  const auditLog = listAuditLogFor(owner)

  useOrgStaffVersion()
  useVerificationVersion()
  const staff = listStaffFor(owner)
  const activeStaff = new Set(staff.filter((m) => m.status === 'active').map((m) => m.staffEmail.toLowerCase()))
  // Employment records this organisation has confirmed for people who work here.
  const verifiedStaffRecords = listRequestsForIssuerEmail(owner).filter((r) => r.status === 'verified' && r.moduleKey === 'employment' && activeStaff.has(r.ownerEmail.toLowerCase())).length
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
            <OverviewStat label="Verified staff records" value={verifiedStaffRecords} />
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
              management — you can browse, but posting or pipeline actions are read-only for you.
            </div>
          )}
          <TalentSearch />
        </div>
      )}

      {tab === 'requests' && <RequestsPanel />}

      {tab === 'staff' && <StaffPanel />}

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


/** Search people this organisation is allowed to see. The database decides who that is: private profiles never appear,
 * verified-organisations-only profiles appear to organisations PROFILE has verified, public ones to everyone. */
function TalentSearch() {
  useAccountsCacheVersion()
  useActivitiesCacheVersion()
  const [query, setQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState<string | null>(null)

  const people = listAllAccounts()
    .filter((a): a is Extract<ReturnType<typeof listAllAccounts>[number], { accountType: 'individual' }> => a.accountType === 'individual')
    .map((a) => {
      const records = listActivities(a.email)
      const skills = Array.from(new Set(records.flatMap((r) => r.skills.map((x) => x.trim()).filter(Boolean))))
      return { account: a, records: records.length, skills }
    })
    .sort((x, y) => y.records - x.records || y.skills.length - x.skills.length)

  const topSkills = (() => {
    const counts = new Map<string, number>()
    for (const p of people) for (const sk of p.skills) counts.set(sk, (counts.get(sk) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k)
  })()

  const q = query.trim().toLowerCase()
  const results = people.filter(({ account, skills }) => {
    if (skillFilter && !skills.includes(skillFilter)) return false
    if (!q) return true
    return account.legalName.toLowerCase().includes(q) || (account.headline ?? '').toLowerCase().includes(q) || skills.some((s) => s.toLowerCase().includes(q))
  })

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people by name, headline or skill…"
        aria-label="Search people"
        className="mb-2 min-h-[44px] w-full rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
      />
      <p className="mb-4 text-xs text-text-2">
        You only see people whose profile settings allow it. Ordered by recorded evidence (records, then skills) — never by followers, likes or views.
      </p>
      {topSkills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {topSkills.map((sk) => (
            <button
              key={sk}
              type="button"
              aria-pressed={skillFilter === sk}
              onClick={() => setSkillFilter((cur) => (cur === sk ? null : sk))}
              className={`rounded-full border px-3 py-1 text-xs ${skillFilter === sk ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}
            >
              {sk}
            </button>
          ))}
        </div>
      )}
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          {people.length === 0 ? 'No one is discoverable yet. People appear here once their profile is set to be visible to verified organisations or public.' : 'No one matches that search.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {results.map(({ account, records, skills }) => (
            <div key={account.email} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
              <UserAvatar ownerEmail={account.email} name={account.legalName} size={36} />
              <div className="min-w-[180px] flex-1">
                <div className="text-sm font-semibold text-text-0">{account.legalName}</div>
                <div className="text-xs text-text-1">
                  {account.headline ? `${account.headline} · ` : ''}
                  {records} record{records === 1 ? '' : 's'} · {skills.length} skill{skills.length === 1 ? '' : 's'}
                </div>
                {skills.length > 0 && <div className="mt-1 text-[11px] text-text-2">{skills.slice(0, 5).join(' · ')}</div>}
              </div>
              {account.username && (
                <Link to={`/profile/${account.username}`} className="text-xs font-semibold text-accent">
                  View profile
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/** Verification requests addressed to this organisation, with a way into the full inbox. */
function RequestsPanel() {
  const { account } = useAccount()
  useVerificationVersion()
  useAccountsCacheVersion()
  const requests = account?.accountType === 'organisation' ? listRequestsForIssuerEmail(account.officialEmail) : []
  const open = requests.filter((r) => r.status !== 'verified' && r.status !== 'rejected')
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-1">
          {open.length === 0 ? 'Nothing is waiting for you.' : `${open.length} request${open.length === 1 ? ' is' : 's are'} waiting for you.`}
        </p>
        <Link to="/verification-inbox" className="rounded-lg bg-accent-solid px-3.5 py-2 text-xs font-semibold text-white no-underline">
          Open the verification inbox
        </Link>
      </div>
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">No verification or affiliation requests yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.slice(0, 8).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-semibold text-text-0">{r.moduleName}</div>
                <div className="text-xs text-text-1">
                  {personName(r.ownerEmail)} · sent {new Date(r.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-semibold capitalize text-text-1">{r.status.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
