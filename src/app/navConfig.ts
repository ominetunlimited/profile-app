import type { Account } from './accountTypes'
import { canAccessInstitutionHubTools, canAccessRecruiterHub, hubForOrgType, isCvEligible, isPortfolioEligible, orgRoleCan } from './accountTypes'
import type { StaffRole } from './AccountContext'

/**
 * Recovery patch — §10 Navigation, single source of truth for every
 * account-aware nav surface (§10.1 mobile bottom tabs, §10.2/§10.6 top bar,
 * §10.3 Profile Drawer, §10.4 Hamburger Menu). Previously AppShell hardcoded
 * 5 links total and every other real route (Store, Career Engine, Org/
 * Institution/Government workspaces, Owner/Internal tools) had no nav entry
 * anywhere — reachable only by typing the URL. Built once here so mobile and
 * desktop render from the same config, never two hand-maintained menus
 * (§10.8's own quality gate).
 *
 * §10.4's hard rule: an item the account can't reach is never shown
 * disabled — it's simply absent from the array the caller renders.
 */
export interface NavItem {
  key: string
  label: string
  to: string
  show: boolean
}

interface NavContext {
  account: Account | null
  staffRole: StaffRole
}

function orgHome(account: Extract<Account, { accountType: 'organisation' }>): string {
  const hub = hubForOrgType(account.orgType)
  if (hub === 'institutional_hub') return '/institution/me'
  if (hub === 'regulatory_console') return '/government/me'
  return '/org/me/talent'
}

/** §10.1 Mobile Bottom Navigation — 5 tabs, center is the primary "create" action. */
export function bottomTabs({ account, staffRole }: NavContext): NavItem[] {
  if (!account && !staffRole) return []
  const isOrg = account?.accountType === 'organisation'
  return [
    { key: 'home', label: 'Home', to: '/home', show: true },
    { key: 'connections', label: 'Connect', to: '/connections', show: true },
    { key: 'create', label: 'Record', to: '/record', show: !!account },
    { key: 'opportunity', label: 'Opportunity', to: '/opportunities', show: true },
    { key: 'cv_portfolio', label: isOrg ? 'Portfolio' : 'CV', to: isOrg ? '/career/portfolio/organisation-company-showcase' : '/career/cv/executive', show: true },
  ].filter((t) => t.show)
}

/**
 * V9 Enforcement Patch §3/§14: CV and Portfolio (and the rest of the
 * high-value primary surfaces) must not disappear into the hamburger menu —
 * a persistent, visible desktop nav row, not just the mobile bottom tabs
 * and the hamburger's full list. Kept short and high-value on purpose;
 * everything else still lives in the Hamburger Menu, which is for
 * secondary/system functions (§15), not where core product modules hide.
 */
export function topNavItems({ account, staffRole }: NavContext): NavItem[] {
  if (!account && !staffRole) return []
  const isOrg = account?.accountType === 'organisation'
  return [
    { key: 'home', label: 'Home', to: '/home', show: true },
    { key: 'profile', label: 'Profile', to: '/profile/me', show: !!account },
    { key: 'cv_portfolio', label: isOrg ? 'Portfolio' : 'CV & Portfolio', to: isOrg ? '/career/portfolio/organisation-company-showcase' : '/career/cv/executive', show: !!account },
    { key: 'trust', label: 'Trust Centre', to: '/trust-passport', show: true },
    { key: 'opportunities', label: 'Opportunities', to: '/opportunities', show: true },
    { key: 'communities', label: 'Communities', to: '/communities', show: !!account },
    { key: 'learning', label: 'Learning', to: '/learn', show: !!account },
  ].filter((t) => t.show)
}

/** §10.3 Profile Drawer — kept short, opened from the avatar. */
export function profileDrawerItems({ account }: NavContext): NavItem[] {
  if (!account) return []
  const isOrg = account.accountType === 'organisation'
  return [
    { key: 'my-profile', label: 'My Profile', to: '/profile/me', show: true },
    { key: 'edit-profile', label: 'Edit Profile', to: '/settings', show: true },
    { key: 'my-cv', label: 'My CV', to: '/profile/me?tab=cv-portfolio', show: isCvEligible(account) },
    { key: 'my-portfolio', label: 'My Portfolio', to: '/profile/me?tab=cv-portfolio', show: isPortfolioEligible(account) && isOrg },
  ].filter((t) => t.show)
}

interface NavGroup {
  key: string
  items: NavItem[]
}

/** §10.4 Hamburger Menu — every real destination in the build, account-aware.
 * Grouped (not one flat list) to match the Handoff's own divider placement. */
export function hamburgerGroups({ account, staffRole }: NavContext): NavGroup[] {
  const isIndividual = account?.accountType === 'individual'
  const isOrg = account?.accountType === 'organisation'
  const canAdminOrg = isOrg && orgRoleCan(account, 'appointRoles')

  const core: NavItem[] = [
    { key: 'my-profile', label: 'My Profile', to: '/profile/me', show: !!account },
    { key: 'trust-center', label: 'Trust Center', to: '/trust-passport', show: true },
    { key: 'credential-hub', label: 'Credential Hub', to: '/credentials', show: isIndividual },
    { key: 'marketplace', label: 'Marketplace', to: '/store', show: !!account },
    { key: 'ads-centre', label: 'Ads Centre', to: '/ads', show: !!account },
    { key: 'analytics', label: 'Analytics', to: '/analytics', show: isIndividual },
    { key: 'career-growth', label: 'Career Growth', to: '/career-growth', show: isIndividual },
    { key: 'applications', label: 'Applications', to: '/applications', show: isIndividual },
    { key: 'saved', label: 'Saved', to: '/saved', show: !!account },
    { key: 'learning', label: 'Learning Center', to: '/learn', show: !!account },
    { key: 'communities', label: 'Communities', to: '/communities', show: !!account },
    { key: 'collaboration', label: 'Collaboration Hub', to: '/collaboration', show: !!account },
    { key: 'verification-inbox', label: 'Verification inbox', to: '/verification-inbox', show: isOrg },
    { key: 'workspaces', label: 'Workspaces & invitations', to: '/workspaces', show: !!account },
    { key: 'recruiter-hub', label: 'Recruiter Hub', to: '/org/me/recruiter', show: isOrg && canAccessRecruiterHub(account) },
    { key: 'institution-hub', label: 'Institution Hub', to: '/institution/me', show: !!account && isOrg && canAccessInstitutionHubTools(account) },
    { key: 'org-dashboard', label: 'Organisation Dashboard', to: isOrg ? orgHome(account) : '#', show: isOrg },
    { key: 'admin-centre', label: 'Admin Centre', to: canAdminOrg ? '/settings?tab=organisation' : '/mission-control', show: canAdminOrg || !!staffRole },
    { key: 'developer-platform', label: 'Developer Platform', to: '/developer-platform', show: !!account },
    { key: 'api-centre', label: 'API Centre', to: '/api-centre', show: !!account },
    { key: 'integrations', label: 'Integrations', to: '/org/me/integrations', show: isOrg },
  ].filter((t) => t.show)

  const system: NavItem[] = [
    { key: 'settings', label: 'Settings', to: '/settings', show: !!account },
    { key: 'privacy', label: 'Privacy & Security', to: '/settings?tab=privacy', show: !!account },
    { key: 'accessibility', label: 'Accessibility Options', to: '/settings?tab=accessibility', show: !!account },
    { key: 'help', label: 'Help & Support', to: '/help', show: true },
    { key: 'about', label: 'About PROFILE', to: '/about', show: true },
    { key: 'feedback', label: 'Feedback Centre', to: '/feedback', show: true },
    { key: 'release-notes', label: 'Release Notes', to: '/release-notes', show: true },
  ].filter((t) => t.show)

  return [
    { key: 'core', items: core },
    { key: 'system', items: system },
  ]
}
