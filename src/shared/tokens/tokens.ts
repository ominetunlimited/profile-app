/**
 * TS mirror of tokens.css, for non-CSS contexts (chart colors, canvas, native
 * shells). CSS custom properties in tokens.css remain the source of truth for
 * anything rendered in a browser — do not let these two drift.
 */
export const tokensLight = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSunken: '#F1F5F9',
  border: '#E5E7EB',
  borderStrong: '#CBD5E1',
  text0: '#1E293B',
  text1: '#5B6B80',
  text2: '#8496A9',
  accent: '#0057D9',
  trust: '#0E7490',
  gold: '#8A6200',
  success: '#04763C',
  warning: '#8A5200',
  danger: '#C2181D',
} as const

export const tokensDark = {
  bg: '#060E1C',
  surface: '#0C1829',
  surfaceSunken: '#050B16',
  border: 'rgba(255,255,255,.07)',
  borderStrong: 'rgba(255,255,255,.14)',
  text0: 'rgba(255,255,255,.90)',
  text1: 'rgba(255,255,255,.65)',
  text2: 'rgba(255,255,255,.40)',
  accent: '#4C8DFF',
  trust: '#00E5FF',
  gold: '#F4B400',
  success: '#3DDC7F',
  warning: '#FBBF24',
  danger: '#FF7A7A',
} as const

export type TokenSet = typeof tokensLight
