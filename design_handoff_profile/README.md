# PROFILE — Design Handoff for Claude Code

## Instruction to Claude Code
**Build the PROFILE application by implementing these 42 designs in this codebase's real stack — do not import, embed, or reference the `.dc.html` files at runtime.** They are high-fidelity design references (a prototyping tool's output), not application source. Read each screen's markup and inline styles as the spec for layout, copy, spacing, color, and interaction states, then recreate it as proper components (React/Next.js or whatever this repo already uses) wired to real data, routing, and auth — per this repo's existing conventions if it has any (check for `package.json`, an existing component library, a router).

Treat as **final**: copy text, exact spacing values, exact color tokens (hex values below), typography choices, component states shown (hover/loading/empty/error where present). Treat as **illustrative only**: the sample persona data ("Amara Okafor", "Aurora Power", specific numbers) — build against `data-model.md`'s schema instead, backed by real data.

## Audit status (this pass)
Every `.dc.html` file was swept for dead links (`href="#"`, empty `onClick`, orphaned nav items) immediately before this handoff. Zero remain. Every nav item, CTA, and in-card link now points to a real screen in this set or triggers a real inline state change (e.g. Sign In's "Forgot password" shows a confirmation, not a dead link). Three "read the full write-up" / "view →" links inside Portfolio Templates' rendered **template previews** are intentionally non-interactive (styled as plain text, not `<a>`) — they're inside a mockup of what a user's own portfolio would show, not real product navigation.

## Visual system — now unified
This design merges two sources: an original PROFILE design system and a Figma-Make exploration the user supplied. The merge is complete across all 42 screens:
- **Headings** (all `<h1>`) use **Plus Jakarta Sans** (700/800), adopted from the Figma source, loaded via Google Fonts in every file's `<helmet>`.
- **Body/UI text** stays **Inter** — unchanged from the original system.
- **Card hover-lift** (`.ds-card-hover`: 2px translateY + soft accent shadow on hover) and the **Trust Score ring** (`conic-gradient` fill, score/1000) are adopted from Figma and documented as reusable patterns in `PROFILE Design System.dc.html`.
- **Explicitly rejected from Figma**: like/comment/view vanity counters and "N recruiters viewed you — upgrade to see who" upsell patterns. These conflict with the product's stated anti-vanity-metric principle. `PROFILE Home (Figma Reference).dc.html` is kept as a side-by-side reference showing what was **not** adopted, with the conflict flagged inline — do not build from that file; build from `PROFILE Home.dc.html`.

## Screen inventory (42 files)
**Public site:** Public Hero, About & Solutions, Blog & News, Trust Centre, Help Centre, Legal (Terms/Privacy/Cookies), Sign In, Account Creation, Onboarding.
**Core product:** Home, Profile & Trust, Public Profile Page, Settings & Privacy, Notification Centre, Opportunity Hub, Messaging & Communities, Community Detail, Dispute & Appeal, Learning.
**Career Engine:** CV Templates (10), Portfolio Templates (5), Cover Letter, Advisor & Creator Hub, Creator Earnings, Creator Marketplace.
**Org/Institution/Government:** Organization Workspace, Institution Workspace, Government Workspace, Verification Review, Credential Schema Builder, Institution Analytics, Government Analytics, Enterprise Integrations, Recruiter Workflow.
**Owner/internal:** Mission Control, AI Decision Log, Route Integrity Engine.
**Foundation & cross-platform:** Design System, Logo System, Mobile App (iOS+Android), Windows App, i18n & RTL Example.
**Reference only (do not build from):** Home (Figma Reference) — see note above.

## Design tokens
Light / dark values, all as CSS custom properties in each file's `<style>` block:
```
--bg:            #F8FAFC / #060E1C
--surface:       #FFFFFF / #0C1829
--surface-sunken:#F1F5F9 / #050B16
--border:        #E5E7EB / rgba(255,255,255,.07)
--border-strong: #CBD5E1 / rgba(255,255,255,.14)
--text-0:        #1E293B / rgba(255,255,255,.90)
--text-1:        #5B6B80 / rgba(255,255,255,.65)
--text-2:        #8496A9 / rgba(255,255,255,.40)
--accent:        #0057D9 / #4C8DFF
--trust:         #0E7490 / #00E5FF
--gold:          #8A6200 / #F4B400
--success:       #04763C / #3DDC7F
--warning:       #8A5200 / #FBBF24
--danger:        #C2181D / #FF7A7A
```
Typography: Plus Jakarta Sans (headings only), Inter (UI text), JetBrains Mono (data/numeric). Full component states in `PROFILE Design System.dc.html`.

## Assets
`assets/profile-mark.png` / `profile-mark-mono.png` (official logo, transparent, do not redraw), `assets/profile-wordmark.svg`. Logo usage rules in `PROFILE Logo System.dc.html`. All product imagery is a striped placeholder with a monospace label (e.g. `// site photo`) — source real photography before shipping.

## Known gaps — read before building
1. **No shared data layer** — every screen hardcodes its own sample data. Build the real data model from `data-model.md` and wire every screen to it; do not port the hardcoded persona values.
2. **No true breakpoint QA** — layouts use fluid patterns throughout (CSS grid `auto-fit`/`minmax`, flexbox `wrap`, `clamp()`) but were not screenshot-tested at intermediate widths. Verify in a real browser during build.
3. **Accessibility** — see `accessibility-spot-check.md`. Structurally sound (semantic buttons/links, `role="tablist"`, reduced-motion support everywhere) but not independently WCAG-audited. Add explicit `:focus-visible` rings, run a full contrast scan, and implement real `aria-live` regions for form errors when you build.
4. **Route paths referenced in links** (e.g. `PROFILE Trust Centre.dc.html`) map 1:1 to the screen inventory above — translate filenames to this codebase's actual route/URL scheme.
5. One inconsistency is intentionally left visible on **Route Integrity Engine**'s own screen (a Mission Control sidebar link with no destination) — it's a worked example of the audit process, not a bug to silently fix; resolve it as part of building Mission Control's real navigation.

## Files
All 42 `.dc.html` screens, `assets/`, `data-model.md`, `accessibility-spot-check.md`. Open any `.dc.html` directly in a browser to preview it.
