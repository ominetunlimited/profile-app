import { useCallback, useEffect, useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { findAccountByEmail, useAccountsCacheVersion } from '@/app/demoAccountStore'
import { KIND_LABEL, listAllDataRequests, resolveDataRequest, type DataRequest } from '@/app/dataRequestStore'
import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'
import { Button } from '@/shared/ui/Button'

const STATUS_TONE: Record<DataRequest['status'], string> = {
  submitted: 'bg-warning-soft text-warning',
  in_review: 'bg-accent-soft text-accent',
  completed: 'bg-success-soft text-success',
  declined: 'bg-danger-soft text-danger',
}

/** Queue for data-rights requests (correction, consent withdrawal, appeals, account deletion).
 * Every decision goes through a role-checked server function that records the reviewer and time,
 * and tells the requester. Completing a deletion request records the decision only — the removal
 * itself is carried out by an operator against the live data, never by this screen. */
export function AdminDataRequests() {
  const { admin } = useAdmin()
  useAccountsCacheVersion()
  const allowed = !!admin && platformRoleCan(admin.role, 'data_requests')
  const [items, setItems] = useState<DataRequest[] | null>(null)
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await listAllDataRequests())
    } catch {
      setError('Could not load requests.')
    }
  }, [])
  useEffect(() => {
    if (allowed) void load()
  }, [allowed, load])

  if (!allowed) {
    return <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">Your role doesn't include data-request review.</p>
  }

  const all = items ?? []
  const open = all.filter((r) => r.status === 'submitted' || r.status === 'in_review')
  const list = filter === 'open' ? open : all
  const selected = all.find((r) => r.id === selectedId) ?? null
  const nameOf = (email: string) => findAccountByEmail(email)?.legalName ?? email

  async function decide(decision: 'in_review' | 'completed' | 'declined') {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await resolveDataRequest(selected.id, decision, note)
      await load()
      if (decision !== 'in_review') {
        setSelectedId(null)
        setNote('')
      }
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Data requests</h1>
      <p className="mb-5 text-sm text-text-1">Correction, consent-withdrawal, appeal and account-deletion requests from users. Each decision is recorded and the requester is notified.</p>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('open')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'open' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}>
          Awaiting review ({open.length})
        </button>
        <button onClick={() => setFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}>
          All requests
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-2">
          {items === null ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-1">Loading…</div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing waiting.</div>
          ) : (
            list.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedId(r.id)
                  setNote(r.reviewerNote ?? '')
                  setError(null)
                }}
                className={`rounded-xl border p-3 text-left ${selectedId === r.id ? 'border-accent bg-surface-sunken' : 'border-border bg-surface'}`}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar ownerEmail={r.userEmail} name={nameOf(r.userEmail)} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-0">{nameOf(r.userEmail)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[r.status]}`}>{r.status.replace('_', ' ')}</span>
                </div>
                <div className="text-xs text-text-2">
                  {KIND_LABEL[r.kind]} · {new Date(r.createdAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>

        <div>
          {!selected ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">Select a request to review.</div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold text-text-0">{KIND_LABEL[selected.kind]}</div>
                <span className={`ms-auto rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
              </div>
              <div className="text-xs text-text-2">
                From {nameOf(selected.userEmail)} ({selected.userEmail}) · {new Date(selected.createdAt).toLocaleString()}
              </div>
              <div className="whitespace-pre-line rounded-lg bg-surface-sunken p-3 text-sm text-text-0">{selected.details || 'No details were given.'}</div>
              {selected.kind === 'delete' && (
                <p className="rounded-lg border border-warning bg-warning-soft p-3 text-xs text-text-0">
                  Marking this completed records the decision only. Removing the data is done separately by an operator, and records independently verified by institutions may remain in their systems.
                </p>
              )}
              {selected.status === 'submitted' || selected.status === 'in_review' ? (
                <>
                  <label className="text-xs font-medium text-text-0" htmlFor="dr-note">
                    Note to the requester (required if declining)
                  </label>
                  <textarea
                    id="dr-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
                  />
                  {error && (
                    <p role="alert" className="text-xs text-danger">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'submitted' && (
                      <Button variant="secondary" disabled={busy} onClick={() => void decide('in_review')}>
                        Start review
                      </Button>
                    )}
                    <Button disabled={busy} onClick={() => void decide('completed')}>
                      Mark completed
                    </Button>
                    <Button variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => void decide('declined')}>
                      Decline
                    </Button>
                  </div>
                </>
              ) : (
                selected.reviewerNote && <p className="text-xs text-text-1">Reviewer note: {selected.reviewerNote}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
