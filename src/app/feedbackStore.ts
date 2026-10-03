import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/** Feedback to the PROFILE team, stored on the server (public.feedback_items): you see your own; staff with review access see everyone's in the Admin Centre. */
export type FeedbackCategory = 'bug' | 'idea' | 'praise' | 'other'
export type FeedbackStatus = 'new' | 'seen' | 'resolved'

export interface FeedbackEntry {
  id: string
  ownerEmail: string
  category: FeedbackCategory
  message: string
  status: FeedbackStatus
  createdAt: string
}

interface Row {
  id: string
  user_email: string
  category: FeedbackCategory
  message: string
  status: FeedbackStatus
  created_at: string
}

const table = createServerTable<Row>('feedback_items', { orderBy: 'created_at' })
export const useFeedbackVersion = table.useVersion
const toEntry = (r: Row): FeedbackEntry => ({ id: r.id, ownerEmail: r.user_email, category: r.category, message: r.message, status: r.status, createdAt: r.created_at })

export function listFeedback(ownerEmail: string): FeedbackEntry[] {
  return table.rows().filter((f) => f.user_email.toLowerCase() === ownerEmail.toLowerCase()).map(toEntry).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Everything staff can see (the database returns all rows only to reviewers). */
export function listAllFeedback(): FeedbackEntry[] {
  return table.rows().map(toEntry).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function submitFeedback(input: { ownerEmail: string; category: FeedbackCategory; message: string }): Promise<FeedbackEntry> {
  const row: Row = { id: crypto.randomUUID(), user_email: input.ownerEmail.toLowerCase(), category: input.category, message: input.message.trim(), status: 'new', created_at: new Date().toISOString() }
  table.set([row, ...table.rows()])
  await persist(table, () => supabase.from('feedback_items').insert({ id: row.id, user_email: row.user_email, category: row.category, message: row.message }))
  return toEntry(row)
}

export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  table.set(table.rows().map((r) => (r.id === id ? { ...r, status } : r)))
  await persist(table, () => supabase.rpc('staff_set_feedback_status', { p_id: id, p_status: status }))
}
