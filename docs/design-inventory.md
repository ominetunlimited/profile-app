# Design → code implementation inventory

Source of truth for visuals: `design_handoff_profile/*.dc.html`. Flow, routes and data come from the Master Prompt and `data-model.md`.
"Fidelity" is the result of an element-by-element comparison against the `.dc.html` markup; **Unaudited** means the screen exists and is wired but has not yet been compared.

| # | Design asset | Route | Component | Data | Fidelity |
|---|---|---|---|---|---|
| 1 | Public Hero | `/` | `public/PublicHero` | static + theme/language | Unaudited |
| 2 | About & Solutions | `/about` | `public/AboutSolutions` | static | Unaudited |
| 3 | Blog & News | `/blog` | `public/BlogNews` | static | Unaudited |
| 4 | Trust Centre | `/trust` | `public/TrustCentre` | static | Unaudited |
| 5 | Help Centre | `/help` | `public/HelpCentre` | static | Unaudited |
| 6 | Legal | `/legal`, `/terms`, `/privacy`, `/cookies` + 7 more | `public/legal/LegalDocumentPage` | static | Unaudited |
| 7 | Sign In | `/auth` | `auth/AuthPage` | Supabase Auth | Unaudited |
| 8 | Account Creation | `/auth?mode=signup` | `auth/AccountCreationWizard` | Supabase Auth + accounts | Unaudited |
| 9 | Onboarding | `/onboarding` | `onboarding/OnboardingPage` | accounts, activities | Unaudited |
| 10 | Home | `/home` | `home/HomePage` inside `shared/ui/AppShell` | accounts, activities, trust score, recommendations, jobs | Shell (top bar, 188px rail, mobile tabs) and Home rebuilt to the design with real data; activity cards inside the feed are still the existing ones (unaudited). Known honest deviations: no per-record verified status, Career readiness and verifier profile views show — (no engine / no tracking yet), "Later" dismisses without a 7-day re-surface |
| 11 | Profile & Trust / Public Profile Page | `/profile`, `/profile/:username` | `profile/ProfilePage`, `trust/TrustPassport` | accounts, activities, KYC | Unaudited |
| 12 | Settings & Privacy | `/settings` | `settings/SettingsPage` + `settingsTabs` | accounts, preferences | Unaudited |
| 13 | Notification Centre | `/notifications` | `notifications/NotificationCentre` | notifications | Unaudited |
| 14 | Opportunity Hub | `/opportunities` | `opportunities/OpportunityHub` | jobs, applications | Unaudited |
| 15 | Messaging & Communities | `/messages`, `/communities` | `messaging/MessagingCommunities` | messages, communities | Unaudited |
| 16 | Community Detail | `/communities/:id` | `communities/CommunityDetail` | communities | Unaudited |
| 17 | Dispute & Appeal | `/disputes/:recordId` | `disputes/DisputeAppeal` | disputes | Unaudited |
| 18 | Learning | `/learn` | `learning/LearningPage` | learning store | Unaudited |
| 19 | CV Templates | `/career/cv/:template` | `career/cv/CVTemplatesRoute` | CV data | Unaudited |
| 20 | Portfolio Templates | `/career/portfolio/:template` | `career/portfolio/PortfolioTemplatesRoute` | portfolio data | Unaudited |
| 21 | Cover Letter | `/career/cover-letter` | `career/coverletter/CoverLetterPage` | CV data | Unaudited |
| 22 | Advisor & Creator Hub | `/career/advisor` | `career/advisor/AdvisorCreatorHub` | static + stores | Unaudited |
| 23 | Creator Earnings | `/career/earnings` | `career/earnings/CreatorEarnings` | commerce store | Unaudited |
| 24 | Creator Marketplace | `/career/marketplace` | `career/marketplace/CreatorMarketplace` | commerce store | Unaudited |
| 25 | Organization Workspace | `/org/:id/talent` | `orgworkspace/OrganizationWorkspace` | jobs, applications | Unaudited |
| 26 | Institution Workspace | `/institution/:id` | `orgworkspace/InstitutionWorkspace` | verification requests | Unaudited |
| 27 | Government Workspace | `/government/:id` | `orgworkspace/GovernmentWorkspace` | schemas | Unaudited |
| 28 | Verification Review | `/internal/verification-review` | `orgworkspace/VerificationReview` | accounts | Unaudited |
| 29 | Credential Schema Builder | `/institution/:id/schemas` | `orgworkspace/CredentialSchemaBuilder` | schema store | Unaudited |
| 30 | Institution Analytics | `/institution/:id/analytics` | `orgworkspace/InstitutionAnalytics` | derived | Unaudited |
| 31 | Government Analytics | `/government/:id/analytics` | `orgworkspace/GovernmentAnalytics` | derived | Unaudited |
| 32 | Enterprise Integrations | `/org/:id/integrations` | `orgworkspace/EnterpriseIntegrations` | static | Unaudited |
| 33 | Recruiter Workflow | `/org/:id/recruiter` | `orgworkspace/RecruiterWorkflow` | applications | Unaudited |
| 34 | Mission Control | `/mission-control` | `internal/MissionControl` | derived | Unaudited |
| 35 | AI Decision Log | `/internal/ai-decision-log` | `internal/AIDecisionLog` | log store | Unaudited |
| 36 | Route Integrity Engine | `/internal/route-integrity` | `internal/RouteIntegrityEngine` | route registry | Unaudited |
| 37 | Design System | — (reference, not a product route) | tokens in `shared/tokens` | — | Tokens match README |
| 38 | Logo System | — (reference) | `shared/brand` | — | Assets in place |
| 39 | Mobile App | — (reference; responsive web covers it) | `AppShell` bottom tabs | — | Unaudited |
| 40 | Windows App | — (reference) | — | — | Not a web route |
| 41 | i18n & RTL Example | — (reference) | `app/i18n`, `LanguagePicker` | — | Unaudited |
| 42 | Home (Figma Reference) | — | do not build | — | Intentionally not built |

Extra product routes with no design asset (store, connections, saved, applications, ads, credentials, analytics, admin centre, …) are listed in `src/app/routeRegistry.ts`.
