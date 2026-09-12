import type { OrgHubProfile } from './accountTypes'

export type BuildPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type RouteGate =
  | { kind: 'public' }
  | { kind: 'authenticated' }
  | { kind: 'individual' }
  | { kind: 'organisation'; hub?: OrgHubProfile | OrgHubProfile[] }
  | { kind: 'staff' }

export interface RouteEntry {
  path: string
  screen: string
  /** §6 build-sequencing phase this screen belongs to (0-7, matching the build
   * doc's own PHASE 0..7 numbering exactly — corrected from an earlier
   * off-by-one where this registry used 2-6 for what the build doc calls
   * Phase 1-5). */
  phase: BuildPhase
  masterPromptRef: string
  gate: RouteGate
  /** Set for a route that exists only to close a flagged design-handoff gap. */
  note?: string
}

/**
 * The route registry, seeded from PROFILE_CLAUDE_CODE_BUILD_PROMPT.md §5's
 * 37-screen web checklist and expanded with routes the Master Prompt requires
 * that have no 1:1 Handoff screen (the individually-routable legal documents
 * in §31's table and §37.15's LEGAL_PAGES_V3, /how-it-works, /help/faq) plus
 * one flagged entry closing a Handoff-documented gap (see note below) — every
 * nav target must resolve to a real page or an explicit FeatureShell, never a
 * 404 (build doc §49.3).
 *
 * Design System, Logo System, Mobile App, Windows App, and the i18n/RTL Example
 * are reference material / cross-platform targets, not web routes, and are
 * intentionally excluded from this table.
 */
export const routeRegistry: RouteEntry[] = [
  // ---- Phase 1 — Public site & auth root ----
  // Route paths below follow Master Prompt §31's explicit route table and §6.6/
  // §34.2's `/auth` auth-root convention, NOT the informal path guesses in the
  // Handoff README's "route map (design-level, informational)" — e.g. Sign In +
  // Account Creation are one `/auth` route (mode via query param, §6.6), and the
  // public Trust Centre is `/trust` not `/trust-centre`. Master Prompt wins on
  // route/URL structure per the source-of-truth hierarchy (build doc §1).
  { path: '/', screen: 'Public Hero', phase: 1, masterPromptRef: '§6', gate: { kind: 'public' } },
  { path: '/about', screen: 'About & Solutions', phase: 1, masterPromptRef: '§43', gate: { kind: 'public' } },
  {
    path: '/how-it-works',
    screen: 'How PROFILE Works',
    phase: 1,
    masterPromptRef: '§31.1',
    gate: { kind: 'public' },
    note: 'Distinct route required by §31\'s table but not a separate Handoff screen — built with About\'s shared visual pattern per build doc §8\'s "use existing components" rule.',
  },
  { path: '/blog', screen: 'Blog & News', phase: 1, masterPromptRef: '§31', gate: { kind: 'public' } },
  { path: '/trust', screen: 'Trust Centre', phase: 1, masterPromptRef: '§12, §13, §31', gate: { kind: 'public' } },
  { path: '/help', screen: 'Help Centre', phase: 1, masterPromptRef: '§37.10, §31', gate: { kind: 'public' } },
  { path: '/help/faq', screen: 'FAQ Library', phase: 1, masterPromptRef: '§45', gate: { kind: 'public' } },
  { path: '/legal', screen: 'Legal (tabbed hub)', phase: 1, masterPromptRef: '§31, §46', gate: { kind: 'public' } },
  { path: '/terms', screen: 'Terms of Service', phase: 1, masterPromptRef: '§46.6, §31', gate: { kind: 'public' } },
  { path: '/privacy', screen: 'Privacy & Data Policy', phase: 1, masterPromptRef: '§46.4, §31', gate: { kind: 'public' } },
  { path: '/cookies', screen: 'Cookie Policy', phase: 1, masterPromptRef: '§37.15, §31', gate: { kind: 'public' } },
  {
    path: '/identity-agreement',
    screen: 'Identity & Authenticity Agreement',
    phase: 1,
    masterPromptRef: '§46.3, §31',
    gate: { kind: 'public' },
  },
  {
    path: '/verification-consent',
    screen: 'Verification Routing Consent',
    phase: 1,
    masterPromptRef: '§46.5, §31',
    gate: { kind: 'public' },
  },
  { path: '/conduct', screen: 'Professional Conduct Standards', phase: 1, masterPromptRef: '§46.7, §31', gate: { kind: 'public' } },
  { path: '/dpa', screen: 'Data Processing Agreement', phase: 1, masterPromptRef: '§46.8, §31', gate: { kind: 'public' } },
  {
    path: '/acceptable-use',
    screen: 'Acceptable Use Policy',
    phase: 1,
    masterPromptRef: '§37.15',
    gate: { kind: 'public' },
    note: 'Listed in LEGAL_PAGES_V3 (§37.15) with no canonical drafted text in the Master Prompt (unlike §46.3-46.8) — page exists and is real, flagged pending-legal-drafting rather than fabricated.',
  },
  {
    path: '/copyright',
    screen: 'Copyright & Intellectual Property',
    phase: 1,
    masterPromptRef: '§37.15',
    gate: { kind: 'public' },
    note: 'Same gap as /acceptable-use — required by §37.15, no canonical text drafted yet.',
  },
  {
    path: '/community-guidelines',
    screen: 'Community Guidelines',
    phase: 1,
    masterPromptRef: '§37.15, §21',
    gate: { kind: 'public' },
    note: 'Same gap as /acceptable-use — required by §37.15, no canonical text drafted yet.',
  },
  {
    path: '/security-practices',
    screen: 'Security Practices',
    phase: 1,
    masterPromptRef: '§37.15, §27',
    gate: { kind: 'public' },
    note: 'Same gap as /acceptable-use — required by §37.15, no canonical text drafted yet; content grounded in §27\'s real security architecture rather than invented.',
  },
  { path: '/auth', screen: 'Sign In / Account Creation', phase: 1, masterPromptRef: '§6.6, §7, §8', gate: { kind: 'public' } },
  { path: '/onboarding', screen: 'Onboarding', phase: 1, masterPromptRef: '§8.8-8.10', gate: { kind: 'authenticated' } },

  // ---- Phase 2 — Core authenticated product ----
  { path: '/home', screen: 'Home', phase: 2, masterPromptRef: '§11', gate: { kind: 'authenticated' } },
  {
    path: '/profile',
    screen: 'Profile & Trust (self alias)',
    phase: 2,
    masterPromptRef: '§24, §10.3',
    gate: { kind: 'authenticated' },
    note: "Redirects to /profile/me — §10.3's Profile Drawer links to /profile/@username; this build has no backend-issued username directory to resolve a bare /profile against, so it redirects to the self-alias instead of guessing.",
  },
  {
    path: '/profile/:username',
    screen: 'Profile & Trust / Public Profile Page',
    phase: 2,
    masterPromptRef: '§24.1, §24.2, §10.3',
    gate: { kind: 'authenticated' },
    note: "One component serves both build-doc screens (own profile, editable, vs. viewing someone else) depending on whether :username resolves to the signed-in account — 'me' is this build's own-profile alias.",
  },
  { path: '/settings', screen: 'Settings & Privacy', phase: 2, masterPromptRef: '§25', gate: { kind: 'authenticated' } },
  {
    path: '/store',
    screen: 'Store Hub',
    phase: 2,
    masterPromptRef: '§19, §38.4, §38.5, §38.6a',
    gate: { kind: 'authenticated' },
    note: 'Patch (pre-Phase-7): assembles existing Marketplace/Commerce-Activation pieces into one named Market + Create Store screen — not previously a distinct route.',
  },
  { path: '/notifications', screen: 'Notification Centre', phase: 2, masterPromptRef: '§10, §20', gate: { kind: 'authenticated' } },
  { path: '/opportunities', screen: 'Opportunity Hub', phase: 2, masterPromptRef: '§18', gate: { kind: 'authenticated' } },
  { path: '/messages', screen: 'Messaging & Communities', phase: 2, masterPromptRef: '§20, §21', gate: { kind: 'authenticated' } },
  {
    path: '/communities',
    screen: 'Communities (list)',
    phase: 2,
    masterPromptRef: '§21.2, §10.4',
    gate: { kind: 'authenticated' },
    note: "§10.4's Hamburger Menu gives Communities its own top-level route, distinct from Messaging — this renders the same screen as /messages, pre-selected to its Communities tab.",
  },
  { path: '/communities/:id', screen: 'Community Detail', phase: 2, masterPromptRef: '§21', gate: { kind: 'authenticated' } },
  { path: '/disputes/:recordId', screen: 'Dispute & Appeal', phase: 2, masterPromptRef: '§50.1, §28.4', gate: { kind: 'authenticated' } },
  {
    path: '/learn',
    screen: 'Learning',
    phase: 2,
    masterPromptRef: '§21, §50.9.7, §10.4',
    gate: { kind: 'authenticated' },
    note: "Corrected from an earlier /learning — §10.4's Hamburger Menu explicitly routes Learning Center at /learn.",
  },

  // ---- Phase 3 — Career Engine ----
  { path: '/career/cv/:template', screen: 'CV Templates', phase: 3, masterPromptRef: '§15, §47.5', gate: { kind: 'individual' } },
  {
    path: '/career/portfolio/:template',
    screen: 'Portfolio Templates',
    phase: 3,
    masterPromptRef: '§15.4, §47.3, §47.6',
    gate: { kind: 'authenticated' },
    note: 'Portfolio is universal (§15.4 hard rule), not organisation-exclusive — corrected from an earlier reading; individuals get both CV and Portfolio, organisations get Portfolio only. See accountTypes.ts.',
  },
  { path: '/career/cover-letter', screen: 'Cover Letter', phase: 3, masterPromptRef: '§47', gate: { kind: 'individual' } },
  { path: '/career/advisor', screen: 'Advisor & Creator Hub', phase: 3, masterPromptRef: '§48', gate: { kind: 'authenticated' } },
  { path: '/career/marketplace', screen: 'Creator Marketplace', phase: 3, masterPromptRef: '§19', gate: { kind: 'authenticated' } },
  { path: '/career/earnings', screen: 'Creator Earnings', phase: 3, masterPromptRef: '§19, §38', gate: { kind: 'authenticated' } },

  // ---- Phase 4 — Organisation / Institution / Government ----
  {
    path: '/org/:id/talent',
    screen: 'Organization Workspace',
    phase: 4,
    masterPromptRef: '§16, §42',
    gate: { kind: 'organisation', hub: ['business_hub', 'community_hub'] },
    note: "Build doc §5 explicitly scopes this to business_hub/community_hub — an earlier pass left it open to any hub, which would have let an institutional_hub or regulatory_console org reach the generic workspace instead of being confined to its own dedicated one.",
  },
  {
    path: '/institution/:id',
    screen: 'Institution Workspace',
    phase: 4,
    masterPromptRef: '§16',
    gate: { kind: 'organisation', hub: 'institutional_hub' },
  },
  {
    path: '/government/:id',
    screen: 'Government Workspace',
    phase: 4,
    masterPromptRef: '§16, §10.5',
    gate: { kind: 'organisation', hub: 'regulatory_console' },
  },
  {
    path: '/internal/verification-review',
    screen: 'Verification Review',
    phase: 4,
    masterPromptRef: '§16, §26',
    gate: { kind: 'staff' },
  },
  {
    path: '/institution/:id/schemas',
    screen: 'Credential Schema Builder',
    phase: 4,
    masterPromptRef: '§16.2',
    gate: { kind: 'organisation', hub: 'institutional_hub' },
  },
  {
    path: '/institution/:id/analytics',
    screen: 'Institution Analytics',
    phase: 4,
    masterPromptRef: '§23, §16',
    gate: { kind: 'organisation', hub: 'institutional_hub' },
  },
  {
    path: '/government/:id/analytics',
    screen: 'Government Analytics',
    phase: 4,
    masterPromptRef: '§23, §16',
    gate: { kind: 'organisation', hub: 'regulatory_console' },
  },
  {
    path: '/org/:id/integrations',
    screen: 'Enterprise Integrations',
    phase: 4,
    masterPromptRef: '§16.7, §38.9, §38.18',
    gate: { kind: 'organisation' },
  },
  {
    path: '/org/:id/recruiter',
    screen: 'Recruiter Workflow',
    phase: 4,
    masterPromptRef: '§18.3, §39',
    gate: { kind: 'organisation', hub: 'business_hub' },
  },

  // ---- Phase 5 — Owner / internal ----
  { path: '/mission-control', screen: 'Mission Control', phase: 5, masterPromptRef: '§26, §35', gate: { kind: 'staff' } },
  {
    path: '/mission-control/executive-copilots',
    screen: 'Mission Control — Executive Copilots',
    phase: 5,
    masterPromptRef: '§26, §35',
    gate: { kind: 'staff' },
    note:
      "Registered to close the gap flagged on the Route Integrity Engine screen itself: linked from Mission Control's sidebar in the Handoff with no registered route. Resolved here by registering the route rather than removing the link.",
  },
  { path: '/internal/ai-decision-log', screen: 'AI Decision Log', phase: 5, masterPromptRef: '§48', gate: { kind: 'staff' } },
  { path: '/internal/route-integrity', screen: 'Route Integrity Engine', phase: 5, masterPromptRef: '§49.3', gate: { kind: 'staff' } },
  {
    path: '/internal/content-console',
    screen: 'Owner Content Console',
    phase: 5,
    masterPromptRef: '§50.11.8',
    gate: { kind: 'staff' },
    note: 'Patch (pre-Phase-7) B8: staff-only news/blog/announcement composer, not previously a distinct screen.',
  },
  {
    path: '/internal/admin-management',
    screen: 'Admin Management',
    phase: 5,
    masterPromptRef: '§50.11.8',
    gate: { kind: 'staff' },
    note:
      'Patch (pre-Phase-7) B9: registered as staff-gated at the router level; Owner-only enforcement happens inside the component itself via RequireOwner, matching the pattern used elsewhere (e.g. HubAccessDenied) for checks that need live account state.',
  },

  // ---- Design Recovery Patch — §10.4 Hamburger Menu destinations with no ----
  // ---- prior route; every real §10 nav item now resolves somewhere real. ----
  { path: '/connections', screen: 'Connections', phase: 2, masterPromptRef: '§10.1', gate: { kind: 'authenticated' }, note: 'Recovery patch: §10.1 mobile bottom nav tab with no prior route.' },
  { path: '/record', screen: 'Record Activity', phase: 2, masterPromptRef: '§10.1', gate: { kind: 'authenticated' }, note: 'Recovery patch: §10.1 primary create-activity action as its own route, reusing Home\'s Composer.' },
  { path: '/credentials', screen: 'Credential Hub', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'authenticated' }, note: 'Recovery patch: §10.4 Hamburger Menu item, individual accounts only (enforced in-component).' },
  { path: '/analytics', screen: 'Analytics', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'authenticated' }, note: 'Recovery patch: §10.4 Hamburger Menu item, individual accounts only (enforced in-component) — orgs already have Institution/Government Analytics.' },
  { path: '/career-growth', screen: 'Career Growth', phase: 2, masterPromptRef: '§10.4, §18.5', gate: { kind: 'authenticated' }, note: 'Recovery patch: §10.4 Hamburger Menu item, individual accounts only (enforced in-component).' },
  { path: '/collaboration', screen: 'Collaboration Hub', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'authenticated' }, note: 'Recovery patch: §10.4 Hamburger Menu item.' },
  { path: '/developer-platform', screen: 'Developer Platform', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'public' }, note: 'Recovery patch: §10.4 Hamburger Menu item — honest "not built yet" real page, not a dead link.' },
  { path: '/api-centre', screen: 'API Centre', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'public' }, note: 'Recovery patch: §10.4 Hamburger Menu item — honest "not built yet" real page, not a dead link.' },
  { path: '/feedback', screen: 'Feedback Centre', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'public' }, note: 'Recovery patch: §10.4 Hamburger Menu item.' },
  { path: '/release-notes', screen: 'Release Notes', phase: 2, masterPromptRef: '§10.4', gate: { kind: 'public' }, note: 'Recovery patch: §10.4 Hamburger Menu item — real changelog of this build\'s actual phase history.' },
  {
    path: '/trust-passport',
    screen: 'Trust Passport',
    phase: 2,
    masterPromptRef: '§4.5, §12.6, §13',
    gate: { kind: 'authenticated' },
    note:
      "Bug fix: every in-app 'Trust Centre' nav link previously pointed at the public /trust marketing page (PublicHeader/PublicFooter chrome), which took a signed-in user out of the app shell entirely. This is the real authenticated destination — Trust Score ring, §4.5 dimensions, and the §13.2 calculation matrix. /trust remains the public explainer for signed-out visitors.",
  },
]
