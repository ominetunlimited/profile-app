import { useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Button } from '@/shared/ui/Button'
import { Evidence } from '@/screens/orgworkspace/VerificationInbox'
import { listUnroutedRequests, personName, setVerificationRequestStatus, useVerificationVersion, type VerificationStatus } from '@/app/verificationRequestStore'

const isOpen = (s: VerificationStatus) => s !== 'verified' && s !== 'rejected'

/** Verification requests whose named institution isn't a registered organisation: PROFILE staff decide them.
 * (Requests to a registered institution go to that institution's own inbox and never appear here.) */
export function AdminVerificationRequests() {
  useVerificationVersion()
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const all = listUnroutedRequests()
  const list = filter === 'open' ? all.filter((r) => isOpen(r.status)) : all
  const selected = all.find((r) => r.id === selectedId) ?? null

  async function decide(status: 'under_review' | 'verified' | 'rejected') {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await setVerificationRequestStatus(selected.id, status, note)
      if (status !== 'under_review') {
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
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Unrouted verification requests</h1>
      <p className="mb-5 text-sm text-text-1">Requests naming an institution that isn't on PROFILE. Staff can only confirm what they can check; decline with a reason otherwise.</p>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('open')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'open' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}>
          Awaiting review ({all.filter((r) => isOpen(r.status)).length})
        </button>
        <button onClick={() => setFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}>
          All
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-2">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing waiting.</div>
          ) : (
            list.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedId(r.id)
                  setNote(r.decisionNote ?? '')
                  setError(null)
                }}
                className={`rounded-xl border p-3 text-left ${selectedId === r.id ? 'border-accent bg-surface-sunken' : 'border-border bg-surface'}`}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar ownerEmail={r.ownerEmail} name={personName(r.ownerEmail)} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-0">{personName(r.ownerEmail)}</span>
                </div>
                <div className="text-xs text-text-2">
                  {r.moduleName} · {r.issuerName} · <span className="capitalize">{r.status.replace(/_/g, ' ')}</span>
                </div>
              </button>
            ))
          )}
        </div>
        <div>
          {!selected ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">Select a request to review.</div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="text-lg font-semibold text-text-0">{selected.moduleName}</div>
              <div className="text-xs text-text-2">
                {personName(selected.ownerEmail)} ({selected.ownerEmail}) → {selected.issuerName} (not on PROFILE)
              </div>
              <div className="font-mono text-sm text-text-0">{selected.identifierValue}</div>
              {selected.documentMediaAssetId && <Evidence assetId={selected.documentMediaAssetId} />}
              {isOpen(selected.status) ? (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    aria-label="Note to the person"
                    placeholder="Note to the person (required if declining)"
                    className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
                  />
                  {error && (
                    <p role="alert" className="text-xs text-danger">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" disabled={busy} onClick={() => void decide('under_review')}>
                      Start review
                    </Button>
                    <Button disabled={busy} onClick={() => void decide('verified')}>
                      Confirm record
                    </Button>
                    <Button variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => void decide('rejected')}>
                      Decline
                    </Button>
                  </div>
                </>
              ) : (
                selected.decisionNote && <p className="text-xs text-text-1">Note: {selected.decisionNote}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
