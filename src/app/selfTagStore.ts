import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'
import { emitEvent } from './eventBus'

/** "I was part of this" requests, stored on the server (public.self_tags): the activity's owner approves or rejects. */
export type SelfTagStatus = 'requested' | 'approved' | 'rejected'

export interface SelfTagRequest {
  id: string
  requesterEmail: string
  requesterName: string
  activityId: string
  activityOwnerEmail: string
  activityTitle: string
  role: string
  status: SelfTagStatus
  requestedAt: string
}

interface Row {
  id: string
  requester_email: string
  requester_name: string
  activity_id: string
  activity_owner_email: string
  activity_title: string
  role: string
  status: SelfTagStatus
  requested_at: string
}

const table = createServerTable<Row>('self_tags')
export const useSelfTagsVersion = table.useVersion
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const toRequest = (r: Row): SelfTagRequest => ({
  id: r.id,
  requesterEmail: r.requester_email,
  requesterName: r.requester_name,
  activityId: r.activity_id,
  activityOwnerEmail: r.activity_owner_email,
  activityTitle: r.activity_title,
  role: r.role,
  status: r.status,
  requestedAt: r.requested_at,
})

export function requestSelfTag(input: { requesterEmail: string; requesterName: string; activityId: string; activityOwnerEmail: string; activityTitle: string; role: string }): void {
  if (table.rows().some((r) => same(r.requester_email, input.requesterEmail) && r.activity_id === input.activityId)) return
  const row: Row = {
    id: crypto.randomUUID(),
    requester_email: input.requesterEmail.toLowerCase(),
    requester_name: input.requesterName,
    activity_id: input.activityId,
    activity_owner_email: input.activityOwnerEmail.toLowerCase(),
    activity_title: input.activityTitle,
    role: input.role,
    status: 'requested',
    requested_at: new Date().toISOString(),
  }
  table.set([...table.rows(), row])
  void persist(table, () => supabase.from('self_tags').insert(row))
    .then(() => emitEvent('tag_request', input.activityOwnerEmail, { deepLink: `/activity/${input.activityId}`, targetType: 'activity', targetId: input.activityId, vars: { role: input.role } }))
    .catch(() => undefined)
}

export function myRequestFor(requesterEmail: string, activityId: string): SelfTagRequest | undefined {
  const r = table.rows().find((x) => same(x.requester_email, requesterEmail) && x.activity_id === activityId)
  return r ? toRequest(r) : undefined
}

export function pendingRequestsForOwner(activityOwnerEmail: string): SelfTagRequest[] {
  return table.rows().filter((r) => same(r.activity_owner_email, activityOwnerEmail) && r.status === 'requested').map(toRequest)
}

export function approvedTagsFor(requesterEmail: string): SelfTagRequest[] {
  return table.rows().filter((r) => same(r.requester_email, requesterEmail) && r.status === 'approved').map(toRequest)
}

export function respondToSelfTag(id: string, status: 'approved' | 'rejected'): void {
  const target = table.rows().find((r) => r.id === id)
  table.set(table.rows().map((r) => (r.id === id ? { ...r, status } : r)))
  void persist(table, () => supabase.rpc('respond_self_tag', { p_id: id, p_status: status }))
    .then(() => {
      if (target) void emitEvent('tag_response', target.requester_email, { deepLink: `/activity/${target.activity_id}`, targetType: 'activity', targetId: target.activity_id, vars: { detail: status } })
    })
    .catch(() => undefined)
}
