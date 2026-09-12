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
}

const STORAGE_KEY = 'profile:demo-cv-details'

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
}

function readAll(): Record<string, CvDetails> {
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

export function getCvDetails(ownerEmail: string): CvDetails {
  return readAll()[ownerEmail] ?? EMPTY_DETAILS
}

export function saveCvDetails(ownerEmail: string, details: CvDetails): void {
  const all = readAll()
  all[ownerEmail] = details
  writeAll(all)
}
