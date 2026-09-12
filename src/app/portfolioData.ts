import type { Account } from './accountTypes'
import { listActivities, ownerKey } from './activityStore'

/** §15.4/§47.3 — Portfolio is the real activity archive (every recorded item
 * with includeInPortfolio, which this build's composer defaults true), never
 * fabricated project content. §15.2's 'organisation' entry gets its own
 * shape (programmes/staff/partnerships) since an org's Institutional
 * Portfolio isn't built from personal Activities the same way. */
export interface PortfolioItem {
  title: string
  body: string
  type: string
}

export interface PortfolioData {
  kind: 'individual' | 'organisation'
  name: string
  headline: string
  items: PortfolioItem[]
}

export function buildPortfolioData(account: Account | null): PortfolioData {
  if (!account) return { kind: 'individual', name: 'Your name', headline: '', items: [] }

  if (account.accountType === 'organisation') {
    return { kind: 'organisation', name: account.legalName, headline: `${account.orgType} · ${account.registryLevel}`, items: [] }
  }

  const activities = listActivities(ownerKey(account))
  const items: PortfolioItem[] = activities
    .filter((a) => a.cvPortfolioInclude)
    .map((a) => ({ title: a.title, body: a.description, type: a.type }))

  return {
    kind: 'individual',
    name: account.legalName,
    headline: account.headline ?? '',
    items,
  }
}
