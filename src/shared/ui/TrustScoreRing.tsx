import type { TrustScoreResult } from '@/app/trustScore'

/** §24.1's `<TrustScoreRing tier score confidenceLevel />` header component —
 * extracted from TrustPassport.tsx's inline ring so both the full Trust
 * Passport page and the compact Profile header render the exact same real
 * computation, never two independent-looking trust rings. */
export function TrustScoreRing({ trust, size = 56 }: { trust: TrustScoreResult; size?: number }) {
  const ringPct = trust.total / 1000
  const r = 42
  const circumference = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`Trust Score ${trust.total} of 1000, ${trust.tier.label}`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={trust.tier.color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ringPct)}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text x="50" y="54" textAnchor="middle" className="fill-current text-text-0" style={{ fontSize: 22, fontWeight: 700 }}>
        {trust.total}
      </text>
    </svg>
  )
}
