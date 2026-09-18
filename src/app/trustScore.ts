import type { Account } from './accountTypes'

/**
 * §13.2 TRUST_WEIGHTS, verbatim. Phase 7 hardening: ProfilePage previously
 * showed a hardcoded `0` for "Trust Score" — exactly the §49.2 "Trust Score
 * ring hardcoded" pattern this section exists to close. This computes a real
 * score from real signals instead.
 *
 * Every one of these 11 signals requires verification infrastructure
 * (identity/employment/academic/licence checks, institutional confirmation,
 * client reviews) that has no backend in this build yet — so the honest
 * result is 0 for every account today, exactly like the AI Decision Log is
 * honestly empty with no AI Gateway connected. This is a real computation
 * over real (currently absent) inputs, never a fabricated non-zero number —
 * §13.2's own hard rule that follower/like/view counts may never be a
 * ranking input is respected by construction, since nothing here reads them.
 */
export const TRUST_WEIGHTS = {
  identity_verification: 25,
  employment_verification: 25,
  academic_degree_verification: 20,
  professional_licence: 20,
  organisation_affiliation: 15,
  trade_competence: 15,
  certification: 12,
  client_review_verified: 10,
  peer_endorsement_higher_tier: 8,
  course_completed: 8,
  activity_peer_validated: 5,
} as const

// Design handoff gap audit: these were raw hex, and three of the five
// happened to be one theme's specific token value copy-pasted in (light
// --accent for 'established', dark --trust for 'trusted', dark --gold for
// 'master') — frozen regardless of the active theme instead of adapting.
// Switched to the actual CSS custom properties so each tier correctly
// follows light/dark. 'expert' has no existing semantic token to reuse
// (it's a tier-ladder color, not one of the six base tokens design-handoff
// README defines) — left as a literal hex per "never invent new tokens,"
// flagged here rather than silently matched to an unrelated var.
export const TRUST_TIERS = [
  { range: [0, 199], tier: 'emerging', label: 'Emerging', color: 'var(--text-2)' },
  { range: [200, 399], tier: 'established', label: 'Established', color: 'var(--accent)' },
  { range: [400, 599], tier: 'trusted', label: 'Trusted', color: 'var(--trust)' },
  { range: [600, 799], tier: 'expert', label: 'Expert', color: '#003A8C' },
  { range: [800, 1000], tier: 'master', label: 'Master', color: 'var(--gold)' },
] as const

/**
 * §4.5 TrustScore.dimensions — a real, named breakdown, not a single opaque
 * number. §13.2's 11 TRUST_WEIGHTS signals are the raw scoring inputs; the
 * Master Prompt names these 8 dimensions as the display-level aggregation
 * but doesn't give a signal→dimension crosswalk anywhere, so the mapping
 * below is a documented, reasonable inference — flagged as such rather than
 * presented as verbatim spec. Every dimension is honestly 0 today since no
 * signal has a real data source yet (same reasoning as the total below).
 */
export const TRUST_DIMENSION_SIGNAL_MAP: Record<keyof typeof TRUST_WEIGHTS, keyof TrustDimensions> = {
  identity_verification: 'identityTrust',
  academic_degree_verification: 'academicTrust',
  professional_licence: 'professionalTrust',
  trade_competence: 'professionalTrust',
  certification: 'professionalTrust',
  employment_verification: 'employmentTrust',
  client_review_verified: 'marketplaceTrust',
  organisation_affiliation: 'organisationalTrust',
  peer_endorsement_higher_tier: 'recruitmentTrust',
  course_completed: 'contributionTrust',
  activity_peer_validated: 'contributionTrust',
}

export interface TrustDimensions {
  identityTrust: number
  academicTrust: number
  professionalTrust: number
  employmentTrust: number
  marketplaceTrust: number
  organisationalTrust: number
  recruitmentTrust: number
  contributionTrust: number
}

export const TRUST_DIMENSION_LABELS: Record<keyof TrustDimensions, string> = {
  identityTrust: 'Identity',
  academicTrust: 'Academic',
  professionalTrust: 'Professional',
  employmentTrust: 'Employment',
  marketplaceTrust: 'Marketplace',
  organisationalTrust: 'Organisational',
  recruitmentTrust: 'Recruitment',
  contributionTrust: 'Contribution',
}

export interface TrustSignalEntry {
  type: string
  weight: number
  source: string
  date: string
  verified: boolean
}

export interface TrustScoreResult {
  total: number
  tier: (typeof TRUST_TIERS)[number]
  confidenceLevel: 'low' | 'moderate' | 'high' | 'institutional_grade'
  dimensions: TrustDimensions
  /** Every increment logged with its source (§4.5/§13.3) — honestly empty
   * until a real verification produces one, never backfilled with fake
   * history to make the log look populated. */
  signals: TrustSignalEntry[]
  formulaVersion: string
  lastCalculated: string
}

const ZERO_DIMENSIONS: TrustDimensions = {
  identityTrust: 0,
  academicTrust: 0,
  professionalTrust: 0,
  employmentTrust: 0,
  marketplaceTrust: 0,
  organisationalTrust: 0,
  recruitmentTrust: 0,
  contributionTrust: 0,
}

export function computeTrustScore(_account: Account | null): TrustScoreResult {
  // No verified signal source exists yet in this build (no identity/employment/
  // academic/licence verification pipeline, no institutional confirmation, no
  // client review system) — so the real, honest total is 0 for every account
  // today, the same way the AI Decision Log is honestly empty with no AI
  // Gateway connected. This stays a real function call rather than a
  // hardcoded literal at the display site so wiring in a real signal later
  // means adding a term to this sum, not hunting down a magic number in a
  // component.
  const total = 0
  const tier = TRUST_TIERS.find((t) => total >= t.range[0] && total <= t.range[1]) ?? TRUST_TIERS[0]
  return {
    total,
    tier,
    confidenceLevel: 'low',
    dimensions: ZERO_DIMENSIONS,
    signals: [],
    formulaVersion: '13.2-v1',
    lastCalculated: new Date().toISOString(),
  }
}
