import { useState } from 'react'
import { findAccountByEmail } from '@/app/demoAccountStore'
import {
  allReports,
  countsFor,
  listCommunities,
  staffRemovePost,
  staffResolveReport,
  staffSetCommunityStatus,
  useCommunitiesVersion,
  type Community,
} from '@/app/communityStore'

const name = (email: string) => findAccountByEmail(email)?.legalName ?? email

/** Platform-level oversight of communities (Master Prompt §50.6). Platform staff
 * can see every community regardless of privacy, suspend/restore one, remove a
 * post, and work the cross-community reports queue — every action is a
 * server-side RPC that checks the caller is an active platform admin and writes
 * to the community's audit log. */
export function AdminCommunities() {
  useCommunitiesVersion()
  const [tab, setTab] = useState<'communities' | 'reports'>('communities')
  const [error, setError] = useState<string | null>(null)
  const communities = listCommunities()
  const reports = allReports()
  const open = reports.filter((r) => r.status === 'open' || r.status === 'reviewing')

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Communities</h1>
      <p className="mb-5 text-sm text-text-1">Oversight of every community and group on the platform, including private and invite-only ones.</p>
      <div className="mb-4 flex gap-2">
        {(['communities', 'reports'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}>
            {t}
            {t === 'reports' && open.length > 0 && <span className="ms-1.5 rounded-full bg-accent-solid px-1.5 text-[10px] font-bold text-white">{open.length}</span>}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}

      {tab === 'communities' && (
        communities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">No communities exist yet.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[2fr_1fr_90px_90px_110px] bg-surface-sunken text-[11px] font-semibold tracking-wide text-text-2">
              <div className="px-3.5 py-2.5">COMMUNITY</div><div className="px-3.5 py-2.5">OWNER</div><div className="px-3.5 py-2.5">MEMBERS</div><div className="px-3.5 py-2.5">STATUS</div><div className="px-3.5 py-2.5" />
            </div>
            {communities.map((c) => <Row key={c.id} c={c} onRun={run} />)}
          </div>
        )
      )}

      {tab === 'reports' && (
        reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">No community reports.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {reports.map((r) => {
              const c = communities.find((x) => x.id === r.communityId)
              return (
                <div key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold capitalize text-text-0">{r.targetType.replace('_', ' ')}</span>
                    <span className="text-text-2">in {c?.name ?? 'a community'} · {r.reason}</span>
                    <span className="ms-auto rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-text-2">{r.status}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-text-2">Reported by {name(r.reporterEmail)} · {new Date(r.createdAt).toLocaleString()}</div>
                  {(r.status === 'open' || r.status === 'reviewing') && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                      {r.targetType === 'community_post' && (
                        <button className="text-danger" onClick={() => run(async () => { await staffRemovePost(r.targetId, 'Removed after report'); await staffResolveReport(r.id, 'actioned') })}>
                          Remove post &amp; resolve
                        </button>
                      )}
                      <button className="text-accent" onClick={() => run(() => staffResolveReport(r.id, 'reviewing'))}>Mark reviewing</button>
                      <button className="text-text-1" onClick={() => run(() => staffResolveReport(r.id, 'dismissed'))}>Dismiss</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function Row({ c, onRun }: { c: Community; onRun: (fn: () => Promise<unknown>) => void }) {
  const stats = countsFor(c.id)
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-border bg-surface text-sm">
      <div className="grid grid-cols-[2fr_1fr_90px_90px_110px] items-center">
        <div className="px-3.5 py-2.5">
          <div className="font-semibold text-text-0">{c.name}</div>
          <div className="text-[11px] text-text-2">{c.type} · {c.kind} · {c.privacy.replace('_', '-')}</div>
        </div>
        <div className="truncate px-3.5 py-2.5 text-xs text-text-1">{name(c.ownerEmail)}</div>
        <div className="px-3.5 py-2.5 text-xs">{stats.members}</div>
        <div className="px-3.5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${c.status === 'active' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{c.status}</span></div>
        <div className="px-3.5 py-2.5 text-right">
          <button onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-accent">{c.status === 'active' ? 'Suspend…' : 'Restore…'}</button>
        </div>
      </div>
      {open && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-sunken px-3.5 py-2.5">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (kept in the audit log)" aria-label="Reason" className="min-h-[34px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-xs" />
          <button
            disabled={reason.trim().length < 3}
            onClick={() => { onRun(() => staffSetCommunityStatus(c.id, c.status === 'active' ? 'suspended' : 'active', reason.trim())); setOpen(false); setReason('') }}
            className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Confirm {c.status === 'active' ? 'suspension' : 'restore'}
          </button>
        </div>
      )}
    </div>
  )
}
