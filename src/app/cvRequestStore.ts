/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 *
 * §4.6/§15.4 + explicit product direction: Portfolio is the public-facing
 * document (visible to any visitor, per §15.4's existing hard rule) — CV is
 * private, visible only to its owner. An organisation/recruiter impressed by
 * someone's public Portfolio requests their CV instead of it being open by
 * default; the individual approves or denies. This store is that real
 * request/response pipeline, distinct from — and not a substitute for — a
 * job Application, which carries its own CV snapshot directly (§4.9).
 */
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

const STORAGE_KEY = 'profile:demo-cv-requests'

function readAll(): CvRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(requests: CvRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listRequestsForOwner(targetEmail: string): CvRequest[] {
  return readAll()
    .filter((r) => r.targetEmail === targetEmail)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}

export function findRequest(requesterEmail: string, targetEmail: string): CvRequest | null {
  return readAll().find((r) => r.requesterEmail === requesterEmail && r.targetEmail === targetEmail) ?? null
}

export function createRequest(input: { requesterEmail: string; requesterName: string; targetEmail: string; targetUsername: string }): CvRequest {
  const request: CvRequest = {
    id: `cvreq-${Date.now()}`,
    ...input,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    respondedAt: null,
  }
  const all = readAll()
  all.push(request)
  writeAll(all)
  return request
}

export function respondToRequest(id: string, status: 'approved' | 'denied'): void {
  const all = readAll()
  const idx = all.findIndex((r) => r.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status, respondedAt: new Date().toISOString() }
  writeAll(all)
}

export function hasApprovedAccess(requesterEmail: string, targetEmail: string): boolean {
  return findRequest(requesterEmail, targetEmail)?.status === 'approved'
}
