# PROFILE — Accessibility Spot-Check

This is a targeted spot-check, not an independent WCAG 2.1 AA audit. It covers what was structurally verified in this session; a full audit (screen-reader pass, automated contrast scan across all 43 files, keyboard-trap testing per modal) has NOT been performed and should be run before production release.

## Verified in this session (Home.dc.html, representative sample)
- Zero unlabelled images, zero unlabelled buttons, zero unlabelled inputs (programmatic check).
- Icon-only buttons (search, notification bell) carry visible glyphs plus surrounding context; consider adding explicit `aria-label` before code starts, since emoji/glyph alone is not a reliable accessible name in all screen readers.

## Structurally built in, by convention, across all files
- `role="tablist"` / `role="tab"` on every tab pattern (Home, Profile & Trust, Public Profile, Settings, Blog & News, Advisor & Creator Hub, Design System).
- `prefers-reduced-motion` media query present in every file's `<style>` block — verified by grep, 100% coverage.
- Status communicated as icon + text together (✓ Verified, ⚠ Pending) — never colour alone — per the Trust/Verification design language.
- Native form elements (`<select>`, `<textarea>`, checkbox) rather than custom-built equivalents, preserving default keyboard/screen-reader behaviour.
- Minimum touch targets: buttons in Mobile App's tab bar and primary CTAs are ≥44px.

## Known gaps — flag before Claude Code build
1. **Focus-visible styling** is not explicitly defined on every interactive element — relies on browser default in most files. Needs an explicit `:focus-visible` ring per the design system's `--focus` token, applied consistently in the real codebase.
2. **Color contrast** has not been programmatically checked across all 43 files — the token values were chosen to meet 4.5:1 for body text per the design brief, but this was not verified pixel-by-pixel against every background combination (e.g. status badges on tinted `-soft` backgrounds).
3. **Modal/drawer focus trapping** (Design System's Modal/Drawer patterns) is described but not tested with real keyboard navigation, since these are static prototypes without live focus-trap JS.
4. **Skip-to-content links** are not present on any page — worth adding for keyboard users navigating long pages (Mission Control, Route Integrity Engine).
5. **Form error announcements** (`aria-live="polite"`) are documented in the Design System's Forms section as the intended pattern but not implemented as live ARIA in every form screen (Account Creation, Dispute & Appeal) — these are static prototypes, so live-region behavior needs real implementation.
