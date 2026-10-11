import type { Account } from './accountTypes'
import { listMyKyc } from './kycStore'
import { listVerificationRequests, type VerificationModuleKey } from './verificationRequestStore'

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
  // Accessibility spot-check gap #2 — this renders as a solid badge fill
  // with white text (TrustPassport.tsx); --text-2 is tuned for small-text
  // legibility, not as a background for overlaid white text, and fails
  // 4.5:1 in dark mode once composited. --neutral-solid is fixed across
  // both themes for exactly this kind of use, like --accent-solid.
  { range: [0, 199], tier: 'emerging', label: 'Emerging', color: 'var(--neutral-solid)' },
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

/**
 * §5.2 "Verification (approved) → Trust Score" — maps each institution-decided
 * verification module to the §13.2 weight it earns. A request only counts once
 * its status has reached the terminal 'verified' state (§12.4 timeline), i.e. a
 * named institution actually confirmed it — never on submission, never on the
 * requester's own claim. 'custom' carries no §13.2 weight of its own, so it
 * deliberately earns nothing here rather than being guessed.
 */
export const VERIFICATION_MODULE_WEIGHT: Partial<Record<VerificationModuleKey, keyof typeof TRUST_WEIGHTS>> = {
  identity: 'identity_verification',
  employment: 'employment_verification',
  academic: 'academic_degree_verification',
  professional_licence: 'professional_licence',
  trade_competence: 'trade_competence',
  certification: 'certification',
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

export function computeTrustScore(account: Account | null): TrustScoreResult {
  // Two real, verified signal sources — nothing here ever fabricates points
  // (no auto-approval, no vendor liveness pass):
  //
  //  1. A HUMAN-approved identity (KYC) review (kycStore.ts) → identity_verification.
  //  2. §5.2's "Verification (approved) → Trust Score": any verification request
  //     this account filed that a named institution has driven to the terminal
  //     'verified' state (verificationRequestStore.ts) earns its module's §13.2
  //     weight. This is the same source badgeStore.ts reads to mint badges, so a
  //     badge and its Trust Score points now always agree.
  //
  // Each signal is counted at most once per weight key (deduplicated), so a
  // person can't stack the same weight from a KYC pass and an identity request.
  const email = !account ? '' : account.accountType === 'individual' ? account.email : account.officialEmail
  const signals: TrustSignalEntry[] = []
  const dimensions: TrustDimensions = { ...ZERO_DIMENSIONS }
  const awarded = new Set<keyof typeof TRUST_WEIGHTS>()

  const award = (weightKey: keyof typeof TRUST_WEIGHTS, source: string, date: string) => {
    if (awarded.has(weightKey)) return
    awarded.add(weightKey)
    const weight = TRUST_WEIGHTS[weightKey]
    signals.push({ type: weightKey, weight, source, date, verified: true })
    dimensions[TRUST_DIMENSION_SIGNAL_MAP[weightKey]] += weight
  }

  // 1. Identity — a human-approved KYC review.
  const approvedKyc = email ? listMyKyc(email).find((k) => k.status === 'approved') : undefined
  if (approvedKyc) {
    award('identity_verification', 'PROFILE reviewer — identity documents checked', approvedKyc.reviewedAt ?? approvedKyc.createdAt)
  }

  // 2. Institution-confirmed verifications (employment, academic, licence, …).
  if (email) {
    for (const req of listVerificationRequests(email)) {
      if (req.status !== 'verified') continue
      const weightKey = VERIFICATION_MODULE_WEIGHT[req.moduleKey]
      if (!weightKey) continue
      award(weightKey, `${req.moduleName} verified by ${req.issuerName}`, req.decidedAt ?? req.submittedAt)
    }
  }

  const total = signals.reduce((sum, s) => sum + s.weight, 0)
  const tier = TRUST_TIERS.find((t) => total >= t.range[0] && total <= t.range[1]) ?? TRUST_TIERS[0]
  const confidenceLevel: TrustScoreResult['confidenceLevel'] = signals.length >= 4 ? 'high' : signals.length >= 2 ? 'moderate' : signals.length === 1 ? 'moderate' : 'low'
  return {
    total,
    tier,
    confidenceLevel,
    dimensions,
    signals,
    formulaVersion: '13.2-v1',
    lastCalculated: new Date().toISOString(),
  }
}
