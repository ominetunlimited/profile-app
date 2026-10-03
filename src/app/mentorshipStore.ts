import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'
import { emitEvent } from './eventBus'

/** Mentorship, stored on the server: your mentoring availability (visible to people who can see your profile) and mentee requests (visible to the two people involved). */
export interface MentorshipPreference {
  ownerEmail: string
  openToMentoring: boolean
  menteeCapacity: number
}

interface PrefRow {
  owner_email: string
  open_to_mentoring: boolean
  mentee_capacity: number
}

const prefs = createServerTable<PrefRow>('mentorship_prefs')
export const useMentorshipVersion = prefs.useVersion
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function getMentorshipPreference(ownerEmail: string): MentorshipPreference {
  const r = prefs.rows().find((p) => same(p.owner_email, ownerEmail))
  return r ? { ownerEmail, openToMentoring: r.open_to_mentoring, menteeCapacity: r.mentee_capacity } : { ownerEmail, openToMentoring: false, menteeCapacity: 0 }
}

export function setMentorshipPreference(ownerEmail: string, patch: Partial<Pick<MentorshipPreference, 'openToMentoring' | 'menteeCapacity'>>): void {
  const current = getMentorshipPreference(ownerEmail)
  const next = { ...current, ...patch }
  const row: PrefRow = { owner_email: ownerEmail.toLowerCase(), open_to_mentoring: next.openToMentoring, mentee_capacity: Math.max(0, Math.min(200, Math.round(next.menteeCapacity))) }
  prefs.set([...prefs.rows().filter((p) => !same(p.owner_email, ownerEmail)), row])
  void persist(prefs, () => supabase.from('mentorship_prefs').upsert(row, { onConflict: 'owner_email' })).catch(() => undefined)
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

interface ReqRow {
  id: string
  mentee_email: string
  mentor_email: string
  message: string
  status: MenteeRequestStatus
  requested_at: string
  responded_at: string | null
}

const requests = createServerTable<ReqRow>('mentee_requests')
export const useMenteeRequestsVersion = requests.useVersion

const toRequest = (r: ReqRow): MenteeRequest => ({ id: r.id, menteeEmail: r.mentee_email, mentorEmail: r.mentor_email, message: r.message, status: r.status, requestedAt: r.requested_at, respondedAt: r.responded_at })

export function menteeRequestState(menteeEmail: string, mentorEmail: string): MenteeRequest | undefined {
  const r = requests.rows().find((x) => same(x.mentee_email, menteeEmail) && same(x.mentor_email, mentorEmail))
  return r ? toRequest(r) : undefined
}

export function sendMenteeRequest(menteeEmail: string, mentorEmail: string, message: string): void {
  if (same(menteeEmail, mentorEmail) || menteeRequestState(menteeEmail, mentorEmail)) return
  const row: ReqRow = { id: crypto.randomUUID(), mentee_email: menteeEmail.toLowerCase(), mentor_email: mentorEmail.toLowerCase(), message: message.slice(0, 1000), status: 'pending', requested_at: new Date().toISOString(), responded_at: null }
  requests.set([...requests.rows(), row])
  void persist(requests, () => supabase.from('mentee_requests').insert({ id: row.id, mentee_email: row.mentee_email, mentor_email: row.mentor_email, message: row.message }))
    .then(() => emitEvent('mentorship_request', mentorEmail, { deepLink: '/connections' }))
    .catch(() => undefined)
}

export function respondToMenteeRequest(id: string, status: 'accepted' | 'declined'): void {
  const target = requests.rows().find((r) => r.id === id)
  requests.set(requests.rows().map((r) => (r.id === id ? { ...r, status, responded_at: new Date().toISOString() } : r)))
  void persist(requests, () => supabase.rpc('respond_mentee_request', { p_id: id, p_status: status }))
    .then(() => {
      if (target) void emitEvent('mentorship_response', target.mentee_email, { deepLink: '/connections', vars: { detail: status } })
    })
    .catch(() => undefined)
}

export function listMenteeRequestsForMentor(mentorEmail: string): MenteeRequest[] {
  return requests
    .rows()
    .filter((r) => same(r.mentor_email, mentorEmail))
    .map(toRequest)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}
