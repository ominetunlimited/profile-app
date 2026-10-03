import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Button } from '@/shared/ui/Button'
import { useAccount } from '@/app/AccountContext'
import { useAccountsCacheVersion } from '@/app/demoAccountStore'
import { ensureMediaAsset, getSignedMediaUrl, type MediaAsset } from '@/app/mediaAssetStore'
import {
  fetchVerificationEvents,
  listRequestsForIssuerEmail,
  personName,
  setVerificationRequestStatus,
  useVerificationVersion,
  type VerificationEvent,
  type VerificationRequest,
  type VerificationStatus,
} from '@/app/verificationRequestStore'
import { OrgWorkspaceShell, type OrgNavItem } from './OrgWorkspaceShell'

const STATUS_TONE: Record<VerificationStatus, string> = {
  submitted: 'bg-warning-soft text-warning',
  received: 'bg-accent-soft text-accent',
  institution_notified: 'bg-accent-soft text-accent',
  under_review: 'bg-accent-soft text-accent',
  approved: 'bg-trust-soft text-trust',
  verified: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
}

const isOpen = (r: VerificationRequest) => r.status !== 'verified' && r.status !== 'rejected'

export function Evidence({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<MediaAsset | null | undefined>(undefined)
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void ensureMediaAsset(assetId)
      .then(async (a) => {
        if (!live) return
        setAsset(a ?? null)
        if (a) setUrl(await getSignedMediaUrl(a, 600, a.fileCategory === 'image' ? 'preview' : 'original'))
      })
      .catch(() => live && setAsset(null))
    return () => {
      live = false
    }
  }, [assetId])
  if (asset === undefined) return <p className="text-xs text-text-2">Loading document…</p>
  if (!asset || !url) return <p className="text-xs text-text-2">The attached document couldn't be opened.</p>
  return asset.fileCategory === 'image' ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt="Supporting document" className="max-h-64 max-w-full rounded-lg border border-border object-contain" />
    </a>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent">
      Open {asset.fileName}
    </a>
  )
}

/** The inbox for verification requests addressed to this organisation. Every decision is a role-checked server
 * action that is recorded, shown to the requester, and notifies them. Only organisations PROFILE has itself
 * vetted can confirm a record; an unvetted one can acknowledge and review but not confirm. */
export function VerificationInbox() {
  const { account } = useAccount()
  useVerificationVersion()
  useAccountsCacheVersion()
  const org = account?.accountType === 'organisation' ? account : null
  const [filter, setFilter] = useState<'open' | 'decided' | 'all'>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<VerificationEvent[]>([])

  const all = org ? listRequestsForIssuerEmail(org.officialEmail) : []
  const list = filter === 'open' ? all.filter(isOpen) : filter === 'decided' ? all.filter((r) => !isOpen(r)) : all
  const selected = all.find((r) => r.id === selectedId) ?? null
  const vetted = org?.registryLevel === 'verified' || org?.registryLevel === 'recognized'

  useEffect(() => {
    if (!selected) return
    let live = true
    void fetchVerificationEvents(selected.id).then((e) => live && setEvents(e)).catch(() => live && setEvents([]))
    return () => {
      live = false
    }
  }, [selected?.id, selected?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!org) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center text-sm text-text-1">
        The verification inbox is for organisation accounts. <Link to="/home" className="font-semibold text-accent">Back to Home</Link>
      </div>
    )
  }

  const navItems: OrgNavItem[] = [
    { key: 'inbox', label: 'Verification inbox', active: true },
    { key: 'home', label: 'Workspace', active: false, to: org.orgType && ['University', 'Polytechnic', 'College', 'School', 'Research Institute', 'Certification Authority'].includes(org.orgType) ? '/institution/me' : ['Government Ministry', 'Government Agency', 'Regulatory Authority', 'Licensing Board', 'Professional Council'].includes(org.orgType) ? '/government/me' : '/org/me/talent' },
  ]

  async function decide(status: Exclude<VerificationStatus, 'submitted'>) {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await setVerificationRequestStatus(selected.id, status, note)
      if (status === 'verified' || status === 'rejected') {
        setSelectedId(null)
        setNote('')
      }
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <OrgWorkspaceShell title="Verification inbox" navItems={navItems}>
      <div className="mx-auto max-w-[1000px] p-4 sm:p-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Verification inbox</h1>
        <p className="mb-4 text-sm text-text-1">Requests from people asking {org.legalName} to confirm a record. Each decision is recorded and the person is told.</p>
        {!vetted && (
          <p className="mb-4 rounded-lg border border-warning bg-warning-soft p-3 text-xs text-text-0">
            {org.legalName} hasn't been verified by PROFILE yet, so you can acknowledge and review requests but not confirm them. Confirmation unlocks once PROFILE verifies the organisation.
          </p>
        )}
        <div className="mb-4 flex gap-2">
          {(['open', 'decided', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'}`}
            >
              {f === 'open' ? `Awaiting you (${all.filter(isOpen).length})` : f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-2">
            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing here.</div>
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[r.status]}`}>{r.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-text-2">
                    {r.moduleName} · {new Date(r.submittedAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>

          <div>
            {!selected ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">Select a request to review it.</div>
            ) : (
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <UserAvatar ownerEmail={selected.ownerEmail} name={personName(selected.ownerEmail)} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-text-0">{personName(selected.ownerEmail)}</div>
                    <div className="text-xs text-text-2">{selected.ownerEmail}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[selected.status]}`}>{selected.status.replace(/_/g, ' ')}</span>
                </div>
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-text-2">Record</dt>
                    <dd className="font-medium text-text-0">{selected.moduleName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-2">Reference they gave</dt>
                    <dd className="font-mono text-text-0">{selected.identifierValue}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-2">Submitted</dt>
                    <dd className="text-text-0">{new Date(selected.submittedAt).toLocaleString()}</dd>
                  </div>
                  {selected.documentCopyrightId && (
                    <div>
                      <dt className="text-xs text-text-2">Document ID</dt>
                      <dd className="font-mono text-text-0">{selected.documentCopyrightId}</dd>
                    </div>
                  )}
                </dl>
                {selected.documentMediaAssetId && (
                  <div>
                    <div className="mb-1 text-xs font-semibold text-text-0">Supporting document</div>
                    <Evidence assetId={selected.documentMediaAssetId} />
                  </div>
                )}
                {events.length > 0 && (
                  <ol className="flex flex-col gap-1 border-s border-border ps-3 text-[11px] text-text-1">
                    {events.map((e) => (
                      <li key={e.id}>
                        <span className="font-medium capitalize text-text-0">{e.toStatus.replace(/_/g, ' ')}</span> · {new Date(e.at).toLocaleString()}
                        {e.note && <span> — {e.note}</span>}
                      </li>
                    ))}
                  </ol>
                )}

                {isOpen(selected) ? (
                  <>
                    <label htmlFor="vi-note" className="text-xs font-medium text-text-0">
                      Note to the person (required if you decline)
                    </label>
                    <textarea
                      id="vi-note"
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
                        <Button variant="secondary" disabled={busy} onClick={() => void decide('received')}>
                          Acknowledge
                        </Button>
                      )}
                      {selected.status !== 'under_review' && (
                        <Button variant="secondary" disabled={busy} onClick={() => void decide('under_review')}>
                          Start review
                        </Button>
                      )}
                      <Button disabled={busy || !vetted} onClick={() => void decide('verified')} title={vetted ? undefined : 'Your organisation must be verified by PROFILE first'}>
                        Confirm record
                      </Button>
                      <Button variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => void decide('rejected')}>
                        Decline
                      </Button>
                    </div>
                  </>
                ) : (
                  selected.decisionNote && <p className="text-xs text-text-1">Your note: {selected.decisionNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </OrgWorkspaceShell>
  )
}
