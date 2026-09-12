/**
 * §11.3 Self-Tag System. Real request/approval pipeline. Scope note: once
 * approved, §11.3 says "tag appears on tagged user's CV/Portfolio with role
 * attribution" — this build shows the approved tag on the tagged person's
 * own Profile (Overview tab) as real evidence of the collaboration; full
 * auto-inclusion into their CV's Experience section (mixing another
 * account's activity into a different account's CVDetails store) is a
 * further step not completed here, flagged rather than half-built.
 */
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

const STORAGE_KEY = 'profile:demo-self-tags'

function readAll(): SelfTagRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(requests: SelfTagRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function requestSelfTag(input: { requesterEmail: string; requesterName: string; activityId: string; activityOwnerEmail: string; activityTitle: string; role: string }): void {
  const all = readAll()
  if (all.some((r) => r.requesterEmail === input.requesterEmail && r.activityId === input.activityId)) return
  all.push({ id: `tag-${Date.now()}`, ...input, status: 'requested', requestedAt: new Date().toISOString() })
  writeAll(all)
}

export function myRequestFor(requesterEmail: string, activityId: string): SelfTagRequest | undefined {
  return readAll().find((r) => r.requesterEmail === requesterEmail && r.activityId === activityId)
}

export function pendingRequestsForOwner(activityOwnerEmail: string): SelfTagRequest[] {
  return readAll().filter((r) => r.activityOwnerEmail === activityOwnerEmail && r.status === 'requested')
}

export function approvedTagsFor(requesterEmail: string): SelfTagRequest[] {
  return readAll().filter((r) => r.requesterEmail === requesterEmail && r.status === 'approved')
}

export function respondToSelfTag(id: string, status: 'approved' | 'rejected'): void {
  const all = readAll()
  const idx = all.findIndex((r) => r.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status }
  writeAll(all)
}
