/**
 * GEOMETRIC BACKGROUND SYSTEM (§8) — subtle PROFILE geometry that quietly sits
 * behind the entire platform: landing, profile, organisation, verification,
 * onboarding, dashboards, search, activity, empty states, auth, settings,
 * portfolio and credential screens.
 *
 * Rules baked in:
 *  - Decoration never competes with content (pointer-events-none, aria-hidden,
 *    low opacity, behind everything).
 *  - Background motifs use Powder Blue (#D0E6FD) at low opacity on light, and
 *    Powder on the Royal Blue in dark — derived from --profile-geometric.
 *  - On Royal Blue surfaces we use Warm Beige / Off-White at very low opacity.
 *  - Elements may sit partially outside the container / cropped by the viewport,
 *    giving a quiet sense that one PROFILE system exists behind everything.
 *  - §22: scale and opacity reduce automatically on small screens.
 */
import { useId, type ReactNode } from 'react'

export type BackgroundVariant = 'grid' | 'nodes' | 'orbit' | 'mixed'

const DECOR = 'profile-decor pointer-events-none absolute inset-0 -z-10 overflow-hidden'

/**
 * Hexagonal lattice, the PROFILE mark's own shape: hairline strokes on a
 * pointy-top tiling, faded by a diagonal mask so it dissolves instead of
 * repeating edge to edge. Two oversized hexagon outlines and a small node
 * constellation anchor the corners. No gradients washes, no blobs.
 */
function Lattice({ onDark }: { onDark?: boolean }) {
  const id = useId().replace(/:/g, '')
  const ink = onDark ? 'text-white' : 'text-[var(--profile-royal)] dark:text-white'
  return (
    <svg className={`absolute inset-0 h-full w-full ${ink}`} aria-hidden focusable="false">
      <defs>
        <pattern id={`p${id}`} width="27.71" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(1.7)">
          <path d="M13.86 0 27.71 8V24L13.86 32 0 24V8ZM13.86 32V48" fill="none" stroke="currentColor" strokeWidth="0.55" />
        </pattern>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`m${id}`}>
          <rect width="100%" height="100%" fill={`url(#g${id})`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#p${id})`} mask={`url(#m${id})`} opacity={onDark ? 0.16 : 0.09} />
      <g fill="none" stroke="currentColor" strokeWidth="1.1" opacity={onDark ? 0.2 : 0.12}>
        <polygon points="860,-120 1010,-33 1010,141 860,228 710,141 710,-33" transform="translate(0 0)" className="hidden sm:block" />
        <polygon points="-70,520 40,583 40,709 -70,772 -180,709 -180,583" />
      </g>
      <g className="hidden md:block" fill="currentColor" stroke="currentColor" opacity={onDark ? 0.34 : 0.22}>
        <circle cx="86%" cy="62%" r="3" />
        <circle cx="92%" cy="72%" r="2.2" />
        <circle cx="80%" cy="78%" r="2.2" />
        <line x1="86%" y1="62%" x2="92%" y2="72%" strokeWidth="0.8" />
        <line x1="86%" y1="62%" x2="80%" y2="78%" strokeWidth="0.8" />
        <line x1="92%" y1="72%" x2="80%" y2="78%" strokeWidth="0.8" />
      </g>
    </svg>
  )
}

export interface ProfileBackgroundProps {
  variant?: BackgroundVariant
  /** Render the warm/powder treatment for use on a dark Royal Blue surface. */
  onDark?: boolean
  className?: string
  /** Content to layer above the decoration. Omit for a pure backdrop layer. */
  children?: ReactNode
}

/**
 * Wrap a screen's content in this (as the outermost element) to inherit the
 * PROFILE geometric backdrop. Content should be rendered as normal children —
 * the decoration is layered behind via -z-10. With no children it renders as a
 * standalone backdrop layer (useful dropped into an already-`relative` section).
 */
export function ProfileBackground({ onDark, className = '', children }: ProfileBackgroundProps) {
  return (
    <div className={`relative isolate ${className}`}>
      <div className={DECOR} aria-hidden>
        <Lattice onDark={onDark} />
      </div>
      {children}
    </div>
  )
}
