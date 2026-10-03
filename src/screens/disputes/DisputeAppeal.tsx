import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Field, SelectInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { fileDispute, listMyDisputes, OPEN_STATUSES, type DisputeRecord, type DisputeStatus } from '@/app/disputeStore'
import { listVerificationRequests, useVerificationVersion } from '@/app/verificationRequestStore'
import { uploadMediaAsset, type MediaAsset } from '@/app/mediaAssetStore'

const DISPUTE_TYPES: { value: DisputeRecord['disputeType']; label: string }[] = [
  { value: 'verification_decision', label: 'A verification decision' },
  { value: 'trust_score_change', label: 'A trust score change' },
  { value: 'recruiter_filter_exclusion', label: 'Being excluded from a recruiter filter' },
  { value: 'moderation_action', label: 'A moderation action' },
  { value: 'institutional_rejection', label: 'An institution wrongly rejecting a valid credential' },
]

const STATUS_LABEL: Record<DisputeStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  upheld: 'Upheld',
  corrected: 'Corrected',
  removed: 'Removed',
  escalated: 'Escalated',
  independent_review: 'Independent review',
}

/** The five-step path from the design, driven by the latest dispute's real status. */
const STEPS = ['Rejected', 'Dispute filed', 'Under review', 'Outcome issued', 'Resolved'] as const
function stepIndex(latest: DisputeRecord | undefined): number {
  if (!latest) return 0
  if (latest.status === 'submitted') return 1
  if (OPEN_STATUSES.includes(latest.status)) return 2
  return 4
}

/** Dispute & appeal: contest a decision. A PROFILE reviewer examines both sides' evidence — never an automated final answer. */
export function DisputeAppeal() {
  const { recordId } = useParams<{ recordId: string }>()
  const { account } = useAccount()
  const owner = ownerKey(account)
  useVerificationVersion()
  const [disputes, setDisputes] = useState<DisputeRecord[] | null>(null)
  const [type, setType] = useState<DisputeRecord['disputeType']>('verification_decision')
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState<MediaAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When opened from a rejected verification request, show that record.
  const target = recordId && recordId !== 'new' ? listVerificationRequests(owner).find((r) => r.id === recordId) : undefined

  useEffect(() => {
    let live = true
    listMyDisputes(owner)
      .then((d) => live && setDisputes(d))
      .catch(() => live && setDisputes([]))
    return () => {
      live = false
    }
  }, [owner])

  const latest = disputes?.[0]
  const current = stepIndex(latest)

  async function submit() {
    if (!reason.trim()) {
      setAttempted(true)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const d = await fileDispute({ ownerEmail: owner, disputeType: type, targetId: recordId ?? 'unspecified', reason, evidenceAssetIds: evidence.map((e) => e.id) })
      setDisputes((all) => [d, ...(all ?? [])])
      setReason('')
      setEvidence([])
      setAttempted(false)
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 pb-16 pt-6 sm:px-7">
        <h1 className="mb-1.5 text-2xl font-bold leading-tight tracking-tight text-text-0">Dispute &amp; appeal</h1>
        <p className="mb-[22px] text-[13px] leading-relaxed text-text-1">
          A rejected or revoked record can always be disputed. A PROFILE reviewer examines both sides' evidence — never an automated final answer.
        </p>

        <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Dispute progress">
          {STEPS.map((s, i) => {
            const tone =
              i === 0
                ? 'border-danger bg-danger-soft text-danger'
                : i === 4 && current === 4
                  ? 'border-success bg-success-soft text-success'
                  : i === current
                    ? 'border-border-strong bg-surface-sunken text-text-0'
                    : i < current
                      ? 'border-border-strong bg-surface-sunken text-text-0'
                      : 'border-border-strong bg-surface text-text-1'
            return (
              <li key={s} className="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
                <span className={`rounded-full border-[1.5px] px-3 py-1.5 text-[11.5px] font-semibold ${tone}`}>{s}</span>
                {i < STEPS.length - 1 && (
                  <span aria-hidden className="text-text-2">
                    →
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        {target && (
          <div className="mb-[22px] rounded-[13px] border border-warning bg-warning-soft px-[18px] py-4">
            <div className="mb-1.5 text-[13px] font-semibold text-text-0">
              {target.moduleName} — {target.status === 'rejected' ? `rejected by ${target.issuerName}` : `${target.status.replace(/_/g, ' ')} with ${target.issuerName}`}
            </div>
            <div className="text-[12.5px] leading-relaxed text-text-1">
              {target.decidedAt ? `Decided ${new Date(target.decidedAt).toLocaleDateString()}` : `Submitted ${new Date(target.submittedAt).toLocaleDateString()}`}
              {target.decisionNote ? `: "${target.decisionNote}"` : '.'}
            </div>
          </div>
        )}

        <div className="mb-4 rounded-[13px] border border-border bg-surface px-[22px] py-5 shadow-sm">
          <div className="mb-2.5 text-[13.5px] font-semibold text-text-0">Your case for dispute</div>
          <div className="mb-3">
            <Field label="What are you disputing?">
              <SelectInput value={type} onChange={(e) => setType(e.target.value as DisputeRecord['disputeType'])}>
                {DISPUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Explain why you believe this decision was incorrect" error={attempted && !reason.trim() ? 'Explain what happened before submitting.' : undefined}>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setAttempted(false)
              }}
              rows={4}
              className="mb-3 w-full resize-y rounded-[9px] border border-border-strong bg-surface px-[13px] py-[11px] text-[13px] leading-relaxed text-text-0 outline-none focus-visible:border-accent"
              placeholder="Explain why you believe this rejection was incorrect"
            />
          </Field>
          <div className="mb-2 text-xs font-semibold text-text-0">Supporting evidence</div>
          <div className="mb-3.5 flex flex-wrap gap-2">
            {evidence.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-[9px] border border-dashed border-border-strong px-3.5 py-2.5 font-mono text-[11.5px] text-text-1">
                {e.fileName}
                <button type="button" onClick={() => setEvidence((all) => all.filter((x) => x.id !== e.id))} aria-label={`Remove ${e.fileName}`} className="font-sans font-semibold text-danger">
                  ✕
                </button>
              </div>
            ))}
            <label className={`cursor-pointer rounded-[9px] border border-dashed border-border-strong px-3.5 py-2.5 font-mono text-[11.5px] text-text-2 hover:border-accent ${uploading ? 'opacity-60' : ''}`}>
              {uploading ? 'Uploading…' : '+ Add file'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={async (ev) => {
                  const file = ev.target.files?.[0]
                  ev.target.value = ''
                  if (!file) return
                  setUploading(true)
                  setError(null)
                  try {
                    const asset = await uploadMediaAsset({ file, ownerEmail: owner, targetType: 'credential', targetId: crypto.randomUUID() })
                    setEvidence((all) => [...all, asset])
                  } catch (e) {
                    setError((e as Error).message)
                  }
                  setUploading(false)
                }}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="mb-2 text-xs text-danger">
              {error}
            </p>
          )}
          <button type="button" disabled={busy || uploading} onClick={() => void submit()} className="h-10 rounded-[9px] bg-accent-solid px-4 text-[13px] font-semibold text-white disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit dispute'}
          </button>
        </div>

        <p className="mb-8 text-[11.5px] leading-[1.7] text-text-1">You'll be notified at every stage — never left waiting without word.</p>

        <h2 className="mb-3 text-sm font-semibold text-text-0">Your disputes</h2>
        {disputes === null ? (
          <p className="text-sm text-text-1">Loading…</p>
        ) : disputes.length === 0 ? (
          <p className="text-sm text-text-1">No disputes filed yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {disputes.map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-0">{DISPUTE_TYPES.find((t) => t.value === d.disputeType)?.label}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-text-2">{STATUS_LABEL[d.status]}</span>
                </div>
                <p className="text-sm text-text-1">{d.reason}</p>
                <p className="mt-1 text-[11px] text-text-2">Filed {new Date(d.submittedAt).toLocaleDateString()}</p>
                {d.reviewerNote && <p className="mt-1.5 rounded-md bg-surface-sunken p-2 text-xs text-text-0">Reviewer: {d.reviewerNote}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
