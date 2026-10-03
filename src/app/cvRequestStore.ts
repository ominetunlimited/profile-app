import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/** Requests to see someone's CV, stored on the server (public.cv_requests): the target sees them and decides. */
export type CvRequestStatus = 'pending' | 'approved' | 'denied'

export interface CvRequest {
  id: string
  requesterEmail: string
  requesterName: string
  targetEmail: string
  targetUsername: string
  status: CvRequestStatus
  requestedAt: string
  respondedAt: string | null
}

interface Row {
  id: string
  requester_email: string
  requester_name: string
  target_email: string
  target_username: string
  status: CvRequestStatus
  requested_at: string
  responded_at: string | null
}

const table = createServerTable<Row>('cv_requests')
export const useCvRequestsVersion = table.useVersion

const toRequest = (r: Row): CvRequest => ({
  id: r.id,
  requesterEmail: r.requester_email,
  requesterName: r.requester_name,
  targetEmail: r.target_email,
  targetUsername: r.target_username,
  status: r.status,
  requestedAt: r.requested_at,
  respondedAt: r.responded_at,
})
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function listRequestsForOwner(targetEmail: string): CvRequest[] {
  return table
    .rows()
    .filter((r) => same(r.target_email, targetEmail))
    .map(toRequest)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}

export function findRequest(requesterEmail: string, targetEmail: string): CvRequest | null {
  const r = table.rows().find((x) => same(x.requester_email, requesterEmail) && same(x.target_email, targetEmail))
  return r ? toRequest(r) : null
}

export function createRequest(input: { requesterEmail: string; requesterName: string; targetEmail: string; targetUsername: string }): CvRequest {
  const row: Row = {
    id: crypto.randomUUID(),
    requester_email: input.requesterEmail.toLowerCase(),
    requester_name: input.requesterName,
    target_email: input.targetEmail.toLowerCase(),
    target_username: input.targetUsername,
    status: 'pending',
    requested_at: new Date().toISOString(),
    responded_at: null,
  }
  table.set([...table.rows(), row])
  void persist(table, () => supabase.from('cv_requests').insert({ id: row.id, requester_email: row.requester_email, requester_name: row.requester_name, target_email: row.target_email, target_username: row.target_username })).catch(() => undefined)
  return toRequest(row)
}

export function respondToRequest(id: string, status: 'approved' | 'denied'): void {
  table.set(table.rows().map((r) => (r.id === id ? { ...r, status, responded_at: new Date().toISOString() } : r)))
  void persist(table, () => supabase.rpc('respond_cv_request', { p_id: id, p_status: status })).catch(() => undefined)
}

export function hasApprovedAccess(requesterEmail: string, targetEmail: string): boolean {
  return findRequest(requesterEmail, targetEmail)?.status === 'approved'
}
