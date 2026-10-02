import type { ComponentType } from 'react'
import type { ReactionType } from '@/app/reactionStore'
import { IconHammer, IconLightbulb, IconMedal, IconMegaphone, IconSeedling, IconThumbsUp, type IconProps } from './icons'

export const REACTION_ICON: Record<ReactionType, ComponentType<IconProps>> = {
  appreciate: IconThumbsUp,
  respect: IconMedal,
  insightful: IconLightbulb,
  support: IconSeedling,
  skilled: IconHammer,
  well_explained: IconMegaphone,
}
