import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import {
  GROUP_TYPES,
  PRIVACY_LABEL,
  communitiesLoaded,
  countsFor,
  createCommunity,
  getCommunity,
  joinCommunity,
  listCommunities,
  membershipOf,
  myPendingInvites,
  pendingRequestFor,
  respondToInvite,
  roleOf,
  useCommunitiesVersion,
  type Community,
  type CommunityPrivacy,
  type GroupType,
} from '@/app/communityStore'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { Button } from '@/shared/ui/Button'
import { CommunityAvatar } from './CommunityAvatar'

/** The real directory: communities/groups people have actually created, with
 * server-enforced join rules (public → join, private → request, invite-only →
 * invitation). Replaces the old fixed list of five localStorage "seeds". */
export function CommunityDirectory() {
  useCommunitiesVersion()
  const { account } = useAccount()
  const owner = ownerKey(account)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<GroupType | 'all'>('all')
  const [kind, setKind] = useState<'all' | 'community' | 'group'>('all')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const all = listCommunities()
  const q = query.trim().toLowerCase()
  const filtered = all.filter(
    (c) => (type === 'all' || c.type === type) && (kind === 'all' || c.kind === kind) && (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
  )
  const mine = filtered.filter((c) => roleOf(c.id, owner) !== null)
  const discover = filtered.filter((c) => roleOf(c.id, owner) === null)
  const invites = myPendingInvites(owner)

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(label)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  function card(c: Community) {
    const role = roleOf(c.id, owner)
    const membership = membershipOf(c.id, owner)
    const requested = pendingRequestFor(c.id, owner)
    const stats = countsFor(c.id)
    return (
      <div key={c.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
        <CommunityAvatar community={c} size={44} />
        <div className="min-w-0 flex-1">
          <Link to={`/communities/${c.slug}`} className="font-semibold text-text-0 hover:text-accent">
            {c.name}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-2">
            <span>{c.type}</span>·<span>{c.kind === 'group' ? 'Group' : 'Community'}</span>·
            <span>
              {stats.members} member{stats.members === 1 ? '' : 's'}
            </span>
            {c.privacy !== 'public' && <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">{c.privacy === 'private' ? 'Private' : 'Invite-only'}</span>}
            {role && <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold capitalize text-accent">{role}</span>}
          </div>
          {c.description && <p className="mt-1 line-clamp-2 text-sm text-text-1">{c.description}</p>}
        </div>
        <div className="flex-none">
          {role ? (
            <Link to={`/communities/${c.slug}`} className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-1">
              Open
            </Link>
          ) : membership?.status === 'banned' ? null : requested ? (
            <span className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-2">Requested</span>
          ) : (
            <button
              disabled={busy === c.id || !account}
              onClick={() => act(c.id, () => joinCommunity(c.id))}
              className="rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
            >
              {c.privacy === 'public' ? 'Join' : c.privacy === 'private' ? 'Request to join' : 'Join (invited)'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {invites.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {invites.map((i) => {
            const c = getCommunity(i.communityId)
            if (!c) return null
            return (
              <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft p-3 text-sm">
                <span className="flex-1 text-text-0">
                  You're invited to join <strong>{c.name}</strong>
                </span>
                <button onClick={() => act(i.id, async () => { await respondToInvite(i.id, true); navigate(`/communities/${c.slug}`) })} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
                  Accept
                </button>
                <button onClick={() => act(i.id, () => respondToInvite(i.id, false))} className="text-xs font-semibold text-text-1">
                  Decline
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search communities…" aria-label="Search communities" className="min-h-[40px] min-w-[180px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent" />
        <select value={type} onChange={(e) => setType(e.target.value as GroupType | 'all')} aria-label="Filter by type" className="min-h-[40px] rounded-lg border border-border-strong bg-surface px-2 text-sm">
          <option value="all">All types</option>
          {GROUP_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Filter by kind" className="min-h-[40px] rounded-lg border border-border-strong bg-surface px-2 text-sm">
          <option value="all">Communities &amp; groups</option>
          <option value="community">Communities</option>
          <option value="group">Groups (with chat)</option>
        </select>
        {account && <Button onClick={() => setCreating(true)}>+ Create</Button>}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!communitiesLoaded() ? (
        <p className="text-sm text-text-2">Loading communities…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
          {all.length === 0 ? 'No communities yet — create the first one for your field.' : 'Nothing matches those filters.'}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {mine.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">Your communities</h2>
              <div className="flex flex-col gap-2">{mine.map(card)}</div>
            </section>
          )}
          {discover.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">Discover</h2>
              <div className="flex flex-col gap-2">{discover.map(card)}</div>
            </section>
          )}
        </div>
      )}

      {creating && (
        <CreateCommunityModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            const c = getCommunity(id)
            navigate(`/communities/${c?.slug ?? id}`)
          }}
        />
      )}
    </div>
  )
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'community' | 'group'>('community')
  const [type, setType] = useState<GroupType>('Professional Community')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')
  const [privacy, setPrivacy] = useState<CommunityPrivacy>('public')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div role="dialog" aria-modal="true" aria-label="Create a community" onClick={onClose} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-[min(520px,100%)] overflow-y-auto rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-0">Create a community</h2>
        <div className="flex flex-col gap-3">
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Lagos Product Designers" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Format" hint={kind === 'group' ? 'Groups include a members-only chat.' : 'Communities are discussion boards.'}>
              <SelectInput value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="community">Community (discussions)</option>
                <option value="group">Group (discussions + chat)</option>
              </SelectInput>
            </Field>
            <Field label="Type">
              <SelectInput value={type} onChange={(e) => setType(e.target.value as GroupType)}>
                {GROUP_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Privacy">
            <SelectInput value={privacy} onChange={(e) => setPrivacy(e.target.value as CommunityPrivacy)}>
              {(Object.keys(PRIVACY_LABEL) as CommunityPrivacy[]).map((p) => (
                <option key={p} value={p}>
                  {PRIVACY_LABEL[p]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus-visible:border-accent" placeholder="What is this community for?" />
          </Field>
          <Field label="Rules (optional)" hint="Shown to everyone before they join.">
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus-visible:border-accent" placeholder="e.g. Be respectful. No spam." />
          </Field>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={busy || name.trim().length < 3}
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                onCreated(await createCommunity({ name, kind, type, description, rules, privacy }))
              } catch (e) {
                setError((e as Error).message)
                setBusy(false)
              }
            }}
          >
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
