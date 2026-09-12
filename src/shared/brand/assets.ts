/**
 * The three approved PROFILE brand assets, plus the icon-only mark in color
 * and monochrome, sourced directly from `design_handoff_profile/assets/` —
 * the actual shipped files, never redrawn or substituted. Imported (not
 * referenced as raw string paths) so Vite's asset pipeline hashes and bundles
 * them correctly into the production build, not just during dev.
 *
 * Recovery patch: prior to this, these files were referenced only once (the
 * favicon link in index.html) — every in-app header/auth/onboarding surface
 * fell back to a plain text "PROFILE" wordmark instead of the real assets.
 */
import wordmarkUrl from '../../../design_handoff_profile/assets/profile-wordmark.svg'
import markUrl from '../../../design_handoff_profile/assets/profile-mark.png'
import markMonoUrl from '../../../design_handoff_profile/assets/profile-mark-mono.png'
import lockupUrl from '../../../design_handoff_profile/assets/profile-lockup-horizontal.png'
import icon512Url from '../../../design_handoff_profile/assets/profile-icon-512.png'

export const BRAND = {
  /** Full lockup: mark + "PROFILE" wordmark + "BUILD. VERIFY. GROW" tagline. Use where the full identity is appropriate (auth, onboarding, splash). */
  wordmark: wordmarkUrl,
  /** Icon-only mark, colour. Use where space is constrained (compact header, mobile nav). */
  mark: markUrl,
  /** Icon-only mark, monochrome. Use on tinted/dark surfaces or wherever a single-colour treatment is required. */
  markMono: markMonoUrl,
  /** Horizontal lockup (mark + wordmark, no tagline) — a mid-size option between the full wordmark and the bare mark. */
  lockup: lockupUrl,
  /** Largest favicon-family asset, useful wherever a crisp square mark is needed at larger sizes (e.g. splash). */
  icon512: icon512Url,
}
