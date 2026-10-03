import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/** Which sections an organisation shows on its public portfolio, stored on the server (public.org_portfolio_config) and readable by anyone who can see the organisation. */
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


interface Row {
  owner_email: string
  enabled_sections: Partial<Record<OrgPortfolioSection, boolean>>
}

const table = createServerTable<Row>('org_portfolio_config')
export const useOrgPortfolioVersion = table.useVersion

export function getOrgPortfolioConfig(ownerEmail: string): OrganisationPortfolioConfigV1 {
  const found = table.rows().find((r) => r.owner_email.toLowerCase() === ownerEmail.toLowerCase())
  if (!found) return defaultConfig()
  return { enabledSections: { ...defaultConfig().enabledSections, ...found.enabled_sections } }
}

export function saveOrgPortfolioConfig(ownerEmail: string, config: OrganisationPortfolioConfigV1): void {
  const row: Row = { owner_email: ownerEmail.toLowerCase(), enabled_sections: config.enabledSections }
  table.set([...table.rows().filter((r) => r.owner_email.toLowerCase() !== row.owner_email), row])
  void persist(table, () => supabase.from('org_portfolio_config').upsert(row, { onConflict: 'owner_email' })).catch(() => undefined)
}
