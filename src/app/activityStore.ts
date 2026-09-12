/**
 * TEMPORARY client-only scaffolding (same pattern and same caveats as
 * `demoAccountStore.ts`) so Home's feed, the Record Work composer, and
 * Onboarding's first-activity step share one real, persisted list instead of
 * each faking its own local state. Replace wholesale with real API calls once
 * a backend exists — never extend this file into a permanent data layer.
 */
import type { Account } from './accountTypes'

/** Simplified §4.3 Activity — the fields this build's UI actually reads/writes. */
export interface ActivityRecord {
  id: string
  ownerEmail: string
  type: string
  title: string
  description: string
  role?: string
  organisation?: string
  /** Patch (pre-Phase-7) B4: per-entry location — the Master Prompt names
   * WorkEntry but never field-specifies it (§4.6); added since a work
   * entry's location is real, user-enterable data, not an inference. */
  location?: string
  skills: string[]
  /** §4.3/§4.8 — tools are a distinct attribution axis from skills (a tool
   * tag auto-feeds the ToolStack/CV Tools section, a skill doesn't). Kept as
   * free-text tags here rather than the full editorial-controlled Tool
   * registry §4.8 describes — no tool directory/provider-integration
   * backend exists to validate against yet. */
  tools: string[]
  /** §4.3 `collaborators` — real, user-entered names. The spec's
   * `Collaborator[]` links to other PROFILE accounts with an approval step
   * before appearing on the tagged person's own CV; no multi-user backend
   * exists to do that linking/approval yet, so these are honestly
   * unverified free-text names, never presented as a confirmed tag. */
  collaborators: string[]
  cvPortfolioInclude: boolean
  visibility: 'public' | 'connections_only' | 'private'
  createdAt: string
}

const STORAGE_KEY = 'profile:demo-activities'

function readAll(): ActivityRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(records: ActivityRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function ownerKey(account: Account | null): string {
  if (!account) return ''
  return account.accountType === 'individual' ? account.email : account.officialEmail
}

export function listActivities(ownerEmail: string): ActivityRecord[] {
  return readAll()
    .filter((a) => a.ownerEmail === ownerEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function postActivity(input: Omit<ActivityRecord, 'id' | 'createdAt'>): ActivityRecord {
  const record: ActivityRecord = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  writeAll([...readAll(), record])
  return record
}
