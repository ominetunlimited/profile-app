import type { IndividualAccount, OrganisationAccount } from '@/app/accountTypes'
import { emailIsRegistered, saveDemoAccount } from '@/app/demoAccountStore'
import { postActivity, listActivities } from '@/app/activityStore'
import { saveCvDetails, getCvDetails } from '@/app/cvDetailsStore'
import { toggleMembership, isMember } from '@/app/communitiesStore'
import { createDraftTemplate, publishTemplate, listCreatorTemplates } from '@/app/creatorTemplateStore'
import { setCommerceSettings, getCommerceSettings } from '@/app/commerceStore'
import { saveOrgPortfolioConfig } from '@/app/organisationPortfolioStore'

/**
 * Design Recovery Patch §21-26 — two real, persistent demo accounts built
 * through this app's own real storage APIs (never a separate fixture
 * format), so every feature they populate is exercised the same way a real
 * signed-up user would exercise it.
 *
 * DEMO PASSWORD for both: 'DemoPass123!' (meets passwordMeetsPolicy).
 *
 * Note on the organisation's email: the individual account uses the exact
 * contact address given ('ominet@live.com'). The organisation account
 * cannot reuse the same address — this build's storage is keyed one account
 * per email (demoAccountStore.ts), and activities/CV-details/media are
 * keyed by that same email (activityStore.ts's ownerKey) — so two accounts
 * sharing an email would silently overwrite each other's data. It also uses
 * 'hello@ominetdigital.com' for a second, independent reason: §8.4.1's own
 * rule requires an organisation's official email NOT be a personal/free
 * domain, and a consumer live.com address doesn't fit that even though it
 * isn't in this build's literal FREE_EMAIL_DOMAINS blocklist. Flagged here
 * rather than silently chosen.
 */
export const DEMO_PASSWORD = 'DemoPass123!'
export const OMINI_EMAIL = 'ominet@live.com'
export const OMINET_DIGITAL_EMAIL = 'hello@ominetdigital.com'

function seedIfMissing(ownerEmail: string, entries: Parameters<typeof postActivity>[0][]) {
  if (listActivities(ownerEmail).length > 0) return
  for (const entry of entries) postActivity(entry)
}

export function ensureOminiNfawaSeeded(): IndividualAccount {
  const account: IndividualAccount = {
    accountType: 'individual',
    pathway: 'hybrid',
    careerStage: 'entrepreneur',
    legalName: 'Omini Nfawa',
    username: 'ominet',
    headline: 'Founder of PROFILE',
    email: OMINI_EMAIL,
    country: 'Nigeria',
    city: 'Lagos',
  }

  if (!emailIsRegistered(OMINI_EMAIL)) {
    saveDemoAccount(OMINI_EMAIL, DEMO_PASSWORD, account)
  }

  seedIfMissing(OMINI_EMAIL, [
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Work Experience',
      title: 'Founded PROFILE',
      description: 'Started PROFILE to build verified professional trust infrastructure — where real work becomes evidence, and evidence becomes opportunity.',
      role: 'Founder & CEO',
      organisation: 'PROFILE',
      location: 'Lagos, Nigeria',
      skills: ['Product Strategy', 'Leadership', 'Fundraising'],
      tools: [],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Project',
      title: "Designed PROFILE's Trust Score architecture",
      description: 'Defined the weighted, transparent Trust Score formula and tier system that scores verified evidence over popularity — every increment traceable to its source.',
      role: 'Product & Systems Architect',
      organisation: 'PROFILE',
      skills: ['Systems Design', 'Trust & Safety', 'Data Modeling'],
      tools: ['TypeScript'],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Project',
      title: "Built PROFILE's CV & Portfolio Auto-Build Engine",
      description: '10 real CV templates and 10 Portfolio templates, generated from evidence a user actually recorded — never fabricated content.',
      role: 'Product Engineer',
      organisation: 'PROFILE',
      skills: ['Product Engineering', 'React', 'TypeScript'],
      tools: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Achievement',
      title: 'Shipped Organisation, Institution & Government workspaces',
      description: 'Delivered the highest-leakage-risk part of the build: three distinct, correctly-gated workspaces sharing one codebase.',
      role: 'Founder & CEO',
      organisation: 'PROFILE',
      skills: ['Platform Architecture', 'Stakeholder Management'],
      tools: ['React Router'],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Publication',
      title: 'Wrote the PROFILE Master Prompt specification',
      description: 'A 50-section product and technical specification governing every account type, gating rule, and trust mechanism in PROFILE.',
      role: 'Author',
      skills: ['Technical Writing', 'Systems Thinking'],
      tools: [],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Mentorship',
      title: 'Mentors early-career engineers building on PROFILE',
      description: 'Ongoing 1:1 mentorship for engineers joining the team.',
      role: 'Mentor',
      skills: ['Mentorship', 'Software Engineering'],
      tools: [],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINI_EMAIL,
      type: 'Collaboration',
      title: "Partnered with the design team on PROFILE's Design System",
      description: 'Worked directly with design to ship one consistent token/component system across all 43 screens.',
      role: 'Founder & CEO',
      skills: ['Design Systems', 'Collaboration'],
      tools: ['Figma'],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
  ])

  if (!getCvDetails(OMINI_EMAIL).summaryStatement) {
    saveCvDetails(OMINI_EMAIL, {
      summaryStatement:
        "Founder of PROFILE, building the global infrastructure for verified professional trust — where real work becomes evidence, and evidence becomes opportunity.",
      yearsOfExperience: 10,
      keyAchievement: 'Founded and built PROFILE end-to-end — product, architecture, and design system.',
      objectiveMode: false,
      education: [{ id: 'edu-1', degree: 'B.Sc. Computer Science', school: 'University of Lagos', graduationYear: '2014', relevantCoursework: ['Software Engineering', 'Systems Design'] }],
      certifications: [],
      languages: [{ id: 'lang-1', language: 'English', proficiency: 'native' }],
      externalReferences: [],
      referencesMode: 'available_upon_request',
      projects: [],
      volunteer: [],
      publications: [],
      awards: [],
      affiliations: [{ id: 'aff-1', organisation: 'PROFILE', role: 'Founder', since: '2024' }],
      enabledSections: {
        summary: true, skills: true, languages: true, experience: true, education: true,
        projects: true, publications: true, volunteer: true, awards: true, affiliations: true, references: true,
      },
    })
  }

  for (const communityId of ['engineering-guild', 'mentorship-circle']) {
    if (!isMember(OMINI_EMAIL, communityId)) toggleMembership(OMINI_EMAIL, communityId)
  }

  if (listCreatorTemplates(OMINI_EMAIL).length === 0) {
    const t = createDraftTemplate(OMINI_EMAIL, 'Founder Executive CV', 'cv')
    publishTemplate(t.id, 0)
  }

  return account
}

export function ensureOminetDigitalSeeded(): OrganisationAccount {
  const account: OrganisationAccount = {
    accountType: 'organisation',
    orgType: 'Company',
    legalName: 'Ominet Digital',
    username: 'ominetdigital',
    officialEmail: OMINET_DIGITAL_EMAIL,
    country: 'Nigeria',
    registryLevel: 'verified',
    orgRole: 'super_admin',
  }

  if (!emailIsRegistered(OMINET_DIGITAL_EMAIL)) {
    saveDemoAccount(OMINET_DIGITAL_EMAIL, DEMO_PASSWORD, account)
  }

  seedIfMissing(OMINET_DIGITAL_EMAIL, [
    {
      ownerEmail: OMINET_DIGITAL_EMAIL,
      type: 'Project',
      title: 'Launched PROFILE',
      description: 'Built and launched PROFILE, a global professional trust and verification platform, founded by Omini Nfawa.',
      role: 'Product',
      organisation: 'Ominet Digital',
      location: 'Lagos, Nigeria',
      skills: ['Product Development', 'Platform Engineering'],
      tools: ['React', 'TypeScript'],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINET_DIGITAL_EMAIL,
      type: 'Collaboration',
      title: 'Partnered with early institutions on verification pilots',
      description: 'Worked with early institutional partners to pilot the credential verification workflow.',
      role: 'Partnerships',
      organisation: 'Ominet Digital',
      skills: ['Partnerships', 'Verification Systems'],
      tools: [],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
    {
      ownerEmail: OMINET_DIGITAL_EMAIL,
      type: 'Achievement',
      title: 'Grew the PROFILE engineering team',
      description: 'Hired and onboarded the first engineers building PROFILE.',
      role: 'People',
      organisation: 'Ominet Digital',
      skills: ['Hiring', 'Team Building'],
      tools: [],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    },
  ])

  if (!getCommerceSettings(OMINET_DIGITAL_EMAIL).storeActivated) {
    setCommerceSettings(OMINET_DIGITAL_EMAIL, { storeActivated: true, sellingActivated: true })
  }

  // All sections enabled is organisationPortfolioStore's own default, but set
  // explicitly so this demo account's config exists as a real saved record.
  saveOrgPortfolioConfig(OMINET_DIGITAL_EMAIL, {
    enabledSections: {
      header: true,
      hero: true,
      about_us: true,
      services: true,
      projects: true,
      team: true,
      clients_and_partners: true,
      testimonials: true,
      resources: true,
      careers: true,
      contact: true,
      footer: true,
    },
  })

  return account
}

/**
 * §24 — developer-only test fixtures proving Institution Hub and Government
 * Console are properly gated (registryLevel==='verified' AND the org-type-
 * to-hub mapping, per §10.5's hard rule) — not part of the two named
 * product-demonstration accounts above.
 */
export function ensureInstitutionFixtureSeeded(): OrganisationAccount {
  const email = 'admin@lagosuniversity.test'
  const account: OrganisationAccount = {
    accountType: 'organisation',
    orgType: 'University',
    legalName: 'Lagos Test University',
    officialEmail: email,
    country: 'Nigeria',
    registryLevel: 'verified',
    orgRole: 'super_admin',
  }
  if (!emailIsRegistered(email)) saveDemoAccount(email, DEMO_PASSWORD, account)
  return account
}

export function ensureGovernmentFixtureSeeded(): OrganisationAccount {
  const email = 'admin@ministryoftest.test'
  const account: OrganisationAccount = {
    accountType: 'organisation',
    orgType: 'Government Ministry',
    legalName: 'Test Ministry of Digital Affairs',
    officialEmail: email,
    country: 'Nigeria',
    registryLevel: 'verified',
    orgRole: 'super_admin',
  }
  if (!emailIsRegistered(email)) saveDemoAccount(email, DEMO_PASSWORD, account)
  return account
}
