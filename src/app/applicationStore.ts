/**
 * Pipeline repair Phase A — real Supabase-backed `public.applications` (RLS
 * enforced: visible only to the applicant and the hiring org), replacing the
 * old `localStorage` scaffolding. Same cache + Realtime pattern as
 * jobStore.ts.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { notify } from './notificationStore'
import { getJobById, orgDisplayName } from './jobStore'
import { findAccountByEmail } from './demoAccountStore'
import { conversationIdFor, sendMessage } from './messageStore'

/** §6.4 Application status, verbatim. */
export type ApplicationStatus = 'submitted' | 'received' | 'under_review' | 'shortlisted' | 'interview' | 'offer' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  jobId: string
  applicantEmail: string
  orgEmail: string
  coverLetter: string
  submittedAt: string
  status: ApplicationStatus
  /** Design handoff gap audit — PROFILE Recruiter Workflow.dc.html's
   * Interview-stage cards show a scheduled slot as a pill. */
  interviewSlot?: string
}

interface ApplicationRow {
  id: string
  job_id: string
  applicant_email: string
  org_email: string
  cover_letter: string
  status: ApplicationStatus
  interview_slot: string | null
  submitted_at: string
}

function rowToApplication(r: ApplicationRow): Application {
  return {
    id: r.id,
    jobId: r.job_id,
    applicantEmail: r.applicant_email,
    orgEmail: r.org_email,
    coverLetter: r.cover_letter,
    submittedAt: r.submitted_at,
    status: r.status,
    interviewSlot: r.interview_slot ?? undefined,
  }
}

// --- Live cache ---------------------------------------------------------
let cache: ApplicationRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('applications').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: ApplicationRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  joinRealtime(() =>
    supabase
    .channel('applications-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (payload) => {
      if (payload.eventType !== 'DELETE') upsertCacheRow(payload.new as ApplicationRow)
    })
    .subscribe(),
  )
}

export function onApplicationsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useApplicationsCacheVersion(): number {
  return useSyncExternalStore(onApplicationsChange, () => cacheVersion, () => cacheVersion)
}

/** §6.1 Apply With PROFILE — one application per job per applicant; a
 * second submit is a no-op rather than a duplicate application (enforced by
 * a real DB unique constraint now, not just an in-memory check). */
export async function submitApplication(input: { jobId: string; applicantEmail: string; orgEmail: string; coverLetter: string }): Promise<Application | undefined> {
  if (cache.some((a) => a.job_id === input.jobId && a.applicant_email.toLowerCase() === input.applicantEmail.toLowerCase())) return undefined
  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: input.jobId, applicant_email: input.applicantEmail, org_email: input.orgEmail, cover_letter: input.coverLetter })
    .select()
    .maybeSingle()
  if (error) {
    // Unique-constraint race (two tabs submitting at once) — treat exactly
    // like the pre-check above, a no-op, not a crash.
    if (error.code === '23505') return undefined
    throw error
  }
  if (!data) return undefined
  const row = data as ApplicationRow
  upsertCacheRow(row)
  const record = rowToApplication(row)

  const applicant = findAccountByEmail(input.applicantEmail)
  const job = getJobById(input.jobId)
  notify({
    recipientEmail: input.orgEmail,
    category: 'opportunities',
    text: `${applicant?.legalName ?? 'Someone'} applied with PROFILE for "${job?.title ?? 'your job listing'}".`,
    deepLink: `/org/recruiter`,
  })
  return record
}

export function listApplicationsFor(applicantEmail: string): Application[] {
  const e = applicantEmail.toLowerCase()
  return cache
    .filter((a) => a.applicant_email.toLowerCase() === e)
    .map(rowToApplication)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function listApplicationsForJob(jobId: string): Application[] {
  return cache.filter((a) => a.job_id === jobId).map(rowToApplication)
}

/** §9's free-tier hire cap — an 'offer' is the real signal of a hiring
 * decision made on this listing; there's no separate "mark as hired" step
 * in this build's pipeline, so counting offers is the honest source. */
export function hiredCountForJob(jobId: string): number {
  return cache.filter((a) => a.job_id === jobId && a.status === 'offer').length
}

export function listApplicationsForOrg(orgEmail: string): Application[] {
  const e = orgEmail.toLowerCase()
  return cache
    .filter((a) => a.org_email.toLowerCase() === e)
    .map(rowToApplication)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function myApplicationFor(jobId: string, applicantEmail: string): Application | undefined {
  const e = applicantEmail.toLowerCase()
  const row = cache.find((a) => a.job_id === jobId && a.applicant_email.toLowerCase() === e)
  return row ? rowToApplication(row) : undefined
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  const { data } = await supabase.from('applications').update({ status }).eq('id', id).select().maybeSingle()
  if (!data) return
  const row = data as ApplicationRow
  upsertCacheRow(row)
  const job = getJobById(row.job_id)
  notify({
    recipientEmail: row.applicant_email,
    category: 'opportunities',
    text: `Your application for "${job?.title ?? 'a job'}" at ${orgDisplayName(row.org_email)} is now "${status.replace(/_/g, ' ')}".`,
    deepLink: `/applications`,
  })
}

/**
 * §18.3/§39 "Confirm & send invite" — a real status change plus a real
 * message on the applicant's own Messages thread with the recruiter,
 * matching the mockup's own disclosure ("interview scheduling never
 * bypasses her notice or consent") instead of a fabricated "sent" toast.
 */
export async function scheduleInterview(id: string, orgEmail: string, slot: string): Promise<void> {
  const { data } = await supabase.from('applications').update({ status: 'interview', interview_slot: slot }).eq('id', id).select().maybeSingle()
  if (!data) return
  const application = rowToApplication(data as ApplicationRow)
  upsertCacheRow(data as ApplicationRow)

  const job = getJobById(application.jobId)
  notify({
    recipientEmail: application.applicantEmail,
    category: 'messages',
    text: `${orgDisplayName(orgEmail)} scheduled an interview for "${job?.title ?? 'your application'}" — ${slot}.`,
    // Pipeline repair: a bare `/messages` landed on "No conversations yet"
    // for the recipient, since they're not a conversation_participants row
    // until they actually open this specific thread (see messageStore.ts's
    // joinConversation) — the `?with=` param is what MessagingCommunities.tsx
    // reads to open and self-register into the right conversation.
    deepLink: `/messages?with=${encodeURIComponent(orgEmail)}`,
  })
  const conversationId = conversationIdFor(orgEmail, application.applicantEmail)
  await sendMessage(conversationId, orgEmail, `We'd like to schedule your interview for "${job?.title ?? 'the role'}" on ${slot}. Let us know if this works.`)
}

export async function withdrawApplication(id: string, applicantEmail: string): Promise<void> {
  const { data } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', id).eq('applicant_email', applicantEmail).select().maybeSingle()
  if (data) upsertCacheRow(data as ApplicationRow)
}
