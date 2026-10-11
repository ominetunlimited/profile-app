/**
 * PROFILE ICONOGRAPHY + GEOMETRY SYSTEM — public surface (§19).
 *
 * One import point for the proprietary visual language so any page can inherit
 * the same identity. Colours, stroke, size and variant all flow from the design
 * tokens (tokens.css / tailwind.config.ts) — never hard-coded per component.
 */
export {
  ProfileNode,
  ProfileLink,
  ProfilePath,
  ProfileSealMotif,
  ProfileFrame,
  ProfileGrid,
  ProfileSignal,
  ProfileOrbit,
  type MotifProps,
} from './motifs'

export { ProfileSeal, VerifiedTag, type SealTone, type ProfileSealProps, type VerifiedTagProps } from './ProfileSeal'
export { ProfileBackground, type BackgroundVariant, type ProfileBackgroundProps } from './ProfileBackground'
export { ProfileLoader, ProfileConfirmed, type ProfileLoaderProps } from './ProfileLoader'
export { ProfileEmptyState, type EmptyMotif, type ProfileEmptyStateProps } from './ProfileEmptyState'
export { ProfileAvatarFrame, type FrameShape, type ProfileAvatarFrameProps } from './ProfileAvatarFrame'
export { REACTION_GLYPH, type ReactionIconProps } from './reactions'

// Extended PROFILE icon families (§5) — same grammar as shared/ui/icons.tsx.
export * from './profileIcons'
