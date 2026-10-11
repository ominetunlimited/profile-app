import type { ComponentType } from 'react'
import type { ReactionType } from '@/app/reactionStore'
import { REACTION_GLYPH, type ReactionIconProps } from './profile/reactions'
import type { IconProps } from './icons'

/**
 * PROFILE custom reaction system (§6). Each reaction renders as a geometric
 * symbol from one shared family (profile/reactions.tsx) — never a copied
 * social-media emoji. The `ReactionIconProps` are structurally compatible with
 * the base `IconProps` used across the app, so ActionBar and every other
 * consumer keep working unchanged; only the glyph each reaction draws with is
 * now proprietary PROFILE geometry.
 */
export const REACTION_ICON: Record<ReactionType, ComponentType<IconProps>> = REACTION_GLYPH as unknown as Record<
  ReactionType,
  ComponentType<IconProps>
>

export type { ReactionIconProps }
