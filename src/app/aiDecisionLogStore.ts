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
 * No call site in this build ever invokes this. §48.11's AI Gateway doesn't
 * exist yet — Cover Letter is honestly template-assembled (not AI) and
 * Advisor honestly declines every question, so there is no real AI output
 * anywhere to log. This function exists so the log has a real, correct write
 * path ready for when an actual AI Gateway lands — not to be called
 * speculatively or seeded with fabricated entries to make the log look busy.
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
