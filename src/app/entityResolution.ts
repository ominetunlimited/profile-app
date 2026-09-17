import { listAllAccounts } from './demoAccountStore'
import { TOOL_CATALOGUE } from './toolCatalogue'

/**
 * V9 Unified Ecosystem Patch §3 — Universal Entity Resolution Engine. Before
 * this, every tagging surface (Skills, Tools, Collaborators, Trust Center's
 * "Issuing institution") was its own disconnected plain-text field with no
 * shared matching logic — exactly the "five different autocompletes that
 * each behave slightly differently" bug the patch names. One engine, called
 * by every one of them.
 *
 * `id` for 'individual'/'organisation' results is the account's email —
 * this build has no PID/OPID concept anywhere (ownerKey() email is the real
 * identifier every store already keys on), so the patch's PID/OPID
 * terminology is honoured in spirit, not literally invented as a fake id
 * scheme this build doesn't otherwise have.
 *
 * There is also no structured Skills taxonomy anywhere in this build (only
 * Tools has one, toolCatalogue.ts) — SKILL_SEED below is a small, real
 * reference list in the same spirit as toolCatalogue.ts's own: "not
 * exhaustive, never silently guessed, extendable." A skill typed that isn't
 * in this seed is not an error, exactly like an unrecognised tool.
 */
export type ResolvableEntityType = 'individual' | 'organisation' | 'skill' | 'tool'

export type EntityFieldContext =
  | 'mention'
  | 'tag_institution'
  | 'tools'
  | 'collaborators'
  | 'skills'
  | 'messaging_mention'
  | 'applicant_search'
  | 'community_search'

export interface EntityResolutionResult {
  id: string
  type: ResolvableEntityType
  displayLabel: string
  sub?: string
  matchedOn: 'handle_prefix' | 'name_prefix' | 'name_substring' | 'alias' | 'fuzzy'
}

const SKILL_SEED: string[] = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'Figma', 'Adobe Photoshop', 'Product Management',
  'Project Management', 'User Research', 'UX Writing', 'Contract Negotiation', 'Public Speaking',
  'Data Analysis', 'Copywriting', 'Salesforce Administration', 'Financial Modelling', 'Video Editing',
  'Brand Strategy', 'Team Leadership', 'Customer Success', 'Electrical Wiring', 'Welding', 'Carpentry',
  'Bookkeeping', 'Graphic Design', 'SEO', 'Social Media Marketing', 'Curriculum Design', 'Clinical Research',
]

function allowedTypesFor(fieldContext: EntityFieldContext): ResolvableEntityType[] {
  switch (fieldContext) {
    case 'tools':
      return ['tool']
    case 'skills':
      return ['skill']
    case 'tag_institution':
      return ['organisation']
    case 'collaborators':
    case 'mention':
    case 'messaging_mention':
    case 'applicant_search':
    case 'community_search':
      return ['individual', 'organisation']
  }
}

const MATCH_RANK: Record<EntityResolutionResult['matchedOn'], number> = {
  handle_prefix: 0,
  name_prefix: 1,
  alias: 2,
  name_substring: 3,
  fuzzy: 4,
}

/**
 * `raw` is exactly what the user typed, unmodified. A leading `@` narrows
 * to handle-prefix matching only (individuals/organisations); otherwise
 * name/alias matching applies across every type `fieldContext` allows.
 * Results rank verified-shape matches (handle/name prefix) before
 * substring/alias — never by engagement or popularity, since this build
 * has no such metric to rank by in the first place.
 */
export function resolveEntities(raw: string, fieldContext: EntityFieldContext): EntityResolutionResult[] {
  const trimmed = raw.trim()
  if (!trimmed) return []
  const isHandleQuery = trimmed.startsWith('@')
  const q = (isHandleQuery ? trimmed.slice(1) : trimmed).toLowerCase()
  if (!q) return []

  const allowedTypes = allowedTypesFor(fieldContext)
  const results: EntityResolutionResult[] = []

  if (allowedTypes.includes('individual') || allowedTypes.includes('organisation')) {
    for (const account of listAllAccounts()) {
      const username = 'username' in account ? account.username : undefined
      if (!username) continue
      const type: ResolvableEntityType = account.accountType === 'organisation' ? 'organisation' : 'individual'
      if (!allowedTypes.includes(type)) continue

      const email = account.accountType === 'organisation' ? account.officialEmail : account.email
      const name = account.legalName.toLowerCase()
      const handle = username.toLowerCase()

      if (isHandleQuery) {
        if (handle.startsWith(q)) {
          results.push({ id: email, type, displayLabel: account.legalName, sub: `@${username}`, matchedOn: 'handle_prefix' })
        }
        continue
      }
      if (name.startsWith(q)) {
        results.push({ id: email, type, displayLabel: account.legalName, sub: `@${username}`, matchedOn: 'name_prefix' })
      } else if (handle.startsWith(q)) {
        results.push({ id: email, type, displayLabel: account.legalName, sub: `@${username}`, matchedOn: 'alias' })
      } else if (name.includes(q)) {
        results.push({ id: email, type, displayLabel: account.legalName, sub: `@${username}`, matchedOn: 'name_substring' })
      }
    }
  }

  if (allowedTypes.includes('tool') && !isHandleQuery) {
    for (const t of TOOL_CATALOGUE) {
      const canonical = t.canonicalName.toLowerCase()
      if (canonical.startsWith(q)) {
        results.push({ id: t.id, type: 'tool', displayLabel: t.canonicalName, sub: t.provider ? `made by ${t.provider.name}` : undefined, matchedOn: 'name_prefix' })
      } else if (t.aliases.some((a) => a.startsWith(q))) {
        results.push({ id: t.id, type: 'tool', displayLabel: t.canonicalName, sub: t.provider ? `made by ${t.provider.name}` : undefined, matchedOn: 'alias' })
      } else if (canonical.includes(q)) {
        results.push({ id: t.id, type: 'tool', displayLabel: t.canonicalName, sub: t.provider ? `made by ${t.provider.name}` : undefined, matchedOn: 'name_substring' })
      }
    }
  }

  if (allowedTypes.includes('skill') && !isHandleQuery) {
    for (const s of SKILL_SEED) {
      const lower = s.toLowerCase()
      if (lower.startsWith(q)) results.push({ id: lower.replace(/\s+/g, '-'), type: 'skill', displayLabel: s, matchedOn: 'name_prefix' })
      else if (lower.includes(q)) results.push({ id: lower.replace(/\s+/g, '-'), type: 'skill', displayLabel: s, matchedOn: 'name_substring' })
    }
  }

  return results.sort((a, b) => MATCH_RANK[a.matchedOn] - MATCH_RANK[b.matchedOn] || a.displayLabel.localeCompare(b.displayLabel)).slice(0, 8)
}
