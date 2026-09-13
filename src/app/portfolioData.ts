import type { Account } from './accountTypes'
import { listActivities, ownerKey } from './activityStore'
import { listPublishedItemsForOwner } from './storeItemStore'

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

  // §4.7 — a published Store Item is automatically eligible for Portfolio
  // representation, read live from storeItemStore.ts rather than copied,
  // so editing or unpublishing the item is reflected here with no second
  // write path to keep in sync.
  const storeItems: PortfolioItem[] = listPublishedItemsForOwner(ownerKey(account)).map((i) => ({
    title: i.title,
    body: i.shortDescription,
    type: i.type === 'digital_product' ? 'Digital Product' : 'Service',
  }))

  if (account.accountType === 'organisation') {
    return { kind: 'organisation', name: account.legalName, headline: `${account.orgType} · ${account.registryLevel}`, items: storeItems }
  }

  const activities = listActivities(ownerKey(account))
  const items: PortfolioItem[] = activities
    .filter((a) => a.cvPortfolioInclude)
    .map((a) => ({ title: a.title, body: a.description, type: a.type }))

  return {
    kind: 'individual',
    name: account.legalName,
    headline: account.headline ?? '',
    items: [...items, ...storeItems],
  }
}
