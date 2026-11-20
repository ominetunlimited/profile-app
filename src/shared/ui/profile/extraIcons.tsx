import { useId } from 'react'

/**
 * PROFILE ICON SYSTEM — gap-fill families (identity, attribution, verified-X,
 * professional association).
 *
 * Sourced from Lucide (https://lucide.dev, ISC licence — free for commercial
 * use, no attribution required; see docs/brand/ICON_SOURCES.md). Lucide shares
 * PROFILE's grammar exactly: 24×24 viewBox, round caps and joins,
 * `stroke="currentColor"`. We render them at PROFILE's 1.75 stroke so they sit
 * beside the hand-authored icons as one family. Nothing here is hard-coded to a
 * colour: every glyph takes the brand token colour of its container.
 *
 * The four "Verified …" icons are the base glyph plus one shared check badge
 * (cut out of the glyph with a clip-path), so verification reads identically across
 * organisations, education, employment and affiliation.
 */
export interface XIconProps {
  size?: number
  className?: string
  title?: string
}

const base = (size: number, title?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...(title ? { role: 'img' as const, 'aria-label': title } : { 'aria-hidden': true as const }),
})

/** Profile photograph (Lucide "image"). */
export function IconProfilePhoto({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

/** Personal details card (Lucide "contact"). */
export function IconPersonalDetails({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M16 2v2" />
      <path d="M7 21v-2a2 2 0 012-2h6a2 2 0 012 2v2" />
      <path d="M8 2v2" />
      <circle cx="12" cy="10" r="3" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

/** Identity record history (Lucide "file-clock"). */
export function IconIdentityHistory({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M16 22h2a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v2.85" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M8 14v2.2l1.6 1" />
      <circle cx="8" cy="16" r="6" />
    </svg>
  )
}

/** Verification document (Lucide "file-check"). */
export function IconVerificationDocument({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  )
}

/** Author (Lucide "pen-line"). */
export function IconAuthor({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M13 21h8" />
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )
}

/** Creator (Lucide "palette"). */
export function IconCreator({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  )
}

/** Ownership (Lucide "copyright"). */
export function IconOwnership({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M15 9.354a4 4 0 1 0 0 5.292" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

/** Publication (Lucide "book-open-text"). */
export function IconPublication({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="M12 5v16" />
      <path d="M16 13h2" />
      <path d="M16 9h2" />
      <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
      <path d="M6 13h2" />
      <path d="M6 9h2" />
    </svg>
  )
}

/** Credit / recognition (Lucide "award"). */
export function IconCredit({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
      <circle cx="12" cy="8" r="6" />
    </svg>
  )
}

/** Professional association (Lucide "waypoints"). */
export function IconProfessionalAssociation({ size = 20, className, title }: XIconProps) {
  return (
    <svg {...base(size, title)} className={className}>
      <path d="m10.586 5.414-5.172 5.172" />
      <path d="m18.586 13.414-5.172 5.172" />
      <path d="M6 12h12" />
      <circle cx="12" cy="20" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="20" cy="12" r="2" />
      <circle cx="4" cy="12" r="2" />
    </svg>
  )
}

/** Check badge shared by every "Verified …" icon: ring + tick, bottom-right. */
function VerifiedBadge() {
  return (
    <g>
      <circle cx="17.5" cy="17.5" r="4.6" />
      <path d="M15.4 17.6l1.5 1.5 2.7-3" />
    </g>
  )
}

function WithVerifiedBadge({ size, className, title, children }: XIconProps & { children: React.ReactNode }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg {...base(size ?? 20, title)} className={className}>
      <clipPath id={`vb-${id}`}>
        {/* full canvas minus a disc under the badge, so glyph lines never run through the tick */}
        <path clipRule="evenodd" fillRule="evenodd" d="M0 0H24V24H0Z M17.5 11.1a6.4 6.4 0 1 0 0 12.8a6.4 6.4 0 1 0 0-12.8Z" />
      </clipPath>
      <g clipPath={`url(#vb-${id})`}>{children}</g>
      <VerifiedBadge />
    </svg>
  )
}

/** Verified organisation (Lucide "building-2" + shared check badge). */
export function IconVerifiedOrganisation({ size = 20, className, title }: XIconProps) {
  return (
    <WithVerifiedBadge size={size} className={className} title={title}>
      <path d="M10 12h4" />
      <path d="M10 8h4" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    </WithVerifiedBadge>
  )
}

/** Verified education (Lucide "graduation-cap" + shared check badge). */
export function IconVerifiedEducation({ size = 20, className, title }: XIconProps) {
  return (
    <WithVerifiedBadge size={size} className={className} title={title}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </WithVerifiedBadge>
  )
}

/** Verified employment (Lucide "briefcase-business" + shared check badge). */
export function IconVerifiedEmployment({ size = 20, className, title }: XIconProps) {
  return (
    <WithVerifiedBadge size={size} className={className} title={title}>
      <path d="M12 12h.01" />
      <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M22 13a18.15 18.15 0 0 1-20 0" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </WithVerifiedBadge>
  )
}

/** Verified affiliation (Lucide "handshake" + shared check badge). */
export function IconVerifiedAffiliation({ size = 20, className, title }: XIconProps) {
  return (
    <WithVerifiedBadge size={size} className={className} title={title}>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </WithVerifiedBadge>
  )
}
