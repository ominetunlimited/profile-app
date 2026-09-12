# PROFILE — CLAUDE CODE BUILD PROMPT

### Stage-by-Stage Implementation Directive · Post-Design-Handoff Build

> **Give this document to Claude Code as its operating brief for the PROFILE build.**
> It does not replace the Master Prompt — it tells Claude Code how to *execute* the Master Prompt, in what order, against the design Handoff that Claude Design has already produced, without skipping or misplacing anything.

---

## 0. WHAT THIS DOCUMENT IS AND WHAT IT IS NOT

This is a **build-sequencing and integrity layer** on top of two existing artifacts:

1. **`PROFILE_MASTER_PROMPT (v9, Security Patch Merged)`** — the single source of truth for *what PROFILE is, how it behaves, what data it stores, and who is allowed to see what.* 50 sections. Nothing in it is optional, and nothing outside it may be invented.
2. **`design_handoff_profile/` package** — the single source of truth for *what PROFILE looks like.* 43 high-fidelity `.dc.html` screens, a real `data-model.md`, a design-token set, an accessibility spot-check, and a README describing known gaps.

Claude Code's job is to **build the product these two documents jointly describe** — nothing more, nothing less, nothing rearranged. This document exists only to sequence that work and to make the failure modes explicit before they happen: skipped modules, leaked gated features, ported-in prototype cruft, or an untracked drift between design intent and implementation.

**Read the entire Master Prompt and the entire Handoff README before writing a single line of code.** Do not sample sections. Do not begin implementation from partial context. Both documents are short enough to read in full and long enough that skimming will cause an account-type leak or a missing module — the two failure modes this document exists to prevent.

---

## 1. SOURCE-OF-TRUTH HIERARCHY (read this before every decision)

When any conflict arises, resolve it in this order:

| Priority | Source                                                                                           | Governs                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1        | **Master Prompt** (all 50 sections)                                                              | Business logic, data schema, account/role gating, permissions, feature existence, copy rules, security, compliance              |
| 2        | **`data-model.md`** (Handoff package)                                                            | The *real* entity/field reference — supersedes any schema shape implied by hardcoded sample data in the `.dc.html` files        |
| 3        | **`.dc.html` screens + Design System file + design tokens**                                      | Visual design: layout, spacing, color, typography, copy text, interaction states, component appearance                          |
| 4        | **Illustrative sample data** ("Amara Okafor" persona, all names/numbers in the `.dc.html` files) | **Never authoritative.** Reference only for "what does populated UI look like" — never for schema shape, never for gating logic |

Two rules follow directly from this table and are absolute:

- **Never infer a permission, a gate, or a schema field from a design mockup.** If a `.dc.html` file shows a feature and the Master Prompt doesn't authorize it for that account type, the Master Prompt wins — flag the discrepancy, don't silently build to the mockup.
- **Never invent a visual treatment the Handoff didn't specify.** If the Master Prompt describes a feature but the Handoff has no matching screen or component for it, build the *behavior* per the Master Prompt using the existing Design System's tokens/components (§3, `PROFILE Design System.dc.html`) — never a new one-off style.

---

## 2. THE THREE LAWS AND THE NON-NEGOTIABLE CONSTRAINTS (restated — do not deviate)

```
LAW 1 — PRESERVE & HARMONISE      Nothing is removed. Nothing is deprecated. Nothing is simplified.
LAW 2 — FIX & ACTIVATE            No dead clicks. No empty buttons. No placeholder tabs. No blank pages.
LAW 3 — ELEVATE TO PRODUCTION GRADE  Interactive, responsive, animated, scalable, secure, accessible.

CONSTRAINT 1 — No ranking/score/leaderboard driven by attention metrics (followers, likes, views, shares).
CONSTRAINT 2 — No feature exists solely to increase time-on-platform or posting frequency.
CONSTRAINT 3 — Every trust-bearing number is explainable on demand ("How this is calculated") — built
               before the number ships, never after.
```

Additional standing rules that apply to *every* stage below, carried forward from Master Prompt §36 and §49.8:

- Every registered navigation item resolves to a real page or an explicit "being finished" feature shell — **never a 404** (§49.3 Route Integrity Engine).
- No component may present randomly generated or hardcoded output as detected, computed, or AI-derived. If a real pipeline isn't built yet, the UI omits the feature or clearly labels it manual/placeholder — never fake it (§49.8, ties to §48 AI Engine governance).
- Dark mode and light mode work perfectly on every screen, every component, every state — this is checked per stage, not deferred to a final pass.
- AI-generated CVs, Portfolios, and cover letters remain fully editable by the user, always.

---

## 3. ACCOUNT-TYPE & GATING MATRIX — the anti-leak contract

This is the single most consequence-heavy part of the build. Read it before building *any* screen that could plausibly render for more than one account type. Every stage's Definition of Done (§7) includes a gating check against this table.

### 3.1 The two root account types (§4.1, §8.3)

```
accountType: 'individual' | 'organisation'
```

- **Individual** → `pathway: 'professional' | 'competence' | 'hybrid'`, gets CV, never Portfolio-only.
- **Organisation** → `organisationType` (one of the §8.3 `ORGANISATION_TYPES` list — Company, Startup, University, Government Ministry, NGO, etc.) → gets **Portfolio (`OrganisationPortfolioDocument`, §49.5), never a CV module — structurally, not just visually hidden.**

**Hard rule (§49.4, §49.5):** the CV page component must be *structurally incapable* of rendering for `accountType === 'organisation'`. This is not a `display:none` — the component tree for organisations never imports the CV renderer at all. `AccountContext` (accountType/pathway/orgType) is established once at onboarding Step 1 and must be read by every module that branches on it: CV/Portfolio, primary nav, avatar dropdown, Settings tabs, Hiring Dashboard visibility.

### 3.2 Organisation sub-routing — every org type gets exactly one hub, never a generic dashboard (§8.4)

```
OrgHubProfile = 'institutional_hub' | 'business_hub' | 'regulatory_console' | 'community_hub'

institutional_hub   → University, Polytechnic, College, School, Research Institute, Certification Authority
business_hub         → Company, Startup, Recruitment Agency, Consulting Firm, Hospital
regulatory_console   → Government Ministry, Government Agency, Regulatory Authority, Licensing Board, Professional Council
community_hub        → NGO, Foundation, Trade Association, Guild, Cooperative
```

Every `OrganisationType` must map to exactly one hub before it can be offered at registration — no silent default. A new org type is not addable without a hub assignment.

### 3.3 Sector-scoped module visibility inside the shared Institution/Org Hub (§34.2a)

This is a **visibility filter on one shared hub**, not multiple hubs per sector — do not fork the codebase per sector.

```
university / school            → academic verification, bulk student ingestion, Institution Excellence Dashboard
government_agency              → country adapter tools, IOTR, regulatory licensing workflows
regulatory_body                → professional licence verification, IOTR
hospital                       → employment + professional licence verification
company                        → employment verification, recruiter hub
certification_authority        → certification verification, bulk record ingestion
(unlisted types)                → base set only: identity verification requests, staff/affiliation mgmt, messaging
```

**Explicit hard rule (§10.5):** *no organisation type other than an institutional-hub type — not Company, not NGO, not Government — receives Institution Hub credential-schema-builder / bulk-verification tools.* Institution Hub access additionally requires `registryLevel === 'verified'` (IOTR) **and** the org-type-to-hub mapping — both conditions, always.

**Government/regulatory features are equally one-directional:** `GOVERNMENT_CONSOLE_FEATURES` (national credential validation, regulatory verification, institutional accreditation, audit reports, trust network oversight) render only for `regulatory_console`-hub accounts, gated on verified authorised-government-account status. They must never appear in an individual account, a business_hub account, or a community_hub account, regardless of that account's Trust Score, plan tier, or admin role.

### 3.4 Owner / internal tools (Mission Control, AI Decision Log, Route Integrity Engine)

These are not exposed to *any* external account type — individual, organisation, institution, or government. They are PROFILE-staff-only surfaces (§26 Admin Centre, §35, §49 owner tooling). Gate on internal staff role, never on plan tier, org type, or Trust Score, and keep them off the public build's client bundle where the target architecture supports code-splitting by role.

### 3.5 Organisation-internal role gating (§42) — a second, independent gating axis

Inside a single organisation, `OrgAdminRoleV3` (`super_admin | admin | verification_officer | hr_manager | credential_manager | moderator | compliance_officer`) gates *within* that org's own hub per the §42.2 permission matrix — billing, role appointment, verification review, credential issuance, hiring pipeline, community moderation, audit log access, legal holds. This is orthogonal to §3.1–§3.3 above: a `verification_officer` at a University still only ever sees `institutional_hub` tools, scoped further by their role's permissions inside it. Build both axes; never collapse them into one flag.

### 3.6 Gating verification checklist (apply at the end of every stage in §7)

```
[ ] Does this screen/component check accountType before rendering anything org-specific?
[ ] Does this screen/component check orgType → OrgHubProfile before rendering hub-specific tools?
[ ] Does this screen/component check sector (§3.3) before rendering sector-specific modules?
[ ] Is government/regulatory content reachable ONLY from a verified regulatory_console account?
[ ] Is Institution Hub content reachable ONLY from a verified institutional_hub account?
[ ] Is CV rendering structurally absent (not hidden) for accountType === 'organisation'?
[ ] Does org-internal content additionally check OrgAdminRoleV3 permissions (§42.2) where relevant?
[ ] Are owner/internal tools excluded from every non-staff account and, ideally, the public bundle?
[ ] Is every gate enforced server-side, not just hidden in client UI (data-model.md's explicit rule
    on officialDomain verification before staff invites applies to every gate in this section, not
    just that one case)?
```

---

## 4. HANDOFF PACKAGE — HOW TO USE IT, NOT HOW NOT TO

- The 43 `.dc.html` files are **design references**, built in a prototyping tool with a custom templating runtime (`support.js`). **Do not port that runtime or its templating syntax into the target codebase.** Recreate each screen natively in the target stack's own component patterns, state management, and routing.
- Treat **pixel values, copy text, and color tokens as final.** Treat the sample data (the "Amara Okafor" persona, all names/numbers) as **illustrative only** — build against `data-model.md`'s real schema, not the shape implied by sample content.
- Every screen was designed with at minimum: default, loading (where data-dependent), empty, and error states. Not every screen has all states shown explicitly — where a state isn't shown, design and build it using the same visual language (same tokens, same component patterns) rather than inventing a new style.
- Design tokens (light/dark) are defined once, sourced from `PROFILE Design System.dc.html` — implement as CSS custom properties / a shared theme object, never hardcoded per-screen hex values. Full token list, typography (Inter for UI, JetBrains Mono for data/numeric/technical labels), and all component states (hover/focus/disabled/loading) live in that one file — build the component library from it first (see Phase 0 below), then compose every other screen from those components.
- An orange accent variant was explored and explicitly rejected — do not reintroduce orange as a primary accent without product-owner sign-off.
- Real photography/diagrams must be sourced to replace the striped placeholder blocks (`// site photo — rooftop array` style labels) before production release — flag every placeholder still present at each stage's Definition of Done rather than silently shipping it.
- Known accessibility gaps flagged in `accessibility-spot-check.md` are **build requirements, not optional polish**: explicit `:focus-visible` rings per the design system's `--focus` token on every interactive element; a full contrast pass (not just body text) including status badges on tinted `-soft` backgrounds; real keyboard-tested modal/drawer focus trapping; skip-to-content links on long pages (Mission Control, Route Integrity Engine); `aria-live="polite"` form error announcements on every form screen (Account Creation, Dispute & Appeal), not just the ones where it happens to already work.
- One documented open issue must be resolved before routes are considered final: a Mission Control sidebar link with no destination, caught and documented on the Route Integrity Engine screen itself.

---

## 5. FULL SCREEN INVENTORY — THE NO-SKIPPING CHECKLIST

Every screen below must exist in the shipped build, mapped to its Master Prompt section(s) and its build phase (§6). Do not consider any phase complete while items assigned to it remain unbuilt. Treat this table as the literal acceptance checklist for "nothing was skipped."

### Phase 1 — Foundation

| Screen        | Master Prompt ref          |
| ------------- | -------------------------- |
| Design System | §3 Global Design System    |
| Logo System   | §3.6-adjacent brand assets |

### Phase 2 — Public site (unauthenticated)

| Screen                                                             | Master Prompt ref                                                                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Public Hero (landing)                                              | §6 Hero Gateway & Landing Experience                                                                                              |
| About & Solutions                                                  | §43 About, Vision, Mission & Platform Narrative                                                                                   |
| Blog & News                                                        | (editorial — verify against §31 Static Pages if scoped there)                                                                     |
| Trust Centre (public explainer)                                    | §12 Trust Center, §13 Trust Score Architecture                                                                                    |
| Help Centre                                                        | §45 FAQ Library                                                                                                                   |
| Legal (Terms/Privacy/Cookies, tabbed)                              | §31 Static Pages & Legal Documents, §46 Legal & Policy Document Library                                                           |
| Sign In (+ conditional MFA)                                        | §7 Authentication System                                                                                                          |
| Account Creation (individual vs org/institution/government branch) | §8 Registration & Onboarding System — build §8.3–§8.4's routing matrix exactly, this is the gating root for everything downstream |
| Onboarding (first-record + verification nudges)                    | §8.8–§8.10, §8.8.1 Journey Setup                                                                                                  |

### Phase 3 — Core authenticated product

| Screen                                                        | Master Prompt ref                                  |
| ------------------------------------------------------------- | -------------------------------------------------- |
| Home (command-centre dashboard)                               | §11 Home Feed & Record Work System                 |
| Profile & Trust (own profile, evidence, Trust Passport)       | §24 Profile Page Architecture, §12 Trust Center    |
| Public Profile Page (viewing another user)                    | §24.2                                              |
| Settings & Privacy (Security/Privacy/Notifications/Data tabs) | §25 Settings                                       |
| Notification Centre                                           | referenced throughout §10, §20                     |
| Opportunity Hub (browse/filter/match-detail)                  | §18 Opportunity Hub                                |
| Messaging & Communities (DM threads + community list)         | §20 Messaging System, §21 Learning & Communities   |
| Community Detail                                              | §21                                                |
| Dispute & Appeal                                              | §50.1 Dispute schema, §28.4 Enforcement Escalation |
| Learning                                                      | §21, §50.9.7 PROFILE Academy                       |

### Phase 4 — Career Engine

| Screen                                                            | Master Prompt ref                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| CV Templates (10 layouts)                                         | §15 CV/Portfolio Auto-Build Engine, §47.5                         |
| Portfolio Templates (5 layouts)                                   | §15.2 — organisations only, §49.5 `OrganisationPortfolioDocument` |
| Cover Letter (opportunity-aware, AI-assisted)                     | §47 Professional Career Engine                                    |
| Advisor & Creator Hub (AI chat advisor + creator's own templates) | §48 PROFILE AI Engine                                             |
| Creator Earnings (per-template stats, payouts)                    | §19 Marketplace, §38 Economic Engine                              |
| Creator Marketplace (buyer-side browse/purchase)                  | §19 Marketplace                                                   |

### Phase 5 — Organisation / Institution / Government

| Screen                                                                | Master Prompt ref                          | Gate (§3 above)                        |
| --------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| Organization Workspace (talent search, requests, staff, integrations) | §16, §42                                   | `business_hub` / `community_hub`       |
| Institution Workspace (bulk verification queue, analytics, schemas)   | §16 Institutional Trust Hub & VXI          | `institutional_hub` only               |
| Government Workspace (licence confirmations, analytics)               | §16, `GOVERNMENT_CONSOLE_FEATURES` (§10.5) | `regulatory_console` only              |
| Verification Review (PROFILE-staff review of workspace requests)      | §16, §26                                   | internal staff                         |
| Credential Schema Builder (institution-defined record types)          | §16.2                                      | `institutional_hub` only               |
| Institution Analytics                                                 | §23 Analytics, §16                         | `institutional_hub`                    |
| Government Analytics                                                  | §23, §16                                   | `regulatory_console`                   |
| Enterprise Integrations (SSO, API keys)                               | §16.7, §38.9, §38.18                       | organisation accounts w/ authorisation |
| Recruiter Workflow (candidate pipeline, interview scheduling)         | §18.3, §39 Four-Sided Marketplace          | `business_hub`, recruiter role         |

### Phase 6 — Owner / internal

| Screen                                   | Master Prompt ref        |
| ---------------------------------------- | ------------------------ |
| Mission Control (owner dashboard)        | §26 Admin Centre, §35    |
| AI Decision Log (governance audit trail) | §48 AI Engine governance |
| Route Integrity Engine                   | §49.3                    |

### Phase 7 — Cross-platform & polish

| Screen                                                    | Master Prompt ref                                 |
| --------------------------------------------------------- | ------------------------------------------------- |
| Mobile App (iOS + Android, 7 screens each)                | §10.1–§10.3 mobile nav, §29                       |
| Windows App (multi-panel, command palette, drag-and-drop) | §29 Performance/Offline/PWA-adjacent desktop spec |
| i18n & RTL Example (EN/DE/AR)                             | §30 Globalisation & Multilingual Architecture     |

---

## 6. BUILD SEQUENCE — do not reorder without a stated reason

This extends the Master Prompt's own §49.9 recommended sequence to the full 43-screen, 50-section scope, since §49.9 was written for an already-partial build. Follow it in order; each phase's Definition of Done (§7) must pass before the next phase starts.

```
PHASE 0 — Route Integrity & Account Context Skeleton
  · Route Integrity Engine scaffolding (§49.3) — every nav item resolves to a real page
    or an explicit feature shell, never a 404, from day one.
  · AccountContext (§49.4) — accountType, pathway, orgType, OrgHubProfile — established
    at the very start and wired to a single shared source, before any screen reads it.
  · Design System + Logo System built as the shared component/token library everything
    else composes from (Phase 1 of §5 above).

PHASE 1 — Public Site & Auth Root
  Public Hero → About & Solutions → Trust Centre (public) → Help Centre → Legal →
  Blog & News → Sign In → Account Creation → Onboarding.
  Account Creation is the gating root (§8.3–§8.4) — get its routing matrix exactly right
  here, since every downstream phase depends on AccountContext being correct from this
  screen forward.

PHASE 2 — Core Individual Product
  Home → Profile & Trust → Public Profile Page → Settings & Privacy → Notification
  Centre → Opportunity Hub → Messaging & Communities → Community Detail →
  Dispute & Appeal → Learning.
  Gate check at the end of this phase: nothing here renders organisation-only,
  institution-only, or government-only content for an individual account.

PHASE 3 — Career Engine
  CV Templates (individual only, structurally) → Portfolio Templates (organisation
  only, structurally, via OrganisationPortfolioDocument §49.5) → Cover Letter →
  Advisor & Creator Hub → Creator Marketplace → Creator Earnings.
  Gate check: CV component tree is structurally absent from any organisation-type
  build path — not conditionally hidden.

PHASE 4 — Organisation / Institution / Government
  Build the shared Org Workspace shell first, then layer sector-scoped module
  visibility (§34.2a) on top of it — do not fork a separate codebase per sector.
  Order: Organization Workspace (business_hub/community_hub baseline) →
  Institution Workspace + Credential Schema Builder + Institution Analytics
  (institutional_hub) → Government Workspace + Government Analytics
  (regulatory_console) → Verification Review (internal) → Enterprise Integrations →
  Recruiter Workflow.
  Gate check: run the full §3.6 checklist against every screen in this phase before
  moving on — this is the highest-leakage-risk phase in the entire build.

PHASE 5 — Owner / Internal Tools
  Mission Control → AI Decision Log → Route Integrity Engine (full dashboard, not
  just the Phase 0 scaffolding). Confirm these are unreachable from any external
  account type, including a verified regulatory_console government account.

PHASE 6 — Cross-Platform
  Mobile App (iOS + Android) → Windows App → i18n & RTL pass across everything
  already built, not as an afterthought bolted onto Phase 1–5 screens.

PHASE 7 — Hardening & Activation Audit
  Run §35 Activation Audit Requirements and the full §3.6 gating checklist against
  every screen built in every prior phase. Close every item in §49.2's "present but
  non-functional" pattern list (upload pipelines, template switchers bound to real
  layout, Trust Score computed not hardcoded, no Math.random() fabrication) and every
  gap flagged in accessibility-spot-check.md. Confirm dark/light mode on every screen.
  This phase does not add features — it verifies every prior phase's Definition of
  Done actually holds under real navigation, not just in isolation.
```

---

## 7. DEFINITION OF DONE — apply at the end of every phase in §6

A phase is not complete until every item below is true for every screen built in that phase:

```
[ ] Every screen in §5's checklist for this phase exists and is reachable via real navigation.
[ ] Every route resolves — no 404s, no dead clicks, no empty buttons, no placeholder tabs (§49.3).
[ ] The full §3.6 gating checklist passes for every screen that could plausibly branch by
    account type, org type, sector, or internal role.
[ ] Default, loading, empty, and error states are built for every data-dependent screen —
    not just the ones the Handoff explicitly showed.
[ ] No fabricated output anywhere (§49.8) — every number, badge, or AI-labeled result is
    either real/computed or explicitly labeled placeholder-pending.
[ ] Dark mode and light mode both render correctly.
[ ] Focus-visible rings, contrast, modal focus-trapping, skip-links, and aria-live form
    errors are implemented per accessibility-spot-check.md's flagged gaps — not deferred.
[ ] Design tokens, spacing, and copy match the Handoff exactly; sample persona data does
    not leak into the built schema anywhere.
[ ] AccountContext-dependent components read from the single shared AccountContext source,
    not a locally duplicated copy.
[ ] Anything gated in the UI is also gated server-side.
```

---

## 8. WHAT TO DO WHEN SOMETHING IS UNCLEAR

- If the Master Prompt specifies behavior for a surface the Handoff didn't design a screen for: build the behavior using existing Design System components — do not skip the feature, and do not invent new visual language for it.
- If the Handoff shows a screen or detail the Master Prompt doesn't authorize (an account type seeing a feature the gating matrix in §3 excludes it from): the Master Prompt wins. Build the screen without the unauthorized element, and note the discrepancy rather than silently resolving it either way.
- If `data-model.md` and a `.dc.html` file's sample data structurally disagree: `data-model.md` wins, always.
- For genuinely open product decisions the Master Prompt itself flags as unresolved (see its "OPEN ITEMS FOR PRODUCT DECISION" section — e.g. Communities' full data model, Tool Provider Agreements, the Workspace Switcher UX sign-off), do not silently invent a resolution. Build everything else, flag these explicitly, and hold them for product sign-off rather than guessing.

---

## 9. CLOSING DIRECTIVE

Build PROFILE exactly once, in the order above, against the Master Prompt as the sole authority for what the product does and who is allowed to see it, and the Handoff package as the sole authority for what it looks like. Nothing in the 50 sections and nothing among the 43 screens is optional, decorative, or safe to defer silently. Where gating is involved — individual vs. organisation, business vs. institutional vs. regulatory, external vs. owner-internal — treat every boundary in §3 as a hard architectural wall, not a UI convenience, and verify it explicitly before calling any phase done.
