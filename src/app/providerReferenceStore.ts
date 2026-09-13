import { resolveTool } from './toolCatalogue'

/**
 * §1.4/§1.5 Provider Notification. No real Provider account exists anywhere
 * in this build to actually deliver a live notification to (§1.3 — a
 * provider account is a real, separate account type nothing has built
 * yet), so this is the honest version: a real, queryable log of every time
 * a recognised tool was genuinely referenced in a real activity, shown on
 * that tool's own page as real usage data. Wording is deliberately always
 * "used" / "referenced" — §1.4's hard rule is that USED/REFERENCED/LISTED
 * are not ENDORSED/VERIFIED, and this build can never honestly claim the
 * latter two without a real provider claiming and reviewing the account.
 */
export interface ProviderReference {
  id: string
  toolId: string
  activityId: string
  userEmail: string
  createdAt: string
}

const STORAGE_KEY = 'profile:demo-provider-references'

function readAll(): ProviderReference[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: ProviderReference[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

/** Called once per real activity post — resolves each free-text tool
 * against the catalogue and records a reference for any real match. A
 * duplicate (same user, same tool, same activity) never double-counts. */
export function recordToolReferences(activityId: string, userEmail: string, rawTools: string[]): void {
  const all = readAll()
  const additions: ProviderReference[] = []
  for (const raw of rawTools) {
    const tool = resolveTool(raw)
    if (!tool) continue
    if (all.some((r) => r.toolId === tool.id && r.activityId === activityId && r.userEmail === userEmail)) continue
    additions.push({ id: crypto.randomUUID(), toolId: tool.id, activityId, userEmail, createdAt: new Date().toISOString() })
  }
  if (additions.length > 0) writeAll([...all, ...additions])
}

export function referenceCountForTool(toolId: string): number {
  return readAll().filter((r) => r.toolId === toolId).length
}

export function listReferencesForTool(toolId: string): ProviderReference[] {
  return readAll()
    .filter((r) => r.toolId === toolId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
