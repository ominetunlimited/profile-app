# PROFILE — Phase 7: Hardening & Activation Audit

Per `PROFILE_CLAUDE_CODE_BUILD_PROMPT.md` §6: "This phase does not add features —
it verifies every prior phase's Definition of Done actually holds under real
navigation, not just in isolation." Scope: §35 Activation Audit, §49.2's "present
but non-functional" list, `accessibility-spot-check.md`'s flagged gaps, dark/light
mode, and the full §3.6 gating checklist.

**Verification method for this pass**: static code audit (targeted `Read`/`Grep`
against the Master Prompt's actual §13/§35/§49.2 text and the build doc's §3.6
checklist) plus `tsc -b --noEmit` and `npm run build`, both clean. No
browser-automation tool was available this session — see the standing caveat in
[[profile-feedback-verify-dont-trust-typecheck]] / `PATCH_STATUS.md`. Everything
below is a real code change, not yet click-tested live.

## Fixed this pass

- **§49.2-style: Trust Score hardcoded to 0 on Profile & Trust.** New
  `src/app/trustScore.ts` implements §13.2's real `TRUST_WEIGHTS` structure. Every
  one of its 11 signals needs verification infrastructure (identity/employment/
  academic/licence checks, institutional confirmation, client reviews) this build
  has no backend for — so the honestly-computed total is 0 today, same reasoning
  as the AI Decision Log's honest emptiness. The difference from before: it's now
  a real function call ready to sum in real signals later, not a bare literal.
- **Profile & Trust's stat row was fully hardcoded.** "Activities" now reads the
  real count from `activityStore`. "Followers/Connections/Reviews/Verified items"
  stay honestly 0 with an explanatory code comment — no social graph, review
  system, or verification pipeline exists yet to compute them from.
- **§11.2 Six Professional Reactions were three inert `<span>` elements**, not the
  spec's six, and none were clickable — a direct §35 "static button, no handler"
  violation. New `src/app/reactionStore.ts` implements the real thing: all six
  reactions, one per user per activity, changeable (re-clicking your own toggles
  it off), public totals — and structurally never touches Trust Score or ranking,
  per §11.2's REACTION_RULES hard rule.
- **Activity `skills` field was wired to nothing.** The Home composer declared
  the field but always posted `skills: []`, silently starving every CV template's
  Skills section and Discover-matching of real input. Added a real "Skills
  demonstrated" input to the composer, and skill tags now render on activity
  cards.
- **Onboarding's progress checklist was fully static** — every step past the
  first two (`account`, `verified`) was hardcoded `completed: false` regardless
  of actual state, so it never tracked real progress. `headline`, `skill`, and
  `activity` now reflect real account/activity state. `photo`, `trust_center`,
  and `discoverable` stay honestly false — this build has no photo-upload
  pipeline, Trust Center setup flow, or discoverability toggle to check against,
  which is now stated in a comment rather than left implicit.
- **Dispute & Appeal's submit button silently disabled with no feedback** — a
  user with an empty reason field got no explanation. Now shows a real,
  `aria-live="polite"` validation message via `Field`'s existing `error` prop
  (closing `accessibility-spot-check.md` gap #5's Dispute & Appeal callout,
  which had no error state to announce at all before this).
- **Command Palette (the app's one real modal) had no focus trap** —
  `accessibility-spot-check.md` gap #3. Tab/Shift+Tab now cycle within the
  dialog instead of escaping to the page underneath, and focus returns to
  whatever triggered the palette when it closes. Added `aria-modal="true"`.

## Confirmed already-satisfied (no change needed)

- CV template switcher genuinely swaps rendered layout per selection (both CV
  and Portfolio template pages render `active.Component`, not just a highlighted
  tab) — §49.2's named gap doesn't exist in this codebase.
- CV page is structurally gated to `accountType === 'individual'`;
  Institution/Government Hub access requires both the correct `OrgHubProfile`
  *and* `registryLevel === 'verified'` (`HubAccessDenied` in
  `OrgWorkspaceShell.tsx`) — §3.6's "hub AND verified" and CV-structural-absence
  checklist items both hold.
- Global `::focus-visible` ring (accessibility-spot-check.md gap #1) is defined
  once in `tokens.css` and applies app-wide, not per-component.
- Skip-links (gap #4) exist on the specific long pages the spot-check names
  (Mission Control, Route Integrity Engine, AI Decision Log) plus this patch's
  two new internal screens.
- No `Math.random()`-based fabrication anywhere in `src/` (the two hits found are
  ID generation for new store records, not fabricated displayed data — a
  different thing from §49.2's "Tool metadata detection... fabricated, not
  detected" complaint).
- No "Coming soon" / TODO-style dead placeholders found anywhere in `src/`.
- Onboarding photo/cover upload, Settings "Change photo", and the Home "People to
  connect" panel — the specific broken versions §49.2 describes don't exist in
  this codebase, because this rebuild never included those features in the first
  place (see finding below, not a false-positive fix).

## Findings flagged, not fixed (would be new features, out of Phase 7 scope)

1. **Home has no Trust Score ring or "People to connect" panel at all** — §49.2
   describes fixing a *hardcoded* ring and a *duplicated-array* panel, implying
   both should already exist in some form. Neither does: this build's Home
   (`HomePage.tsx`) is a simpler command-centre than the Handoff's full
   `Home.dc.html`. Building either honestly needs real data this build doesn't
   have (a live discovery/social-graph source for "People to connect"); the
   Trust Score ring specifically could now render `computeTrustScore()`'s real
   (if currently-zero) output on Home too, but that's a UI addition, not a
   hardening fix, so it's named here for a product decision rather than built.
2. **§49.5 `OrganisationPortfolioDocument` vs. this patch's
   `OrganisationPortfolioConfigV1` naming mismatch** — documented in detail in
   `src/app/organisationPortfolioStore.ts`'s file comment. The Master Prompt's
   own canonical section names for organisation portfolio content
   (`programmesInitiatives`, `staffHighlights`, `publications`,
   `communityImpact`, `partnerships`, `activeJobListings`, `trustScore`,
   `verificationAuthorityStatus`) don't line up with the patch-specified
   toggle list (`hero`, `team`, `testimonials`, `resources`, `careers`,
   `contact`, `footer`, etc.). Both currently coexist without conflict since
   neither has real backing content yet, but reconciling the naming — or
   building `OrganisationPortfolioDocument` as the real schema each toggled
   section reads from — needs a decision, not a silent pick.
3. **No gate in this build is enforced server-side** (§3.6's last checklist
   item) — expected and already disclosed throughout `profile_build_status.md`:
   there is no backend at all yet. Not a new finding, restated here because
   §3.6 explicitly asks for it to be checked at the end of every phase.

## Not exhaustively re-audited this pass

43 screens is a large surface; this pass prioritized the concretely-named
`(§49.2 table + accessibility-spot-check.md's 5 gaps` items plus spot-checks of
Learning, Opportunity Hub, Advisor/Creator Hub, and Marketplace for the same
dead-button/fabrication patterns (none found). A full screen-by-screen re-click
of all 43 screens' empty/loading/error states, exact token/spacing parity
against the Handoff, and a real contrast scan (accessibility-spot-check.md gap
#2, never done even at the design stage) still hasn't happened and should, once
browser access is available again.
