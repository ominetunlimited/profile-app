/**
 * THE PROFILE VERIFICATION MARK (§7) — one of the most important elements in
 * the entire visual system.
 *
 * NOT a tick inside a circle. A proprietary geometric seal: a faceted identity
 * node with an internal verification vertex, belonging to the same motif
 * grammar as ProfileNode/Link/Path. Recognisable at small sizes, and never
 * confusable with a social-media popularity badge.
 *
 * PROFILE verification means: "This identity, affiliation, credential or claim
 * has been verified against an identifiable source." The interface reinforces
 * that distinction — the mark always ships paired with text (§23: icon + text +
 * colour, never colour alone).
 *
 * Semantic colour hierarchy (§7):
 *   gold   — high-trust / distinguished verification
 *   green  — successfully verified / confirmed
 *   blue   — standard PROFILE verification
 *   royal  — verification infrastructure / dark UI
 */

export type SealTone = 'gold' | 'green' | 'blue' | 'royal'

const TONE_FILL: Record<SealTone, string> = {
  gold: 'var(--profile-gold)',
  green: 'var(--trust)',
  blue: 'var(--profile-bright-blue)',
  royal: 'var(--profile-royal)',
}

/** Ink that sits on the seal fill with AA contrast in both themes. */
const TONE_INK: Record<SealTone, string> = {
  gold: 'var(--profile-royal)',
  green: 'var(--profile-royal)',
  blue: 'var(--profile-off-white)',
  royal: 'var(--profile-off-white)',
}

export interface ProfileSealProps {
  size?: number
  tone?: SealTone
  className?: string
  /** Accessible label; when omitted the mark is decorative (aria-hidden). */
  label?: string
  /** Play the §16 settle micro-interaction (e.g. on successful confirmation). */
  animate?: boolean
}

/**
 * The standalone seal. A faceted node (rounded-hexagon) with a verification
 * vertex cut through the middle. Distinct from a generic tick-in-circle by the
 * faceted outer form and the two-part internal check.
 */
export function ProfileSeal({ size = 16, tone = 'green', className = '', label, animate }: ProfileSealProps) {
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`${animate ? 'profile-seal-animate' : ''} ${className}`}
      {...a11y}
    >
      {/* Faceted identity node — the seal body (rounded hexagonal shield) */}
      <path
        d="M12 1.7 20.3 5.2v6.3c0 5-3.7 9.1-8.3 10.5-4.6-1.4-8.3-5.5-8.3-10.5V5.2Z"
        fill={TONE_FILL[tone]}
      />
      {/* Inner verification vertex — two strokes forming the PROFILE check */}
      <path
        d="M8.2 12.2 11 15 16 9.1"
        fill="none"
        stroke={TONE_INK[tone]}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface VerifiedTagProps {
  /** Text shown next to the seal, e.g. "Verified", "Verified organisation". */
  text?: string
  tone?: SealTone
  size?: number
  className?: string
}

/**
 * §23 — the seal is ALWAYS paired with text so verification never depends on
 * colour alone. Use this wherever a "✓ Verified" style status appears. The tag
 * background/ink derive from the tone's soft/strong tokens, adapting to theme.
 */
export function VerifiedTag({ text = 'Verified', tone = 'green', size = 14, className = '' }: VerifiedTagProps) {
  const ink =
    tone === 'gold'
      ? 'var(--gold)'
      : tone === 'blue'
        ? 'var(--profile-bright-blue)'
        : tone === 'royal'
          ? 'var(--profile-royal)'
          : 'var(--trust)'
  const soft =
    tone === 'gold'
      ? 'var(--gold-soft)'
      : tone === 'blue'
        ? 'var(--accent-soft)'
        : 'var(--trust-soft)'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ color: ink, background: soft, borderColor: ink }}
    >
      <ProfileSeal size={size} tone={tone} />
      {text}
    </span>
  )
}
