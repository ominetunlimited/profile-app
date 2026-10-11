/**
 * PROFILE SIGNATURE GEOMETRIC LANGUAGE (§3, §17) — the proprietary motif family.
 *
 * These are NOT decorative circles/squares/lines. They are the reusable visual
 * vocabulary of PROFILE: one grammar of "identity node + connected geometry +
 * verification seal", reused consistently across icons, backgrounds,
 * illustrations, verification marks, profile frames, organisation structures and
 * activity visualisations. See a motif in isolation and it should read as
 * PROFILE.
 *
 * Every motif is built on a shared 24×24 grid with the same construction: a
 * filled/stroked NODE (the identity), connected by clean LINES to other nodes,
 * with a consistent stroke weight and `currentColor` so each inherits the brand
 * token colour already applied to its container (§4, §19). Colours come from
 * the design tokens — nothing is hard-coded per component. An optional `color`
 * prop simply sets the CSS `color`, so `currentColor` picks it up.
 *
 * Motifs: Node · Link · Path · Seal · Frame · Grid · Signal · Orbit
 */
import type { ReactNode } from 'react'

export interface MotifProps {
  size?: number
  className?: string
  /** Stroke weight; defaults to the icon system's uniform 1.75. */
  strokeWidth?: number
  /** Override colour (sets CSS `color`, which `currentColor` then uses). */
  color?: string
}

const STROKE = 1.75

function Motif({ size = 24, className, strokeWidth = STROKE, color, children }: MotifProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={color ? { color } : undefined}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/**
 * A. PROFILE NODE — a verified identity: a central point wrapped by structured
 * geometric rings. The atomic unit of the whole system. Use for identity,
 * profile, verification, attribution.
 */
export function ProfileNode(p: MotifProps) {
  return (
    <Motif {...p}>
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </Motif>
  )
}

/**
 * B. PROFILE LINK — two identity nodes joined by a clean line. Represents
 * affiliation, organisation, employment, education, professional relationship.
 */
export function ProfileLink(p: MotifProps) {
  return (
    <Motif {...p}>
      <circle cx="5.5" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="2.6" />
      <path d="M8.1 12h7.8" />
    </Motif>
  )
}

/**
 * C. PROFILE PATH — connected angular nodes tracing a journey. Represents
 * career history, education, experience, progression, professional journey.
 */
export function ProfilePath(p: MotifProps) {
  return (
    <Motif {...p}>
      <path d="M4 19.5l5-6 4 3 7-9" />
      <circle cx="4" cy="19.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13.5" r="1.6" />
      <circle cx="13" cy="16.5" r="1.6" />
      <circle cx="20" cy="7.5" r="2" fill="currentColor" stroke="none" />
    </Motif>
  )
}

/**
 * D. PROFILE SEAL — the proprietary verification mark (§7). Deliberately NOT a
 * tick-in-a-circle. A faceted geometric node whose check is formed by the same
 * angular grammar as every other motif. See ProfileSeal.tsx for the full
 * colour-context version used across the product; this is the line-art base.
 */
export function ProfileSealMotif(p: MotifProps) {
  return (
    <Motif {...p}>
      <path d="M12 2.5l8 3.2v6.1c0 4.6-3.3 8.3-8 9.7-4.7-1.4-8-5.1-8-9.7V5.7l8-3.2Z" />
      <path d="M8.7 12.2l2.4 2.4 4.2-4.6" strokeWidth={(p.strokeWidth ?? STROKE) + 0.25} />
    </Motif>
  )
}

/**
 * E. PROFILE FRAME — a distinctive geometric frame for surrounding profile
 * photographs, logos, credentials and identity cards. Corner nodes on a soft
 * rounded square, not a generic circle.
 */
export function ProfileFrame(p: MotifProps) {
  return (
    <Motif {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="3.5" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="20.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="20.5" r="1.5" fill="currentColor" stroke="none" />
    </Motif>
  )
}

/**
 * F. PROFILE GRID — a restrained modular grid representing structured identity
 * information. Used very subtly in dashboards, empty states, headers, profile
 * backgrounds and organisation pages (§8).
 */
export function ProfileGrid(p: MotifProps) {
  const pts = [
    [7, 7],
    [12, 7],
    [17, 7],
    [7, 12],
    [12, 12],
    [17, 12],
    [7, 17],
    [12, 17],
    [17, 17],
  ]
  return (
    <Motif {...p}>
      {pts.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 4 ? 2 : 1.3} fill={i === 4 ? 'currentColor' : 'none'} />
      ))}
    </Motif>
  )
}

/**
 * G. PROFILE SIGNAL — a small radiating node representing recognition,
 * discovery, visibility and attribution. Use sparingly.
 */
export function ProfileSignal(p: MotifProps) {
  return (
    <Motif {...p}>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <path d="M12 6.2a5.8 5.8 0 0 1 5.8 5.8" />
      <path d="M12 3.2a8.8 8.8 0 0 1 8.8 8.8" opacity="0.55" />
      <path d="M6.2 12A5.8 5.8 0 0 1 12 6.2" opacity="0.55" />
    </Motif>
  )
}

/**
 * H. PROFILE ORBIT — a restrained circular structure around a central identity
 * element. Used sparingly; never decorative clutter.
 */
export function ProfileOrbit(p: MotifProps) {
  return (
    <Motif {...p}>
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" />
      <circle cx="5" cy="12" r="1.6" opacity="0.6" />
    </Motif>
  )
}

