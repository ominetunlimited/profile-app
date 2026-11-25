/**
 * PROFILE ICON SYSTEM: Hugeicons (the design system's icon family), one stroke,
 * one sizing rule, colour inherited via currentColor. Exported names and props
 * are unchanged, so every screen picks the new glyphs up without other edits.
 */
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  AlertCircleIcon,
  Analytics01Icon,
  Archive01Icon,
  AtIcon,
  Attachment01Icon,
  Award01Icon,
  BankIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CharityIcon,
  ChartUpIcon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  Compass01Icon,
  Copy01Icon,
  DashboardCircleIcon,
  FileUserIcon,
  FileValidationIcon,
  Flag01Icon,
  FlowConnectionIcon,
  Folder01Icon,
  GraduationCapIcon,
  HeartCheckIcon,
  HourglassIcon,
  IdCardIcon,
  Link02Icon,
  LockIcon,
  QuoteDownIcon,
  Route01Icon,
  SchoolIcon,
  Stamp01Icon,
  TextAlignLeftIcon,
  UserCheck01Icon,
  UserGroupIcon,
  UserIcon,
  UserStarIcon,
} from '@hugeicons/core-free-icons'

export interface PIconProps {
  size?: number
  className?: string
}

const STROKE = 1.6

export function IconIdentity({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={IdCardIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconUsername({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={AtIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconBio({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={TextAlignLeftIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconVerify({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={CheckmarkBadge01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconVerificationPending({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={HourglassIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconVerificationFailed({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={AlertCircleIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconVerificationRequest({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={FileValidationIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconVerificationSource({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Stamp01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconAttribution({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={UserCheck01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCitation({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={QuoteDownIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconContribution({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={HeartCheckIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconInstitution({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={BankIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconSchool({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={SchoolIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconNgo({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={CharityIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconDepartment({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={FlowConnectionIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconTeam({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={UserGroupIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconDegree({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={GraduationCapIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCertificate({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Award01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconAlumni({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={UserStarIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCareerPath({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Route01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconPromotion({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={ChartUpIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCurrentPosition({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={BriefcaseIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconFormerPosition({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Clock01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconId({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={IdCardIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCv({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={FileUserIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconPortfolio({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Folder01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconRecord({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Archive01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconAttachment({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Attachment01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconAffiliation({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Link02Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconColleague({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={UserIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCommunity({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={UserGroupIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconExplore({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Compass01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconDashboard({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={DashboardCircleIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconAnalytics({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Analytics01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconActivity({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Activity01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconHistory({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Clock01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconCopy({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Copy01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconReport({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={Flag01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconPrivacy({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={LockIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}

export function IconSaved({ size = 20, className }: PIconProps) {
  return <HugeiconsIcon icon={BookmarkIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} aria-hidden="true" />
}
