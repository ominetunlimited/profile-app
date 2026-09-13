/**
 * TEMPORARY client-only scaffolding (same pattern and same caveats as
 * `demoAccountStore.ts`) so Home's feed, the Record Work composer, and
 * Onboarding's first-activity step share one real, persisted list instead of
 * each faking its own local state. Replace wholesale with real API calls once
 * a backend exists — never extend this file into a permanent data layer.
 */
import type { Account } from './accountTypes'
import { listFollowedOrgs } from './followStore'
import { listConnectedEmails } from './connectionStore'
import { recordToolReferences } from './providerReferenceStore'

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

/** Defends against records saved by an earlier version of this build before
 * skills/tools/collaborators existed on ActivityRecord (or a real user
 * leaving them blank) — every reader downstream (HomePage, CareerGrowthPage,
 * OnboardingPage, badgeStore, AnalyticsPage) does `.skills.length` etc.
 * directly, so this is the one place that needs to normalise rather than
 * every call site guarding separately. */
function normalize(a: Partial<ActivityRecord> & Record<string, unknown>): ActivityRecord {
  return {
    ...a,
    skills: Array.isArray(a.skills) ? a.skills : [],
    tools: Array.isArray(a.tools) ? a.tools : [],
    collaborators: Array.isArray(a.collaborators) ? a.collaborators : [],
  } as ActivityRecord
}

function readAll(): ActivityRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalize) : []
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
  // §1.4 Provider Notification: real, honest "used" logging for any tool
  // that resolves to the real catalogue (toolCatalogue.ts) — never a claim
  // of endorsement, and never invented for a tool with no known provider.
  recordToolReferences(record.id, record.ownerEmail, record.tools)
  return record
}

export function getActivityById(id: string): ActivityRecord | undefined {
  return readAll().find((a) => a.id === id)
}

/**
 * §1's real Home feed requirement: not just the signed-in account's own
 * posts, but real activity from accounts they actually have a relationship
 * with — followed organisations (followStore.ts) and connected individuals
 * (connectionStore.ts) — restricted to what that relationship is honestly
 * allowed to see (their `public` activity; a connection additionally sees
 * `connections_only`). The owner always sees their own activity at every
 * visibility level, same as before.
 */
export function listFeedFor(ownerEmail: string): ActivityRecord[] {
  if (!ownerEmail) return []
  const own = ownerEmail.toLowerCase()
  const connectedEmails = new Set(listConnectedEmails(ownerEmail).map((e) => e.toLowerCase()))
  const followedOrgs = new Set(listFollowedOrgs(ownerEmail).map((e) => e.toLowerCase()))

  return readAll()
    .filter((a) => {
      const authorEmail = a.ownerEmail.toLowerCase()
      if (authorEmail === own) return true
      if (a.visibility === 'private') return false
      if (a.visibility === 'connections_only') return connectedEmails.has(authorEmail)
      // visibility === 'public': only from someone this account actually
      // follows/connects with — a real feed, not "every public post from
      // every account on the browser" (that would never scale past a demo).
      return connectedEmails.has(authorEmail) || followedOrgs.has(authorEmail)
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
