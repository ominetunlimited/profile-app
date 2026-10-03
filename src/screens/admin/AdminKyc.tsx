import { useEffect, useState } from 'react'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { KYC_DOCUMENT_LABEL, listKyc, reviewKyc, useKycVersion, type KycSubmission } from '@/app/kycStore'
import { ensureMediaAsset, getMediaAssetById, getSignedMediaUrl, useMediaAssetsCacheVersion } from '@/app/mediaAssetStore'
import { Button } from '@/shared/ui/Button'

const name = (email: string) => findAccountByEmail(email)?.legalName ?? email
const STATUS_TONE: Record<KycSubmission['status'], string> = {
  submitted: 'bg-warning-soft text-warning',
  in_review: 'bg-accent-soft text-accent',
  approved: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
}

function Evidence({ assetId, label }: { assetId: string | null; label: string }) {
  useMediaAssetsCacheVersion()
  const asset = assetId ? getMediaAssetById(assetId) : undefined
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    setUrl(null)
    if (assetId) {
      void ensureMediaAsset(assetId).then((a) => (a ? getSignedMediaUrl(a, 600, 'preview') : null)).then((u) => live && setUrl(u))
    }
    return () => {
      live = false
    }
  }, [assetId, asset?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!assetId) return null
  return (
    <figure className="flex flex-col gap-1">
      <div className="flex h-48 w-72 max-w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-sunken text-xs text-text-2">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt={label} className="h-48 w-72 max-w-full object-contain" />
          </a>
        ) : asset ? (
          'Loading…'
        ) : (
          'Image unavailable'
        )}
      </div>
      <figcaption className="text-xs text-text-1">{label}</figcaption>
    </figure>
  )
}

/** Human review of identity (KYC) submissions. Approval is the only thing that
 * earns the Identity Trust points — there is no automated pass. Liveness /
 * face-match isn't performed (no vendor), so the reviewer compares the selfie
 * with the ID photo by eye. */
export function AdminKyc() {
  useKycVersion()
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const all = listKyc()
  const openCount = all.filter((k) => k.status === 'submitted' || k.status === 'in_review').length
  const list = filter === 'open' ? all.filter((k) => k.status === 'submitted' || k.status === 'in_review') : all
  const selected = all.find((k) => k.id === selectedId) ?? null

  async function decide(decision: 'in_review' | 'approved' | 'rejected') {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await reviewKyc(selected.id, decision, note)
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
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Identity verification (KYC)</h1>
      <p className="mb-5 text-sm text-text-1">Review submitted ID documents and selfies. Images are private; opening them is limited to verification reviewers.</p>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('open')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'open' ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}>
          Awaiting review ({openCount})
        </button>
        <button onClick={() => setFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}>
          All submissions
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-2">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing waiting.</div>
          ) : (
            list.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setSelectedId(k.id)
                  setNote(k.reviewerNote ?? '')
                  setError(null)
                }}
                className={`rounded-xl border p-3 text-left ${selectedId === k.id ? 'border-accent bg-surface-sunken' : 'border-border bg-surface'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-0">{name(k.userEmail)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[k.status]}`}>{k.status.replace('_', ' ')}</span>
                </div>
                <div className="text-xs text-text-2">
                  {KYC_DOCUMENT_LABEL[k.documentType]} · {new Date(k.createdAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>

        <div>
          {!selected ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">Select a submission to review.</div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold text-text-0">{name(selected.userEmail)}</div>
                <span className="text-xs text-text-2">{selected.userEmail}</span>
                <span className={`ms-auto rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                <Evidence assetId={selected.frontAsset} label="ID — front" />
                <Evidence assetId={selected.backAsset} label="ID — back" />
                <Evidence assetId={selected.selfieAsset} label="Selfie" />
              </div>
              <div>
                <h2 className="mb-1 text-sm font-semibold text-text-0">Details the applicant confirmed</h2>
                <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1 text-xs">
                  <dt className="text-text-2">Document</dt>
                  <dd className="text-text-0">{KYC_DOCUMENT_LABEL[selected.documentType]}</dd>
                  <dt className="text-text-2">Name</dt>
                  <dd className="text-text-0">{selected.extracted.fullName || '—'}</dd>
                  <dt className="text-text-2">ID number</dt>
                  <dd className="text-text-0">{selected.extracted.idNumber || '—'}</dd>
                  <dt className="text-text-2">Date of birth</dt>
                  <dd className="text-text-0">{selected.extracted.dateOfBirth || '—'}</dd>
                  <dt className="text-text-2">Expiry</dt>
                  <dd className="text-text-0">{selected.extracted.expiryDate || '—'}</dd>
                </dl>
                <p className="mt-2 rounded-lg bg-surface-sunken p-2 text-xs text-text-1">
                  Liveness / face-match: <strong>{selected.livenessStatus === 'pending_vendor' ? 'not performed (no vendor configured)' : selected.livenessStatus}</strong>. Compare the selfie to the ID photo yourself, and check the typed details against the document — they come from on-device OCR plus the applicant's own edits.
                </p>
              </div>
              {selected.status === 'submitted' || selected.status === 'in_review' ? (
                <div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} aria-label="Reviewer note" placeholder="Note to the applicant (required if rejecting)" className="mb-2 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm" />
                  {error && (
                    <p role="alert" className="mb-2 text-xs text-danger">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'submitted' && (
                      <Button variant="secondary" disabled={busy} onClick={() => void decide('in_review')}>
                        Mark in review
                      </Button>
                    )}
                    <Button
                      disabled={busy}
                      onClick={() => {
                        if (confirm('Approve this identity? The applicant earns Identity trust points.')) void decide('approved')
                      }}
                    >
                      Approve
                    </Button>
                    <Button variant="secondary" className="!border-danger !text-danger" disabled={busy} onClick={() => void decide('rejected')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-1">
                  Decided {selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : ''}
                  {selected.reviewerNote ? ` — “${selected.reviewerNote}”` : ''}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
