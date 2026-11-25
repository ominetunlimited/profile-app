/**
 * PROFILE ICON SYSTEM: Hugeicons (the design system's icon family), one stroke,
 * one sizing rule, colour inherited via currentColor. Exported names and props
 * are unchanged, so every screen picks the new glyphs up without other edits.
 */
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BankIcon,
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  Building02Icon,
  Cancel01Icon,
  FactoryIcon,
  FileTextIcon,
  GraduationCapIcon,
  HammerIcon,
  HandshakeIcon,
  HomeIcon,
  LightbulbIcon,
  Link02Icon,
  Login01Icon,
  Medal01Icon,
  Megaphone01Icon,
  Menu01Icon,
  MessageSquareIcon,
  Plant01Icon,
  PlusSignIcon,
  RepeatIcon,
  Search01Icon,
  Settings01Icon,
  Share08Icon,
  StarIcon,
  Tag01Icon,
  ThumbsUpIcon,
  Tick02Icon,
  UserIcon,
  Wrench01Icon,
  ArrowRightIcon,
  CheckmarkBadge01Icon,
  ShieldCheckIcon,
  TrendingUpIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons'

export interface IconProps {
  size?: number
  className?: string
  filled?: boolean
}

const STROKE = 1.6

export function IconBell({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={BellIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMessage({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={MessageSquareIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMenu({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Menu01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconSearch({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Search01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconPerson({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={UserIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBuilding({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Building02Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconGraduationCap({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={GraduationCapIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconGovernment({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={BankIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconHome({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={HomeIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconHandshake({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={HandshakeIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconPlus({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={PlusSignIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBriefcase({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={BriefcaseIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconDocument({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={FileTextIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconTag({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Tag01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconLink({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Link02Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconTool({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Wrench01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconHammer({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={HammerIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconWarning({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Alert02Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconThumbsUp({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={ThumbsUpIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMedal({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Medal01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconLightbulb({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={LightbulbIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconSeedling({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Plant01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMegaphone({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Megaphone01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconFactory({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={FactoryIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconCheck({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Tick02Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconClose({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Cancel01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconChevronRight({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={ArrowRight01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconChevronLeft({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={ArrowLeft01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconEnter({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Login01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconGear({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Settings01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconRepost({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={RepeatIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBookmark({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={BookmarkIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconShare({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={Share08Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconStar({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={StarIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconArrowRight({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={ArrowRightIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBadgeCheck({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={CheckmarkBadge01Icon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconShieldCheck({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={ShieldCheckIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconTrendingUp({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={TrendingUpIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconZap({ size = 20, className, filled }: IconProps) {
  return <HugeiconsIcon icon={ZapIcon} size={size} strokeWidth={STROKE} color="currentColor" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}
