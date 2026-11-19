/**
 * PROFILE brand assets — the Ominet Digital–era logo family (editable SVG).
 *
 * Single source of truth: /public/brand/profile/logo/*.svg. Every in-app logo
 * reference goes through this module or <ProfileLogo> — never a raw path.
 * The old key names (wordmark, mark, markMono, lockup, icon512) are kept so
 * existing call sites keep working; they now resolve to the new artwork.
 */
const L = '/brand/profile/logo'
const I = '/brand/profile/icons'

export const BRAND_LOGOS = {
  primary: { light: `${L}/profile-logo-primary-light.svg`, dark: `${L}/profile-logo-primary-dark.svg`, monoBlack: `${L}/profile-logo-primary-mono-black.svg`, monoWhite: `${L}/profile-logo-primary-mono-white.svg` },
  horizontal: { light: `${L}/profile-logo-horizontal-light.svg`, dark: `${L}/profile-logo-horizontal-dark.svg`, monoBlack: `${L}/profile-logo-horizontal-mono-black.svg`, monoWhite: `${L}/profile-logo-horizontal-mono-white.svg` },
  symbol: { light: `${L}/profile-symbol-light.svg`, dark: `${L}/profile-symbol-dark.svg`, transparent: `${L}/profile-symbol-transparent.svg`, monoBlack: `${L}/profile-symbol-mono-black.svg`, monoWhite: `${L}/profile-symbol-mono-white.svg` },
} as const

export const BRAND = {
  /** Primary stacked logo (symbol + wordmark + tagline). Auth, onboarding, splash. */
  wordmark: BRAND_LOGOS.primary.light,
  /** Symbol only, transparent background — works on any surface. */
  mark: BRAND_LOGOS.symbol.transparent,
  /** Symbol only, single colour (black) for tinted / print contexts. */
  markMono: BRAND_LOGOS.symbol.monoBlack,
  /** Horizontal lockup. Headers and navigation. */
  lockup: BRAND_LOGOS.horizontal.light,
  /** Largest square raster app icon. */
  icon512: `${I}/icon-512.png`,
  favicon: '/favicon.svg',
  appIcon: `${L}/profile-app-icon.svg`,
} as const
