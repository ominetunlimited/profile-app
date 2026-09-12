/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 *
 * Patch (pre-Phase-7) B6: OrganisationPortfolioConfigV1 — extends the
 * Organisation / Company Showcase template (portfolioTemplates.tsx) from a
 * fixed 4-block layout into a composable system with a toggleable section
 * map. The prior ad hoc sections (Programmes & initiatives, Staff
 * highlights, Community impact records, Partnerships & MoUs) are folded
 * into this named 12-section list per the patch's own canonical set —
 * `projects` covers programmes/initiatives, `team` covers staff highlights,
 * `clients_and_partners` covers partnerships/MoUs, and community-impact
 * content now lives under `about_us` rather than as its own toggle, since
 * the patch document (the newer, more specific instruction) doesn't name it
 * separately.
 *
 * Phase 7 audit finding (flagged, not silently resolved): §49.5 of the
 * Master Prompt separately defines `OrganisationPortfolioDocument` with its
 * own canonical section names — `about`, `programmesInitiatives`,
 * `staffHighlights`, `publications`, `communityImpact`, `partnerships`,
 * `activeJobListings`, `services`, `trustScore`, `verificationAuthorityStatus`
 * — which is the CONTENT schema (what data populates each section, typed
 * against real entities like ProgrammeEntry/StaffHighlightEntry). This file's
 * OrgPortfolioSection is a different, complementary concern: a visibility/
 * layout toggle map for the rendered template, closer to a page-builder
 * config than a data schema. The two naming sets don't line up 1:1 (this
 * list also has hero/team/testimonials/resources/careers/contact/footer with
 * no §49.5 equivalent, and §49.5's publications/activeJobListings/trustScore/
 * verificationAuthorityStatus have no toggle here yet). Reconciling them —
 * either by renaming this list to match §49.5 exactly or by building
 * OrganisationPortfolioDocument as the real backing content type each
 * section reads from — is real work, deliberately left for product
 * sign-off/a future pass rather than guessed at silently here.
 */
export type OrgPortfolioSection =
  | 'header'
  | 'hero'
  | 'about_us'
  | 'services'
  | 'projects'
  | 'team'
  | 'clients_and_partners'
  | 'testimonials'
  | 'resources'
  | 'careers'
  | 'contact'
  | 'footer'

export const ORG_PORTFOLIO_SECTIONS: { value: OrgPortfolioSection; label: string; structural?: boolean }[] = [
  { value: 'header', label: 'Header', structural: true },
  { value: 'hero', label: 'Hero / tagline' },
  { value: 'about_us', label: 'About us' },
  { value: 'services', label: 'Services' },
  { value: 'projects', label: 'Projects & programmes' },
  { value: 'team', label: 'Team (verified staff)' },
  { value: 'clients_and_partners', label: 'Clients & partners' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'resources', label: 'Resources' },
  { value: 'careers', label: 'Careers' },
  { value: 'contact', label: 'Contact' },
  { value: 'footer', label: 'Footer', structural: true },
]

export interface OrganisationPortfolioConfigV1 {
  enabledSections: Record<OrgPortfolioSection, boolean>
}

function defaultConfig(): OrganisationPortfolioConfigV1 {
  const enabledSections = {} as Record<OrgPortfolioSection, boolean>
  for (const s of ORG_PORTFOLIO_SECTIONS) enabledSections[s.value] = true
  return { enabledSections }
}

const STORAGE_KEY = 'profile:demo-org-portfolio-config'

function readAll(): Record<string, OrganisationPortfolioConfigV1> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, OrganisationPortfolioConfigV1>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function getOrgPortfolioConfig(ownerEmail: string): OrganisationPortfolioConfigV1 {
  const found = readAll()[ownerEmail]
  if (!found) return defaultConfig()
  // Merge over defaults so a config saved before a new section existed still enables it.
  return { enabledSections: { ...defaultConfig().enabledSections, ...found.enabledSections } }
}

export function saveOrgPortfolioConfig(ownerEmail: string, config: OrganisationPortfolioConfigV1): void {
  const all = readAll()
  all[ownerEmail] = config
  writeAll(all)
}
