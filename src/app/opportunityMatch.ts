import { listActivities } from './activityStore'
import type { JobListing } from './jobStore'

export interface JobMatch {
  /** Share of the listing's required skills the viewer has recorded evidence for; null when the listing names no skills. */
  pct: number | null
  matched: string[]
  missing: string[]
}

/** The skills this account has recorded across their own activities (deduplicated, original casing kept). */
export function recordedSkills(ownerEmail: string): string[] {
  const seen = new Map<string, string>()
  for (const a of listActivities(ownerEmail)) {
    for (const s of a.skills) {
      const t = s.trim()
      if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t)
    }
  }
  return [...seen.values()]
}

/** A real, explainable match: overlap between recorded skills and the listing's required skills — never a guessed score. */
export function matchJob(skills: string[], job: JobListing): JobMatch {
  if (job.requiredSkills.length === 0) return { pct: null, matched: [], missing: [] }
  const have = new Set(skills.map((s) => s.toLowerCase()))
  const matched = job.requiredSkills.filter((r) => have.has(r.toLowerCase()))
  const missing = job.requiredSkills.filter((r) => !have.has(r.toLowerCase()))
  return { pct: Math.round((matched.length / job.requiredSkills.length) * 100), matched, missing }
}
