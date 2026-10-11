/**
 * Client entry point to the central notification engine (migration 0009).
 *
 * Features emit a *named event* about a target; they never write notification
 * rows or compose notification text. The database engine (`emit_notification`)
 * applies the event rules — category, mandatory-ness, grouping — checks
 * eligibility (blocks, muted conversations, self) and the recipient's
 * preferences, composes the text from a fixed server-side template, and
 * inserts/groups the row; Realtime then delivers it.
 *
 * Core social + messaging events (reactions, comments, replies, mentions,
 * reposts, recommendations, follows, connections, messages, message
 * reactions) are emitted by database triggers and need no client call. This
 * helper is for the events the server has no row for (e.g. features still on
 * local storage) or that carry client-only detail (an interview slot).
 */
import { supabase } from './supabaseClient'

export type ClientEvent =
  | 'credit'
  | 'credit_dispute'
  | 'tag_request'
  | 'tag_response'
  | 'org_mention'
  | 'mentorship_request'
  | 'mentorship_response'
  | 'staff_invite'
  | 'application_received'
  | 'application_status'
  | 'interview_scheduled'
  | 'passport_revoked'

export interface EmitOptions {
  deepLink: string
  targetType?: 'activity' | 'job' | 'advert' | 'repost' | 'conversation'
  targetId?: string
  /** Sanitised, length-limited slots for the server template: {title} {detail} {role}. */
  vars?: { title?: string; detail?: string; role?: string }
}

/** Fire-and-forget by design: a notification problem must never fail the user's action. */
export async function emitEvent(event: ClientEvent, recipientEmail: string, opts: EmitOptions): Promise<void> {
  if (!recipientEmail) return
  const { error } = await supabase.rpc('emit_notification', {
    p_recipient: recipientEmail,
    p_event: event,
    p_deep_link: opts.deepLink,
    p_target_type: opts.targetType ?? null,
    p_target_id: opts.targetId ?? null,
    p_vars: opts.vars ?? {},
  })
  if (error) console.warn(`[eventBus] ${event} not delivered:`, error.message)
}
