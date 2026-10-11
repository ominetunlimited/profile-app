/**
 * PROFILE ICON SYSTEM — Classic Edition.
 *
 * A hand-authored, proprietary SVG set — the single visual language for every
 * icon in the product. Shared grammar, shared by every icon below and by the
 * extended families in profile/profileIcons.tsx and profile/reactions.tsx:
 *
 *   · 24×24 viewBox, single source of truth for every size (16→48px+) — no
 *     separate lower-fidelity mobile set, so a phone at 16px renders the exact
 *     same vectors as desktop at 24px, just scaled.
 *   · One consistent 1.75 stroke, round caps + round joins — the "engraved
 *     ink" weight that reads with confidence at 16px without going muddy.
 *   · `stroke="currentColor"` — every icon inherits the brand-token colour
 *     already applied to its container; nothing here is hard-coded.
 *   · Optical sizing — each glyph fills its 24×24 cell generously with equal
 *     visual padding, so the set aligns and centres as one family.
 *
 * These are intentionally distinctive and classic — never cartoonish, never
 * 3D, never emoji. Each silhouette is memorable on its own yet unmistakably
 * part of one PROFILE grammar.
 */
export interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
})

export function IconBell({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic bell: tapered body, defined rim, swinging clapper */}
      <path d="M12 4.2c-3.2 0-5.2 2.1-5.2 5.1 0 3.4-.9 4.7-1.6 5.5-.35.4-.05 1 .5 1h12.6c.55 0 .85-.6.5-1-.7-.8-1.6-2.1-1.6-5.5 0-3-2-5.1-5.2-5.1Z" />
      <path d="M12 2.6v1.4" />
      <path d="M9.6 15.9a2.5 2.5 0 0 0 4.8 0" />
    </svg>
  )
}

export function IconMessage({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Rounded chat bubble with a single elegant tail notch */}
      <path d="M12 4.2c-4.5 0-8.2 3-8.2 6.8 0 2.1 1.1 4 2.9 5.2-.1 1.2-.6 2.2-1.5 3 1.6-.1 3-.6 4-1.4.9.3 1.9.5 2.8.5 4.5 0 8.2-3 8.2-6.8S16.5 4.2 12 4.2Z" />
    </svg>
  )
}

export function IconMenu({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="4" y1="6.75" x2="20" y2="6.75" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17.25" x2="20" y2="17.25" />
    </svg>
  )
}

export function IconSearch({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10.6" cy="10.6" r="6.6" />
      <line x1="15.4" y1="15.4" x2="20.2" y2="20.2" />
    </svg>
  )
}

export function IconPerson({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Head + shoulders silhouette, cleanly balanced */}
      <circle cx="12" cy="7.8" r="3.8" />
      <path d="M4.6 20.2c.9-3.9 3.8-6 7.4-6s6.5 2.1 7.4 6" />
    </svg>
  )
}

export function IconBuilding({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Two-tone office block: main tower + annex, arched door, window grid */}
      <path d="M5.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14.5 5v15.5" />
      <path d="M14.5 9.5h3A1.5 1.5 0 0 1 19 11v9.5" />
      <path d="M3 20.5h18" />
      <path d="M8 7.5v1.2M11 7.5v1.2M8 11.5v1.2M11 11.5v1.2M8 15.5v1.2M11 15.5v1.2" />
      <path d="M10.2 20.5v-3.2a1.6 1.6 0 0 1 3.2 0v3.2" />
    </svg>
  )
}

export function IconGraduationCap({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic mortarboard with tassel */}
      <path d="M2.2 9.2 12 4.4l9.8 4.8L12 14 2.2 9.2Z" />
      <path d="M6.3 11v4.4c0 1.7 2.6 3 5.7 3s5.7-1.3 5.7-3V11" />
      <path d="M21.8 9.4v5.4" />
    </svg>
  )
}

export function IconGovernment({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classical portico: pediment, four columns, stepped base */}
      <path d="M2.4 9.6 12 3.9l9.6 5.7" />
      <path d="M2.4 9.6 12 15.3l9.6-5.7" />
      <path d="M4.6 11.6v6.2M9.2 11.6v6.2M14.8 11.6v6.2M19.4 11.6v6.2" />
      <path d="M2.8 19.6h18.4" />
      <path d="M3.4 21.4h17.2" />
    </svg>
  )
}

export function IconHome({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Gabled home: pitched roof, solid walls, centred door */}
      <path d="M3.2 10.6 12 4.2l8.8 6.4" />
      <path d="M5.4 9v11.2h13.2V9" />
      <path d="M10 20.2v-4.2a2 2 0 0 1 4 0v4.2" />
    </svg>
  )
}

export function IconHandshake({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Clasped hands meeting at centre — partnership */}
      <path d="M2.6 11.2 6.8 7.6l2.7 2.3a1.7 1.7 0 0 0 2.3 0l1.4-1.2a1.7 1.7 0 0 1 2.3 0l2.7 2.3 4.2-3.6" />
      <path d="M2.6 11.2 5 16.4l3-1.9" />
      <path d="M21.4 11.2 19 16.4l-3-1.9" />
      <path d="M8.6 13.1 10 14.6l1.4-1.5 1.4 1.5 1.4-1.5" />
    </svg>
  )
}

export function IconPlus({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconBriefcase({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic briefcase: latch, handle, reinforced seam */}
      <rect x="2.8" y="7.4" width="18.4" height="12.6" rx="2.4" />
      <path d="M8.6 7.4V6.1a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2v1.3" />
      <path d="M2.8 13.2h18.4" />
      <path d="M10.4 13.2v1.6h3.2v-1.6" />
    </svg>
  )
}

export function IconDocument({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Page with folded corner and ruled lines */}
      <path d="M13.4 3.2H7.4A2.2 2.2 0 0 0 5.2 5.4v13.2a2.2 2.2 0 0 0 2.2 2.2h9.2a2.2 2.2 0 0 0 2.2-2.2V8.2Z" />
      <path d="M13.4 3.2v4a1.6 1.6 0 0 0 1.6 1.6h3.8" />
      <path d="M8.6 12.6h6.8M8.6 15.8h6.8M8.6 19h3.4" />
    </svg>
  )
}

export function IconTag({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Price tag with a punched hole */}
      <path d="M11.6 3.4h5.4a2.6 2.6 0 0 1 2.6 2.6v5.4a2 2 0 0 1-.6 1.4l-6.2 6.2a2 2 0 0 1-2.8 0l-4.8-4.8a2 2 0 0 1 0-2.8l6.2-6.2a2 2 0 0 1 1.2-.6Z" />
      <circle cx="15.7" cy="8.3" r="1.4" />
    </svg>
  )
}

export function IconLink({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic interlocking chain link */}
      <path d="M9.6 14.4 14.4 9.6" />
      <path d="M11.4 6.9 13 5.3a4.3 4.3 0 0 1 6.1 6.1l-1.6 1.6" />
      <path d="M12.6 17.1 11 18.7a4.3 4.3 0 0 1-6.1-6.1l1.6-1.6" />
    </svg>
  )
}

export function IconTool({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic open-end wrench */}
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.6 17.4a1.6 1.6 0 0 0 0 2.3l1.7 1.7a1.6 1.6 0 0 0 2.3 0l5.7-5.7a4 4 0 0 0 5.4-5.4l-2.9 2.9-2.3-.6-.6-2.3Z" />
    </svg>
  )
}

export function IconHammer({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Claw hammer */}
      <path d="M13.9 4.1 20 10.2a1.5 1.5 0 0 1 0 2.1l-2 2a1.5 1.5 0 0 1-2.1 0l-1.4-1.4-6.1 6.1-3.1-3.1 6.1-6.1-1.4-1.4a1.5 1.5 0 0 1 0-2.1l2-2a1.5 1.5 0 0 1 2.1 0Z" />
    </svg>
  )
}

export function IconWarning({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Alert: rounded triangle with exclamation */}
      <path d="M10.3 4.3 2.9 17.4a2.4 2.4 0 0 0 2.1 3.6h14a2.4 2.4 0 0 0 2.1-3.6L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.4v4.2" />
      <path d="M12 16.6v.2" />
    </svg>
  )
}

export function IconThumbsUp({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Thumbs-up endorsement */}
      <path d="M7.2 11.2v8.4H5a1.6 1.6 0 0 1-1.6-1.6v-5.2a1.6 1.6 0 0 1 1.6-1.6Z" />
      <path d="M7.2 11.4 10.4 4a2.1 2.1 0 0 1 2.6 2.7l-.7 2.2h4.3a2.1 2.1 0 0 1 2 2.7l-1.6 6A2.1 2.1 0 0 1 15 19.6H7.2" />
    </svg>
  )
}

/** "Respect" reaction — a recognition medal, safer to render correctly than
 * a raised-hand gesture at 20px while staying clearly distinct from the
 * other five reaction icons. */
export function IconMedal({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Ribboned award medal with inner star */}
      <circle cx="12" cy="9" r="5.4" />
      <path d="M8.9 13.6 7 20.6l5-2.6 5 2.6-1.9-7" />
      <path d="M12 6.4l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3Z" />
    </svg>
  )
}

export function IconLightbulb({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic bulb: glass dome, filament base, screw thread */}
      <path d="M12 3.2a5.9 5.9 0 0 0-3.4 10.7c.5.4.8 1 .9 1.6h5c.1-.6.4-1.2.9-1.6A5.9 5.9 0 0 0 12 3.2Z" />
      <path d="M9.5 15.9h5" />
      <path d="M10.2 18.6h3.6" />
      <path d="M11 21.2h2" />
    </svg>
  )
}

export function IconSeedling({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Sprouting plant in soil — growth */}
      <path d="M12 21.2v-8.4" />
      <path d="M12 12.8C12 9.4 9.3 6.8 5.6 6.8c0 3.4 2.7 6 6.4 6Z" />
      <path d="M12 12.8c0-3.4 2.7-6 6.4-6 0 3.4-2.7 6-6.4 6Z" />
      <path d="M7.4 21.2h9.2" />
    </svg>
  )
}

export function IconMegaphone({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Announcement cone with broadcast arcs */}
      <path d="M3.4 10.2v3.6a1.4 1.4 0 0 0 1.4 1.4h1.4l7 4.4a1 1 0 0 0 1.6-.8V5.2a1 1 0 0 0-1.6-.8l-7 4.4H4.8a1.4 1.4 0 0 0-1.4 1.4Z" />
      <path d="M15.8 9.4a3.6 3.6 0 0 1 0 5.2" />
      <path d="M18.4 7a7 7 0 0 1 0 10" />
    </svg>
  )
}

export function IconFactory({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Sawtooth-roof industrial building with chimney */}
      <path d="M2.8 20.6v-8.4l4.4 2.6v-2.6l4.4 2.6v-2.6l4.4 2.6v-3.2l4.4 2.6v8.4Z" />
      <path d="M18 7.4V3.6" />
      <path d="M2.4 20.6h19.2" />
    </svg>
  )
}

export function IconCheck({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.6 12.6 9.4 17.4 19.4 6.6" />
    </svg>
  )
}

export function IconClose({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function IconChevronRight({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9.2 5.2 16 12l-6.8 6.8" />
    </svg>
  )
}

export function IconChevronLeft({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.8 5.2 8 12l6.8 6.8" />
    </svg>
  )
}

export function IconEnter({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Enter / sign-in: door frame with inward arrow */}
      <path d="M20.4 5.2v13.6a1.4 1.4 0 0 1-1.4 1.4h-6" />
      <path d="M13 12H3.6" />
      <path d="M7 8.4 3.4 12 7 15.6" />
    </svg>
  )
}

export function IconGear({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Classic settings cog — toothed ring around a hollow centre */}
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 4.5l1.7 1.7M17.8 17.8l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.5 19.5l1.7-1.7M17.8 6.2l1.7-1.7" />
    </svg>
  )
}

export function IconRepost({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Circular repost / re-share arrows */}
      <path d="M4 12.4V9.6a3 3 0 0 1 3-3h10" />
      <path d="M14.4 3.6 17 6.6l-2.6 3" />
      <path d="M20 11.6v2.8a3 3 0 0 1-3 3H7" />
      <path d="M9.6 20.4 7 17.4l2.6-3" />
    </svg>
  )
}

export function IconBookmark({ size = 20, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M6.4 4.4h11.2v15.2L12 15.8l-5.6 3.8Z" />
    </svg>
  )
}

export function IconShare({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Share: node radiating upward to two destinations */}
      <path d="M12 15.4V3.8" />
      <path d="M8.2 7.4 12 3.6l3.8 3.8" />
      <path d="M5.6 11.4V18a2.4 2.4 0 0 0 2.4 2.4h8.4A2.4 2.4 0 0 0 18.8 18v-6.6" />
    </svg>
  )
}

export function IconStar({ size = 20, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3.6l2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9Z" />
    </svg>
  )
}
