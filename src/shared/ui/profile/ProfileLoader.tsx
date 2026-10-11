/**
 * PROFILE LOADING ANIMATION (§15) — not a generic spinning circle.
 *
 * A sequence of PROFILE nodes connecting and disconnecting: three identity
 * nodes on a line light up in turn while the connecting strokes draw between
 * them. Fast, subtle and on-system — it reinforces the identity grammar rather
 * than borrowing a stock spinner. Animation is CSS-driven (tokens.css
 * `profile-node-connect` / `profile-line-draw`) and is fully disabled under
 * both `prefers-reduced-motion` and the in-app accessibility override.
 */
export interface ProfileLoaderProps {
  size?: number
  /** Accessible status text. */
  label?: string
  className?: string
}

export function ProfileLoader({ size = 44, label = 'Loading', className = '' }: ProfileLoaderProps) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <svg width={size} height={size * 0.5} viewBox="0 0 64 32" aria-hidden>
        {/* connecting strokes */}
        <line x1="16" y1="16" x2="32" y2="16" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" className="profile-loader-line" />
        <line x1="32" y1="16" x2="48" y2="16" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" className="profile-loader-line" style={{ animationDelay: '0.18s' }} />
        {/* identity nodes — light up in sequence */}
        <circle cx="16" cy="16" r="4" fill="var(--accent)" className="profile-loader-node" />
        <circle cx="32" cy="16" r="5" fill="var(--profile-bright-blue)" className="profile-loader-node" style={{ animationDelay: '0.2s' }} />
        <circle cx="48" cy="16" r="4" fill="var(--accent)" className="profile-loader-node" style={{ animationDelay: '0.4s' }} />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/**
 * §16 micro-interaction — the seal settling into place on a successful
 * submission / verification / affiliation confirmation. Precise, not playful.
 */
export function ProfileConfirmed({ size = 40, label = 'Confirmed' }: { size?: number; label?: string }) {
  return (
    <span role="status" className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" className="profile-seal-animate" aria-hidden>
        <circle cx="12" cy="12" r="10.5" fill="var(--trust-soft)" stroke="var(--trust)" strokeWidth="1.5" />
        <path d="M7.5 12.3l3 3 6-6.6" fill="none" stroke="var(--trust)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}
