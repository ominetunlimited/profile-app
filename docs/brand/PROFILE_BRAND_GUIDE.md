# PROFILE visual identity (Ominet Digital)

PROFILE is a product of Ominet Digital. The logo carries the Ominet colour spectrum; the interface stays on the official eight-colour PROFILE palette.

## Logo family (`/public/brand/profile/logo/`)
All files are editable SVG with no embedded raster.

| Use | File |
|---|---|
| Stacked primary (auth, onboarding, splash) | `profile-logo-primary-light.svg` / `-dark.svg` |
| Horizontal (headers, nav) | `profile-logo-horizontal-light.svg` / `-dark.svg` |
| Symbol only | `profile-symbol-*.svg` (`-transparent` works on any surface) |
| Favicon / app icon | `profile-favicon.svg`, `profile-app-icon.svg` |
| Single colour | `*-mono-black.svg`, `*-mono-white.svg` |

PNG exports for browsers, iOS and PWA are in `/public/brand/profile/icons/`. Regenerate them from the SVGs if the artwork changes.

## In code
- Use `<ProfileLogo variant="horizontal | primary | symbol" />` (`src/shared/ui/ProfileLogo.tsx`). It follows the light/dark theme through CSS.
- Use `surface="on-dark"` or `"on-light"` only for surfaces that never change tone.
- Paths live only in `src/shared/brand/assets.ts`. Never hardcode a logo path.

## Colour
- Interface: the eight tokens at the top of `src/shared/tokens/tokens.css` (`--profile-*`).
- Parent-brand gradient: `--omnet-*` and `--omnet-gradient`, taken from the logo artwork. For logo and selected brand moments only, never for general UI, buttons or text.
- Status colours (success, warning, error, verification) keep their semantic meaning.

## Icons
Sources and licences are recorded in `docs/brand/ICON_SOURCES.md`. Gap-fill icons from Lucide (ISC) live in `src/shared/ui/profile/extraIcons.tsx`.

Every icon is `currentColor`, so it takes the colour of its container's token (Royal/Blue on light, Off-White on dark, Bright Blue when active, Gold/Green for verification). Do not hardcode hex or raw Tailwind palette colours on icons.

## Minimum sizes and clear space
Horizontal logo: 24px high minimum. Symbol: 16px minimum. Keep clear space of at least one quarter of the symbol height on every side. Do not stretch, recolour, rotate or add shadows.
