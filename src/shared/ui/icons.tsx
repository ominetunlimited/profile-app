/**
 * V9 Unified Ecosystem Patch §17 Icon System — resolves the named conflict.
 * §10.7 said "Lucide SVG only," but this build never actually depended on
 * Lucide anywhere (`grep lucide-react` across the whole tree returns
 * nothing) — the real, pre-existing icon system was ad hoc emoji glyphs
 * (🔔 💬 ☰ 👍 🏢 …), which is what actually violates §10.7's underlying
 * discipline: inconsistent rendering across OS/browser, no brand-token
 * color, no consistent stroke weight. This is the one custom PROFILE icon
 * family the patch asks for — a small, hand-authored, consistent SVG set
 * (24x24 viewBox, uniform 1.75 stroke, round joins, `currentColor` so every
 * usage inherits the brand-token color already applied to its container)
 * replacing every real icon usage this build has. Kept intentionally
 * geometric/simple rather than illustrative, so every icon reads at 16px on
 * mobile exactly as cleanly as it does at 24px on desktop — same "no
 * separate, lower-fidelity mobile set" rule the patch names explicitly.
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
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 6 2 6.5H4C4.5 14 6 12 6 8Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  )
}

export function IconMessage({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="3" />
      <path d="M8 16.5l-2.5 3v-3" />
    </svg>
  )
}

export function IconMenu({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}

export function IconSearch({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.3" y1="15.3" x2="20" y2="20" />
    </svg>
  )
}

export function IconPerson({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </svg>
  )
}

export function IconBuilding({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="1" />
      <rect x="8" y="7" width="2" height="2" />
      <rect x="14" y="7" width="2" height="2" />
      <rect x="8" y="12" width="2" height="2" />
      <rect x="14" y="12" width="2" height="2" />
      <rect x="10" y="16" width="4" height="4.5" />
    </svg>
  )
}

export function IconGraduationCap({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2 9l10-4 10 4-10 4-10-4Z" />
      <path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" />
      <line x1="22" y1="9" x2="22" y2="15" />
    </svg>
  )
}

export function IconGovernment({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2 10l10-5.5 10 5.5" />
      <line x1="4" y1="10" x2="4" y2="18" />
      <line x1="9" y1="10" x2="9" y2="18" />
      <line x1="15" y1="10" x2="15" y2="18" />
      <line x1="20" y1="10" x2="20" y2="18" />
      <line x1="2" y1="20.5" x2="22" y2="20.5" />
    </svg>
  )
}

export function IconHome({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 11l8-6.5 8 6.5" />
      <path d="M6 10v9.5h12V10" />
      <rect x="10" y="13.5" width="4" height="6" />
    </svg>
  )
}

export function IconHandshake({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 11.5l4-3 3 2.5 3.5-2.5 3.5 2.5 4-2.5" />
      <path d="M3 11.5l2.5 5 3-1.8" />
      <path d="M21 11.5l-2.5 5-3-1.8" />
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
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8.5 8V6.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V8" />
      <line x1="3" y1="13.5" x2="21" y2="13.5" />
    </svg>
  )
}

export function IconDocument({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 3h7l5 5v13H7Z" />
      <path d="M14 3v5h5" />
      <line x1="9.5" y1="12.5" x2="16" y2="12.5" />
      <line x1="9.5" y1="16" x2="16" y2="16" />
    </svg>
  )
}

export function IconTag({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3h6a2 2 0 0 1 2 2v6L11 20l-9-9L11 3Z" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconLink({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="9" width="8" height="6" rx="3" />
      <rect x="13" y="9" width="8" height="6" rx="3" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  )
}

export function IconTool({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
    </svg>
  )
}

export function IconHammer({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15 3l6 6-3 3-2-2-8 8-3-3 8-8-2-2Z" />
      <line x1="4" y1="20" x2="9" y2="15" />
    </svg>
  )
}

export function IconWarning({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3l10 18H2Z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconThumbsUp({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 11v9H4v-9Z" />
      <path d="M7 11l3-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.2l-1.3 6A2 2 0 0 1 16 20H7" />
    </svg>
  )
}

/** "Respect" reaction — a recognition medal, safer to render correctly than
 * a raised-hand gesture at 20px while staying clearly distinct from the
 * other five reaction icons. */
export function IconMedal({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L7 21l5-3 5 3-2-7.5" />
    </svg>
  )
}

export function IconLightbulb({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9v.2h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z" />
      <path d="M9 18h6" />
      <path d="M10 21h4" />
    </svg>
  )
}

export function IconSeedling({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21v-8" />
      <path d="M12 13c-4 0-7-3-7-7 4 0 7 2 7 5" />
      <path d="M12 11c0-3 3-5 7-5 0 4-3 7-7 7" />
    </svg>
  )
}

export function IconMegaphone({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 10v4h3l6 4V6l-6 4Z" />
      <path d="M15 9a4 4 0 0 1 0 6" />
      <path d="M18 6a8 8 0 0 1 0 12" />
    </svg>
  )
}

export function IconFactory({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 21V11l5 3V11l5 3V8l6 4v9Z" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  )
}

export function IconCheck({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}

export function IconClose({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
    </svg>
  )
}

export function IconChevronRight({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconChevronLeft({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function IconEnter({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M19 6v6H8" />
      <path d="M11 9l-3 3 3 3" />
    </svg>
  )
}

export function IconGear({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  )
}

export function IconRepost({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 12V9a3 3 0 0 1 3-3h11" />
      <path d="M15 3l3 3-3 3" />
      <path d="M20 12v3a3 3 0 0 1-3 3H6" />
      <path d="M9 21l-3-3 3-3" />
    </svg>
  )
}

export function IconBookmark({ size = 20, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 4h12v16l-6-4-6 4V4Z" />
    </svg>
  )
}

export function IconShare({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  )
}

export function IconStar({ size = 20, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </svg>
  )
}
