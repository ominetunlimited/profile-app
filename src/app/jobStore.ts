import { notify } from './notificationStore'
import { findAccountByEmail } from './demoAccountStore'
import { listFollowersOf } from './followStore'

/** §18.2 JOB_LISTING_FIELDS — the real listing an org actually posts.
 * Previously Opportunity Hub and Recruiter Workflow both said "not built
 * yet"; this is the real store both now read from and write to. */
export interface JobListing {
  id: string
  orgEmail: string
  title: string
  workType: 'remote' | 'hybrid' | 'on_site'
  location: string
  description: string
  requiredSkills: string[]
  salaryRange?: string
  closingDate?: string
  /**
   * V9 Unified Ecosystem Patch §9 — "Create Opportunity" is free-tier,
   * capped at hiring up to 5 people per posting; this build has no real
   * payment processor anywhere (adStore.ts, PremiumPlansTab), so every
   * account here is honestly on the free tier and the cap applies
   * platform-wide rather than gating on a subscription field that would
   * otherwise never be real. Distinct from the paid Ads Centre / Recruiter
   * Hub posting path (§10), which is unaffected by this cap.
   */
  maxHires: number
  status: 'open' | 'closed'
  createdAt: string
}

export const FREE_TIER_MAX_HIRES = 5

const STORAGE_KEY = 'profile:demo-jobs'

function readAll(): JobListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: JobListing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listOpenJobs(): JobListing[] {
  return readAll()
    .filter((j) => j.status === 'open')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listJobsByOrg(orgEmail: string): JobListing[] {
  const e = orgEmail.toLowerCase()
  return readAll()
    .filter((j) => j.orgEmail.toLowerCase() === e)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getJobById(id: string): JobListing | undefined {
  return readAll().find((j) => j.id === id)
}

export function postJob(input: Omit<JobListing, 'id' | 'createdAt' | 'status'>): JobListing {
  const record: JobListing = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'open' }
  writeAll([...readAll(), record])

  // §14/§4.2's org-notification pattern extended outward: real followers of
  // this org (followStore.ts) are told a real job went live, not a blast to
  // every account on the browser.
  const orgName = orgDisplayName(input.orgEmail)
  for (const followerEmail of listFollowersOf(input.orgEmail)) {
    notify({ recipientEmail: followerEmail, category: 'opportunities', text: `${orgName} posted a new opportunity: ${input.title}.`, deepLink: `/job/${record.id}` })
  }
  return record
}

export function closeJob(id: string): void {
  const all = readAll()
  const idx = all.findIndex((j) => j.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'closed' }
  writeAll(all)
}

export function orgDisplayName(orgEmail: string): string {
  return findAccountByEmail(orgEmail)?.legalName ?? 'An organisation'
}
