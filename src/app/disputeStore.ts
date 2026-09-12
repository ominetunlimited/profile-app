/** Temporary client-only scaffolding, same caveats as demoAccountStore.ts. */

/** §50.1 Dispute interface, verbatim shape. */
export interface DisputeRecord {
  id: string
  ownerEmail: string
  disputeType: 'verification_decision' | 'trust_score_change' | 'recruiter_filter_exclusion' | 'moderation_action' | 'institutional_rejection'
  targetId: string
  reason: string
  status: 'submitted' | 'under_review' | 'upheld' | 'corrected' | 'removed' | 'escalated' | 'independent_review'
  submittedAt: string
}

const STORAGE_KEY = 'profile:demo-disputes'

function readAll(): DisputeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(records: DisputeRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listDisputes(ownerEmail: string): DisputeRecord[] {
  return readAll()
    .filter((d) => d.ownerEmail === ownerEmail)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function fileDispute(input: Omit<DisputeRecord, 'id' | 'status' | 'submittedAt'>): DisputeRecord {
  const record: DisputeRecord = { ...input, id: crypto.randomUUID(), status: 'submitted', submittedAt: new Date().toISOString() }
  writeAll([...readAll(), record])
  return record
}
