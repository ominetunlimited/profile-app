# PROFILE — Pre-Phase-7 Patch Status

Applied 2026-09-12, against the "PROFILE — Patch Prompt (Pre-Final-Phase Patch Set)"
document. This file records what changed, what was confirmed already-satisfied, one
correction to the patch document itself, and one honest limitation on how this pass
was verified.

**Note on prior status docs**: this patch document referred to per-phase status files
(`PROFILE/PHASE0_STATUS.md` through `PHASE6_STATUS.md`) as the detailed record of
Phases 0–6. Those files do not exist anywhere in this project directory — there is no
`PROFILE/` subfolder at all. Only `PROFILE_MASTER_PROMPT (9)...md` and
`PROFILE_CLAUDE_CODE_BUILD_PROMPT.md` exist at the project root. This discrepancy is
recorded here rather than silently ignored; if per-phase status docs are wanted, they
need to be (re)written, not assumed to already exist.

## B1 — CV/Portfolio gating (correction, not a gap)

The patch claimed `routeRegistry.ts`'s portfolio route gates on `{ kind: 'organisation' }`,
which would incorrectly block individual accounts from Portfolio. This is **not true of
the current code** — `routeRegistry.ts`'s `/career/portfolio/:template` entry (and the
router-level handling in `router.tsx`) already use `{ kind: 'authenticated' }` with both
`isCvEligible`/`isPortfolioEligible` in `accountTypes.ts` correctly scoped (individuals:
both CV and Portfolio; organisations: Portfolio only, never CV). This was fixed several
phases ago, in Phase 2, when this exact bug was first flagged. No code change was needed
for B1 — confirmed already-satisfied.

## Implemented this patch

- **B2/B3 — CV header + summary/education/references sub-schemas**: `IndividualAccount`
  gained `city`, `stateOrRegion`, `linkedInUrl`, `externalWebsiteUrl`. New
  `cvDetailsStore.ts` holds summary statement, years of experience, key achievement,
  objective-mode flag, education, certifications, languages, and a self-reported external
  reference list — distinct from and additive to §47.2/§47.9's institutional
  ProfessionalReference verification flow, never replacing it. New `CvDetailsEditor.tsx`
  edits all of this from the CV Templates page. All 10 CV templates render the new fields
  via a shared `ExtraCvSections` component.
- **GPA display rule**: a GPA renders only if ≥3.5 or the degree was completed within the
  last two years (`shouldShowGpa()` in `careerData.ts`) — never fabricated or filtered,
  just a display rule over a value the user entered.
- **B4 — work-entry location**: `ActivityRecord` and `CvExperienceEntry` gained an
  optional `location` field; collected on the Home activity composer, rendered on every
  CV template's experience block (both the shared `ExperienceBlock` and Career Timeline's
  own inline rendering).
- **B6 — Portfolio Organisation composability**: the Organisation / Company Showcase
  template is now a composable system. New `organisationPortfolioStore.ts` defines
  `OrganisationPortfolioConfigV1` with a 12-section toggle map (header, hero, about us,
  services, projects, team, clients & partners, testimonials, resources, careers, contact,
  footer — header/footer structural, not toggleable). `PortfolioTemplatesPage.tsx` gained a
  section-toggle editor for organisation accounts, persisted per owner.
- **B7 — Store Hub**: new `/store` route (`StoreHub.tsx`) assembling the existing
  Marketplace/Commerce-Activation pieces (§19, §38.4–§38.6a) into one named screen — a
  Market (always visible, honest empty state) and a Create Store section (gated on
  Settings → Commerce & Selling's `storeActivated`, via new `commerceStore.ts`).
- **B8 — Owner Content Console**: new `/internal/content-console` (staff-only) —
  drafts/schedules/publishes news, blog, and announcement posts (`ownerContentStore.ts`,
  `OwnerContentPostV1`). The public Blog & News page is not yet wired to read from this
  store — that remains a follow-up, so publishing here does not yet change what the public
  page shows; noted in-code rather than left implicit.
- **B9 — Owner role + secondary internal gate**: `StaffRole` extended to
  `'internal_staff' | 'owner' | null` (owner is a strict superset — every existing
  `staffRole === 'internal_staff'` check now also accepts `'owner'`, plus a new
  `RequireOwner` guard for Owner-only surfaces). New `/internal/admin-management`
  (Owner-only) creates/revokes scoped Admins (`internalStaffStore.ts`) limited to specific
  internal tools. New `RequireInternalAccessGate` (`internalAccessGate.tsx`) adds a
  session-scoped secondary passphrase in front of every existing staff route
  (`/mission-control`, `/internal/ai-decision-log`, `/internal/route-integrity`,
  `/internal/verification-review`) plus the two new ones — clearly labelled as a demo-only
  mechanism, not a real security boundary, since there is still no backend.
- **B10 — Master Prompt documentation patch**: added §50.11.8 "PROFILE-Specific
  Additions" to `PROFILE_MASTER_PROMPT (9)...md` itself (both the table of contents and
  the full section, inserted between §50.11.7 and §50.12), recording all seven items above
  with their cross-references.
- Fixed two real, previously-undiscovered bugs found while implementing this patch:
  `Field.tsx`'s `TextInput`/`SelectInput` silently dropped any caller-supplied `className`
  (it was applied *before* the base style instead of merged with it); and Settings'
  `ProfileTab` was a non-functional stub (uncontrolled inputs, no save path at all).

## How this pass was verified

`tsc -b --noEmit` and `npm run build` both pass clean with zero errors. **No interactive
browser verification was possible this session** — the browser-automation tooling used in
earlier phases of this build is not available in this environment/toolset. This is a real
gap relative to this project's established practice ("verify, don't trust typecheck") and
is being disclosed rather than glossed over. A follow-up pass with browser access should
click through: the CV details editor and its rendering across all 10 templates, the GPA
display rule at both boundary conditions, Store Hub's gating on the Settings toggle, the
Owner Content Console's draft/publish/delete flow, the internal access gate's passphrase
prompt, Admin Management's add/revoke flow, and the Portfolio section toggles across
reloads.
