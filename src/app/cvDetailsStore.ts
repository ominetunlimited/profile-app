/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 *
 * Patch (pre-Phase-7): §4.6 names `EducationEntry`, `CertificationEntry`,
 * and `SummaryContent` as CV sub-schemas but never field-specifies any of
 * them anywhere in the Master Prompt (confirmed by search — they appear
 * only as type references at §4.6's `sections` object). §47.2/§47.8 add
 * `languages: LanguageProficiency[]` similarly without a field shape. None
 * of this is derivable from recorded Activities the way work experience is,
 * so — unlike `careerData.ts`'s activity-derived fields — this needs its
 * own real, editable store, filled in directly by the user.
 *
 * V9 Enforcement Patch: added the remaining CV sections a complete CV needs
 * end-to-end (Projects, Volunteer Work, Publications, Awards & Honors,
 * Professional Affiliations) plus a per-section include/exclude toggle so
 * the manual editor can expose "which sections appear in this CV" rather
 * than forcing every section into the document. Projects/Volunteer/
 * Publications/Awards additionally carry an optional `sourceActivityId` —
 * set when the entry was auto-populated from a real recorded Activity
 * (careerData.ts's `mergeAutoAndManual`) — and a `hidden` flag, which is the
 * real mechanism behind "the user retains control": an auto-populated entry
 * can be hidden without deleting the Activity it came from, and reappears
 * if un-hidden, rather than the CV silently absorbing every activity with
 * no way to review it first.
 */

export interface EducationEntry {
  id: string
  degree: string
  school: string
  graduationYear: string
  /** Optional; display rule (never a filter) applied at render time — see cvDetailsDisplay.ts. */
  gpa?: number
  relevantCoursework: string[]
}

export interface CertificationEntry {
  id: string
  name: string
  issuer: string
  year: string
}

export type LanguageProficiencyLevel = 'basic' | 'conversational' | 'fluent' | 'native'

export interface LanguageEntry {
  id: string
  language: string
  proficiency: LanguageProficiencyLevel
}

/**
 * Patch: §47.2/§47.9's `ReferenceEntry`/`ProfessionalReference` is built for
 * PROFILE's own verified, trust-weighted reference workflow (a referee who
 * is themselves a PROFILE account). It has no plain contact-card shape for
 * a reference who is NOT a PROFILE user. This sits alongside that verified
 * flow (not built yet — no multi-user backend exists to verify a referee
 * against), never replacing it, and is always rendered as self-reported.
 */
export interface ExternalReferenceEntry {
  id: string
  name: string
  jobTitle: string
  company: string
  relationship: string
  phone: string
  email: string
}

export type ReferencesMode = 'listed' | 'available_upon_request'

export interface ProjectEntry {
  id: string
  title: string
  description: string
  role: string
  date: string
  tools: string[]
  sourceActivityId?: string
  hidden?: boolean
}

export interface VolunteerEntry {
  id: string
  role: string
  organisation: string
  description: string
  date: string
  sourceActivityId?: string
  hidden?: boolean
}

export interface PublicationEntry {
  id: string
  title: string
  publisher: string
  date: string
  url: string
  sourceActivityId?: string
  hidden?: boolean
}

export interface AwardEntry {
  id: string
  title: string
  issuer: string
  date: string
  sourceActivityId?: string
  hidden?: boolean
}

export interface AffiliationEntry {
  id: string
  organisation: string
  role: string
  since: string
}

export type CvSectionKey =
  | 'summary'
  | 'skills'
  | 'languages'
  | 'experience'
  | 'education'
  | 'projects'
  | 'publications'
  | 'volunteer'
  | 'awards'
  | 'affiliations'
  | 'references'

export const CV_SECTION_LABELS: Record<CvSectionKey, string> = {
  summary: 'Professional Summary',
  skills: 'Skills',
  languages: 'Languages',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  publications: 'Publications',
  volunteer: 'Volunteer Work',
  awards: 'Awards & Honors',
  affiliations: 'Professional Affiliations',
  references: 'References',
}

/** Summary/Skills/Experience/Education are structural to every one of the
 * 10 CV templates (hardcoded per-template sections, not conditionally
 * rendered) and cannot be switched off — every other section is optional
 * per the manual editor's own section-selection requirement, rendered
 * through the shared `ExtraCvSections` block instead. */
export const CV_REQUIRED_SECTIONS: CvSectionKey[] = ['summary', 'skills', 'experience', 'education']

export interface CvDetails {
  summaryStatement: string
  yearsOfExperience: number | null
  keyAchievement: string
  objectiveMode: boolean
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
}

const STORAGE_KEY = 'profile:demo-cv-details'

const DEFAULT_ENABLED_SECTIONS: Record<CvSectionKey, boolean> = {
  summary: true,
  skills: true,
  languages: false,
  experience: true,
  education: true,
  projects: false,
  publications: false,
  volunteer: false,
  awards: false,
  affiliations: false,
  references: false,
}

const EMPTY_DETAILS: CvDetails = {
  summaryStatement: '',
  yearsOfExperience: null,
  keyAchievement: '',
  objectiveMode: false,
  education: [],
  certifications: [],
  languages: [],
  externalReferences: [],
  referencesMode: 'listed',
  projects: [],
  volunteer: [],
  publications: [],
  awards: [],
  affiliations: [],
  enabledSections: DEFAULT_ENABLED_SECTIONS,
}

function readAll(): Record<string, Partial<CvDetails>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, CvDetails>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}

/** Merges over EMPTY_DETAILS so a record saved before these new fields
 * existed still gets a real, complete CvDetails back rather than crashing
 * on a missing array/section. */
export function getCvDetails(ownerEmail: string): CvDetails {
  const stored = readAll()[ownerEmail]
  if (!stored) return EMPTY_DETAILS
  return {
    ...EMPTY_DETAILS,
    ...stored,
    enabledSections: { ...DEFAULT_ENABLED_SECTIONS, ...stored.enabledSections },
  }
}

export function saveCvDetails(ownerEmail: string, details: CvDetails): void {
  const all = readAll() as Record<string, CvDetails>
  all[ownerEmail] = details
  writeAll(all)
}
