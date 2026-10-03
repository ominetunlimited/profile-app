import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { EntityAutocomplete } from '@/shared/ui/EntityAutocomplete'
import { Button } from '@/shared/ui/Button'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { uploadMediaAsset, type MediaAsset } from '@/app/mediaAssetStore'
import { useKycVersion } from '@/app/kycStore'
import { extractDocumentFields, recognizeDocument, type ExtractedFields } from '@/app/ocr'
import { CameraCapture } from '@/shared/ui/CameraCapture'
import { KycFlow } from './KycFlow'
import {
  computeTrustScore,
  TRUST_DIMENSION_LABELS,
  TRUST_DIMENSION_SIGNAL_MAP,
  TRUST_TIERS,
  TRUST_WEIGHTS,
  type TrustDimensions,
} from '@/app/trustScore'
import {
  listVerificationRequests,
  submitVerificationRequest,
  VERIFICATION_MODULES,
  VERIFICATION_TIMELINE,
  type VerificationModuleKey,
  type VerificationRequest,
} from '@/app/verificationRequestStore'
import { displayPid, listSharesFor, revokePassportShare, shareTrustPassport, type PassportAccessExpiry } from '@/app/trustPassportShareStore'

/**
 * §4.5 Trust Score Schema + §12.6 Trust Passport — the real, in-app,
 * authenticated Trust Centre experience. Previously "Trust Centre" in every
 * in-app nav surface (navConfig.ts) pointed at the PUBLIC `/trust` marketing
 * page, which renders with PublicHeader/PublicFooter and the public site's
 * own nav (About/Blog/Help/…) — clicking it from inside the app genuinely
 * took you out of the app shell entirely. That public page still exists for
 * signed-out visitors; this is the separate, real destination for someone
 * already inside PROFILE, showing their own Trust Score ring, the 8-
 * dimension breakdown, and the literal calculation matrix (§13.2) — not a
 * re-export of the marketing copy.
 */
export function TrustPassport() {
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  useKycVersion() // re-score live when a reviewer decides your identity check
  const trust = computeTrustScore(account)
  const [requests, setRequests] = useState(() => listVerificationRequests(owner))
  const [shares, setShares] = useState(() => listSharesFor(owner))
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const verifiedCount = requests.filter((r) => r.status === 'verified').length
  const pendingCount = requests.filter((r) => r.status !== 'verified' && r.status !== 'rejected').length
  const headline = account?.accountType === 'individual' ? account.headline : account?.accountType === 'organisation' ? account.orgType : ''
  const initials = account?.legalName
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const dimensionSignals: Record<keyof TrustDimensions, string[]> = {
    identityTrust: [], academicTrust: [], professionalTrust: [], employmentTrust: [],
    marketplaceTrust: [], organisationalTrust: [], recruitmentTrust: [], contributionTrust: [],
  }
  const earned = (signal: string) => trust.signals.filter((s) => s.type === signal && s.verified).reduce((n, s) => n + s.weight, 0)
  for (const [signal, dimension] of Object.entries(TRUST_DIMENSION_SIGNAL_MAP)) {
    dimensionSignals[dimension].push(signal)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-2">Trust Passport</div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Your Trust Score</h1>

        <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:gap-8">
          <TrustScoreRing trust={trust} size={140} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: trust.tier.color }}>
                {trust.tier.label}
              </span>
              <span className="text-xs capitalize text-text-2">{trust.confidenceLevel} confidence</span>
            </div>
            <p className="mb-2 text-sm text-text-1">
              Every point here traces to a real, sourced signal — never a follower, like, or view count (§13.2's own
              hard rule).
            </p>
            <Link to="/trust" className="text-xs font-semibold text-accent">
              How trust scoring works →
            </Link>
          </div>
        </div>

        {/* Design handoff gap audit — PROFILE Profile & Trust.dc.html's
            Trust Passport share flow (passport card, share modal, "who
            currently holds it" + Revoke) had no real equivalent. Built from
            the mockup's exact source text/structure; "opened N times" is
            never reproduced since no real recipient-side session exists in
            this build to track an open event — shares honestly always show
            "not yet opened". */}
        <section className="mb-8 flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1 basis-[400px]">
            <h2 className="mb-1.5 font-semibold text-text-0">Trust Passport</h2>
            <p className="mb-4 max-w-[62ch] text-xs leading-relaxed text-text-1">
              A signed, verifiable summary you share with one party at a time. It states what has been confirmed and
              by whom, carries an expiry, and can be revoked after you send it.
            </p>

            <div className="max-w-[520px] overflow-hidden rounded-2xl border border-trust bg-surface shadow-lg">
              <div className="flex flex-wrap items-center gap-2.5 border-b border-trust bg-trust-soft px-4 py-3.5">
                <span className="flex-1 text-sm font-semibold text-text-0">Trust Passport</span>
                <span className="font-mono text-[10.5px] text-trust">{displayPid(owner)}</span>
              </div>
              <div className="p-4">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-accent-solid text-base font-semibold text-white">{initials}</span>
                  <div className="min-w-[140px] flex-1">
                    <div className="text-sm font-semibold text-text-0">{account?.legalName}</div>
                    <div className="text-xs text-text-1">{headline}</div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-mono text-xl font-semibold text-text-0">{trust.total}</div>
                    <div className="text-[10px] text-text-1">Trust Score</div>
                  </div>
                </div>
                <div className="mb-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-2.5">
                    <span className="flex-none text-xs font-semibold text-trust">✓</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-text-0">{verifiedCount} verified record{verifiedCount === 1 ? '' : 's'}</div>
                      <div className="text-[11px] leading-relaxed text-text-1">Confirmed by an institution or employer.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-2.5">
                    <span className="flex-none text-xs font-semibold text-text-2">◌</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-text-0">{pendingCount} pending</div>
                      <div className="text-[11px] leading-relaxed text-text-1">Stated openly. A passport never hides an incomplete item.</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-border pt-3.5 text-[11px] leading-relaxed text-text-1">
                  <div className="min-w-0 flex-1 basis-[180px]">
                    <strong className="font-semibold text-text-0">Issued</strong> {new Date().toLocaleDateString()}
                    <br />
                    <strong className="font-semibold text-text-0">Expires</strong> per share below · revocable any time
                  </div>
                  <div className="min-w-0 flex-1 basis-[150px]">
                    <strong className="font-semibold text-text-0">Verify independently</strong>
                    <br />
                    <span title="Illustrative — a live public verification page isn't built in this pass">profile.app/v/{displayPid(owner)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
              <Button onClick={() => setShareModalOpen(true)}>Share with someone</Button>
              <Button variant="secondary" disabled title="Passport PDF export isn't built in this pass — flagged, not silently faked">
                Download PDF
              </Button>
            </div>
          </div>

          <div className="flex min-w-[250px] flex-1 basis-[270px] flex-col gap-3.5">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2.5 text-sm font-semibold text-text-0">Who currently holds it</div>
              {shares.length === 0 ? (
                <p className="mb-2.5 text-xs text-text-1">You haven't shared your passport with anyone yet.</p>
              ) : (
                shares.map((s) => (
                  <div key={s.id} className="mb-2.5 flex flex-wrap items-center gap-2 border-b border-border pb-2.5">
                    <div className="min-w-0 flex-1 basis-[120px]">
                      <div className="text-xs font-medium text-text-0">{s.sharedWith}</div>
                      <div className="text-[10.5px] text-text-1">
                        Shared {new Date(s.sharedAt).toLocaleDateString()} · not yet opened ·{' '}
                        {s.expiresAt ? `expires ${new Date(s.expiresAt).toLocaleDateString()}` : 'until revoked'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        revokePassportShare(s.id, owner)
                        setShares(listSharesFor(owner))
                      }}
                      className="flex-none rounded-lg border border-danger px-2.5 py-1 text-[11px] font-semibold text-danger"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
              <p className="text-[11px] text-text-1">Revoking takes effect immediately. The holder sees that access was withdrawn, not why.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2.5 text-sm font-semibold text-text-0">What a passport never contains</div>
              <p className="text-xs leading-relaxed text-text-1">
                Date of birth, home address, national ID numbers, document scans, salary history, or anything you
                have not published. It states that a check passed — never the underlying document.
              </p>
            </div>
          </div>
        </section>

        {shareModalOpen && (
          <ShareModal
            onClose={() => setShareModalOpen(false)}
            onShare={(sharedWith, accessExpiry) => {
              shareTrustPassport(owner, sharedWith, accessExpiry)
              setShares(listSharesFor(owner))
              setShareModalOpen(false)
            }}
          />
        )}

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Trust dimensions</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(TRUST_DIMENSION_LABELS) as (keyof TrustDimensions)[]).map((key) => (
              <div key={key} className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-text-0">{TRUST_DIMENSION_LABELS[key]}</span>
                  <span className="font-mono text-xs text-text-2">{trust.dimensions[key]}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${trust.dimensions[key]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Calculation matrix (§13.2)</h2>
          <p className="mb-3 text-xs text-text-1">
            Every signal below needs a real verification to contribute. Identity counts once a PROFILE reviewer
            approves your documents; the others still have no verification source in this build, so they stay at 0
            rather than being estimated.
          </p>
          {(Object.keys(TRUST_DIMENSION_LABELS) as (keyof TrustDimensions)[]).map((dim) => (
            <div key={dim} className="mb-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-2">{TRUST_DIMENSION_LABELS[dim]}</div>
              <div className="flex flex-col gap-1">
                {dimensionSignals[dim].map((signal) => (
                  <div key={signal} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-xs">
                    <span className="text-text-1">{signal.replace(/_/g, ' ')}</span>
                    <span className={`font-mono ${earned(signal) > 0 ? "font-semibold text-success" : "text-text-2"}`}>{earned(signal)} / {TRUST_WEIGHTS[signal as keyof typeof TRUST_WEIGHTS]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Tier ladder</h2>
          <div className="flex flex-col gap-1.5">
            {TRUST_TIERS.map((t) => (
              <div key={t.tier} className={`flex items-center gap-3 rounded-lg border p-2.5 ${t.tier === trust.tier.tier ? 'border-accent' : 'border-border'}`}>
                <span className="h-3 w-3 flex-none rounded-full" style={{ background: t.color }} />
                <span className="w-24 flex-none font-mono text-xs text-text-1">{t.range[0]}–{t.range[1]}</span>
                <span className="font-semibold text-text-0">{t.label}</span>
                {t.tier === trust.tier.tier && <span className="ms-auto text-xs font-semibold text-accent">You are here</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Verification Center (§12)</h2>
          <p className="mb-3 text-xs text-text-1">
            Submitting here creates a real, persisted request — it does not fabricate an approval. No institution
            reviewer is wired to these individual requests yet in this build, so a real submission honestly stays at
            "Submitted" rather than being auto-approved to look finished.
          </p>
          {account?.accountType === 'individual' && (
            <div className="mb-4">
              <KycFlow />
            </div>
          )}
          <VerificationSubmitForm owner={owner} onSubmitted={() => setRequests(listVerificationRequests(owner))} />
          {requests.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {requests.map((r) => (
                <VerificationRequestCard key={r.id} request={r} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-text-0">Signal log (§13.3)</h2>
          {trust.signals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              Nothing has actually been verified yet — a submission above only starts the process. No institution
              reviewer exists in this build to approve one, so there is no real signal to log yet, only honestly
              empty until one is.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {trust.signals.map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3 text-sm">
                  +{s.weight} {s.type} · {s.source}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function VerificationSubmitForm({ owner, onSubmitted }: { owner: string; onSubmitted: () => void }) {
  const [moduleKey, setModuleKey] = useState<VerificationModuleKey>('identity')
  const [identifierValue, setIdentifierValue] = useState('')
  const [issuerName, setIssuerName] = useState('')
  const [document, setDocument] = useState<MediaAsset | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [scan, setScan] = useState<{ running: boolean; progress: number; found: Partial<ExtractedFields> | null }>({ running: false, progress: 0, found: null })
  const selectedModule = VERIFICATION_MODULES.find((m) => m.key === moduleKey)!

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <Field label="Verification type">
        <SelectInput value={moduleKey} onChange={(e) => setModuleKey(e.target.value as VerificationModuleKey)}>
          {VERIFICATION_MODULES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label={selectedModule.identifierLabel}>
        <TextInput value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} />
      </Field>
      <Field label="Issuing institution / authority" hint="Resolves against real registered organisations on PROFILE where one matches — free text otherwise">
        <EntityAutocomplete value={issuerName} onChange={setIssuerName} fieldContext="tag_institution" multi={false} placeholder="e.g. University of Lagos" />
      </Field>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface-sunken p-3">
        <Button variant="secondary" onClick={() => setScanOpen(true)}>Scan a document</Button>
        <span className="min-w-0 flex-1 text-xs text-text-1">
          Photograph a certificate, licence or ID and we'll read the details on your device to fill this in — you check and edit them before submitting.
        </span>
      </div>
      {scan.running && (
        <p role="status" className="text-xs text-text-1">Reading your document on this device… {Math.round(scan.progress * 100)}%</p>
      )}
      {scan.found && !scan.running && (
        <p className="text-xs text-text-1">
          {scan.found.confidence === 'low' ? "We couldn't read much from that photo — please type the details in." : `We read${scan.found.idNumber ? ` number ${scan.found.idNumber}` : ''}${scan.found.issuer ? ` from ${scan.found.issuer}` : ''} — check the fields below.`}
        </p>
      )}
      <CameraCapture
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Scan a document"
        hint="Lay it flat in good light and fit it inside the frame"
        onCapture={async (file) => {
          setScan({ running: true, progress: 0, found: null })
          try {
            const { text } = await recognizeDocument(file, (p) => setScan((s) => ({ ...s, progress: p.progress })))
            const found = extractDocumentFields(text)
            setScan({ running: false, progress: 1, found })
            if (found.idNumber) setIdentifierValue(found.idNumber)
            if (found.issuer) setIssuerName(found.issuer)
            // Keep the photo as the supporting document (private bucket).
            setUploading(true)
            try {
              setDocument(await uploadMediaAsset({ file, ownerEmail: owner, targetType: 'credential', targetId: crypto.randomUUID() }))
            } finally {
              setUploading(false)
            }
          } catch {
            setScan({ running: false, progress: 0, found: { confidence: 'low' } as Partial<ExtractedFields> })
          }
        }}
      />
      <Field label="Supporting document (optional)" error={uploadError ?? undefined}>
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            setUploadError(null)
            setUploading(true)
            try {
              // Real KYC document capture — Supabase Storage, not the old
              // resizeImage-only path that silently dropped every PDF.
              // target_id is a fresh id; it doesn't need to match the
              // verification request's own id, only to be a stable key this
              // asset is filed under.
              const asset = await uploadMediaAsset({ file, ownerEmail: owner, targetType: 'credential', targetId: crypto.randomUUID() })
              setDocument(asset)
            } catch (err) {
              setUploadError(err instanceof Error ? err.message : 'Could not upload this document.')
            } finally {
              setUploading(false)
            }
          }}
          className="text-xs text-text-1"
        />
        {uploading && <p className="mt-1 text-xs text-text-2">Uploading…</p>}
        {document && !uploading && <p className="mt-1 text-xs text-success">Uploaded — {document.copyrightId}</p>}
      </Field>
      <Button
        disabled={!identifierValue.trim() || !issuerName.trim() || uploading}
        onClick={() => {
          submitVerificationRequest({
            ownerEmail: owner,
            moduleKey,
            moduleName: selectedModule.name,
            identifierValue,
            issuerName,
            documentDataUrl: null,
            documentMediaAssetId: document?.id ?? null,
            documentCopyrightId: document?.copyrightId ?? null,
          })
          setIdentifierValue('')
          setIssuerName('')
          setDocument(null)
          onSubmitted()
        }}
      >
        Submit for verification
      </Button>
    </div>
  )
}

function VerificationRequestCard({ request }: { request: VerificationRequest }) {
  const currentIndex = VERIFICATION_TIMELINE.indexOf(request.status)
  const isRejected = request.status === 'rejected'
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-0">{request.moduleName}</span>
        <span className="text-xs text-text-2">{new Date(request.submittedAt).toLocaleDateString()}</span>
      </div>
      <p className="mb-3 text-xs text-text-1">
        {request.identifierValue} · {request.issuerName}
        {request.documentCopyrightId && <span className="ml-1.5 text-text-2">· 📎 {request.documentCopyrightId}</span>}
      </p>
      {isRejected ? (
        <p className="text-xs text-danger">Rejected — appeal available.</p>
      ) : (
        <div className="flex items-center gap-1">
          {VERIFICATION_TIMELINE.map((step, i) => (
            <div key={step} className="flex flex-1 items-center gap-1">
              <span className={`h-2 w-2 flex-none rounded-full ${i <= currentIndex ? 'bg-accent' : 'bg-border'}`} />
              {i < VERIFICATION_TIMELINE.length - 1 && <span className={`h-0.5 flex-1 ${i < currentIndex ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      )}
      {!isRejected && <p className="mt-1.5 text-[10.5px] uppercase tracking-wide text-text-2">{request.status.replace(/_/g, ' ')}</p>}
    </div>
  )
}

const EXPIRY_OPTIONS: { value: PassportAccessExpiry; label: string }[] = [
  { value: '30_days', label: '30 days' },
  { value: '90_days', label: '90 days' },
  { value: 'until_revoked', label: 'Until revoked' },
]

function ShareModal({ onClose, onShare }: { onClose: () => void; onShare: (sharedWith: string, accessExpiry: PassportAccessExpiry) => void }) {
  const [sharedWith, setSharedWith] = useState('')
  const [accessExpiry, setAccessExpiry] = useState<PassportAccessExpiry>('30_days')

  return (
    <div role="presentation" onClick={onClose} className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(6,14,28,0.55)] p-5 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-[min(460px,100%)] overflow-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-2 text-[17px] font-semibold text-text-0">Share your Trust Passport</div>
        <p className="mb-4 text-sm leading-relaxed text-text-1">
          They will see your verified records, credentials and score — and nothing else. You can withdraw access at
          any time.
        </p>
        <label className="mb-3.5 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-0">Share with</span>
          <input
            autoFocus
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
            placeholder="Organisation or email address"
            className="h-[42px] rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent"
          />
        </label>
        <div className="mb-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-0">Access expires</span>
          <div className="flex flex-wrap gap-1.5">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAccessExpiry(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${accessExpiry === opt.value ? 'bg-accent-solid text-white' : 'border border-border-strong text-text-1'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4 rounded-lg border border-border bg-surface-sunken p-3 text-xs leading-relaxed text-text-1">
          They will be told who shared it and when. Every time they open it, you see it in your access log.
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border-strong px-3.5 py-2 text-sm font-semibold text-text-0">
            Cancel
          </button>
          <button
            disabled={!sharedWith.trim()}
            onClick={() => onShare(sharedWith.trim(), accessExpiry)}
            className="rounded-lg bg-accent-solid px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Share passport
          </button>
        </div>
      </div>
    </div>
  )
}
