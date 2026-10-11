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
      {/* Identity card: portrait + detail lines */}
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.8" />
      <circle cx="8.8" cy="10.8" r="2.3" />
      <path d="M5.4 15.9c.6-1.7 1.8-2.6 3.4-2.6s2.8.9 3.4 2.6" />
      <path d="M15 9.8h3.6M15 12.8h2.6" />
    </svg>
  )
}
export function IconUsername({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Verified person handle */}
      <circle cx="11.4" cy="7.8" r="3.8" />
      <path d="M4.4 20.2c.8-4 3.8-6.2 7-6.2 1.6 0 3 .4 4.2 1.1" />
      <path d="M15.4 17.2 17.4 19.2 21.6 14.6" />
    </svg>
  )
}
export function IconBio({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Bio: ruled text lines with a closing node */}
      <path d="M4 6.2h16M4 11h11M4 15.8h7" />
      <circle cx="17.6" cy="15.8" r="1.6" />
    </svg>
  )
}

/* ── Verification states (§7, §23 — icon + text + colour, never colour alone) ─ */
export function IconVerify({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Verified shield with check */}
      <path d="M12 2.7 20 6v6.1c0 4.7-3.4 8.5-8 9.9-4.6-1.4-8-5.2-8-9.9V6Z" />
      <path d="M8.5 12.1 11 14.6 15.9 9.3" />
    </svg>
  )
}
export function IconVerificationPending({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Clock — awaiting verification */}
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 6.8V12l3.2 2.2" />
    </svg>
  )
}
export function IconVerificationFailed({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Shield with cross — verification failed */}
      <path d="M12 2.7 20 6v6.1c0 4.7-3.4 8.5-8 9.9-4.6-1.4-8-5.2-8-9.9V6Z" />
      <path d="M9.3 9.3 14.7 14.7M14.7 9.3 9.3 14.7" />
    </svg>
  )
}
export function IconVerificationRequest({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Outbox tray — a verification request awaiting dispatch */}
      <path d="M4 13.4V6.4a2.4 2.4 0 0 1 2.4-2.4h11.2A2.4 2.4 0 0 1 20 6.4v7" />
      <path d="M3.4 13.4h5l1.4 2.2h4.4l1.4-2.2h5" />
      <path d="M12 15.6V8.8" />
      <path d="M9.6 11 12 8.4 14.4 11" />
    </svg>
  )
}
export function IconVerificationSource({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Source node branching to two outputs */}
      <circle cx="5.6" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="18.4" cy="6.4" r="2.1" />
      <circle cx="18.4" cy="17.6" r="2.1" />
      <path d="M8.1 10.9 16.3 7.4M8.1 13.1 16.3 16.6" />
    </svg>
  )
}

/* ── Attribution ──────────────────────────────────────────────────────── */
export function IconAttribution({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Person with a confirmed attribution node */}
      <circle cx="11.4" cy="7.2" r="2.7" />
      <path d="M6.2 20.2c.7-3.6 2.8-5.5 5.2-5.5s4.5 1.9 5.2 5.5" />
      <path d="M16.8 4.2 18.2 5.6 20.8 2.8" />
    </svg>
  )
}
export function IconCitation({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Double quotation mark — citation */}
      <path d="M9.4 6.4C6.7 7.6 5 10 5 13v4.8h5.2v-6.4H7.3c.2-1.3 1-2.3 2.2-3Z" />
      <path d="M18.2 6.4c-2.7 1.2-4.4 3.6-4.4 6.6v4.8H19v-6.4h-2.9c.2-1.3 1-2.3 2.2-3Z" />
    </svg>
  )
}
export function IconContribution({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Spark pen — a contributed edit */}
      <path d="M4.4 19.6 5.6 15" />
      <path d="M13.2 3.4 20.6 10.8 15 16.4 7.6 9Z" />
      <circle cx="9.4" cy="11.2" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ── Organisation subtypes ────────────────────────────────────────────── */
export function IconInstitution({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Institution: columned hall with pediment */}
      <path d="M2.6 9.4 12 3.8l9.4 5.6" />
      <path d="M5 10.4v8M9.5 10.4v8M14.5 10.4v8M19 10.4v8" />
      <path d="M3 18.4h18" />
      <path d="M2.6 20.6h18.8" />
    </svg>
  )
}
export function IconSchool({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* School: mortarboard over a bell-shaped building base */}
      <path d="M2.6 9 12 4.4 21.4 9 12 13.6 2.6 9Z" />
      <path d="M6.4 10.8v4.6c0 1.6 2.5 2.8 5.6 2.8s5.6-1.2 5.6-2.8v-4.6" />
      <path d="M21.4 9v5" />
    </svg>
  )
}
export function IconNgo({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Outreach: core node with cardinal reach */}
      <circle cx="12" cy="12" r="3.1" />
      <circle cx="12" cy="12" r="7.6" opacity="0.5" />
      <path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6" />
    </svg>
  )
}
export function IconDepartment({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Department: three defined modules + an open add slot */}
      <rect x="3.6" y="3.6" width="7" height="7" rx="1.6" />
      <rect x="13.4" y="3.6" width="7" height="7" rx="1.6" />
      <rect x="3.6" y="13.4" width="7" height="7" rx="1.6" />
      <path d="M16.9 13.4v7M13.4 16.9h7" />
    </svg>
  )
}
export function IconTeam({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Two people — a team */}
      <circle cx="8.4" cy="8.8" r="2.7" />
      <circle cx="16.6" cy="10.2" r="2.1" />
      <path d="M3.2 19.2c.6-3.1 2.7-4.8 5.2-4.8s4.6 1.7 5.2 4.8" />
      <path d="M15 19c.4-2.3 1.7-3.5 3.3-3.5s2.7 1 3.1 3" />
    </svg>
  )
}

/* ── Education ────────────────────────────────────────────────────────── */
export function IconDegree({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Ribboned degree medallion with inner detail */}
      <circle cx="12" cy="9" r="5.6" />
      <path d="M9.4 13.7 8 20.4l4-2.1 4 2.1-1.4-6.7" />
      <path d="M12 6.4v5.2M9.6 8.6h4.8" />
    </svg>
  )
}
export function IconCertificate({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Certificate with rosette seal */}
      <rect x="3" y="3.8" width="18" height="12.4" rx="2.2" />
      <path d="M6.6 8h6.4M6.6 11.2h4.2" />
      <circle cx="16" cy="17.4" r="2.7" />
      <path d="M14.5 19.7 14 21.6l2-1 2 1-.5-1.9" />
    </svg>
  )
}
export function IconAlumni({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Alumni: cap with hanging tassel on a graduate base */}
      <path d="M2.6 9 12 4.4 21.4 9 12 13.6 2.6 9Z" />
      <path d="M6.8 11.4v4.4c0 1.5 2.3 2.7 5.2 2.7s5.2-1.2 5.2-2.7v-4.4" />
      <path d="M21.4 9.2v5.4" />
    </svg>
  )
}

/* ── Career ───────────────────────────────────────────────────────────── */
export function IconCareerPath({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Ascending nodes tracing a career progression */}
      <circle cx="4.8" cy="18.6" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="12.6" r="1.6" />
      <circle cx="17.2" cy="6.6" r="2.1" fill="currentColor" stroke="none" />
      <path d="M4.8 18.6 10.4 12.6 17.2 6.6" />
    </svg>
  )
}
export function IconPromotion({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Upward trend with arrowhead — a promotion */}
      <path d="M3.8 17.4 9.4 12l3.6 2.8 7-7.6" />
      <path d="M15 7.2h5v5" />
    </svg>
  )
}
export function IconCurrentPosition({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Radar target — the current, active position */}
      <circle cx="12" cy="12" r="8.2" opacity="0.5" />
      <circle cx="12" cy="12" r="3.1" />
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
      {/* ID badge: portrait + credential lines */}
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.6" />
      <circle cx="8.8" cy="10.9" r="2.2" />
      <path d="M5.4 16c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3" />
      <path d="M15 9.8h3.6M15 13h2.6" />
    </svg>
  )
}
export function IconCv({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* CV: folded page with a signature line */}
      <path d="M13 3.2H7.2A2.2 2.2 0 0 0 5 5.4v13.2a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2V8.2Z" />
      <path d="M13 3.2v4a1.6 1.6 0 0 0 1.6 1.6h4.4" />
      <path d="M8.4 11.4h7.2M8.4 14.4h7.2M8.4 17.4h3.8" />
    </svg>
  )
}
export function IconPortfolio({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Portfolio case with clasp */}
      <rect x="2.8" y="7.2" width="18.4" height="12.8" rx="2.4" />
      <path d="M8.8 7.2V5.6a2.2 2.2 0 0 1 2.2-2.2h2a2.2 2.2 0 0 1 2.2 2.2v1.6" />
      <path d="M2.8 12.6h18.4" />
      <path d="M10.4 12.6v1.8h3.2v-1.8" />
    </svg>
  )
}
export function IconRecord({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Structured record: ledger with entries */}
      <rect x="3.4" y="3.8" width="17.2" height="16.4" rx="2.2" />
      <path d="M7.4 8.4h4M7.4 12h9M7.4 15.6h6" />
      <circle cx="17.2" cy="8.4" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function IconAttachment({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Paperclip */}
      <path d="M16.4 6.6 9.2 13.8a2.6 2.6 0 0 0 3.7 3.7l7.2-7.2a4.6 4.6 0 0 0-6.5-6.5L6 11.2a6.6 6.6 0 0 0 9.4 9.3" />
    </svg>
  )
}

/* ── Network ──────────────────────────────────────────────────────────── */
export function IconAffiliation({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Two nodes joined — an affiliation */}
      <circle cx="5.8" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="18.2" cy="12" r="2.5" />
      <path d="M8.3 12h7.4" />
    </svg>
  )
}
export function IconColleague({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Two peers — colleagues */}
      <circle cx="8.8" cy="8.6" r="2.7" />
      <circle cx="16.8" cy="10" r="2.1" />
      <path d="M3.4 19.2c.6-3 2.7-4.6 5.4-4.6s4.8 1.6 5.4 4.6" />
      <path d="M15.4 18.9c.4-2.1 1.6-3.2 3.2-3.2s2.6 1 3 2.9" />
    </svg>
  )
}
export function IconCommunity({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Hub-and-spoke network — a community */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="5.8" r="1.9" />
      <circle cx="19" cy="5.8" r="1.9" />
      <circle cx="5" cy="18.2" r="1.9" />
      <circle cx="19" cy="18.2" r="1.9" />
      <path d="M6.4 7.2 9.9 10M17.6 7.2 14.1 10M6.4 16.8 9.9 14M17.6 16.8 14.1 14" />
    </svg>
  )
}

/* ── Platform / status ────────────────────────────────────────────────── */
export function IconExplore({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Compass rose — explore */}
      <circle cx="12" cy="12" r="9.2" />
      <path d="M15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6Z" />
    </svg>
  )
}
export function IconDashboard({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Modular dashboard layout */}
      <rect x="3.4" y="3.4" width="7.2" height="8.2" rx="1.6" />
      <rect x="13.4" y="3.4" width="7.2" height="5.2" rx="1.6" />
      <rect x="3.4" y="14.4" width="7.2" height="6.2" rx="1.6" />
      <rect x="13.4" y="11.4" width="7.2" height="9.2" rx="1.6" />
    </svg>
  )
}
export function IconAnalytics({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Bar chart on axes */}
      <path d="M3.6 20.4V3.6M3.6 20.4h16.8" />
      <path d="M8 20.4v-5.4M12.6 20.4V8.4M17.2 20.4v-8.4" />
    </svg>
  )
}
export function IconActivity({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Activity pulse line */}
      <path d="M2.8 12h3.8l2.6-6.6 4.4 13.2 2.6-6.6h5" />
    </svg>
  )
}
export function IconHistory({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Clock with rewind arrow — history */}
      <path d="M3.6 12a8.4 8.4 0 1 0 2.5-6L3 8.6" />
      <path d="M3 4.2v4.6h4.6" />
      <path d="M12 7.8v4.4l3.2 1.9" />
    </svg>
  )
}
export function IconCopy({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Duplicate / copy two panes */}
      <rect x="9" y="9" width="11.4" height="11.4" rx="2.2" />
      <path d="M5.4 15H5a1.6 1.6 0 0 1-1.6-1.6V5A1.6 1.6 0 0 1 5 3.4h8.4A1.6 1.6 0 0 1 15 5v.4" />
    </svg>
  )
}
export function IconReport({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Report flag with alert mark */}
      <path d="M5 3.6h13.8v11.6l-3.2 2.2-2.3-1.6-2.3 1.6L5 15.2Z" />
      <path d="M11.9 7v3.6" />
      <path d="M11.9 12.6v.3" />
    </svg>
  )
}
export function IconPrivacy({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      {/* Shield with padlock — privacy */}
      <path d="M12 2.8 19.6 5.9v5.3c0 4.4-3.2 8.1-7.6 9.5-4.4-1.4-7.6-5.1-7.6-9.5V5.9Z" />
      <rect x="9" y="10.4" width="6" height="5.2" rx="1.2" />
      <path d="M10.3 10.4V9.3a1.7 1.7 0 0 1 3.4 0v1.1" />
    </svg>
  )
}
export function IconSaved({ size = 20, className }: PIconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.6 3.6h10.8v16.8L12 16.8l-5.4 3.6Z" />
    </svg>
  )
}


