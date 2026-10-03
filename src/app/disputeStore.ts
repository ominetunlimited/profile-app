import { supabase } from './supabaseClient'

/**
 * Disputes & appeals, server-side (public.disputes, RLS-enforced): a person files one, a PROFILE reviewer
 * sees it in the Admin Centre and records an outcome, and the person is notified.
 */
export type DisputeType = 'verification_decision' | 'trust_score_change' | 'recruiter_filter_exclusion' | 'moderation_action' | 'institutional_rejection'
export type DisputeStatus = 'submitted' | 'under_review' | 'upheld' | 'corrected' | 'removed' | 'escalated' | 'independent_review'

export interface DisputeRecord {
  id: string
  ownerEmail: string
  disputeType: DisputeType
  targetId: string
  reason: string
  evidenceAssetIds: string[]
  status: DisputeStatus
  reviewerNote: string | null
  submittedAt: string
  resolvedAt: string | null
}

interface Row {
  id: string
  owner_email: string
  dispute_type: DisputeType
  target_id: string
  reason: string
  evidence_asset_ids: string[]
  status: DisputeStatus
  reviewer_note: string | null
  created_at: string
  resolved_at: string | null
}

const toRecord = (r: Row): DisputeRecord => ({
  id: r.id,
  ownerEmail: r.owner_email,
  disputeType: r.dispute_type,
  targetId: r.target_id,
  reason: r.reason,
  evidenceAssetIds: r.evidence_asset_ids ?? [],
  status: r.status,
  reviewerNote: r.reviewer_note,
  submittedAt: r.created_at,
  resolvedAt: r.resolved_at,
})

export const OPEN_STATUSES: DisputeStatus[] = ['submitted', 'under_review', 'escalated', 'independent_review']

/** Disputes visible to this account: their own, or — for a reviewer — all of them. */
async function fetchAll(): Promise<DisputeRecord[]> {
  const { data, error } = await supabase.from('disputes').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as Row[]).map(toRecord)
}

export async function listMyDisputes(ownerEmail: string): Promise<DisputeRecord[]> {
  return (await fetchAll()).filter((d) => d.ownerEmail.toLowerCase() === ownerEmail.toLowerCase())
}

export const listAllDisputes = fetchAll

export async function fileDispute(input: { ownerEmail: string; disputeType: DisputeType; targetId: string; reason: string; evidenceAssetIds?: string[] }): Promise<DisputeRecord> {
  const { data, error } = await supabase
    .from('disputes')
    .insert({
      owner_email: input.ownerEmail,
      dispute_type: input.disputeType,
      target_id: input.targetId,
      reason: input.reason.trim(),
      evidence_asset_ids: input.evidenceAssetIds ?? [],
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toRecord(data as Row)
}

export async function resolveDispute(id: string, decision: Exclude<DisputeStatus, 'submitted'>, note = ''): Promise<void> {
  const { error } = await supabase.rpc('staff_resolve_dispute', { did: id, decision, note })
  if (error) throw new Error(error.message)
}
