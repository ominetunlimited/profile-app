import { emitEvent } from './eventBus'

/**
 * V9 Unified Ecosystem Patch §5 — "Open to mentoring" already existed as a
 * name in Settings' visibility-controls list and §50.9.8's relationship
 * model, but the actual Settings toggle rendered uncontrolled with no
 * store behind it (a real §35 dead-toggle violation, same class of bug as
 * OpportunityHub's previously-inert career-stage buttons). Real, local,
 * persisted state — same temporary-scaffolding pattern as every other
 * store in this build.
 *
 * MenteeRequest is deliberately a separate type/store from
 * connectionStore.ts's ConnectionRecord — the patch is explicit that a
 * mentee request must not be merged into the Connection Request flow.
 */
export interface MentorshipPreference {
  ownerEmail: string
  openToMentoring: boolean
  menteeCapacity: number
}

const PREFS_KEY = 'profile:demo-mentorship-prefs'

function readPrefs(): MentorshipPreference[] {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePrefs(records: MentorshipPreference[]) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function getMentorshipPreference(ownerEmail: string): MentorshipPreference {
  const e = ownerEmail.toLowerCase()
  return readPrefs().find((p) => p.ownerEmail.toLowerCase() === e) ?? { ownerEmail, openToMentoring: false, menteeCapacity: 0 }
}

export function setMentorshipPreference(ownerEmail: string, patch: Partial<Pick<MentorshipPreference, 'openToMentoring' | 'menteeCapacity'>>): void {
  const all = readPrefs()
  const e = ownerEmail.toLowerCase()
  const idx = all.findIndex((p) => p.ownerEmail.toLowerCase() === e)
  const current = idx === -1 ? { ownerEmail, openToMentoring: false, menteeCapacity: 0 } : all[idx]
  const next = { ...current, ...patch }
  if (idx === -1) writePrefs([...all, next])
  else writePrefs(all.map((p, i) => (i === idx ? next : p)))
}

export type MenteeRequestStatus = 'pending' | 'accepted' | 'declined'

export interface MenteeRequest {
  id: string
  menteeEmail: string
  mentorEmail: string
  message: string
  status: MenteeRequestStatus
  requestedAt: string
  respondedAt: string | null
}

const REQUESTS_KEY = 'profile:demo-mentee-requests'

function readRequests(): MenteeRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRequests(records: MenteeRequest[]) {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function menteeRequestState(menteeEmail: string, mentorEmail: string): MenteeRequest | undefined {
  const m = menteeEmail.toLowerCase()
  const t = mentorEmail.toLowerCase()
  return readRequests().find((r) => r.menteeEmail.toLowerCase() === m && r.mentorEmail.toLowerCase() === t)
}

export function sendMenteeRequest(menteeEmail: string, mentorEmail: string, message: string): void {
  if (menteeEmail.toLowerCase() === mentorEmail.toLowerCase()) return
  if (menteeRequestState(menteeEmail, mentorEmail)) return
  const record: MenteeRequest = {
    id: crypto.randomUUID(),
    menteeEmail,
    mentorEmail,
    message,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    respondedAt: null,
  }
  writeRequests([...readRequests(), record])
  void emitEvent('mentorship_request', mentorEmail, { deepLink: '/connections' })
}

export function respondToMenteeRequest(id: string, status: 'accepted' | 'declined'): void {
  const all = readRequests()
  const idx = all.findIndex((r) => r.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status, respondedAt: new Date().toISOString() }
  writeRequests(all)
  void emitEvent('mentorship_response', all[idx].menteeEmail, { deepLink: '/connections', vars: { detail: status } })
}

export function listMenteeRequestsForMentor(mentorEmail: string): MenteeRequest[] {
  const e = mentorEmail.toLowerCase()
  return readRequests()
    .filter((r) => r.mentorEmail.toLowerCase() === e)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}
