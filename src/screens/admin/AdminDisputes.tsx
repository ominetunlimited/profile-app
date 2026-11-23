import { ProfileLogoAnimated } from '@/shared/ui/ProfileLogoAnimated'
import { useCallback, useEffect, useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Button } from '@/shared/ui/Button'
import { Evidence } from '@/screens/orgworkspace/VerificationInbox'
import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'
import { findAccountByEmail, useAccountsCacheVersion } from '@/app/demoAccountStore'
import { listAllDisputes, OPEN_STATUSES, resolveDispute, type DisputeRecord, type DisputeStatus } from '@/app/disputeStore'

const TYPE_LABEL: Record<DisputeRecord['disputeType'], string> = {
  verification_decision: 'A verification decision',
  trust_score_change: 'A trust score change',
  recruiter_filter_exclusion: 'Excluded from a recruiter filter',
  moderation_action: 'A moderation action',
  institutional_rejection: 'An institution rejecting a valid credential',
}
const TONE: Record<DisputeStatus, string> = {
  submitted: 'bg-warning-soft text-warning',
  under_review: 'bg-accent-soft text-accent',
  escalated: 'bg-accent-soft text-accent',
  independent_review: 'bg-accent-soft text-accent',
  upheld: 'bg-surface-sunken text-text-1',
  corrected: 'bg-success-soft text-success',
  removed: 'bg-success-soft text-success',
}

/** Reviewer queue for disputes and appeals. Every outcome is recorded with the reviewer and time, and the person is notified.
 * Giving an outcome (upheld / corrected / removed) needs a written note. */
export function AdminDisputes() {
  const { admin } = useAdmin()
  useAccountsCacheVersion()
  const allowed = !!admin && platformRoleCan(admin.role, 'data_requests')
  const [items, setItems] = useState<DisputeRecord[] | null>(null)
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await listAllDisputes())
    } catch {
      setError('Could not load disputes.')
    }
  }, [])
  useEffect(() => {
    if (allowed) void load()
  }, [allowed, load])

  if (!allowed) return <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">Your role doesn't include dispute review.</p>

  const all = items ?? []
  const open = all.filter((d) => OPEN_STATUSES.includes(d.status))
  const list = filter === 'open' ? open : all
  const selected = all.find((d) => d.id === selectedId) ?? null
  const nameOf = (email: string) => findAccountByEmail(email)?.legalName ?? email

  async function decide(decision: Exclude<DisputeStatus, 'submitted'>) {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await resolveDispute(selected.id, decision, note)
      await load()
      if (!OPEN_STATUSES.includes(decision)) {
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
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Disputes &amp; appeals</h1>
      <p className="mb-5 text-sm text-text-1">Examine both sides' evidence and record a written outcome. The person is notified at each step.</p>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('open')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'open' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}>
          Open ({open.length})
        </button>
        <button onClick={() => setFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}>
          All
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-2">
          {items === null ? (
            <div className="flex justify-center py-6"><ProfileLogoAnimated state="loading" size={32} /></div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing waiting.</div>
          ) : (
            list.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedId(d.id)
                  setNote(d.reviewerNote ?? '')
                  setError(null)
                }}
                className={`rounded-xl border p-3 text-left ${selectedId === d.id ? 'border-accent bg-surface-sunken' : 'border-border bg-surface'}`}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar ownerEmail={d.ownerEmail} name={nameOf(d.ownerEmail)} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-0">{nameOf(d.ownerEmail)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${TONE[d.status]}`}>{d.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-xs text-text-2">
                  {TYPE_LABEL[d.disputeType]} · {new Date(d.submittedAt).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
        <div>
          {!selected ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">Select a dispute to review.</div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold text-text-0">{TYPE_LABEL[selected.disputeType]}</div>
                <span className={`ms-auto rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${TONE[selected.status]}`}>{selected.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-xs text-text-2">
                {nameOf(selected.ownerEmail)} ({selected.ownerEmail}) · filed {new Date(selected.submittedAt).toLocaleString()} · record: <span className="font-mono">{selected.targetId}</span>
              </div>
              <div className="whitespace-pre-line rounded-lg bg-surface-sunken p-3 text-sm text-text-0">{selected.reason}</div>
              {selected.evidenceAssetIds.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-text-0">Evidence they attached</div>
                  {selected.evidenceAssetIds.map((id) => (
                    <Evidence key={id} assetId={id} />
                  ))}
                </div>
              )}
              {OPEN_STATUSES.includes(selected.status) ? (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    aria-label="Written outcome for the person"
                    placeholder="Written outcome for the person (required for upheld, corrected or removed)"
                    className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
                  />
                  {error && (
                    <p role="alert" className="text-xs text-danger">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'submitted' && (
                      <Button variant="secondary" disabled={busy} onClick={() => void decide('under_review')}>
                        Start review
                      </Button>
                    )}
                    <Button variant="secondary" disabled={busy} onClick={() => void decide('escalated')}>
                      Escalate
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => void decide('independent_review')}>
                      Independent review
                    </Button>
                    {(['upheld', 'corrected', 'removed'] as const).map((r) => (
                      <Button key={r} disabled={busy || note.trim().length < 3} onClick={() => void decide(r)}>
                        <span className="capitalize">{r}</span>
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                selected.reviewerNote && <p className="text-xs text-text-1">Outcome given: {selected.reviewerNote}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
