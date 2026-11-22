/**
 * PROFILE ICON SYSTEM (Master Prompt §10.7): Lucide SVG only, one family, one
 * stroke weight, one sizing rule, colour inherited via currentColor.
 *
 * The exported names and props are unchanged, so every screen that imports an
 * `IconX` from here picks up the Lucide glyphs without any other edit.
 */
import { Bell,MessageSquare,Menu,Search,User,Building2,GraduationCap,Landmark,House,Handshake,Plus,Briefcase,FileText,Tag,Link2,Wrench,Hammer,TriangleAlert,ThumbsUp,Medal,Lightbulb,Sprout,Megaphone,Factory,Check,X,ChevronRight,ChevronLeft,LogIn,Settings,Repeat2,Bookmark,Share2,Star } from 'lucide-react'

export interface IconProps {
  size?: number
  className?: string
  filled?: boolean
}

const STROKE = 1.75

export function IconBell({ size = 20, className, filled }: IconProps) {
  return <Bell size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMessage({ size = 20, className, filled }: IconProps) {
  return <MessageSquare size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMenu({ size = 20, className, filled }: IconProps) {
  return <Menu size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconSearch({ size = 20, className, filled }: IconProps) {
  return <Search size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconPerson({ size = 20, className, filled }: IconProps) {
  return <User size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBuilding({ size = 20, className, filled }: IconProps) {
  return <Building2 size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconGraduationCap({ size = 20, className, filled }: IconProps) {
  return <GraduationCap size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconGovernment({ size = 20, className, filled }: IconProps) {
  return <Landmark size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconHome({ size = 20, className, filled }: IconProps) {
  return <House size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconHandshake({ size = 20, className, filled }: IconProps) {
  return <Handshake size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconPlus({ size = 20, className, filled }: IconProps) {
  return <Plus size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBriefcase({ size = 20, className, filled }: IconProps) {
  return <Briefcase size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconDocument({ size = 20, className, filled }: IconProps) {
  return <FileText size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconTag({ size = 20, className, filled }: IconProps) {
  return <Tag size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconLink({ size = 20, className, filled }: IconProps) {
  return <Link2 size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconTool({ size = 20, className, filled }: IconProps) {
  return <Wrench size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconHammer({ size = 20, className, filled }: IconProps) {
  return <Hammer size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconWarning({ size = 20, className, filled }: IconProps) {
  return <TriangleAlert size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconThumbsUp({ size = 20, className, filled }: IconProps) {
  return <ThumbsUp size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMedal({ size = 20, className, filled }: IconProps) {
  return <Medal size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconLightbulb({ size = 20, className, filled }: IconProps) {
  return <Lightbulb size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconSeedling({ size = 20, className, filled }: IconProps) {
  return <Sprout size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconMegaphone({ size = 20, className, filled }: IconProps) {
  return <Megaphone size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconFactory({ size = 20, className, filled }: IconProps) {
  return <Factory size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconCheck({ size = 20, className, filled }: IconProps) {
  return <Check size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconClose({ size = 20, className, filled }: IconProps) {
  return <X size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconChevronRight({ size = 20, className, filled }: IconProps) {
  return <ChevronRight size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconChevronLeft({ size = 20, className, filled }: IconProps) {
  return <ChevronLeft size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconEnter({ size = 20, className, filled }: IconProps) {
  return <LogIn size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconGear({ size = 20, className, filled }: IconProps) {
  return <Settings size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconRepost({ size = 20, className, filled }: IconProps) {
  return <Repeat2 size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconBookmark({ size = 20, className, filled }: IconProps) {
  return <Bookmark size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconShare({ size = 20, className, filled }: IconProps) {
  return <Share2 size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}

export function IconStar({ size = 20, className, filled }: IconProps) {
  return <Star size={size} strokeWidth={STROKE} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
}
