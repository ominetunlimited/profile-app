import type { OrgHubProfile } from './accountTypes'

export type RouteGate =
  | { kind: 'public' }
  | { kind: 'authenticated' }
  | { kind: 'individual' }
  | { kind: 'organisation'; hub?: OrgHubProfile | OrgHubProfile[] }
  | { kind: 'staff' }
  /** The real Admin Centre — gated on a live `platform_admins` row
   * (AdminContext/guards via AdminShell.tsx's RequirePlatformAdmin), never
   * on AccountContext's dev-only `staffRole`. Distinct from 'staff' because
   * it has its own sign-in surface and sidebar shell, not the consumer app. */
  | { kind: 'platform_admin' }

export interface RouteEntry {
  path: string
  screen: string
  gate: RouteGate
}

/**
 * The route registry: every navigable path in the app. Every nav target must resolve to a real page or an explicit
 * "coming soon" shell, never a 404.
 */
export const routeRegistry: RouteEntry[] = [
  // ---- Public site & auth root ----
  // Sign In and Account Creation share one `/auth` route (mode via query param); the public Trust Centre is `/trust`.
  { path: '/', screen: 'Public Hero', gate: { kind: 'public' } },
  { path: '/about', screen: 'About & Solutions', gate: { kind: 'public' } },
  {
    path: '/how-it-works',
    screen: 'How PROFILE Works',
    gate: { kind: 'public' },
  },
  { path: '/blog', screen: 'Blog & News', gate: { kind: 'public' } },
  { path: '/trust', screen: 'Trust Centre', gate: { kind: 'public' } },
  { path: '/help', screen: 'Help Centre', gate: { kind: 'public' } },
  { path: '/help/faq', screen: 'FAQ Library', gate: { kind: 'public' } },
  { path: '/legal', screen: 'Legal (tabbed hub)', gate: { kind: 'public' } },
  { path: '/terms', screen: 'Terms of Service', gate: { kind: 'public' } },
  { path: '/privacy', screen: 'Privacy & Data Policy', gate: { kind: 'public' } },
  { path: '/cookies', screen: 'Cookie Policy', gate: { kind: 'public' } },
  {
    path: '/identity-agreement',
    screen: 'Identity & Authenticity Agreement',
    gate: { kind: 'public' },
  },
  {
    path: '/verification-consent',
    screen: 'Verification Routing Consent',
    gate: { kind: 'public' },
  },
  { path: '/conduct', screen: 'Professional Conduct Standards', gate: { kind: 'public' } },
  { path: '/dpa', screen: 'Data Processing Agreement', gate: { kind: 'public' } },
  {
    path: '/acceptable-use',
    screen: 'Acceptable Use Policy',
    gate: { kind: 'public' },
  },
  {
    path: '/copyright',
    screen: 'Copyright & Intellectual Property',
    gate: { kind: 'public' },
  },
  {
    path: '/community-guidelines',
    screen: 'Community Guidelines',
    gate: { kind: 'public' },
  },
  {
    path: '/security-practices',
    screen: 'Security Practices',
    gate: { kind: 'public' },
  },
  { path: '/auth', screen: 'Sign In / Account Creation', gate: { kind: 'public' } },
  {
    path: '/auth/reset-password',
    screen: 'Password Reset Callback',
    gate: { kind: 'public' },
  },
  { path: '/onboarding', screen: 'Onboarding', gate: { kind: 'authenticated' } },

  // ---- Core authenticated product ----
  { path: '/home', screen: 'Home', gate: { kind: 'authenticated' } },
  {
    path: '/profile',
    screen: 'Profile & Trust (self alias)',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/profile/:username',
    screen: 'Profile & Trust / Public Profile Page',
    gate: { kind: 'authenticated' },
  },
  { path: '/settings', screen: 'Settings & Privacy', gate: { kind: 'authenticated' } },
  {
    path: '/store',
    screen: 'Store Hub',
    gate: { kind: 'authenticated' },
  },
  { path: '/notifications', screen: 'Notification Centre', gate: { kind: 'authenticated' } },
  { path: '/opportunities', screen: 'Opportunity Hub', gate: { kind: 'authenticated' } },
  {
    path: '/opportunity/students',
    screen: 'Student Opportunity Hub',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/opportunity/graduates',
    screen: 'Graduate Launchpad',
    gate: { kind: 'authenticated' },
  },
  { path: '/messages', screen: 'Messaging & Communities', gate: { kind: 'authenticated' } },
  {
    path: '/communities',
    screen: 'Communities (list)',
    gate: { kind: 'authenticated' },
  },
  { path: '/communities/:id', screen: 'Community Detail', gate: { kind: 'authenticated' } },
  { path: '/disputes/:recordId', screen: 'Dispute & Appeal', gate: { kind: 'authenticated' } },
  {
    path: '/learn',
    screen: 'Learning',
    gate: { kind: 'authenticated' },
  },

  // ---- Career Engine ----
  { path: '/career/cv/:template', screen: 'CV Templates', gate: { kind: 'individual' } },
  {
    path: '/career/portfolio/:template',
    screen: 'Portfolio Templates',
    gate: { kind: 'authenticated' },
  },
  { path: '/career/cover-letter', screen: 'Cover Letter', gate: { kind: 'individual' } },
  { path: '/career/advisor', screen: 'Advisor & Creator Hub', gate: { kind: 'authenticated' } },
  { path: '/career/marketplace', screen: 'Creator Marketplace', gate: { kind: 'authenticated' } },
  { path: '/career/earnings', screen: 'Creator Earnings', gate: { kind: 'authenticated' } },

  // ---- Organisation / Institution / Government ----
  {
    path: '/org/:id/talent',
    screen: 'Organization Workspace',
    gate: { kind: 'organisation', hub: ['business_hub', 'community_hub'] },
  },
  {
    path: '/institution/:id',
    screen: 'Institution Workspace',
    gate: { kind: 'organisation', hub: 'institutional_hub' },
  },
  {
    path: '/government/:id',
    screen: 'Government Workspace',
    gate: { kind: 'organisation', hub: 'regulatory_console' },
  },
  {
    path: '/internal/verification-review',
    screen: 'Verification Review',
    gate: { kind: 'staff' },
  },
  {
    path: '/institution/:id/schemas',
    screen: 'Credential Schema Builder',
    gate: { kind: 'organisation', hub: 'institutional_hub' },
  },
  {
    path: '/institution/:id/analytics',
    screen: 'Institution Analytics',
    gate: { kind: 'organisation', hub: 'institutional_hub' },
  },
  {
    path: '/government/:id/analytics',
    screen: 'Government Analytics',
    gate: { kind: 'organisation', hub: 'regulatory_console' },
  },
  {
    path: '/org/:id/integrations',
    screen: 'Enterprise Integrations',
    gate: { kind: 'organisation' },
  },
  { path: '/verification-inbox', screen: 'Verification Inbox', gate: { kind: 'organisation' } },
  {
    path: '/org/:id/recruiter',
    screen: 'Recruiter Workflow',
    gate: { kind: 'organisation', hub: 'business_hub' },
  },

  // ---- Owner / internal ----
  { path: '/mission-control', screen: 'Mission Control', gate: { kind: 'staff' } },
  {
    path: '/mission-control/executive-copilots',
    screen: 'Mission Control — Executive Copilots',
    gate: { kind: 'staff' },
  },
  { path: '/internal/ai-decision-log', screen: 'AI Decision Log', gate: { kind: 'staff' } },
  { path: '/internal/route-integrity', screen: 'Route Integrity Engine', gate: { kind: 'staff' } },
  {
    path: '/internal/dispute-review',
    screen: 'Dispute Review',
    gate: { kind: 'staff' },
  },
  {
    path: '/internal/content-console',
    screen: 'Owner Content Console',
    gate: { kind: 'staff' },
  },
  {
    path: '/internal/admin-management',
    screen: 'Admin Management',
    gate: { kind: 'staff' },
  },

  // ---- Real Admin Centre — a genuine Supabase-backed ----
  // platform_admins identity, separate from the dev-only staffRole system
  // above. See supabase/migrations/0005_platform_admins.sql and
  // src/screens/admin/*.
  { path: '/admin/login', screen: 'Admin Sign In', gate: { kind: 'public' } },
  { path: '/admin', screen: 'Admin Dashboard', gate: { kind: 'platform_admin' } },
  { path: '/admin/users', screen: 'Admin Users & Roles', gate: { kind: 'platform_admin' } },
  { path: '/admin/verification', screen: 'Admin Verification Queue', gate: { kind: 'platform_admin' } },
  { path: '/admin/kyc', screen: 'Admin Identity (KYC) Review', gate: { kind: 'platform_admin' } },
  { path: '/admin/verification-requests', screen: 'Admin Unrouted Verification Requests', gate: { kind: 'platform_admin' } },
  { path: '/admin/disputes', screen: 'Admin Disputes & Appeals', gate: { kind: 'platform_admin' } },
  { path: '/admin/data-requests', screen: 'Admin Data Requests', gate: { kind: 'platform_admin' } },
  { path: '/admin/content', screen: 'Admin Content Moderation', gate: { kind: 'platform_admin' } },
  { path: '/admin/communities', screen: 'Admin Communities', gate: { kind: 'platform_admin' } },
  { path: '/admin/mission-control', screen: 'Admin Mission Control', gate: { kind: 'platform_admin' } },
  { path: '/admin/ai-decision-log', screen: 'Admin AI Decision Log', gate: { kind: 'platform_admin' } },
  { path: '/admin/settings', screen: 'Admin Support & Notifications', gate: { kind: 'platform_admin' } },
  { path: '/admin/route-integrity', screen: 'Admin Route Integrity', gate: { kind: 'platform_admin' } },

  // ---- Design Recovery Patch —  Hamburger Menu destinations with no ----
  // ---- prior route; every real  nav item now resolves somewhere real. ----
  { path: '/connections', screen: 'Connections', gate: { kind: 'authenticated' }, },
  { path: '/record', screen: 'Record Activity', gate: { kind: 'authenticated' }, },
  {
    path: '/activity/:id',
    screen: 'Activity Detail',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/tool/:id',
    screen: 'Tool Detail',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/provider/:id',
    screen: 'Provider Detail',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/job/:id',
    screen: 'Job Detail',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/apply/:jobId',
    screen: 'Apply With PROFILE',
    gate: { kind: 'individual' },
  },
  {
    path: '/saved',
    screen: 'Saved',
    gate: { kind: 'authenticated' },
  },
  {
    path: '/applications',
    screen: 'Applications',
    gate: { kind: 'individual' },
  },
  {
    path: '/ads',
    screen: 'Ads Centre',
    gate: { kind: 'authenticated' },
  },
  { path: '/credentials', screen: 'Credential Hub', gate: { kind: 'authenticated' }, },
  { path: '/analytics', screen: 'Analytics', gate: { kind: 'authenticated' }, },
  { path: '/career-growth', screen: 'Career Growth', gate: { kind: 'authenticated' }, },
  { path: '/collaboration', screen: 'Collaboration Hub', gate: { kind: 'authenticated' }, },
  { path: '/developer-platform', screen: 'Developer Platform', gate: { kind: 'public' }, },
  { path: '/api-centre', screen: 'API Centre', gate: { kind: 'public' }, },
  { path: '/feedback', screen: 'Feedback Centre', gate: { kind: 'public' }, },
  { path: '/release-notes', screen: 'Release Notes', gate: { kind: 'public' }, },
  {
    path: '/trust-passport',
    screen: 'Trust Passport',
    gate: { kind: 'authenticated' },
  },
]
