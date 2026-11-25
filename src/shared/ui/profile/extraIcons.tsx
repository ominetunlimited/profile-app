/**
 * PROFILE ICON SYSTEM, identity and verification glyphs (Hugeicons).
 * The four "Verified ..." icons are the base glyph plus one shared check badge,
 * so verification reads identically across organisations, education,
 * employment and affiliation. Names and props are unchanged.
 */
import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Book02Icon,
  BriefcaseIcon as Briefcase,
  Building03Icon,
  Camera01Icon,
  CheckmarkBadge01Icon,
  CopyrightIcon,
  FileValidationIcon,
  GraduationCapIcon,
  Link02Icon,
  MagicWand01Icon,
  PencilEdit01Icon,
  StarIcon,
  UserEdit01Icon,
  UserGroupIcon,
  WorkHistoryIcon,
} from '@hugeicons/core-free-icons'

export interface XIconProps {
  size?: number
  className?: string
  title?: string
}

const STROKE = 1.6

function glyph(icon: IconSvgElement, { size = 20, className, title }: XIconProps): ReactNode {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={STROKE}
      color="currentColor"
      className={className}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    />
  )
}

function verified(icon: IconSvgElement, { size = 20, className, title }: XIconProps) {
  const badge = Math.max(10, Math.round(size * 0.5))
  return (
    <span className={`relative inline-flex ${className ?? ''}`} style={{ width: size, height: size }} {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}>
      <HugeiconsIcon icon={icon} size={size} strokeWidth={STROKE} color="currentColor" />
      <span className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-surface text-success" style={{ width: badge, height: badge }}>
        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={badge} strokeWidth={STROKE} color="currentColor" />
      </span>
    </span>
  )
}

export const IconProfilePhoto = (p: XIconProps) => glyph(Camera01Icon, p)
export const IconPersonalDetails = (p: XIconProps) => glyph(UserEdit01Icon, p)
export const IconIdentityHistory = (p: XIconProps) => glyph(WorkHistoryIcon, p)
export const IconVerificationDocument = (p: XIconProps) => glyph(FileValidationIcon, p)
export const IconAuthor = (p: XIconProps) => glyph(PencilEdit01Icon, p)
export const IconCreator = (p: XIconProps) => glyph(MagicWand01Icon, p)
export const IconOwnership = (p: XIconProps) => glyph(CopyrightIcon, p)
export const IconPublication = (p: XIconProps) => glyph(Book02Icon, p)
export const IconCredit = (p: XIconProps) => glyph(StarIcon, p)
export const IconProfessionalAssociation = (p: XIconProps) => glyph(UserGroupIcon, p)
export const IconVerifiedOrganisation = (p: XIconProps) => verified(Building03Icon, p)
export const IconVerifiedEducation = (p: XIconProps) => verified(GraduationCapIcon, p)
export const IconVerifiedEmployment = (p: XIconProps) => verified(Briefcase, p)
export const IconVerifiedAffiliation = (p: XIconProps) => verified(Link02Icon, p)
