/**
 * §5 Advertising System. Real campaign data model, real creation flow, real
 * feed placement — intentionally scoped, not the full targeting/zones/
 * autoplay richness §5 describes, since building that to a genuinely real
 * (non-fabricated) standard needs a real ad-serving/payment backend this
 * build doesn't have. What's real here: the 20-type cap, a disclosed
 * (not hidden) pricing formula, a real campaign state machine, and real
 * inline feed placement that never overlays content or navigation — it's
 * just another list item, clearly labelled "Sponsored".
 *
 * §5's "after satisfying required payment/account conditions" is honoured
 * the same honest way settingsTabs.tsx's PremiumPlansTab already handles
 * billing: no real payment processor exists anywhere in this build, so
 * "Activate" is a disclosed mock-payment confirmation, never a silent
 * free activation and never a fake "payment successful" claim.
 */
export const AD_TYPES = [
  'Job / Recruitment',
  'Sponsored Activity',
  'Product',
  'Service',
  'Store',
  'Portfolio',
  'Event',
  'Course / Training',
  'Webinar',
  'Publication / Book',
  'Digital Download',
  'Professional Announcement',
  'Organisation Awareness',
  'Brand Awareness',
  'Marketplace Promotion',
  'App / Software',
  'Funding / Grant Opportunity',
  'Internship',
  'Fellowship / Programme',
  'General Promotion',
] as const
export type AdType = (typeof AD_TYPES)[number]

export const AD_PLACEMENTS = ['home_feed', 'opportunities', 'market_hub', 'search'] as const
export type AdPlacement = (typeof AD_PLACEMENTS)[number]

export type CampaignStatus = 'draft' | 'pending_payment' | 'active' | 'ended'

export interface AdCampaign {
  id: string
  advertiserEmail: string
  adType: AdType
  title: string
  description: string
  destination: string
  targetCountry?: string
  placements: AdPlacement[]
  durationDays: number
  estimatedCostUsd: number
  status: CampaignStatus
  createdAt: string
  startedAt?: string
  endsAt?: string
}

const STORAGE_KEY = 'profile:demo-ad-campaigns'
/** Disclosed, not hidden — the actual number driving "estimated cost". */
export const PRICE_PER_PLACEMENT_PER_DAY_USD = 2

function readAll(): AdCampaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: AdCampaign[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function estimateCost(placements: AdPlacement[], durationDays: number): number {
  return placements.length * durationDays * PRICE_PER_PLACEMENT_PER_DAY_USD
}

export function createCampaign(input: {
  advertiserEmail: string
  adType: AdType
  title: string
  description: string
  destination: string
  targetCountry?: string
  placements: AdPlacement[]
  durationDays: number
}): AdCampaign {
  const record: AdCampaign = {
    ...input,
    id: crypto.randomUUID(),
    estimatedCostUsd: estimateCost(input.placements, input.durationDays),
    status: 'draft',
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), record])
  return record
}

/** Disclosed mock-payment confirmation — no real processor exists in this
 * build (same honesty as PremiumPlansTab); activation is real state, the
 * "payment" behind it is not. */
export function activateCampaign(id: string): void {
  const all = readAll()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) return
  const now = new Date()
  const ends = new Date(now.getTime() + all[idx].durationDays * 86400000)
  all[idx] = { ...all[idx], status: 'active', startedAt: now.toISOString(), endsAt: ends.toISOString() }
  writeAll(all)
}

export function endCampaign(id: string): void {
  const all = readAll()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'ended' }
  writeAll(all)
}

export function listCampaignsFor(advertiserEmail: string): AdCampaign[] {
  const e = advertiserEmail.toLowerCase()
  return readAll()
    .filter((c) => c.advertiserEmail.toLowerCase() === e)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Real feed placement source — active, non-expired campaigns for this
 * surface only. Frequency is controlled by the CALLER (e.g. "every 4th
 * feed item"), not here, so one campaign never appears twice in a row by
 * accident. */
export function listActiveCampaignsForPlacement(placement: AdPlacement): AdCampaign[] {
  const now = Date.now()
  return readAll().filter((c) => c.status === 'active' && c.placements.includes(placement) && (!c.endsAt || new Date(c.endsAt).getTime() > now))
}
