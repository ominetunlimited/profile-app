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
   * Interview-stage cards show a scheduled slot as a pill; previously no
   * field existed to hold one. */
  interviewSlot?: string
}

const STORAGE_KEY = 'profile:demo-applications'

function readAll(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: Application[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

/** §6.1 Apply With PROFILE — one application per job per applicant; a
 * second submit is a no-op rather than a duplicate application. */
export function submitApplication(input: { jobId: string; applicantEmail: string; orgEmail: string; coverLetter: string }): Application | undefined {
  const all = readAll()
  if (all.some((a) => a.jobId === input.jobId && a.applicantEmail.toLowerCase() === input.applicantEmail.toLowerCase())) return undefined
  const record: Application = { ...input, id: crypto.randomUUID(), submittedAt: new Date().toISOString(), status: 'submitted' }
  writeAll([...all, record])

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
  return readAll()
    .filter((a) => a.applicantEmail.toLowerCase() === e)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function listApplicationsForJob(jobId: string): Application[] {
  return readAll().filter((a) => a.jobId === jobId)
}

/** §9's free-tier hire cap — an 'offer' is the real signal of a hiring
 * decision made on this listing; there's no separate "mark as hired" step
 * in this build's pipeline, so counting offers is the honest source. */
export function hiredCountForJob(jobId: string): number {
  return readAll().filter((a) => a.jobId === jobId && a.status === 'offer').length
}

export function listApplicationsForOrg(orgEmail: string): Application[] {
  const e = orgEmail.toLowerCase()
  return readAll()
    .filter((a) => a.orgEmail.toLowerCase() === e)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function myApplicationFor(jobId: string, applicantEmail: string): Application | undefined {
  const e = applicantEmail.toLowerCase()
  return readAll().find((a) => a.jobId === jobId && a.applicantEmail.toLowerCase() === e)
}

export function updateApplicationStatus(id: string, status: ApplicationStatus): void {
  const all = readAll()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status }
  writeAll(all)
  const job = getJobById(all[idx].jobId)
  notify({
    recipientEmail: all[idx].applicantEmail,
    category: 'opportunities',
    text: `Your application for "${job?.title ?? 'a job'}" at ${orgDisplayName(all[idx].orgEmail)} is now "${status.replace(/_/g, ' ')}".`,
    deepLink: `/applications`,
  })
}

/**
 * §18.3/§39 "Confirm & send invite" — a real status change plus a real
 * message on the applicant's own Messages thread with the recruiter,
 * matching the mockup's own disclosure ("interview scheduling never
 * bypasses her notice or consent") instead of a fabricated "sent" toast.
 */
export function scheduleInterview(id: string, orgEmail: string, slot: string): void {
  const all = readAll()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'interview', interviewSlot: slot }
  writeAll(all)

  const application = all[idx]
  const job = getJobById(application.jobId)
  notify({
    recipientEmail: application.applicantEmail,
    category: 'messages',
    text: `${orgDisplayName(orgEmail)} scheduled an interview for "${job?.title ?? 'your application'}" — ${slot}.`,
    deepLink: `/messages`,
  })
  const conversationId = conversationIdFor(orgEmail, application.applicantEmail)
  sendMessage(conversationId, orgEmail, `We'd like to schedule your interview for "${job?.title ?? 'the role'}" on ${slot}. Let us know if this works.`)
}

export function withdrawApplication(id: string, applicantEmail: string): void {
  const all = readAll()
  const idx = all.findIndex((a) => a.id === id && a.applicantEmail.toLowerCase() === applicantEmail.toLowerCase())
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'withdrawn' }
  writeAll(all)
}
