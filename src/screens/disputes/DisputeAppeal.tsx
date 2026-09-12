import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { fileDispute, listDisputes, type DisputeRecord } from '@/app/disputeStore'

const DISPUTE_TYPES: { value: DisputeRecord['disputeType']; label: string }[] = [
  { value: 'verification_decision', label: 'A verification decision' },
  { value: 'trust_score_change', label: 'A trust score change' },
  { value: 'recruiter_filter_exclusion', label: 'Being excluded from a recruiter filter' },
  { value: 'moderation_action', label: 'A moderation action' },
  { value: 'institutional_rejection', label: 'An institution wrongly rejecting a valid credential' },
]

const STATUS_LABEL: Record<DisputeRecord['status'], string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  upheld: 'Upheld',
  corrected: 'Corrected',
  removed: 'Removed',
  escalated: 'Escalated',
  independent_review: 'Independent review',
}

/** §50.1 Dispute & Appeal — extends §28.4 Enforcement Escalation. Every
 * decision is documented, explainable, and appealable within 14 days. */
export function DisputeAppeal() {
  const { recordId } = useParams<{ recordId: string }>()
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [disputes, setDisputes] = useState<DisputeRecord[]>(() => listDisputes(owner))
  const [type, setType] = useState<DisputeRecord['disputeType']>('verification_decision')
  const [reason, setReason] = useState('')
  const [attempted, setAttempted] = useState(false)

  return (
    <AppShell>
      <div className="mx-auto max-w-[680px] px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-text-0">Dispute & appeal</h1>
        <p className="mb-6 text-sm text-text-1">
          Every decision on PROFILE is documented, explainable, and appealable within 14 days.
          {recordId && recordId !== 'new' && (
            <>
              {' '}
              Filing for record <span className="font-mono text-xs">{recordId}</span>.
            </>
          )}
        </p>

        <div className="mb-8 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex flex-col gap-3">
            <Field label="What are you disputing?">
              <SelectInput value={type} onChange={(e) => setType(e.target.value as DisputeRecord['disputeType'])}>
                {DISPUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Explain what happened" error={attempted && !reason.trim() ? 'Explain what happened before submitting.' : undefined}>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setAttempted(false)
                }}
                rows={4}
                className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
                placeholder="What decision are you disputing, and why do you believe it's wrong?"
              />
            </Field>
          </div>
          <Button
            onClick={() => {
              if (!reason.trim()) {
                setAttempted(true)
                return
              }
              fileDispute({ ownerEmail: owner, disputeType: type, targetId: recordId ?? 'unspecified', reason })
              setDisputes(listDisputes(owner))
              setReason('')
              setAttempted(false)
            }}
          >
            Submit dispute
          </Button>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-text-0">Your disputes</h2>
        {disputes.length === 0 ? (
          <p className="text-sm text-text-1">No disputes filed yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {disputes.map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-0">{DISPUTE_TYPES.find((t) => t.value === d.disputeType)?.label}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-text-2">{STATUS_LABEL[d.status]}</span>
                </div>
                <p className="text-sm text-text-1">{d.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
