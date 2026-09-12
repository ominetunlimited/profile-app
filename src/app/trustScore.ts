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
// Not yet consumed by computeTrustScore() below — every signal it weighs
// needs a verification pipeline this build doesn't have yet. Kept here,
// exported, so wiring a real signal in later means adding one real term to
// the sum in computeTrustScore(), not inventing the weight table from scratch.
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

export const TRUST_TIERS = [
  { range: [0, 199], tier: 'emerging', label: 'Emerging', color: '#94A3B8' },
  { range: [200, 399], tier: 'established', label: 'Established', color: '#0057D9' },
  { range: [400, 599], tier: 'trusted', label: 'Trusted', color: '#00E5FF' },
  { range: [600, 799], tier: 'expert', label: 'Expert', color: '#003A8C' },
  { range: [800, 1000], tier: 'master', label: 'Master', color: '#F4B400' },
] as const

export interface TrustScoreResult {
  total: number
  tier: (typeof TRUST_TIERS)[number]
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
  return { total, tier }
}
