/**
 * What the viewer did with each recommendation (migration 0012): dismissed or
 * acted. The ranker reads this to stop repeating dismissed items for 30 days,
 * hide ones already acted on, and nudge kinds the viewer engages with. Private
 * to the viewer (RLS: own rows only); nothing here is ever shown to others.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'

export interface FeedbackRow {
  rec_key: string
  kind: string
  action: 'dismissed' | 'acted'
  created_at: string
}

let rows: FeedbackRow[] = []
let version = 0
const listeners = new Set<() => void>()
function bump() {
  version++
  listeners.forEach((fn) => fn())
}
export function useRecommendationFeedbackVersion(): number {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version, () => version)
}

async function load() {
  const { data } = await supabase.from('recommendation_feedback').select('rec_key,kind,action,created_at')
  rows = (data ?? []) as FeedbackRow[]
  bump()
}

if (typeof window !== 'undefined') {
  void load()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load()
  })
}

export function listFeedback(): FeedbackRow[] {
  return rows
}

export async function recordFeedback(email: string, recKey: string, kind: string, action: 'dismissed' | 'acted'): Promise<void> {
  rows = [...rows.filter((r) => !(r.rec_key === recKey && r.action === action)), { rec_key: recKey, kind, action, created_at: new Date().toISOString() }]
  bump()
  const { error } = await supabase.from('recommendation_feedback').upsert({ user_email: email, rec_key: recKey, kind, action, created_at: new Date().toISOString() }, { onConflict: 'user_email,rec_key,action' })
  if (error) await load()
}
