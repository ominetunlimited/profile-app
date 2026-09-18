/** Temporary client-only scaffolding, same caveats as demoAccountStore.ts. */

/** data-model.md "AI Decision Log Entry", verbatim shape. */
export interface AiDecisionLogEntry {
  id: string
  surface: 'advisor' | 'copilot' | 'cover_letter' | 'opportunity_match'
  output: string
  dataAccessed: string[]
  userId: string
  reviewStatus: 'unreviewed' | 'reviewed' | 'flagged'
  timestamp: string
}

const STORAGE_KEY = 'profile:demo-ai-decision-log'

function readAll(): AiDecisionLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function listAiDecisions(): AiDecisionLogEntry[] {
  return readAll().sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/**
 * Called from AdvisorCreatorHub.tsx after every real PROFILE Advisor reply
 * (api/advisor.ts, a Vercel serverless function backed by the Anthropic
 * API) — the one real AI Gateway call site this build has. Cover Letter
 * remains honestly template-assembled (not AI), so it does not call this.
 * Never call this speculatively or seed it with fabricated entries.
 */
export function logAiDecision(entry: Omit<AiDecisionLogEntry, 'id' | 'timestamp'>): void {
  const record: AiDecisionLogEntry = { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
  const all = readAll()
  all.push(record)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}
