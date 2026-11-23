/**
 * PROFILE ICON SYSTEM, extended semantic families (§4, §5).
 *
 * Lucide SVG only (Master Prompt §10.7): one family, 1.75 stroke, 24px grid,
 * colour from currentColor. Names and props are unchanged, so every consumer
 * (badges, profile sections, navigation) picks up the Lucide glyphs untouched.
 */
import { Activity,AlignLeft,AtSign,Award,BadgeCheck,BookUser,Bookmark,Briefcase,ChartColumn,Compass,Copy,FileCheck,FileUser,Flag,FolderOpen,GraduationCap,HandHeart,HeartHandshake,History,Hourglass,IdCard,Landmark,LayoutDashboard,Link2,Lock,Network,Paperclip,Quote,Route,School,ScrollText,ShieldAlert,Stamp,TrendingUp,UserCheck,UserRound,Users } from 'lucide-react'

export interface PIconProps {
  size?: number
  className?: string
}

export function IconIdentity({ size = 20, className }: PIconProps) {
  return <IdCard size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconUsername({ size = 20, className }: PIconProps) {
  return <AtSign size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconBio({ size = 20, className }: PIconProps) {
  return <AlignLeft size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconVerify({ size = 20, className }: PIconProps) {
  return <BadgeCheck size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconVerificationPending({ size = 20, className }: PIconProps) {
  return <Hourglass size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconVerificationFailed({ size = 20, className }: PIconProps) {
  return <ShieldAlert size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconVerificationRequest({ size = 20, className }: PIconProps) {
  return <FileCheck size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconVerificationSource({ size = 20, className }: PIconProps) {
  return <Stamp size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconAttribution({ size = 20, className }: PIconProps) {
  return <UserCheck size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCitation({ size = 20, className }: PIconProps) {
  return <Quote size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconContribution({ size = 20, className }: PIconProps) {
  return <HeartHandshake size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconInstitution({ size = 20, className }: PIconProps) {
  return <Landmark size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconSchool({ size = 20, className }: PIconProps) {
  return <School size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconNgo({ size = 20, className }: PIconProps) {
  return <HandHeart size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconDepartment({ size = 20, className }: PIconProps) {
  return <Network size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconTeam({ size = 20, className }: PIconProps) {
  return <Users size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconDegree({ size = 20, className }: PIconProps) {
  return <GraduationCap size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCertificate({ size = 20, className }: PIconProps) {
  return <Award size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconAlumni({ size = 20, className }: PIconProps) {
  return <BookUser size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCareerPath({ size = 20, className }: PIconProps) {
  return <Route size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconPromotion({ size = 20, className }: PIconProps) {
  return <TrendingUp size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCurrentPosition({ size = 20, className }: PIconProps) {
  return <Briefcase size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconFormerPosition({ size = 20, className }: PIconProps) {
  return <History size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconId({ size = 20, className }: PIconProps) {
  return <IdCard size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCv({ size = 20, className }: PIconProps) {
  return <FileUser size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconPortfolio({ size = 20, className }: PIconProps) {
  return <FolderOpen size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconRecord({ size = 20, className }: PIconProps) {
  return <ScrollText size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconAttachment({ size = 20, className }: PIconProps) {
  return <Paperclip size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconAffiliation({ size = 20, className }: PIconProps) {
  return <Link2 size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconColleague({ size = 20, className }: PIconProps) {
  return <UserRound size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCommunity({ size = 20, className }: PIconProps) {
  return <Users size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconExplore({ size = 20, className }: PIconProps) {
  return <Compass size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconDashboard({ size = 20, className }: PIconProps) {
  return <LayoutDashboard size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconAnalytics({ size = 20, className }: PIconProps) {
  return <ChartColumn size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconActivity({ size = 20, className }: PIconProps) {
  return <Activity size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconHistory({ size = 20, className }: PIconProps) {
  return <History size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconCopy({ size = 20, className }: PIconProps) {
  return <Copy size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconReport({ size = 20, className }: PIconProps) {
  return <Flag size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconPrivacy({ size = 20, className }: PIconProps) {
  return <Lock size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export function IconSaved({ size = 20, className }: PIconProps) {
  return <Bookmark size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}
