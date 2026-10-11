/**
 * PROFILE ICON SYSTEM — extended semantic families (§4, §5).
 *
 * Same grammar as shared/ui/icons.tsx: 24×24 viewBox, uniform 1.75 stroke,
 * round joins/caps, `currentColor`, `aria-hidden`. Icons feel precise,
 * architectural and modern — never cartoonish, never 3D, never emoji. Crisp
 * from 16px to 48px+. Colours always come from the brand tokens applied to the
 * container, so nothing is hard-coded here.
 *
 * These extend (never replace) the base set in icons.tsx with the attribution,
 * verification-state, organisation-subtype, education, career, document,
 * network and platform families the patch calls out.
 */
export interface PIconProps {
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

/* ── Identity ─────────────────────────────────────────────────────────── */
export function IconIdentity({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16.2c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4" />
      <path d="M15 10h4M15 13.5h3" />
    </svg>
  )
}
export function IconUsername({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s5.4 1.6 6.2 4.6" />
      <path d="M16.5 5.5l1 1 1.8-2" opacity="0.6" />
    </svg>
  )
}
export function IconBio({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6h16M4 11h12M4 16h9" />
      <circle cx="18.5" cy="16" r="1.6" />
    </svg>
  )
}

/* ── Verification states (§7, §23 — icon + text + colour, never colour alone) ─ */
export function IconVerify({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.6l8 3.3v6c0 4.5-3.3 8.2-8 9.5-4.7-1.3-8-5-8-9.5v-6l8-3.3Z" />
      <path d="M8.6 12.2l2.5 2.5 4.3-4.8" />
    </svg>
  )
}
export function IconVerificationPending({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}
export function IconVerificationFailed({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.6l8 3.3v6c0 4.5-3.3 8.2-8 9.5-4.7-1.3-8-5-8-9.5v-6l8-3.3Z" />
      <path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" />
    </svg>
  )
}
export function IconVerificationRequest({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 5.5h9.5a2 2 0 0 1 2 2V19l-3.5-2.4L8.5 19V7.5" />
      <path d="M17 8.5h3v8.7" />
      <path d="M15.5 12.7h4" opacity="0.7" />
    </svg>
  )
}
export function IconVerificationSource({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6.5" r="2" />
      <circle cx="18" cy="17.5" r="2" />
      <path d="M8.2 10.8l7.6-3M8.2 13.2l7.6 3" />
    </svg>
  )
}

/* ── Attribution ──────────────────────────────────────────────────────── */
export function IconAttribution({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="7" r="2.6" />
      <path d="M7 20c.7-3.4 2.7-5.2 5-5.2s4.3 1.8 5 5.2" />
      <path d="M17.5 4.5l1 1 1.7-1.9" opacity="0.6" />
    </svg>
  )
}
export function IconCitation({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 6.5C6.5 7.5 5 9.6 5 12v5.5h5V11H7.4c.3-1 1-1.8 2-2.3Z" />
      <path d="M18 6.5C15.5 7.5 14 9.6 14 12v5.5h5V11h-2.6c.3-1 1-1.8 2-2.3Z" />
    </svg>
  )
}
export function IconContribution({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20l5-5" />
      <path d="M13.5 3.5l7 7-4 4-7-7Z" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ── Organisation subtypes ────────────────────────────────────────────── */
export function IconInstitution({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 9.5l9-5 9 5" />
      <path d="M5 9.5V18M10 9.5V18M14 9.5V18M19 9.5V18" />
      <path d="M3 20h18" />
    </svg>
  )
}
export function IconSchool({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.5 9L12 4.5 21.5 9 12 13.5 2.5 9Z" />
      <path d="M6.5 11v4.5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V11" />
    </svg>
  )
}
export function IconNgo({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      <circle cx="12" cy="12" r="7.5" opacity="0.5" />
    </svg>
  )
}
export function IconDepartment({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="M13 16.5h7M16.5 13v7" />
    </svg>
  )
}
export function IconTeam({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="8.5" cy="9" r="2.6" />
      <circle cx="16.5" cy="10.5" r="2" />
      <path d="M3.5 19c.6-3 2.6-4.6 5-4.6s4.4 1.6 5 4.6" />
      <path d="M15 19c.4-2.2 1.6-3.4 3.2-3.4s2.6 1 3 3" />
    </svg>
  )
}

/* ── Education ────────────────────────────────────────────────────────── */
export function IconDegree({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9.5 13.6L8 20l4-2 4 2-1.5-6.4" />
      <path d="M10.5 8.5h3M12 7v3" opacity="0.7" />
    </svg>
  )
}
export function IconCertificate({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4" width="17" height="12" rx="2" />
      <path d="M7 8h6M7 11h4" />
      <circle cx="16" cy="17.5" r="2.6" />
      <path d="M14.6 19.6l-.6 2 2-1 2 1-.6-2" />
    </svg>
  )
}
export function IconAlumni({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.5 9L12 4.5 21.5 9 12 13.5 2.5 9Z" />
      <path d="M7 11.5V16c0 1.3 2.2 2.5 5 2.5s5-1.2 5-2.5v-4.5" />
      <path d="M21.5 9v5" />
    </svg>
  )
}

/* ── Career ───────────────────────────────────────────────────────────── */
export function IconCareerPath({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="5" cy="18.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="11" cy="12" r="1.6" />
      <circle cx="17" cy="6.5" r="2" fill="currentColor" stroke="none" />
      <path d="M5 18.5l4-4.5 4-3.5 3.5-3" />
    </svg>
  )
}
export function IconPromotion({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 17l5-5 4 3 7-8" />
      <path d="M15 7h5v5" />
    </svg>
  )
}
export function IconCurrentPosition({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" opacity="0.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function IconFormerPosition({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8" opacity="0.55" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/* ── Documents ────────────────────────────────────────────────────────── */
export function IconId({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16c.5-1.5 1.7-2.3 3.2-2.3s2.7.8 3.2 2.3" />
      <path d="M15 10h3.5M15 13h2.5" />
    </svg>
  )
}
export function IconCv({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v4h4" />
      <path d="M9 11h6M9 14h6M9 17h3" />
    </svg>
  )
}
export function IconPortfolio({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V7" />
      <path d="M3 12h18" />
    </svg>
  )
}
export function IconRecord({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M7.5 8.5h4M7.5 12h9M7.5 15.5h6" />
      <circle cx="17" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function IconAttachment({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M16 7l-7.2 7.2a2.4 2.4 0 0 0 3.4 3.4l7-7a4.3 4.3 0 0 0-6-6L6 11.6a6.2 6.2 0 0 0 8.8 8.8" />
    </svg>
  )
}

/* ── Network ──────────────────────────────────────────────────────────── */
export function IconAffiliation({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="6" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="2.4" />
      <path d="M8.4 12h7.2" />
    </svg>
  )
}
export function IconColleague({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="8.5" r="2.6" />
      <circle cx="16.5" cy="10" r="2" />
      <path d="M4 19c.6-2.8 2.6-4.3 5-4.3s4.4 1.5 5 4.3" />
      <path d="M15.5 18.8c.4-2 1.5-3 3-3s2.4.9 2.8 2.6" />
    </svg>
  )
}
export function IconCommunity({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="6" r="1.8" />
      <circle cx="19" cy="6" r="1.8" />
      <circle cx="5" cy="18" r="1.8" />
      <circle cx="19" cy="18" r="1.8" />
      <path d="M6.5 7.3l3.8 3M17.5 7.3l-3.8 3M6.5 16.7l3.8-3M17.5 16.7l-3.8-3" />
    </svg>
  )
}

/* ── Platform / status ────────────────────────────────────────────────── */
export function IconExplore({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5Z" />
    </svg>
  )
}
export function IconDashboard({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    </svg>
  )
}
export function IconAnalytics({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 20v-6M12.5 20V9M17 20v-9" />
    </svg>
  )
}
export function IconActivity({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
    </svg>
  )
}
export function IconHistory({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.5" />
      <path d="M3 4v4.5h4.5" />
      <path d="M12 8v4.2l3 1.8" />
    </svg>
  )
}
export function IconCopy({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  )
}
export function IconReport({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 3.5h14v12l-3.2 2.2-2.3-1.6-2.3 1.6L5 15.5Z" />
      <path d="M12 7v4M12 13.2v.3" />
    </svg>
  )
}
export function IconPrivacy({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.8l7.5 3v5.4c0 4.4-3.1 8-7.5 9.4-4.4-1.4-7.5-5-7.5-9.4V5.8l7.5-3Z" />
      <rect x="9" y="10.5" width="6" height="5" rx="1" />
      <path d="M10.2 10.5V9.4a1.8 1.8 0 0 1 3.6 0v1.1" />
    </svg>
  )
}
export function IconSaved({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8Z" />
    </svg>
  )
}

