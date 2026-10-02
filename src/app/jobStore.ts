/**
 * Pipeline repair Phase A — real Supabase-backed `public.jobs` (RLS
 * enforced), replacing the old `localStorage` scaffolding. Same cache +
 * Realtime pattern as activityStore.ts: `postJob`/`closeJob` are real async
 * writes; the read functions stay synchronous, backed by a live cache, since
 * Opportunity Hub/Recruiter Workflow call them inline during render.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { findAccountByEmail } from './demoAccountStore'

/** §18.2 JOB_LISTING_FIELDS — the real listing an org actually posts. */
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

interface JobRow {
  id: string
  org_email: string
  title: string
  work_type: 'remote' | 'hybrid' | 'on_site'
  location: string
  description: string
  required_skills: string[] | null
  salary_range: string | null
  closing_date: string | null
  max_hires: number
  status: 'open' | 'closed'
  created_at: string
}

function rowToListing(r: JobRow): JobListing {
  return {
    id: r.id,
    orgEmail: r.org_email,
    title: r.title,
    workType: r.work_type,
    location: r.location,
    description: r.description,
    requiredSkills: r.required_skills ?? [],
    salaryRange: r.salary_range ?? undefined,
    closingDate: r.closing_date ?? undefined,
    maxHires: r.max_hires,
    status: r.status,
    createdAt: r.created_at,
  }
}

// --- Live cache ---------------------------------------------------------
let cache: JobRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('jobs').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: JobRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  joinRealtime(() =>
    supabase
    .channel('jobs-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
      if (payload.eventType !== 'DELETE') upsertCacheRow(payload.new as JobRow)
    })
    .subscribe(),
  )
}

export function onJobsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useJobsCacheVersion(): number {
  return useSyncExternalStore(onJobsChange, () => cacheVersion, () => cacheVersion)
}

export function listOpenJobs(): JobListing[] {
  return cache
    .filter((j) => j.status === 'open')
    .map(rowToListing)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listJobsByOrg(orgEmail: string): JobListing[] {
  const e = orgEmail.toLowerCase()
  return cache
    .filter((j) => j.org_email.toLowerCase() === e)
    .map(rowToListing)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getJobById(id: string): JobListing | undefined {
  const row = cache.find((j) => j.id === id)
  return row ? rowToListing(row) : undefined
}

export async function postJob(input: Omit<JobListing, 'id' | 'createdAt' | 'status'>): Promise<JobListing> {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      org_email: input.orgEmail,
      title: input.title,
      work_type: input.workType,
      location: input.location,
      description: input.description,
      required_skills: input.requiredSkills,
      salary_range: input.salaryRange ?? null,
      closing_date: input.closingDate ?? null,
      max_hires: input.maxHires,
    })
    .select()
    .single()
  if (error) throw error
  const row = data as JobRow
  upsertCacheRow(row)
  const record = rowToListing(row)

  // Followers are told by the trg_notify_job database trigger (migration 0009).
  return record
}

export async function closeJob(id: string): Promise<void> {
  const { data } = await supabase.from('jobs').update({ status: 'closed' }).eq('id', id).select().maybeSingle()
  if (data) upsertCacheRow(data as JobRow)
}

export function orgDisplayName(orgEmail: string): string {
  return findAccountByEmail(orgEmail)?.legalName ?? 'An organisation'
}
