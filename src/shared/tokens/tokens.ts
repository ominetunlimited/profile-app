/**
 * TS mirror of tokens.css, for non-CSS contexts (chart colors, canvas, native
 * shells). CSS custom properties in tokens.css remain the source of truth for
 * anything rendered in a browser — do not let these two drift.
 *
 * PROFILE Visual Identity patch (§1): the raw official palette lives here as
 * `profile*` so canvas/SVG code that can't read a CSS var still uses the exact
 * brand colours. Semantic values below mirror the CSS derivations (surfaces,
 * contrast-safe text) — where CSS uses `color-mix` these are the resolved hex.
 */
export const tokensLight = {
  // §1 official palette (raw)
  profileRoyal: '#162660',
  profileBeige: '#F1E4D1',
  profilePowder: '#D0E6FD',
  profileBlue: '#2171B5',
  profileBrightBlue: '#1E63D6',
  profileGold: '#D4AF37',
  profileOffWhite: '#F8F7EF',
  profileGreen: '#2BC48A',
  // semantic (mirrors tokens.css :root)
  bg: '#F1E4D1',
  surface: '#F8F7EF',
  surfaceSunken: '#E4D4BC',
  border: '#E2D6C2',
  borderStrong: '#B9A98F',
  text0: '#162660',
  text1: '#5A6183',
  text2: '#5C6386',
  accent: '#1E63D6',
  accentSolid: '#1E63D6',
  link: '#2171B5',
  trust: '#1C6B5E',
  gold: '#8A7433',
  success: '#1F7358',
  warning: '#8A5200',
  danger: '#C2181D',
} as const

export const tokensDark = {
  bg: '#162660',
  surface: '#1D2A66',
  surfaceSunken: '#101A44',
  border: 'rgba(208,230,253,.12)',
  borderStrong: 'rgba(208,230,253,.22)',
  text0: '#F8F7EF',
  text1: '#D0E6FD',
  text2: '#8FA3C6',
  accent: '#6E9EE8',
  accentSolid: '#1E63D6',
  link: '#6E9EE8',
  trust: '#2BC48A',
  gold: '#D4AF37',
  success: '#2BC48A',
  warning: '#F4B400',
  danger: '#FF7A7A',
} as const

export type TokenSet = typeof tokensLight
