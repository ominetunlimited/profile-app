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
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

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

/** Disclosed, not hidden — the actual number driving "estimated cost". */
export const PRICE_PER_PLACEMENT_PER_DAY_USD = 2

/**
 * Campaigns are real rows in `public.ad_campaigns` (migration 0008) with the
 * same cache + Realtime pattern as every other store, so an advertiser's
 * active campaign is genuinely served to OTHER users' feeds (it used to live
 * in the advertiser's own localStorage, so nobody else could ever see it).
 * RLS: anyone signed in sees live non-expired campaigns; only the advertiser
 * sees their own drafts/ended ones.
 */
interface CampaignRow {
  id: string
  advertiser_email: string
  ad_type: AdType
  title: string
  description: string
  destination: string
  target_country: string | null
  placements: AdPlacement[]
  duration_days: number
  estimated_cost_usd: number
  status: CampaignStatus
  created_at: string
  started_at: string | null
  ends_at: string | null
}

function rowToCampaign(r: CampaignRow): AdCampaign {
  return {
    id: r.id,
    advertiserEmail: r.advertiser_email,
    adType: r.ad_type,
    title: r.title,
    description: r.description,
    destination: r.destination,
    targetCountry: r.target_country ?? undefined,
    placements: r.placements,
    durationDays: r.duration_days,
    estimatedCostUsd: Number(r.estimated_cost_usd),
    status: r.status,
    createdAt: r.created_at,
    startedAt: r.started_at ?? undefined,
    endsAt: r.ends_at ?? undefined,
  }
}

let cache: CampaignRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()

function bump() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('ad_campaigns').select('*')
  cache = (data ?? []) as CampaignRow[]
  bump()
}

function upsertRow(row: CampaignRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  cache = idx === -1 ? [...cache, row] : [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  bump()
}

if (typeof window !== 'undefined') {
  void loadCache()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void loadCache()
  })
  joinRealtime(() =>
    supabase
      .channel('ad-campaigns-cache')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_campaigns' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          cache = cache.filter((r) => r.id !== (payload.old as { id: string }).id)
          bump()
        } else {
          upsertRow(payload.new as CampaignRow)
        }
      })
      .subscribe(),
  )
}

export function onCampaignsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function useCampaignsCacheVersion(): number {
  return useSyncExternalStore(onCampaignsChange, () => cacheVersion, () => cacheVersion)
}

export function estimateCost(placements: AdPlacement[], durationDays: number): number {
  return placements.length * durationDays * PRICE_PER_PLACEMENT_PER_DAY_USD
}

export async function createCampaign(input: {
  advertiserEmail: string
  adType: AdType
  title: string
  description: string
  destination: string
  targetCountry?: string
  placements: AdPlacement[]
  durationDays: number
}): Promise<AdCampaign> {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .insert({
      advertiser_email: input.advertiserEmail,
      ad_type: input.adType,
      title: input.title,
      description: input.description,
      destination: input.destination,
      target_country: input.targetCountry ?? null,
      placements: input.placements,
      duration_days: input.durationDays,
      estimated_cost_usd: estimateCost(input.placements, input.durationDays),
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw error
  upsertRow(data as CampaignRow)
  return rowToCampaign(data as CampaignRow)
}

/** Disclosed mock-payment confirmation — no real processor exists in this
 * build (same honesty as PremiumPlansTab); activation is real state, the
 * "payment" behind it is not. */
export async function activateCampaign(id: string): Promise<void> {
  const current = cache.find((c) => c.id === id)
  if (!current) return
  const now = new Date()
  const ends = new Date(now.getTime() + current.duration_days * 86400000)
  const { data, error } = await supabase.from('ad_campaigns').update({ status: 'active', started_at: now.toISOString(), ends_at: ends.toISOString() }).eq('id', id).select().single()
  if (error) throw error
  upsertRow(data as CampaignRow)
}

export async function endCampaign(id: string): Promise<void> {
  const { data, error } = await supabase.from('ad_campaigns').update({ status: 'ended' }).eq('id', id).select().single()
  if (error) throw error
  upsertRow(data as CampaignRow)
}

export function getCampaignById(id: string): AdCampaign | undefined {
  const row = cache.find((c) => c.id === id)
  return row ? rowToCampaign(row) : undefined
}

export function listCampaignsFor(advertiserEmail: string): AdCampaign[] {
  const e = advertiserEmail.toLowerCase()
  return cache
    .filter((c) => c.advertiser_email.toLowerCase() === e)
    .map(rowToCampaign)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Real feed placement source — active, non-expired campaigns for this
 * surface only. Frequency is controlled by the CALLER (e.g. "every 4th
 * feed item"), not here, so one campaign never appears twice in a row by
 * accident. */
export function listActiveCampaignsForPlacement(placement: AdPlacement): AdCampaign[] {
  const now = Date.now()
  return cache
    .filter((c) => c.status === 'active' && c.placements.includes(placement) && (!c.ends_at || new Date(c.ends_at).getTime() > now))
    .map(rowToCampaign)
}
