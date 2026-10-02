import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { findAccountByEmail } from '@/app/demoAccountStore'
import {
  GROUP_TYPES,
  PRIVACY_LABEL,
  auditFor,
  decideAppeal,
  decideJoinRequest,
  deleteCommunity,
  inviteToCommunity,
  isAdmin,
  listMembers,
  pendingAppeals,
  pendingRequests,
  reportsFor,
  staffResolveReport,
  transferOwnership,
  updateCommunitySettings,
  uploadCommunityImage,
  type Community,
  type CommunityPrivacy,
  type CommunityRole,
  type GroupType,
} from '@/app/communityStore'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'

const name = (email: string) => findAccountByEmail(email)?.legalName ?? email
const SECTIONS = ['requests', 'invites', 'reports', 'appeals', 'audit', 'settings'] as const
type Section = (typeof SECTIONS)[number]
const LABEL: Record<Section, string> = { requests: 'Join requests', invites: 'Invite', reports: 'Reports', appeals: 'Appeals', audit: 'Audit log', settings: 'Settings' }

/** Moderator/admin console for one community. Every button maps to a
 * server-side RPC that re-verifies the caller's role — hiding a button here is
 * convenience, not security. */
export function CommunityManage({ community, owner, role }: { community: Community; owner: string; role: CommunityRole }) {
  const admin = isAdmin(role)
  const sections = SECTIONS.filter((s) => s !== 'settings' || admin).filter((s) => s !== 'appeals' || admin)
  const [section, setSection] = useState<Section>('requests')
  const requests = pendingRequests(community.id)
  const appeals = pendingAppeals(community.id)
  const openReports = reportsFor(community.id).filter((r) => r.status === 'open' || r.status === 'reviewing')
  const badge = (s: Section) => (s === 'requests' ? requests.length : s === 'appeals' ? appeals.length : s === 'reports' ? openReports.length : 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {sections.map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${section === s ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}>
            {LABEL[s]}
            {badge(s) > 0 && <span className="ms-1.5 rounded-full bg-accent-solid px-1.5 text-[10px] font-bold text-white">{badge(s)}</span>}
          </button>
        ))}
      </div>
      {section === 'requests' && <RequestsPanel community={community} />}
      {section === 'invites' && <InvitePanel community={community} />}
      {section === 'reports' && <ReportsPanel community={community} />}
      {section === 'appeals' && admin && <AppealsPanel community={community} />}
      {section === 'audit' && <AuditPanel community={community} />}
      {section === 'settings' && admin && <SettingsPanel community={community} owner={owner} role={role} />}
    </div>
  )
}

function useRunner() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }
  return { error, busy, run }
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">{children}</div>
}

function RequestsPanel({ community }: { community: Community }) {
  const list = pendingRequests(community.id)
  const { error, busy, run } = useRunner()
  if (list.length === 0) return <Empty>No pending join requests.</Empty>
  return (
    <div className="flex flex-col gap-2">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {list.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-text-0">{name(r.requesterEmail)}</div>
            <div className="text-xs text-text-2">Requested {new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <button disabled={busy} onClick={() => run(() => decideJoinRequest(r.id, true))} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
          <button disabled={busy} onClick={() => run(() => decideJoinRequest(r.id, false))} className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-1">Decline</button>
        </div>
      ))}
    </div>
  )
}

function InvitePanel({ community }: { community: Community }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const { error, busy, run } = useRunner()
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-2 text-sm text-text-1">Invite someone by their PROFILE account email. They'll get a notification and can accept or decline.</p>
      <div className="flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" aria-label="Invitee email" className="min-h-[40px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent" />
        <Button
          disabled={busy || !email.includes('@')}
          onClick={() =>
            run(async () => {
              await inviteToCommunity(community.id, email.trim())
              setSent(email.trim())
              setEmail('')
            })
          }
        >
          Invite
        </Button>
      </div>
      {sent && <p className="mt-2 text-xs text-success">Invitation sent to {sent}.</p>}
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}

function ReportsPanel({ community }: { community: Community }) {
  const list = reportsFor(community.id)
  const { error, run } = useRunner()
  if (list.length === 0) return <Empty>No reports in this community.</Empty>
  return (
    <div className="flex flex-col gap-2">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {list.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text-0 capitalize">{r.targetType.replace('_', ' ')}</span>
            <span className="text-text-2">· {r.reason}</span>
            <span className="ms-auto rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-text-2">{r.status}</span>
          </div>
          <div className="mt-0.5 text-xs text-text-2">Reported by {name(r.reporterEmail)} · {new Date(r.createdAt).toLocaleString()}</div>
          {(r.status === 'open' || r.status === 'reviewing') && (
            <div className="mt-2 flex gap-3 text-xs font-semibold">
              <button className="text-accent" onClick={() => run(() => staffResolveReport(r.id, 'actioned'))}>Mark actioned</button>
              <button className="text-text-1" onClick={() => run(() => staffResolveReport(r.id, 'dismissed'))}>Dismiss</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AppealsPanel({ community }: { community: Community }) {
  const list = pendingAppeals(community.id)
  const { error, busy, run } = useRunner()
  if (list.length === 0) return <Empty>No pending appeals.</Empty>
  return (
    <div className="flex flex-col gap-2">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {list.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
          <div className="font-semibold text-text-0">{name(a.memberEmail)}</div>
          <p className="my-1 whitespace-pre-wrap text-text-1">{a.message}</p>
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => run(() => decideAppeal(a.id, true))} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">Approve (restore access)</button>
            <button disabled={busy} onClick={() => run(() => decideAppeal(a.id, false))} className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-1">Reject</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditPanel({ community }: { community: Community }) {
  const list = auditFor(community.id)
  if (list.length === 0) return <Empty>No moderation actions recorded yet.</Empty>
  return (
    <div className="flex flex-col gap-1.5">
      {list.map((a) => (
        <div key={a.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
          <span className="font-mono text-text-2">{new Date(a.createdAt).toLocaleString()}</span>{' '}
          <span className="font-semibold text-text-0">{a.actor === 'platform-staff' ? 'PROFILE staff' : name(a.actor)}</span>{' '}
          <span className="text-text-1">{a.action.replace(/_/g, ' ')}</span>
          {a.target && <span className="text-text-1"> → {name(a.target)}</span>}
          {a.detail && <span className="text-text-2"> — {a.detail}</span>}
        </div>
      ))}
    </div>
  )
}

function SettingsPanel({ community, owner, role }: { community: Community; owner: string; role: CommunityRole }) {
  const navigate = useNavigate()
  const [nameDraft, setNameDraft] = useState(community.name)
  const [description, setDescription] = useState(community.description)
  const [rules, setRules] = useState(community.rules)
  const [privacy, setPrivacy] = useState<CommunityPrivacy>(community.privacy)
  const [type, setType] = useState<GroupType>(community.type)
  const [saved, setSaved] = useState(false)
  const [newOwner, setNewOwner] = useState('')
  const avatarInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const { error, busy, run } = useRunner()
  const candidates = listMembers(community.id).filter((m) => m.status === 'active' && m.email.toLowerCase() !== owner.toLowerCase())

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold text-text-0">Community settings</h2>
        <Field label="Name"><TextInput value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={80} /></Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Type">
            <SelectInput value={type} onChange={(e) => setType(e.target.value as GroupType)}>{GROUP_TYPES.map((t) => <option key={t}>{t}</option>)}</SelectInput>
          </Field>
          <Field label="Privacy">
            <SelectInput value={privacy} onChange={(e) => setPrivacy(e.target.value as CommunityPrivacy)}>
              {(Object.keys(PRIVACY_LABEL) as CommunityPrivacy[]).map((p) => <option key={p} value={p}>{PRIVACY_LABEL[p]}</option>)}
            </SelectInput>
          </Field>
        </div>
        <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm" /></Field>
        <Field label="Rules"><textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm" /></Field>
        <div className="flex flex-wrap gap-2 text-xs">
          <input ref={avatarInput} type="file" accept="image/*" className="sr-only" aria-label="Upload community image" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run(() => uploadCommunityImage(community.id, 'avatar', f)) }} />
          <input ref={coverInput} type="file" accept="image/*" className="sr-only" aria-label="Upload cover image" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run(() => uploadCommunityImage(community.id, 'cover', f)) }} />
          <button type="button" onClick={() => avatarInput.current?.click()} className="rounded-lg border border-border-strong px-3 py-1.5 font-semibold">Change image</button>
          <button type="button" onClick={() => coverInput.current?.click()} className="rounded-lg border border-border-strong px-3 py-1.5 font-semibold">Change cover</button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={busy || nameDraft.trim().length < 3}
            onClick={() => run(async () => { await updateCommunitySettings(community.id, { name: nameDraft.trim(), description, rules, privacy, type }); setSaved(true); setTimeout(() => setSaved(false), 1800) })}
          >
            Save changes
          </Button>
          {saved && <span className="text-xs text-success">Saved.</span>}
        </div>
      </section>

      {role === 'owner' && (
        <section className="flex flex-col gap-3 rounded-xl border border-danger bg-surface p-4">
          <h2 className="font-semibold text-text-0">Ownership & danger zone</h2>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Transfer ownership to">
              <SelectInput value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
                <option value="">Choose a member…</option>
                {candidates.map((m) => <option key={m.email} value={m.email}>{name(m.email)}</option>)}
              </SelectInput>
            </Field>
            <Button variant="secondary" disabled={busy || !newOwner} onClick={() => { if (confirm('Transfer ownership? You will become an admin.')) void run(() => transferOwnership(community.id, newOwner)) }}>Transfer</Button>
          </div>
          <div>
            <Button variant="secondary" className="!border-danger !text-danger" disabled={busy} onClick={() => { if (confirm('Delete this community and everything in it? This cannot be undone.')) void run(async () => { await deleteCommunity(community.id); navigate('/communities') }) }}>
              Delete community
            </Button>
          </div>
        </section>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}
