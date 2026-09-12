import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { CommandPalette } from '@/shared/ui/CommandPalette'
import type { ReactElement } from 'react'
import { routeRegistry, type RouteEntry } from './routeRegistry'
import { RequireAuthenticated, RequireOrganisation, RequireOwner, RequireStaff } from './guards'
import { FeatureShell } from '@/screens/shared/FeatureShell'
import { CVTemplatesRoute } from '@/screens/career/cv/CVTemplatesRoute'
import { PortfolioTemplatesRoute } from '@/screens/career/portfolio/PortfolioTemplatesRoute'
import { RouteIntegrityEngine } from '@/screens/internal/RouteIntegrityEngine'
import { NotFoundShell } from '@/screens/shared/NotFoundShell'
import { PublicHero } from '@/screens/public/PublicHero'
import { AboutSolutions } from '@/screens/public/AboutSolutions'
import { HowItWorks } from '@/screens/public/HowItWorks'
import { BlogNews } from '@/screens/public/BlogNews'
import { TrustCentre } from '@/screens/public/TrustCentre'
import { HelpCentre } from '@/screens/public/HelpCentre'
import { FaqLibrary } from '@/screens/public/FaqLibrary'
import { LegalDocumentPage } from '@/screens/public/legal/LegalDocumentPage'
import { AuthPage } from '@/screens/auth/AuthPage'
import { OnboardingPage } from '@/screens/onboarding/OnboardingPage'
import { HomePage } from '@/screens/home/HomePage'
import { ProfilePage } from '@/screens/profile/ProfilePage'
import { SettingsPage } from '@/screens/settings/SettingsPage'
import { NotificationCentre } from '@/screens/notifications/NotificationCentre'
import { OpportunityHub } from '@/screens/opportunities/OpportunityHub'
import { MessagingCommunities } from '@/screens/messaging/MessagingCommunities'
import { CommunityDetail } from '@/screens/messaging/CommunityDetail'
import { DisputeAppeal } from '@/screens/disputes/DisputeAppeal'
import { LearningPage } from '@/screens/learning/LearningPage'
import { CoverLetterPage } from '@/screens/career/coverletter/CoverLetterPage'
import { AdvisorCreatorHub } from '@/screens/career/advisor/AdvisorCreatorHub'
import { CreatorMarketplace } from '@/screens/career/marketplace/CreatorMarketplace'
import { CreatorEarnings } from '@/screens/career/earnings/CreatorEarnings'
import { OrganizationWorkspace } from '@/screens/orgworkspace/OrganizationWorkspace'
import { InstitutionWorkspace } from '@/screens/orgworkspace/InstitutionWorkspace'
import { GovernmentWorkspace } from '@/screens/orgworkspace/GovernmentWorkspace'
import { VerificationReview } from '@/screens/orgworkspace/VerificationReview'
import { CredentialSchemaBuilder } from '@/screens/orgworkspace/CredentialSchemaBuilder'
import { InstitutionAnalytics } from '@/screens/orgworkspace/InstitutionAnalytics'
import { GovernmentAnalytics } from '@/screens/orgworkspace/GovernmentAnalytics'
import { EnterpriseIntegrations } from '@/screens/orgworkspace/EnterpriseIntegrations'
import { RecruiterWorkflow } from '@/screens/orgworkspace/RecruiterWorkflow'
import { MissionControl } from '@/screens/internal/MissionControl'
import { AIDecisionLog } from '@/screens/internal/AIDecisionLog'
import { StoreHub } from '@/screens/store/StoreHub'
import { OwnerContentConsole } from '@/screens/internal/OwnerContentConsole'
import { AdminManagement } from '@/screens/internal/AdminManagement'
import { RequireInternalAccessGate } from './internalAccessGate'
import { ConnectionsPage } from '@/screens/more/ConnectionsPage'
import { RecordActivityPage } from '@/screens/more/RecordActivityPage'
import { CredentialHub } from '@/screens/more/CredentialHub'
import { AnalyticsPage } from '@/screens/more/AnalyticsPage'
import { CareerGrowthPage } from '@/screens/more/CareerGrowthPage'
import { CollaborationHub } from '@/screens/more/CollaborationHub'
import { DeveloperPlatform } from '@/screens/more/DeveloperPlatform'
import { ApiCentre } from '@/screens/more/ApiCentre'
import { FeedbackCentre } from '@/screens/more/FeedbackCentre'
import { ReleaseNotes } from '@/screens/more/ReleaseNotes'

const LEGAL_PATHS = new Set([
  '/terms',
  '/privacy',
  '/cookies',
  '/identity-agreement',
  '/verification-consent',
  '/conduct',
  '/dpa',
  '/acceptable-use',
  '/copyright',
  '/community-guidelines',
  '/security-practices',
])

function elementFor(route: RouteEntry): ReactElement {
  // Screens with a real implementation so far.
  switch (route.path) {
    case '/':
      return <PublicHero />
    case '/about':
      return <AboutSolutions />
    case '/how-it-works':
      return <HowItWorks />
    case '/blog':
      return <BlogNews />
    case '/trust':
      return <TrustCentre />
    case '/help':
      return <HelpCentre />
    case '/help/faq':
      return <FaqLibrary />
    case '/auth':
      return <AuthPage />
    case '/onboarding':
      return (
        <RequireAuthenticated>
          <OnboardingPage />
        </RequireAuthenticated>
      )
    case '/home':
      return (
        <RequireAuthenticated>
          <HomePage />
        </RequireAuthenticated>
      )
    case '/profile':
      return <Navigate to="/profile/me" replace />
    case '/profile/:username':
      return (
        <RequireAuthenticated>
          <ProfilePage />
        </RequireAuthenticated>
      )
    case '/settings':
      return (
        <RequireAuthenticated>
          <SettingsPage />
        </RequireAuthenticated>
      )
    case '/store':
      return (
        <RequireAuthenticated>
          <StoreHub />
        </RequireAuthenticated>
      )
    case '/notifications':
      return (
        <RequireAuthenticated>
          <NotificationCentre />
        </RequireAuthenticated>
      )
    case '/opportunities':
      return (
        <RequireAuthenticated>
          <OpportunityHub />
        </RequireAuthenticated>
      )
    case '/messages':
      return (
        <RequireAuthenticated>
          <MessagingCommunities initialTab="messages" />
        </RequireAuthenticated>
      )
    case '/communities':
      return (
        <RequireAuthenticated>
          <MessagingCommunities initialTab="communities" />
        </RequireAuthenticated>
      )
    case '/communities/:id':
      return (
        <RequireAuthenticated>
          <CommunityDetail />
        </RequireAuthenticated>
      )
    case '/disputes/:recordId':
      return (
        <RequireAuthenticated>
          <DisputeAppeal />
        </RequireAuthenticated>
      )
    case '/learn':
      return (
        <RequireAuthenticated>
          <LearningPage />
        </RequireAuthenticated>
      )
    case '/connections':
      return (
        <RequireAuthenticated>
          <ConnectionsPage />
        </RequireAuthenticated>
      )
    case '/record':
      return (
        <RequireAuthenticated>
          <RecordActivityPage />
        </RequireAuthenticated>
      )
    case '/credentials':
      return (
        <RequireAuthenticated>
          <CredentialHub />
        </RequireAuthenticated>
      )
    case '/analytics':
      return (
        <RequireAuthenticated>
          <AnalyticsPage />
        </RequireAuthenticated>
      )
    case '/career-growth':
      return (
        <RequireAuthenticated>
          <CareerGrowthPage />
        </RequireAuthenticated>
      )
    case '/collaboration':
      return (
        <RequireAuthenticated>
          <CollaborationHub />
        </RequireAuthenticated>
      )
    case '/developer-platform':
      return <DeveloperPlatform />
    case '/api-centre':
      return <ApiCentre />
    case '/feedback':
      return <FeedbackCentre />
    case '/release-notes':
      return <ReleaseNotes />
    case '/internal/route-integrity':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>
            <RouteIntegrityEngine />
          </RequireInternalAccessGate>
        </RequireStaff>
      )
    case '/mission-control':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>
            <MissionControl />
          </RequireInternalAccessGate>
        </RequireStaff>
      )
    case '/internal/ai-decision-log':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>
            <AIDecisionLog />
          </RequireInternalAccessGate>
        </RequireStaff>
      )
    case '/internal/content-console':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>
            <OwnerContentConsole />
          </RequireInternalAccessGate>
        </RequireStaff>
      )
    case '/internal/admin-management':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>
            <RequireOwner>
              <AdminManagement />
            </RequireOwner>
          </RequireInternalAccessGate>
        </RequireStaff>
      )
    // Structural CV/Portfolio wall (§49.5) — routed explicitly, not via the
    // generic gate switch below, so the directory separation stays visible here.
    case '/career/cv/:template':
      return <CVTemplatesRoute />
    case '/career/portfolio/:template':
      return <PortfolioTemplatesRoute />
    case '/career/cover-letter':
      return <CoverLetterPage />
    case '/career/advisor':
      return (
        <RequireAuthenticated>
          <AdvisorCreatorHub />
        </RequireAuthenticated>
      )
    case '/career/marketplace':
      return (
        <RequireAuthenticated>
          <CreatorMarketplace />
        </RequireAuthenticated>
      )
    case '/career/earnings':
      return (
        <RequireAuthenticated>
          <CreatorEarnings />
        </RequireAuthenticated>
      )
    // /legal is the Handoff's tabbed Terms/Privacy/Cookies landing pattern —
    // each tab is now its own real route (§31), so /legal lands on the first.
    case '/legal':
      return <Navigate to="/terms" replace />

    // Phase 4 — Organisation / Institution / Government. Router-level
    // RequireOrganisation enforces the hub match declared in routeRegistry;
    // each component additionally enforces its own §10.5 "hub AND verified"
    // hard rule internally (HubAccessDenied) since that condition needs a
    // live check against account state, not just a route-declared hub.
    case '/org/:id/talent':
      return (
        <RequireOrganisation hub={['business_hub', 'community_hub']}>
          <OrganizationWorkspace />
        </RequireOrganisation>
      )
    case '/institution/:id':
      return (
        <RequireOrganisation hub="institutional_hub">
          <InstitutionWorkspace />
        </RequireOrganisation>
      )
    case '/institution/:id/schemas':
      return (
        <RequireOrganisation hub="institutional_hub">
          <CredentialSchemaBuilder />
        </RequireOrganisation>
      )
    case '/institution/:id/analytics':
      return (
        <RequireOrganisation hub="institutional_hub">
          <InstitutionAnalytics />
        </RequireOrganisation>
      )
    case '/government/:id':
      return (
        <RequireOrganisation hub="regulatory_console">
          <GovernmentWorkspace />
        </RequireOrganisation>
      )
    case '/government/:id/analytics':
      return (
        <RequireOrganisation hub="regulatory_console">
          <GovernmentAnalytics />
        </RequireOrganisation>
      )
    case '/org/:id/integrations':
      return (
        <RequireOrganisation>
          <EnterpriseIntegrations />
        </RequireOrganisation>
      )
    case '/org/:id/recruiter':
      return (
        <RequireOrganisation hub="business_hub">
          <RecruiterWorkflow />
        </RequireOrganisation>
      )
    case '/internal/verification-review':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>
            <VerificationReview />
          </RequireInternalAccessGate>
        </RequireStaff>
      )
  }

  if (LEGAL_PATHS.has(route.path)) return <LegalDocumentPage path={route.path} />

  const shell = <FeatureShell route={route} />
  switch (route.gate.kind) {
    case 'public':
      return shell
    case 'authenticated':
      return <RequireAuthenticated>{shell}</RequireAuthenticated>
    case 'individual':
      return <RequireAuthenticated>{shell}</RequireAuthenticated>
    case 'organisation':
      return <RequireOrganisation hub={route.gate.hub}>{shell}</RequireOrganisation>
    case 'staff':
      return (
        <RequireStaff>
          <RequireInternalAccessGate>{shell}</RequireInternalAccessGate>
        </RequireStaff>
      )
  }
}

/** §29 Windows App reference's Ctrl+K command palette needs `useNavigate`,
 * which requires living inside the router tree — a pathless root layout
 * route is the standard way to mount a persistent overlay alongside every
 * matched page without duplicating it per-route. */
function RootLayout() {
  return (
    <>
      <Outlet />
      <CommandPalette />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...routeRegistry.map((route) => ({
        path: route.path,
        element: elementFor(route),
      })),
      // Backstop (§49.3) — an unregistered URL still hits a shell, never a
      // browser-level 404.
      { path: '*', element: <NotFoundShell /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
