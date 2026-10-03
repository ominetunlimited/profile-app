import { supabase } from './supabaseClient'

/**
 * The AI decision log, server-side (public.ai_decision_log, RLS-enforced): every AI-generated output that touched a
 * real user is recorded when it is produced, and staff with review access can mark it reviewed or flagged.
 */
export interface AiDecisionLogEntry {
  id: string
  surface: 'advisor' | 'copilot' | 'cover_letter' | 'opportunity_match'
  output: string
  dataAccessed: string[]
  userId: string
  reviewStatus: 'unreviewed' | 'reviewed' | 'flagged'
  timestamp: string
}

interface Row {
  id: string
  surface: AiDecisionLogEntry['surface']
  output: string
  data_accessed: string[]
  user_email: string
  review_status: AiDecisionLogEntry['reviewStatus']
  created_at: string
}

const toEntry = (r: Row): AiDecisionLogEntry => ({
  id: r.id,
  surface: r.surface,
  output: r.output,
  dataAccessed: r.data_accessed ?? [],
  userId: r.user_email,
  reviewStatus: r.review_status,
  timestamp: r.created_at,
})

/** Newest first. For a reviewer this is everyone's entries; for anyone else, only their own. */
export async function listAiDecisions(limit = 500): Promise<AiDecisionLogEntry[]> {
  const { data, error } = await supabase.from('ai_decision_log').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  return (data as Row[]).map(toEntry)
}

/** Records one AI output. Failure to log never blocks the user's reply, but it is reported to the console. */
export async function logAiDecision(entry: Omit<AiDecisionLogEntry, 'id' | 'timestamp' | 'reviewStatus'> & { reviewStatus?: 'unreviewed' }): Promise<void> {
  const { error } = await supabase.from('ai_decision_log').insert({
    surface: entry.surface,
    output: entry.output.slice(0, 4000),
    data_accessed: entry.dataAccessed,
    user_email: entry.userId,
  })
  if (error) console.error('AI decision log write failed:', error.message)
}

export async function reviewAiDecision(id: string, status: 'reviewed' | 'flagged' | 'unreviewed'): Promise<void> {
  const { error } = await supabase.rpc('staff_review_ai_decision', { entry: id, status })
  if (error) throw new Error(error.message)
}
