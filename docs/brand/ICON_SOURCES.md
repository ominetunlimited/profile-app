# PROFILE icon sources and licences

## Primary set: hand-authored (owned)
`src/shared/ui/icons.tsx`, `src/shared/ui/profile/profileIcons.tsx`, `reactions.tsx`, `motifs.tsx`. Created for PROFILE. No third-party licence applies.

## Gap-fill set: Lucide (ISC)
`src/shared/ui/profile/extraIcons.tsx` contains 14 icons taken from Lucide (https://lucide.dev, package `lucide-static` v1.76.0).

- Licence: ISC. Free for commercial use, modification and redistribution. Attribution is not required in the product, but the licence text must stay with the source. It is kept in `docs/brand/LICENSE-lucide.txt`.
- Changes made: stroke width set to 1.75 to match the PROFILE grammar; four icons combine a Lucide glyph with a PROFILE check badge.

| PROFILE icon | Lucide source |
|---|---|
| IconProfilePhoto | image |
| IconPersonalDetails | contact |
| IconIdentityHistory | file-clock |
| IconVerificationDocument | file-check |
| IconAuthor | pen-line |
| IconCreator | palette |
| IconOwnership | copyright |
| IconPublication | book-open-text |
| IconCredit | award |
| IconProfessionalAssociation | waypoints |
| IconVerifiedOrganisation | building-2 + badge |
| IconVerifiedEducation | graduation-cap + badge |
| IconVerifiedEmployment | briefcase-business + badge |
| IconVerifiedAffiliation | handshake + badge |

## Evaluated, not used
- **Icons8:** the account is on the free plan. SVG download needs a paid MCP plan, and free PNGs cannot take the PROFILE palette. Not used. If the plan is upgraded later, SVGs can be added here with their licence recorded.
- **Phosphor (MIT), Iconoir (MIT):** suitable alternatives; not needed so far.

## Rules
- Icons must be `currentColor`. No hardcoded hex or raw Tailwind palette colours on icons.
- Add any new third-party icon to this file, with its source, licence and any changes.
