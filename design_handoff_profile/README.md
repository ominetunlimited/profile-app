# Handoff: PROFILE — Full Product Design (43 screens)

## Overview
PROFILE is a professional identity, trust, verification, and career-intelligence platform. This bundle contains the complete design for the product's public site, core authenticated product, Career Engine, organisation/institution/government workspaces, owner-level internal tools, and cross-platform (mobile + Windows) references — built against a single design system.

## About the Design Files
The `.dc.html` files in this bundle are **design references built in a prototyping tool** — high-fidelity mockups showing intended look, copy, layout, and interaction, not production code to copy directly. Each file is a self-contained HTML document (open directly in a browser) using inline styles and a small custom templating runtime (`support.js`) specific to the prototyping environment — **do not port this runtime or its templating syntax into the target codebase.**

The task is to **recreate these designs in the target codebase's actual environment** (React, Next.js, native mobile, etc. — see `## Recommended architecture` below, informed by the original brief) using that environment's own component patterns, state management, and routing — not to embed or reference the HTML files at runtime.

## Fidelity
**High-fidelity.** Every screen has final copy, exact spacing, exact color tokens (see Design Tokens below), and defined interaction states (hover/loading/empty/error where applicable). Treat pixel values, copy text, and color tokens as final; treat the specific sample data (the "Amara Okafor" persona, all names/numbers) as illustrative only — see `data-model.md` for the real entity schema.

## Recommended architecture
React + TypeScript, Tailwind consuming the semantic tokens below as CSS variables (not hardcoded utility classes), React Native or native for mobile, Electron or native for Windows — per the product brief's own architecture guidance. Reassess if the target codebase already has an established stack; use its conventions instead.

## Screen inventory

### Public site (unauthenticated)
| Screen | File | Purpose |
|---|---|---|
| Hero / landing | `PROFILE Public Hero.dc.html` | Front door — explains PROFILE, routes to sign-up/sign-in |
| About & Solutions | `PROFILE About & Solutions.dc.html` | Mission/vision + audience-specific value props (tabbed) |
| Blog & News | `PROFILE Blog & News.dc.html` | Editorial content, two distinct feeds |
| Trust Centre | `PROFILE Trust Centre.dc.html` | Public explainer of Trust Score, verification, disputes |
| Help Centre | `PROFILE Help Centre.dc.html` | Searchable FAQ + category browse |
| Legal | `PROFILE Legal.dc.html` | Terms, Privacy Policy, Cookie Policy (tabbed) |
| Sign In | `PROFILE Sign In.dc.html` | Login + conditional MFA step |
| Account Creation | `PROFILE Account Creation.dc.html` | Multi-step signup; branches for individual vs. org/institution/government |
| Onboarding | `PROFILE Onboarding.dc.html` | First-record + verification nudges post-signup |

### Core authenticated product
| Screen | File | Purpose |
|---|---|---|
| Home | `PROFILE Home.dc.html` | Command-centre dashboard |
| Profile & Trust | `PROFILE Profile & Trust.dc.html` | Own profile, evidence, Trust Passport, verification states |
| Public Profile Page | `PROFILE Public Profile Page.dc.html` | Viewing another user's profile |
| Settings & Privacy | `PROFILE Settings & Privacy.dc.html` | Security/Privacy/Notifications/Data tabs |
| Notification Centre | `PROFILE Notification Centre.dc.html` | Full-width notification inbox |
| Opportunity Hub | `PROFILE Opportunity Hub.dc.html` | Browse/filter/match-detail |
| Messaging & Communities | `PROFILE Messaging & Communities.dc.html` | DM threads + community list |
| Community Detail | `PROFILE Community Detail.dc.html` | Single community — discussions/members/about |
| Dispute & Appeal | `PROFILE Dispute & Appeal.dc.html` | Rejected-record dispute flow |
| Learning | `PROFILE Learning.dc.html` | Recommended/in-progress/completed courses |

### Career Engine
| Screen | File | Purpose |
|---|---|---|
| CV Templates | `PROFILE CV Templates.dc.html` | 10 selectable CV layouts |
| Portfolio Templates | `PROFILE Portfolio Templates.dc.html` | 5 selectable portfolio layouts |
| Cover Letter | `PROFILE Cover Letter.dc.html` | Opportunity-aware AI-assisted draft |
| Advisor & Creator Hub | `PROFILE Advisor & Creator Hub.dc.html` | AI chat advisor + creator's own templates |
| Creator Earnings | `PROFILE Creator Earnings.dc.html` | Per-template stats, payout history |
| Creator Marketplace | `PROFILE Creator Marketplace.dc.html` | Buyer-side template browse/purchase |

### Organisation / Institution / Government
| Screen | File | Purpose |
|---|---|---|
| Organization Workspace | `PROFILE Organization Workspace.dc.html` | Talent search, requests, staff, integrations |
| Institution Workspace | `PROFILE Institution Workspace.dc.html` | Bulk verification queue, analytics, schemas |
| Government Workspace | `PROFILE Government Workspace.dc.html` | Licence confirmations, analytics |
| Verification Review | `PROFILE Verification Review.dc.html` | PROFILE-staff review of workspace requests |
| Credential Schema Builder | `PROFILE Credential Schema Builder.dc.html` | Institution-defined record types |
| Institution Analytics | `PROFILE Institution Analytics.dc.html` | Verification volume trends |
| Government Analytics | `PROFILE Government Analytics.dc.html` | Licence confirmation trends |
| Enterprise Integrations | `PROFILE Enterprise Integrations.dc.html` | SSO config, API key management |
| Recruiter Workflow | `PROFILE Recruiter Workflow.dc.html` | Candidate pipeline + interview scheduling |

### Owner / internal
| Screen | File | Purpose |
|---|---|---|
| Mission Control | `PROFILE Mission Control.dc.html` | Owner dashboard — decisions, KPIs, snapshot export |
| AI Decision Log | `PROFILE AI Decision Log.dc.html` | Governance audit trail for AI outputs |
| Route Integrity Engine | `PROFILE Route Integrity Engine.dc.html` | Route registry health |

### Foundation & cross-platform
| Screen | File | Purpose |
|---|---|---|
| Design System | `PROFILE Design System.dc.html` | Full component library (buttons, forms, tabs, badges, toggles, modals, etc.) |
| Logo System | `PROFILE Logo System.dc.html` | Logo usage rules, assets, clear space |
| Mobile App | `PROFILE Mobile App.dc.html` | iOS + Android reference, 7 screens each |
| Windows App | `PROFILE Windows App.dc.html` | Multi-panel workspace, command palette, drag-and-drop |
| i18n & RTL Example | `PROFILE i18n & RTL Example.dc.html` | English/German/Arabic, RTL mirroring reference |

## Route map (design-level, informational)
See `data-model.md` for entities. Route paths referenced across screens (e.g. `/home`, `/profile/:id`, `/trust-centre`, `/opportunities`, `/org/:id/talent`, `/institution/:id/schemas`) are the intended URL structure but are **not a final registered route table** — reconcile against the target framework's routing conventions. One inconsistency was caught and documented on the Route Integrity Engine screen itself (a Mission Control sidebar link with no destination) — resolve that before considering routes final.

## States coverage
Each screen was designed with, at minimum: default, loading (where data-dependent), empty, and error states where the screen surfaces real data (see Home's degraded-state banner, Institution Workspace's bulk queue, Account Creation's validation states). Not every screen has all 15 states listed in exhaustive design QA checklists — treat this as high-fidelity for the states shown, and design remaining edge states (offline, permission-denied) using the same visual language when building.

## Design Tokens
All colors, spacing, and type are defined as CSS custom properties in every file's `<style>` block, sourced from `PROFILE Design System.dc.html`. Key tokens (light / dark):

```
--bg:            #F8FAFC / #060E1C
--surface:       #FFFFFF / #0C1829
--surface-sunken:#F1F5F9 / #050B16
--border:        #E5E7EB / rgba(255,255,255,.07)
--border-strong: #CBD5E1 / rgba(255,255,255,.14)
--text-0:        #1E293B / rgba(255,255,255,.90)   (primary text)
--text-1:        #5B6B80 / rgba(255,255,255,.65)   (secondary text)
--text-2:        #8496A9 / rgba(255,255,255,.40)   (tertiary/caption)
--accent:        #0057D9 / #4C8DFF                  (primary CTA / links)
--trust:         #0E7490 / #00E5FF                  (verification/trust surfaces)
--gold:          #8A6200 / #F4B400                  (credentials/certifications)
--success:       #04763C / #3DDC7F
--warning:       #8A5200 / #FBBF24
--danger:        #C2181D / #FF7A7A
```
Typography: Inter (UI text), JetBrains Mono (data/numeric/technical labels). Full component states (hover/focus/disabled/loading) are documented in `PROFILE Design System.dc.html`.

An orange accent variant was explored and explicitly rejected in favor of the brand's blue/cyan/gold/coral palette — do not reintroduce orange as a primary accent without product-owner sign-off (documented decision, see Design System's accent toggle).

## Assets
- `assets/profile-mark.png`, `assets/profile-mark-mono.png` — official logo mark, full-color and single-color, transparent, with baked-in shading (do not use flat SVG versions — see Logo System for why).
- `assets/profile-wordmark.svg` — wordmark with tagline.
- `assets/profile-lockup-horizontal.png`, `assets/profile-icon-{16,32,180,512}.png` — derived lockup and icon set.
- Logo usage rules (clear space, minimum size, backgrounds, never-distort patterns) are fully documented in `PROFILE Logo System.dc.html`.
- All product imagery (site photos, diagrams, course thumbnails) is represented as striped placeholder blocks with monospace labels (e.g. `// site photo — rooftop array`) — these are NOT final assets; real photography/diagrams must be sourced.

## Known gaps — read before starting
- `data-model.md` — the real entity/schema reference; sample persona data in the HTML is illustrative only.
- `accessibility-spot-check.md` — what was verified vs. what still needs a full WCAG pass (focus-visible states, full contrast scan, live-region ARIA, skip links).
- Responsive behavior is built fluid-by-construction (CSS grid `auto-fit`/`minmax`, flexbox `wrap`, `clamp()` for spacing — verified present throughout) but has not been screenshot-tested at intermediate viewport widths as a dedicated QA pass; verify in the real browser during implementation.
- Institution/Government-specific bulk staff onboarding, data export status, and notification preferences are built; a few adjacent flows (offline states, permission-denied states) exist only where explicitly shown and should be extended using the same visual language.

## Files
All 43 `.dc.html` design files are included in this folder, plus `data-model.md` and `accessibility-spot-check.md`. Open any `.dc.html` file directly in a browser to view it.
