import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'
import { findAccountByEmail } from './demoAccountStore'
import { emitEvent } from './eventBus'

/** Credits on an activity (collaborators, organisations, providers, tools), stored on the server (public.attributions). The credited person can dispute or remove a credit. */
export type AttributionSubjectType = 'person' | 'organisation' | 'provider' | 'tool' | 'project'
export type AttributionStatus = 'active' | 'disputed' | 'removed'

export interface AttributionRecord {
  id: string
  activityId: string
  activityOwnerEmail: string
  subjectType: AttributionSubjectType
  subjectEmail?: string
  subjectName: string
  role: string
  taggedBy: string
  status: AttributionStatus
  createdAt: string
}

interface Row {
  id: string
  activity_id: string
  activity_owner_email: string
  subject_type: AttributionSubjectType
  subject_email: string | null
  subject_name: string
  role: string
  tagged_by: string
  status: AttributionStatus
  created_at: string
}

const table = createServerTable<Row>('attributions')
export const useAttributionsVersion = table.useVersion
const same = (a: string | null | undefined, b: string) => (a ?? '').toLowerCase() === b.toLowerCase()
const toRecord = (r: Row): AttributionRecord => ({
  id: r.id,
  activityId: r.activity_id,
  activityOwnerEmail: r.activity_owner_email,
  subjectType: r.subject_type,
  subjectEmail: r.subject_email ?? undefined,
  subjectName: r.subject_name,
  role: r.role,
  taggedBy: r.tagged_by,
  status: r.status,
  createdAt: r.created_at,
})

export function addAttribution(input: { activityId: string; activityOwnerEmail: string; subjectType: AttributionSubjectType; subjectName: string; role: string; taggedBy: string }): AttributionRecord {
  const resolved = input.subjectType === 'person' || input.subjectType === 'organisation' ? findAccountByEmail(input.subjectName) : undefined
  const subjectEmail = resolved ? (resolved.accountType === 'individual' ? resolved.email : resolved.officialEmail) : null
  const row: Row = {
    id: crypto.randomUUID(),
    activity_id: input.activityId,
    activity_owner_email: input.activityOwnerEmail.toLowerCase(),
    subject_type: input.subjectType,
    subject_email: subjectEmail ? subjectEmail.toLowerCase() : null,
    subject_name: input.subjectName,
    role: input.role,
    tagged_by: input.taggedBy.toLowerCase(),
    status: 'active',
    created_at: new Date().toISOString(),
  }
  table.set([...table.rows(), row])
  void persist(table, () => supabase.from('attributions').insert(row))
    .then(() => {
      if (row.subject_email && !same(row.subject_email, input.taggedBy)) {
        void emitEvent('credit', row.subject_email, { deepLink: `/activity/${input.activityId}`, targetType: 'activity', targetId: input.activityId, vars: { role: input.role } })
      }
    })
    .catch(() => undefined)
  return toRecord(row)
}

export function listAttributionsFor(activityId: string): AttributionRecord[] {
  return table
    .rows()
    .filter((a) => a.activity_id === activityId && a.status !== 'removed')
    .map(toRecord)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function disputeAttribution(id: string, requesterEmail: string): void {
  const rec = table.rows().find((a) => a.id === id)
  if (!rec || !same(rec.subject_email, requesterEmail)) return
  table.set(table.rows().map((a) => (a.id === id ? { ...a, status: 'disputed' as const } : a)))
  void persist(table, () => supabase.rpc('dispute_attribution', { p_id: id }))
    .then(() => emitEvent('credit_dispute', rec.tagged_by, { deepLink: `/activity/${rec.activity_id}`, targetType: 'activity', targetId: rec.activity_id, vars: { role: rec.role } }))
    .catch(() => undefined)
}

export function removeAttribution(id: string, requesterEmail: string): void {
  const rec = table.rows().find((a) => a.id === id)
  if (!rec || !(same(rec.tagged_by, requesterEmail) || same(rec.subject_email, requesterEmail))) return
  table.set(table.rows().map((a) => (a.id === id ? { ...a, status: 'removed' as const } : a)))
  void persist(table, () => supabase.rpc('remove_attribution', { p_id: id })).catch(() => undefined)
}
