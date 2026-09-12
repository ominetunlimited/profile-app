import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { Button } from '@/shared/ui/Button'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { resizeImage } from '@/app/mediaStore'
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
  const trust = computeTrustScore(account)
  const [requests, setRequests] = useState(() => listVerificationRequests(owner))
  const ringPct = trust.total / 1000
  const circumference = 2 * Math.PI * 54

  const dimensionSignals: Record<keyof TrustDimensions, string[]> = {
    identityTrust: [], academicTrust: [], professionalTrust: [], employmentTrust: [],
    marketplaceTrust: [], organisationalTrust: [], recruitmentTrust: [], contributionTrust: [],
  }
  for (const [signal, dimension] of Object.entries(TRUST_DIMENSION_SIGNAL_MAP)) {
    dimensionSignals[dimension].push(signal)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-2">Trust Passport</div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Your Trust Score</h1>

        <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:gap-8">
          <svg width="140" height="140" viewBox="0 0 120 120" className="flex-none">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={trust.tier.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ringPct)}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
            <text x="60" y="56" textAnchor="middle" className="fill-current text-text-0" style={{ fontSize: 26, fontWeight: 700 }}>
              {trust.total}
            </text>
            <text x="60" y="76" textAnchor="middle" className="fill-current text-text-2" style={{ fontSize: 11 }}>
              / 1000
            </text>
          </svg>
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
            Every signal below needs a real institutional/employer/client verification to contribute — none exist
            yet in this build, so each is honestly 0 rather than estimated.
          </p>
          {(Object.keys(TRUST_DIMENSION_LABELS) as (keyof TrustDimensions)[]).map((dim) => (
            <div key={dim} className="mb-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-2">{TRUST_DIMENSION_LABELS[dim]}</div>
              <div className="flex flex-col gap-1">
                {dimensionSignals[dim].map((signal) => (
                  <div key={signal} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-xs">
                    <span className="text-text-1">{signal.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-text-2">0 / {TRUST_WEIGHTS[signal as keyof typeof TRUST_WEIGHTS]}</span>
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
  const [documentDataUrl, setDocumentDataUrl] = useState<string | null>(null)
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
      <Field label="Issuing institution / authority">
        <TextInput value={issuerName} onChange={(e) => setIssuerName(e.target.value)} placeholder="e.g. University of Lagos" />
      </Field>
      <Field label="Supporting document (optional)">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (file.type === 'application/pdf') return // resizeImage only handles images; PDF storage needs a real file backend
            resizeImage(file, 1600).then(setDocumentDataUrl)
          }}
          className="text-xs text-text-1"
        />
      </Field>
      <Button
        disabled={!identifierValue.trim() || !issuerName.trim()}
        onClick={() => {
          submitVerificationRequest({ ownerEmail: owner, moduleKey, moduleName: selectedModule.name, identifierValue, issuerName, documentDataUrl })
          setIdentifierValue('')
          setIssuerName('')
          setDocumentDataUrl(null)
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
