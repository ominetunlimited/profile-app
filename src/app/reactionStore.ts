/**
 * Pipeline repair Phase A — real Supabase-backed `public.reactions` (RLS:
 * each row visible only to the user who made it) plus the public
 * `public.reaction_counts` view (anonymised totals, security-definer, so it
 * aggregates across every user regardless of caller — see
 * supabase/migrations/0001_init.sql). `setMyReaction` is a real async
 * write; `getMyReaction`/`getReactionCounts` stay synchronous, backed by two
 * small live caches, since ActivityCard calls them inline for every
 * activity in the feed.
 *
 * One real limitation worth naming: Realtime's `postgres_changes` respects
 * the same RLS as normal reads, so a subscription on `reactions` only ever
 * delivers *your own* rows — another user's reaction doesn't push a live
 * update to your `reaction_counts` cache the way an activity or message
 * does. That's an inherent consequence of hiding who-reacted-what (§11.2
 * never exposes identities, only totals), not a bug: counts still refresh
 * correctly on next navigation/reload, and your own toggle updates
 * instantly since that write refetches counts itself.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

export type ReactionType = 'appreciate' | 'respect' | 'insightful' | 'support' | 'skilled' | 'well_explained'

/** V9 Unified Ecosystem Patch §17 — `icon` names a component from
 * shared/ui/icons.tsx rather than an emoji string, so every reaction
 * renders in the same custom icon family as the rest of the platform. */
export const REACTIONS: { type: ReactionType; icon: 'thumbsUp' | 'medal' | 'lightbulb' | 'seedling' | 'hammer' | 'megaphone'; label: string }[] = [
  { type: 'appreciate', icon: 'thumbsUp', label: 'Appreciate' },
  { type: 'respect', icon: 'medal', label: 'Respect' },
  { type: 'insightful', icon: 'lightbulb', label: 'Insightful' },
  { type: 'support', icon: 'seedling', label: 'Support' },
  { type: 'skilled', icon: 'hammer', label: 'Skilled' },
  { type: 'well_explained', icon: 'megaphone', label: 'Well Explained' },
]

const EMPTY_COUNTS: Record<ReactionType, number> = { appreciate: 0, respect: 0, insightful: 0, support: 0, skilled: 0, well_explained: 0 }

export type ReactionTargetType = 'activity' | 'comment' | 'job' | 'advert' | 'repost' | 'community_post'

interface ReactionRow {
  target_type: ReactionTargetType
  target_id: string
  user_email: string
  reaction_type: ReactionType
}

interface CountRow {
  target_type: ReactionTargetType
  target_id: string
  reaction_type: ReactionType
  total: number
}

// --- Live caches ---------------------------------------------------------
// `myReactions` only ever contains the signed-in caller's own rows (all
// `reactions` RLS ever allows); `counts` is the public aggregate view.
let myReactions: ReactionRow[] = []
let counts: CountRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCaches() {
  const [{ data: mine }, { data: totals }] = await Promise.all([supabase.from('reactions').select('target_type,target_id,user_email,reaction_type'), supabase.from('reaction_counts').select('*')])
  myReactions = mine ?? []
  counts = totals ?? []
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCaches()
  joinRealtime(() =>
    supabase
    .channel('reactions-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
      // Only our own rows ever arrive here (RLS-filtered Realtime) — a full
      // reload is cheap and keeps `myReactions` correct across tabs/devices.
      loadCaches()
    })
    .subscribe(),
  )
}

export function onReactionsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useReactionsCacheVersion(): number {
  return useSyncExternalStore(onReactionsChange, () => cacheVersion, () => cacheVersion)
}

export function getMyReaction(targetType: ReactionTargetType, targetId: string, userEmail: string): ReactionType | null {
  const row = myReactions.find((r) => r.target_type === targetType && r.target_id === targetId && r.user_email.toLowerCase() === userEmail.toLowerCase())
  return row?.reaction_type ?? null
}

export function getReactionCounts(targetType: ReactionTargetType, targetId: string): Record<ReactionType, number> {
  const result = { ...EMPTY_COUNTS }
  for (const row of counts) {
    if (row.target_type === targetType && row.target_id === targetId) result[row.reaction_type] = row.total
  }
  return result
}

/** Toggling the currently-active reaction off is how "changeable" (§11.2) includes removal. */
export async function setMyReaction(targetType: ReactionTargetType, targetId: string, userEmail: string, reaction: ReactionType): Promise<void> {
  const current = getMyReaction(targetType, targetId, userEmail)
  if (current === reaction) {
    await supabase.from('reactions').delete().eq('target_type', targetType).eq('target_id', targetId).eq('user_email', userEmail)
  } else {
    const { error } = await supabase
      .from('reactions')
      .upsert({ target_type: targetType, target_id: targetId, user_email: userEmail, reaction_type: reaction }, { onConflict: 'target_type,target_id,user_email' })
    if (error) throw error
    // The author is notified by the trg_notify_reaction trigger (first reaction only).
  }
  await loadCaches()
}
