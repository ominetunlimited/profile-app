import type { Account } from './accountTypes'
import { listActivities, ownerKey, type ActivityRecord } from './activityStore'
import {
  getCvDetails,
  type AffiliationEntry,
  type AwardEntry,
  type CertificationEntry,
  type CvSectionKey,
  type EducationEntry,
  type ExternalReferenceEntry,
  type LanguageEntry,
  type ProjectEntry,
  type PublicationEntry,
  type ReferencesMode,
  type VolunteerEntry,
} from './cvDetailsStore'

/**
 * §15.1/§47.1 hard rule: the CV/Portfolio engine builds only from verified-or
 * -user-provided evidence, never invents an achievement a record doesn't
 * support. This maps the account's real state (account fields + recorded
 * Activities + user-entered CV details) into the shape every template
 * renders — every field is either real data or an honest "not added yet"
 * placeholder, never fabricated persona content like the Handoff's
 * illustrative "Amara Okafor" sample.
 */
export interface CvExperienceEntry {
  title: string
  org: string
  period: string
  /** Patch (pre-Phase-7) B4: per-entry location — real if the Activity that
   * generated this entry has one, honestly blank otherwise (never inferred). */
  location: string
  bullets: string[]
}

export interface CvData {
  name: string
  role: string
  email: string
  phone: string
  location: string
  /** Patch (pre-Phase-7): §4.1 header contact fields with no prior UI. */
  linkedInUrl: string
  externalWebsiteUrl: string
  /** Rendered narrative — falls back to an honest empty-state sentence. */
  summary: string
  /** Structured §4.6 SummaryContent sub-fields, patch-specified per this
   * pass since the Master Prompt names the type but never its fields. */
  yearsOfExperience: number | null
  keyAchievement: string
  objectiveMode: boolean
  experience: CvExperienceEntry[]
  skills: string[]
  tools: string[]
  education: EducationEntry[]
  certifications: CertificationEntry[]
  languages: LanguageEntry[]
  externalReferences: ExternalReferenceEntry[]
  referencesMode: ReferencesMode
  projects: ProjectEntry[]
  volunteer: VolunteerEntry[]
  publications: PublicationEntry[]
  awards: AwardEntry[]
  affiliations: AffiliationEntry[]
  enabledSections: Record<CvSectionKey, boolean>
  hasContent: boolean
}

/**
 * V9 Enforcement Patch §6/§7 — the real (if lightweight) auto-population
 * pipeline: SOURCE (an Activity) → CLASSIFICATION (its `type`) → ELIGIBILITY
 * (does that type map to this CV section) → USER REVIEW/ACTIVATION (the
 * `hidden` flag, settable in CvDetailsEditor without deleting the
 * underlying Activity) → DISPLAY (merged with manual entries below). A
 * manually-added entry (no `sourceActivityId`) is never touched by this —
 * only activity-derived candidates are subject to being superseded/hidden.
 */
function mergeAutoAndManual<T extends { id: string; sourceActivityId?: string; hidden?: boolean }>(
  autoCandidates: T[],
  manualEntries: T[],
): T[] {
  const manualByActivityId = new Map(manualEntries.filter((e) => e.sourceActivityId).map((e) => [e.sourceActivityId, e]))
  const manualOnly = manualEntries.filter((e) => !e.sourceActivityId)
  const fromActivities = autoCandidates
    .map((candidate) => manualByActivityId.get(candidate.sourceActivityId) ?? candidate)
    .filter((e) => !e.hidden)
  return [...fromActivities, ...manualOnly]
}

/** GPA display rule (patch): shown only if >= 3.5 or graduated within ~2
 * years — a client-side rendering rule over a value the user entered, never
 * a fabricated or filtered fact (§49.8). */
export function shouldShowGpa(entry: EducationEntry): boolean {
  if (entry.gpa === undefined || entry.gpa === null) return false
  if (entry.gpa >= 3.5) return true
  const year = Number(entry.graduationYear)
  if (!Number.isFinite(year)) return false
  return new Date().getFullYear() - year <= 2
}

export function buildCvData(account: Account | null): CvData {
  const name = account?.legalName ?? 'Your name'
  const role = (account?.accountType === 'individual' && account.headline) || 'Add a headline in Settings'
  const email = account?.accountType === 'individual' ? account.email : ''
  const location =
    account?.accountType === 'individual' && (account.city || account.stateOrRegion)
      ? [account.city, account.stateOrRegion, account.country].filter(Boolean).join(', ')
      : (account?.country ?? '')
  const linkedInUrl = (account?.accountType === 'individual' && account.linkedInUrl) || ''
  const externalWebsiteUrl = (account?.accountType === 'individual' && account.externalWebsiteUrl) || ''
  const phone = (account?.accountType === 'individual' && account.phone) || ''

  const activities = account ? listActivities(ownerKey(account)) : []
  const experience: CvExperienceEntry[] = activities
    .filter((a) => ['Work Experience', 'Project', 'Trade Job', 'Collaboration'].includes(a.type))
    .map((a) => ({
      title: a.role || a.type,
      org: a.organisation || 'Independent',
      period: new Date(a.createdAt).getFullYear().toString(),
      location: a.location || '',
      bullets: a.description ? [a.description] : [],
    }))

  const skills = Array.from(new Set(activities.flatMap((a) => a.skills)))
  /** §4.6 CVDocument.sections.tools — a distinct CV section from Skills,
   * fed by Activity.tools (§4.3/§4.8), not skills. */
  const tools = Array.from(new Set(activities.flatMap((a) => a.tools)))
  const details = account ? getCvDetails(ownerKey(account)) : null

  const projectCandidates: ProjectEntry[] = activities
    .filter((a) => a.type === 'Project' || a.type === 'Portfolio Item')
    .map((a) => ({ id: `act-${a.id}`, title: a.title, description: a.description, role: a.role || '', date: new Date(a.createdAt).getFullYear().toString(), tools: a.tools, sourceActivityId: a.id }))
  const volunteerCandidates: VolunteerEntry[] = activities
    .filter((a) => a.type === 'Volunteer Work')
    .map((a) => ({ id: `act-${a.id}`, role: a.role || a.title, organisation: a.organisation || '', description: a.description, date: new Date(a.createdAt).getFullYear().toString(), sourceActivityId: a.id }))
  const publicationCandidates: PublicationEntry[] = activities
    .filter((a) => a.type === 'Publication')
    .map((a) => ({ id: `act-${a.id}`, title: a.title, publisher: a.organisation || '', date: new Date(a.createdAt).getFullYear().toString(), url: '', sourceActivityId: a.id }))
  const awardCandidates: AwardEntry[] = activities
    .filter((a) => a.type === 'Achievement')
    .map((a) => ({ id: `act-${a.id}`, title: a.title, issuer: a.organisation || '', date: new Date(a.createdAt).getFullYear().toString(), sourceActivityId: a.id }))

  return {
    name,
    role,
    email,
    phone,
    location,
    linkedInUrl,
    externalWebsiteUrl,
    summary:
      details?.summaryStatement ||
      (activities.length
        ? `${activities.length} recorded ${activities.length === 1 ? 'activity' : 'activities'}, evidence-backed and editable — nothing here is claimed without a record behind it.`
        : 'No activity recorded yet. Record your first activity from Home to start building this CV automatically.'),
    yearsOfExperience: details?.yearsOfExperience ?? null,
    keyAchievement: details?.keyAchievement ?? '',
    objectiveMode: details?.objectiveMode ?? false,
    experience,
    skills,
    tools,
    education: details?.education ?? [],
    certifications: details?.certifications ?? [],
    languages: details?.languages ?? [],
    externalReferences: details?.externalReferences ?? [],
    referencesMode: details?.referencesMode ?? 'listed',
    projects: mergeAutoAndManual(projectCandidates, details?.projects ?? []),
    volunteer: mergeAutoAndManual(volunteerCandidates, details?.volunteer ?? []),
    publications: mergeAutoAndManual(publicationCandidates, details?.publications ?? []),
    awards: mergeAutoAndManual(awardCandidates, details?.awards ?? []),
    affiliations: details?.affiliations ?? [],
    enabledSections: details?.enabledSections ?? {
      summary: true, skills: true, languages: false, experience: true, education: true,
      projects: false, publications: false, volunteer: false, awards: false, affiliations: false, references: false,
    },
    hasContent: activities.length > 0,
  }
}

export function recentActivities(account: Account | null): ActivityRecord[] {
  return account ? listActivities(ownerKey(account)) : []
}
