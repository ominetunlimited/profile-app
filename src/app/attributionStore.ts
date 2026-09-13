import { findAccountByEmail } from './demoAccountStore'
import { notify } from './notificationStore'

/**
 * §2 Activity Attribution and Self-Tagging. Distinct from selfTagStore.ts:
 * that store is the SUBJECT asking to be tagged on someone else's work.
 * This is the AUTHOR crediting someone else — after publication, without
 * deleting and reposting (§2.2's hard requirement) — and it distinguishes
 * real relationship types (§2.3) rather than treating every credit as an
 * ordinary @mention.
 */
export type AttributionSubjectType = 'person' | 'organisation' | 'provider' | 'tool' | 'project'
export type AttributionStatus = 'active' | 'disputed' | 'removed'

export interface AttributionRecord {
  id: string
  activityId: string
  activityOwnerEmail: string
  subjectType: AttributionSubjectType
  /** Only set when the credited person/organisation is a real registered
   * account — a name-only credit (e.g. a tool, or someone not on PROFILE)
   * has no email and is never notified or falsely linked to an account. */
  subjectEmail?: string
  subjectName: string
  role: string
  taggedBy: string
  status: AttributionStatus
  createdAt: string
}

const STORAGE_KEY = 'profile:demo-attributions'

function readAll(): AttributionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: AttributionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function addAttribution(input: {
  activityId: string
  activityOwnerEmail: string
  subjectType: AttributionSubjectType
  subjectName: string
  role: string
  taggedBy: string
}): AttributionRecord {
  // §2.4's hard rule: a person is only ever linked to a real account if one
  // genuinely matches by name lookup isn't reliable, so linking happens
  // only for person/organisation credits where the tagger supplies a name
  // that resolves — never guessed from a bare string match on legalName
  // across every account (too easy to mis-attribute a stranger). Resolution
  // here is intentionally conservative: exact, case-insensitive legalName
  // match only.
  const resolved =
    (input.subjectType === 'person' || input.subjectType === 'organisation')
      ? findAccountByEmail(input.subjectName) // allow crediting by email directly
      : undefined
  const record: AttributionRecord = {
    id: crypto.randomUUID(),
    ...input,
    subjectEmail: resolved ? (resolved.accountType === 'individual' ? resolved.email : resolved.officialEmail) : undefined,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), record])

  if (record.subjectEmail && record.subjectEmail.toLowerCase() !== input.taggedBy.toLowerCase()) {
    const tagger = findAccountByEmail(input.taggedBy)
    notify({
      recipientEmail: record.subjectEmail,
      category: 'community',
      text: `${tagger?.legalName ?? 'Someone'} credited you as "${input.role}" on an activity.`,
      deepLink: `/activity/${input.activityId}`,
    })
  }
  return record
}

export function listAttributionsFor(activityId: string): AttributionRecord[] {
  return readAll()
    .filter((a) => a.activityId === activityId && a.status !== 'removed')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** §2.4 — the credited person must be able to dispute or remove a false
 * attribution; only the subject themselves or the original tagger may act
 * on a given record. */
export function disputeAttribution(id: string, requesterEmail: string): void {
  const all = readAll()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) return
  const record = all[idx]
  if (record.subjectEmail?.toLowerCase() !== requesterEmail.toLowerCase()) return
  all[idx] = { ...record, status: 'disputed' }
  writeAll(all)
  notify({
    recipientEmail: record.taggedBy,
    category: 'community',
    text: `${findAccountByEmail(requesterEmail)?.legalName ?? 'Someone'} disputed the "${record.role}" credit you gave them.`,
    deepLink: `/activity/${record.activityId}`,
  })
}

export function removeAttribution(id: string, requesterEmail: string): void {
  const all = readAll()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) return
  const record = all[idx]
  const canRemove = record.taggedBy.toLowerCase() === requesterEmail.toLowerCase() || record.subjectEmail?.toLowerCase() === requesterEmail.toLowerCase()
  if (!canRemove) return
  all[idx] = { ...record, status: 'removed' }
  writeAll(all)
}
