import type { ComponentType } from 'react'
import type { BadgeType } from '@/app/badgeStore'
import {
  IconCertificate,
  IconContribution,
  IconDegree,
  IconIdentity,
  IconInstitution,
  IconProfessionalAssociation,
  IconPublication,
  IconVerify,
  IconVerifiedEducation,
  IconVerifiedEmployment,
  IconVerifiedOrganisation,
  IconId,
} from '@/shared/ui/profile'
import { IconBriefcase, IconGovernment, IconHandshake, IconStar } from '@/shared/ui/icons'

type BadgeIcon = ComponentType<{ size?: number; className?: string }>

/**
 * One PROFILE icon per §14 badge. Every icon is `currentColor`, so it takes the
 * badge's token colour (success for verified, text-1 for self-reported) — no
 * colour is set here. Record<BadgeType, …> makes a new badge type a compile
 * error until it is given an icon.
 */
export const BADGE_ICON: Record<BadgeType, BadgeIcon> = {
  verified_identity: IconIdentity,
  institutional_affiliation_verified: IconVerifiedEducation,
  verified_academic: IconDegree,
  employment_affiliation_verified: IconVerifiedEmployment,
  verified_professional: IconVerify,
  verified_organisation: IconVerifiedOrganisation,
  government_verified: IconGovernment,
  institution_verified: IconInstitution,
  licensed_professional: IconId,
  certified_expert: IconCertificate,
  guild_certified: IconProfessionalAssociation,
  trusted_contributor: IconContribution,
  opportunity_ready: IconBriefcase,
  mentor: IconHandshake,
  top_rated_provider: IconStar,
  research_contributor: IconPublication,
}
