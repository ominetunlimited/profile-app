/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 *
 * §11.2 SIX_REACTIONS — Phase 7 hardening: the Home activity feed previously
 * rendered three of the six reactions as inert `<span>` text with no click
 * handler at all (a §35 Activation Audit "static button, no handler"
 * violation). This makes them real: one reaction per user per activity,
 * changeable, publicly-visible totals — and explicitly never feeds Trust
 * Score or ranking, per §11.2's REACTION_RULES hard rule.
 */
export type ReactionType = 'appreciate' | 'respect' | 'insightful' | 'support' | 'skilled' | 'well_explained'

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'appreciate', emoji: '👍', label: 'Appreciate' },
  { type: 'respect', emoji: '🫡', label: 'Respect' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'support', emoji: '🌱', label: 'Support' },
  { type: 'skilled', emoji: '⚒️', label: 'Skilled' },
  { type: 'well_explained', emoji: '🗣️', label: 'Well Explained' },
]

interface ReactionState {
  // activityId -> userEmail -> reaction (one per user per post, §11.2)
  [activityId: string]: Record<string, ReactionType>
}

const STORAGE_KEY = 'profile:demo-reactions'

function readAll(): ReactionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(state: ReactionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function getMyReaction(activityId: string, userEmail: string): ReactionType | null {
  return readAll()[activityId]?.[userEmail] ?? null
}

export function getReactionCounts(activityId: string): Record<ReactionType, number> {
  const counts = { appreciate: 0, respect: 0, insightful: 0, support: 0, skilled: 0, well_explained: 0 }
  const forActivity = readAll()[activityId] ?? {}
  for (const reaction of Object.values(forActivity)) counts[reaction]++
  return counts
}

/** Toggling the currently-active reaction off is how "changeable" (§11.2) includes removal. */
export function setMyReaction(activityId: string, userEmail: string, reaction: ReactionType): void {
  const all = readAll()
  const forActivity = { ...(all[activityId] ?? {}) }
  if (forActivity[userEmail] === reaction) {
    delete forActivity[userEmail]
  } else {
    forActivity[userEmail] = reaction
  }
  all[activityId] = forActivity
  writeAll(all)
}
