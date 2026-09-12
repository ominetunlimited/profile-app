/**
 * Single shared account-model source, per PROFILE_CLAUDE_CODE_BUILD_PROMPT.md §3 and
 * Master Prompt §4.1, §4.2, §8.3, §8.4. Every module that branches on
 * accountType/orgType/sector must import from here — never re-derive locally
 * (build doc §7 Definition of Done).
 *
 * FLAGGED DISCREPANCY (Master-Prompt-internal, not Handoff-vs-Master-Prompt):
 * §4.2 defines a second, different `OrgType` enum (snake_case, 16 values —
 * 'company'|'startup'|'ngo'|'university'|'school'|'government_agency'|'hospital'|
 * 'cooperative'|'guild'|'trade_association'|'certification_authority'|
 * 'research_centre'|'mda'|'regulatory_body'|'association'|'licensing_board') that
 * disagrees in both casing and membership with §8.3's `ORGANISATION_TYPES` (Title
 * Case, 22 values) and §8.4's `ORG_TYPE_TO_HUB` (keyed on those same §8.3 strings).
 * §8.3+§8.4 is adopted here as authoritative for registration/gating because it's
 * the self-consistent pair actually used for account creation and hub routing, and
 * §4.2's list looks like an earlier schema draft never reconciled with §8.4's later
 * hub-routing refinement. Held for product sign-off, not silently merged.
 */

export type AccountType = 'individual' | 'organisation'

/** §8.3 IndividualCategory — WHAT kind of professional, not where in their career. */
export type Pathway = 'professional' | 'competence' | 'hybrid'

export const INDIVIDUAL_CATEGORIES: Record<Pathway, { description: string; examples: string[] }> = {
  professional: {
    description: 'Regulated, licensed, degree-based professions',
    examples: ['Doctor', 'Lawyer', 'Engineer', 'Architect', 'Pharmacist', 'Accountant', 'Nurse', 'Surveyor', 'Scientist', 'Professor'],
  },
  competence: {
    description: 'Skill-based, trade-based, vocational, freelance, artisan, and creative professions',
    examples: ['Welder', 'Photographer', 'Chef', 'Electrician', 'Carpenter', 'Tailor', 'Graphic Designer', 'Mechanic', 'Hair Stylist', 'Videographer'],
  },
  hybrid: {
    description: 'Academic qualifications combined with professional competencies',
    examples: ['Engineer & Fabricator', 'Doctor & Entrepreneur', 'Architect & Builder', 'Lecturer & Consultant'],
  },
}

/** §4.1 CareerStage — WHERE in their journey; evolves over time, separate from pathway. */
export type CareerStage =
  | 'learner'
  | 'student'
  | 'undergraduate'
  | 'apprentice'
  | 'technical_vocational_learner'
  | 'emerging_professional'
  | 'fresh_graduate'
  | 'job_seeker'
  | 'intern'
  | 'national_service_participant'
  | 'professional'
  | 'freelancer'
  | 'entrepreneur'
  | 'researcher'
  | 'consultant'
  | 'skilled_tradesperson'
  | 'career_transition'
  | 'executive'
  | 'mentor'
  | 'retired_professional'

export const CAREER_STAGE_OPTIONS: CareerStage[] = [
  'learner',
  'student',
  'undergraduate',
  'apprentice',
  'technical_vocational_learner',
  'emerging_professional',
  'fresh_graduate',
  'job_seeker',
  'intern',
  'national_service_participant',
  'professional',
  'freelancer',
  'entrepreneur',
  'researcher',
  'consultant',
  'skilled_tradesperson',
  'career_transition',
  'executive',
  'mentor',
  'retired_professional',
]

/** §8.3 ORGANISATION_TYPES — the literal registration-time values, Title Case. */
export const ORGANISATION_TYPES = [
  'Company',
  'Startup',
  'University',
  'Polytechnic',
  'College',
  'School',
  'Government Ministry',
  'Government Agency',
  'Regulatory Authority',
  'Licensing Board',
  'Professional Council',
  'Certification Authority',
  'Hospital',
  'NGO',
  'Foundation',
  'Research Institute',
  'Trade Association',
  'Guild',
  'Cooperative',
  'Recruitment Agency',
  'Consulting Firm',
  'Any recognised legal entity',
] as const

export type OrganisationType = (typeof ORGANISATION_TYPES)[number]

export type OrgHubProfile = 'institutional_hub' | 'business_hub' | 'regulatory_console' | 'community_hub'

/**
 * §8.4 ORG_TYPE_TO_HUB verbatim, plus 'Any recognised legal entity' — which §8.3
 * lists but neither §8.4's table nor the build doc's §3.2 assign a hub to. §8.4's
 * own rule says "every OrganisationType maps to exactly one hub... a new
 * organisation type is not addable without a hub assignment," so leaving it
 * unmapped isn't an option — assigned to business_hub here (closest fit: a
 * generic legal entity most resembles a company/business registrant) and flagged
 * for product sign-off rather than silently left to a runtime default.
 */
export const ORG_TYPE_TO_HUB = {
  University: 'institutional_hub',
  Polytechnic: 'institutional_hub',
  College: 'institutional_hub',
  School: 'institutional_hub',
  'Research Institute': 'institutional_hub',
  'Certification Authority': 'institutional_hub',

  Company: 'business_hub',
  Startup: 'business_hub',
  'Recruitment Agency': 'business_hub',
  'Consulting Firm': 'business_hub',
  Hospital: 'business_hub',
  'Any recognised legal entity': 'business_hub', // flagged — see doc comment above

  'Government Ministry': 'regulatory_console',
  'Government Agency': 'regulatory_console',
  'Regulatory Authority': 'regulatory_console',
  'Licensing Board': 'regulatory_console',
  'Professional Council': 'regulatory_console',

  NGO: 'community_hub',
  Foundation: 'community_hub',
  'Trade Association': 'community_hub',
  Guild: 'community_hub',
  Cooperative: 'community_hub',
} satisfies Record<OrganisationType, OrgHubProfile>

export function hubForOrgType(orgType: OrganisationType): OrgHubProfile {
  return ORG_TYPE_TO_HUB[orgType]
}

/**
 * §3.3/§34.2a sector-scoped module visibility inside the shared Institution/Org
 * Hub — a visibility filter on ONE shared hub, not a fork. Sector keys match
 * §34.2a's SECTOR_MODULE_VISIBILITY exactly (which itself keys on §4.2's OrgType,
 * not §8.3's — bridged here via the org's §8.3 registration type).
 */
export type Sector =
  | 'university_or_school'
  | 'government_agency'
  | 'regulatory_body'
  | 'hospital'
  | 'company'
  | 'certification_authority'
  | 'base'

const ORG_TYPE_TO_SECTOR: Record<OrganisationType, Sector> = {
  University: 'university_or_school',
  Polytechnic: 'university_or_school',
  College: 'university_or_school',
  School: 'university_or_school',
  'Research Institute': 'base',
  'Certification Authority': 'certification_authority',

  Company: 'company',
  Startup: 'company',
  'Recruitment Agency': 'company',
  'Consulting Firm': 'company',
  Hospital: 'hospital',
  'Any recognised legal entity': 'company',

  'Government Ministry': 'government_agency',
  'Government Agency': 'government_agency',
  'Regulatory Authority': 'regulatory_body',
  'Licensing Board': 'regulatory_body',
  'Professional Council': 'regulatory_body',

  NGO: 'base',
  Foundation: 'base',
  'Trade Association': 'base',
  Guild: 'base',
  Cooperative: 'base',
}

export function sectorForOrgType(orgType: OrganisationType): Sector {
  return ORG_TYPE_TO_SECTOR[orgType]
}

export const SECTOR_MODULES: Record<Sector, readonly string[]> = {
  university_or_school: ['academic_verification', 'bulk_student_ingestion', 'institution_excellence_dashboard'],
  government_agency: ['country_adapter_tools', 'iotr', 'regulatory_licensing_workflows'],
  regulatory_body: ['professional_licence_verification', 'iotr'],
  hospital: ['employment_verification', 'professional_licence_verification'],
  company: ['employment_verification', 'recruiter_hub'],
  certification_authority: ['certification_verification', 'bulk_record_ingestion'],
  base: ['identity_verification_requests', 'staff_affiliation_management', 'messaging'],
}

/**
 * §50.4 IOTR's `OrgRegistryLevel`, verbatim — corrected from an earlier
 * invented 'unverified'|'pending'|'verified' guess made in Phase 0 before
 * §50.4 was read. This is the exact enum the hard gates (§10.5, §3.3) mean
 * when they say "registryLevel === 'verified' (IOTR)" — not a paraphrase.
 */
export type OrgRegistryLevel = 'verified' | 'recognized' | 'user_submitted' | 'rejected'

export const ORG_TRUST_STATUS_LABEL: Record<OrgRegistryLevel, string> = {
  verified: 'Verified Organisation',
  recognized: 'Recognized — Verification Not Yet Available',
  user_submitted: 'Awaiting Organisational Claim',
  rejected: 'Restricted / Removed',
}

export interface OrganisationAccount {
  accountType: 'organisation'
  orgType: OrganisationType
  legalName: string
  /** §4.2 — @handle, globally unique. Optional until Phase 2 profile setup is built for orgs. */
  username?: string
  officialEmail: string
  country: string
  registryLevel: OrgRegistryLevel
  /**
   * §42.1 — this account's own role within its organisation, a second gating
   * axis independent of accountType/orgType/hub (build doc §3.5). The org's
   * creator becomes initial super_admin automatically (§8.4.1/§42.3 Rule 6) —
   * there is no multi-seat staff/invite system yet in this build, so every
   * organisation account is currently its own sole super_admin; the field
   * exists so screens can gate on it correctly once invites are built,
   * without a later rewrite.
   */
  orgRole: OrgAdminRoleV3
}

export interface IndividualAccount {
  accountType: 'individual'
  pathway: Pathway
  careerStage?: CareerStage
  legalName: string
  /** §8.5 INDIVIDUAL_INFO_FIELDS — captured at signup but previously discarded
   * on submit (never saved to the finalized account). Also the alias behind
   * §9.7 Private Professional Mode's `publicDisplayIdentity`. */
  preferredDisplayName?: string
  /** §4.1 — @handle, globally unique, captured at §8.8 profile setup. */
  username?: string
  headline?: string
  email: string
  country: string
  /**
   * Patch (pre-Phase-7): §4.1 only has `country` (ISO alpha-2) — no
   * structured city/state field existed anywhere in the User schema. Added
   * per the CV header gap; optional, editable in Settings, auto-populates
   * the CV header once filled.
   */
  city?: string
  stateOrRegion?: string
  /** Patch: no external-network URL field existed in §4.1/§4.6/§47.2/§47.8. */
  linkedInUrl?: string
  /** Patch: distinct from §4.1's `profileUrl` (PROFILE's own myprofile.com/@username, §50.8) —
   * this is the user's own external site/GitHub, additive alongside it, never instead of it. */
  externalWebsiteUrl?: string
  /** V9 Enforcement Patch: data-model.md's `IndividualProfile.phone` (E.164) had no field
   * anywhere in this account model or any UI to set it — a real CV header gap. */
  phone?: string
}

export type Account = IndividualAccount | OrganisationAccount

/**
 * §10.5 hard rule — Institution Hub tools require BOTH the org-type-to-hub
 * mapping AND verified registry status. Never true for a non-institutional hub,
 * regardless of trust score, plan tier, or admin role.
 */
export function canAccessInstitutionHubTools(account: Account): account is OrganisationAccount {
  if (account.accountType !== 'organisation') return false
  return hubForOrgType(account.orgType) === 'institutional_hub' && account.registryLevel === 'verified'
}

/**
 * §3.3/§10.5 — government/regulatory console features render only for a verified
 * regulatory_console-hub account. One-directional: never for individual,
 * business_hub, or community_hub, regardless of trust score or plan tier.
 */
export function canAccessGovernmentConsole(account: Account): account is OrganisationAccount {
  if (account.accountType !== 'organisation') return false
  return hubForOrgType(account.orgType) === 'regulatory_console' && account.registryLevel === 'verified'
}

/**
 * §49.4/§49.5 hard rule — CV rendering must be structurally absent for
 * organisations. This is one-directional: individuals get a CV; organisations
 * never do, structurally, not just visually hidden.
 */
export function isCvEligible(account: Account): account is IndividualAccount {
  return account.accountType === 'individual'
}

/**
 * Portfolio is universal, not organisation-exclusive — §15.4's hard rule makes
 * it "mandatory-visible to anyone who can view the profile at all" (every
 * account type), and §47.6's PORTFOLIO_TEMPLATE_LIBRARY lists 10 templates
 * where 9 are individual professions (Designer, Software Engineer, Architect,
 * Researcher, Academic, Photographer, Writer, Consultant, Business
 * Professional) and only the 10th, "Organisation / Company Showcase," is
 * org-specific. §47.3's `PortfolioItemV3.addToCV`/`addToPortfolio` flags
 * (independently settable, "addToBoth = both true") only make sense if an
 * individual can hold both documents at once. Individuals get CV *and*
 * Portfolio; organisations get Portfolio only, never CV — corrects an earlier
 * reading of §15.2/§49.5 that treated Portfolio as organisation-exclusive
 * (the build doc's own phase table made the same undercount, listing 5
 * Portfolio templates against §47.6's actual 10).
 */
export function isPortfolioEligible(_account: Account): boolean {
  return true
}

/** §42.1 — org-internal role gating, orthogonal to accountType/orgType/sector. */
export type OrgAdminRoleV3 =
  | 'super_admin'
  | 'admin'
  | 'verification_officer'
  | 'hr_manager'
  | 'credential_manager'
  | 'moderator'
  | 'compliance_officer'

/**
 * §42.2 Permission Matrix, verbatim. Build doc §3.5: this axis is orthogonal
 * to accountType/orgType/hub/sector — a verification_officer at a University
 * still only ever sees institutional_hub tools, scoped further by this. Never
 * collapse the two axes into one flag.
 */
type OrgCapability =
  | 'billing'
  | 'appointRoles'
  | 'editOrgProfile'
  | 'reviewVerificationRequests'
  | 'issueCredentials'
  | 'manageHiring'
  | 'moderateContent'
  | 'viewAuditLogs'
  | 'handleLegalHolds'

const ORG_PERMISSION_MATRIX: Record<OrgCapability, OrgAdminRoleV3[]> = {
  billing: ['super_admin'],
  appointRoles: ['super_admin', 'admin'],
  editOrgProfile: ['super_admin', 'admin'],
  reviewVerificationRequests: ['super_admin', 'admin', 'verification_officer'],
  issueCredentials: ['super_admin', 'admin', 'credential_manager'],
  manageHiring: ['super_admin', 'admin', 'hr_manager'],
  moderateContent: ['super_admin', 'admin', 'moderator'],
  viewAuditLogs: ['super_admin', 'admin', 'compliance_officer'],
  handleLegalHolds: ['super_admin', 'compliance_officer'],
}

/**
 * §42.2 — checks the org-internal role axis only. Callers must separately
 * check accountType/hub/sector (§3.3) first; this never substitutes for that.
 * `admin` appointing roles is further limited to non-super_admin targets by
 * §42.2's own footnote — enforce that at the call site, not here, since it
 * needs the target role, not just the actor's.
 */
export function orgRoleCan(account: Account, capability: OrgCapability): boolean {
  if (account.accountType !== 'organisation') return false
  return ORG_PERMISSION_MATRIX[capability].includes(account.orgRole)
}

/** §42.2 — every role except verification_officer/hr_manager/credential_manager/
 * moderator sees only their own actions in the audit log; compliance_officer
 * and super_admin/admin see everything. */
export function hasFullAuditLogAccess(account: Account): boolean {
  return orgRoleCan(account, 'viewAuditLogs')
}

/** §37.2 password policy — checked client-side for UX; must be re-enforced server-side. */
export function passwordMeetsPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}
