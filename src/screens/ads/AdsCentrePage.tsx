import { useEffect, useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import {
  activateCampaign,
  AD_PLACEMENTS,
  AD_TYPES,
  createCampaign,
  endCampaign,
  estimateCost,
  listCampaignsFor,
  PRICE_PER_PLACEMENT_PER_DAY_USD,
  type AdCampaign,
  type AdPlacement,
  type AdType,
} from '@/app/adStore'
import { convertFromUsd, currencyForCountry, formatMoney, getFxRates } from '@/app/currencyStore'

/**
 * V9 Unified Ecosystem Patch §15 — this build's one genuinely structured
 * USD amount (`estimatedCostUsd`) is exactly the patch's own worked
 * example: "a $20 USD charge... must settle at that day's real conversion
 * rate, clearly shown before checkout." Real live fetch (currencyStore.ts),
 * never a hardcoded rate; shows nothing extra when the viewer's own
 * currency already is USD, and honestly says "unavailable" rather than
 * guessing if the fetch and the cache both come up empty.
 */
function ConvertedCost({ amountUsd, country }: { amountUsd: number; country: string }) {
  const currency = currencyForCountry(country)
  const [state, setState] = useState<{ loading: boolean; converted: number | null; stale: boolean }>({ loading: true, converted: null, stale: false })

  useEffect(() => {
    if (currency === 'USD') return
    let cancelled = false
    getFxRates().then((fx) => {
      if (cancelled) return
      setState({ loading: false, converted: convertFromUsd(amountUsd, currency, fx.rates), stale: fx.stale })
    })
    return () => {
      cancelled = true
    }
  }, [amountUsd, currency])

  if (currency === 'USD') return null
  if (state.loading) return <span className="text-text-2"> (converting…)</span>
  if (state.converted === null) return <span className="text-text-2"> (≈ {currency} unavailable right now)</span>
  return (
    <span className="text-text-2">
      {' '}
      (≈ {formatMoney(state.converted, currency)}
      {state.stale ? ', last known rate' : ' at today’s rate'})
    </span>
  )
}

const PLACEMENT_LABEL: Record<AdPlacement, string> = {
  home_feed: 'Home feed',
  opportunities: 'Opportunity Hub',
  market_hub: 'Market Hub',
  search: 'Search results',
}

/**
 * §5 Advertising System's Ads Centre — real campaign creation, a disclosed
 * (not hidden) pricing formula shown before "payment", and real state
 * (draft → pending_payment → active → ended). §5.1's 20-type cap is
 * literal — this select offers exactly those 20 and no more.
 */
export function AdsCentrePage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => listCampaignsFor(owner))
  const [creating, setCreating] = useState(false)

  function refresh() {
    setCampaigns(listCampaignsFor(owner))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Ads Centre</h1>
        <p className="mb-6 text-sm text-text-1">
          Sponsored content is always clearly labelled and never covers an activity, comment, or navigation (§7.1's
          hard rule) — it's inserted inline in the feed, at a controlled interval.
        </p>

        {!creating ? (
          <button onClick={() => setCreating(true)} className="mb-6 w-full rounded-lg border border-dashed border-border-strong py-3 text-sm font-medium text-text-1">
            + Create advert
          </button>
        ) : (
          <div className="mb-6 rounded-xl border border-border bg-surface p-4">
            <CreateCampaignForm
              advertiserEmail={owner}
              advertiserCountry={account?.country ?? 'United States'}
              onClose={() => setCreating(false)}
              onCreated={() => {
                setCreating(false)
                refresh()
              }}
            />
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">No campaigns yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-text-0">{c.title}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold capitalize ${
                      c.status === 'active' ? 'border-success text-success' : c.status === 'ended' ? 'border-border-strong text-text-2' : 'border-warning text-warning'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="mb-2 text-xs text-text-2">
                  {c.adType} · {c.placements.map((p) => PLACEMENT_LABEL[p]).join(', ')} · {c.durationDays} days · ${c.estimatedCostUsd} estimated
                  {account && <ConvertedCost amountUsd={c.estimatedCostUsd} country={account.country} />}
                </p>
                {c.status === 'draft' && (
                  <button
                    onClick={() => {
                      activateCampaign(c.id)
                      refresh()
                    }}
                    className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Confirm payment (${c.estimatedCostUsd}) &amp; activate
                  </button>
                )}
                {c.status === 'active' && (
                  <button onClick={() => { endCampaign(c.id); refresh() }} className="text-xs font-semibold text-danger">
                    End campaign
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-text-2">
          No real payment processor exists in this build — "Confirm payment" is a disclosed mock, the same honesty
          pattern as Settings → Premium Plans.
        </p>
      </div>
    </AppShell>
  )
}

function CreateCampaignForm({ advertiserEmail, advertiserCountry, onClose, onCreated }: { advertiserEmail: string; advertiserCountry: string; onClose: () => void; onCreated: () => void }) {
  const [adType, setAdType] = useState<AdType>(AD_TYPES[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [placements, setPlacements] = useState<AdPlacement[]>(['home_feed'])
  const [durationDays, setDurationDays] = useState(7)

  function togglePlacement(p: AdPlacement) {
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const cost = estimateCost(placements, durationDays)

  return (
    <div className="flex flex-col gap-3">
      <Field label="Advert type">
        <SelectInput value={adType} onChange={(e) => setAdType(e.target.value as AdType)}>
          {AD_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Campaign title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Now hiring: Senior Engineer" />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
        />
      </Field>
      <Field label="Destination" hint="A PROFILE route (e.g. /job/…) or an external URL">
        <TextInput value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="/job/..." />
      </Field>
      <Field label="Placement">
        <div className="flex flex-wrap gap-1.5">
          {AD_PLACEMENTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlacement(p)}
              className={`rounded-full border px-3 py-1 text-xs ${placements.includes(p) ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
            >
              {PLACEMENT_LABEL[p]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Duration (days)">
        <SelectInput value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}>
          {[7, 14, 28, 90].map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </SelectInput>
      </Field>
      <div className="rounded-lg bg-surface-sunken p-3 text-xs text-text-1">
        Estimated cost: <span className="font-mono font-semibold text-text-0">${cost}</span>
        <ConvertedCost amountUsd={cost} country={advertiserCountry} /> ({placements.length} placement{placements.length === 1 ? '' : 's'} × {durationDays} days × $
        {PRICE_PER_PLACEMENT_PER_DAY_USD}/day)
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!title.trim() || !description.trim() || placements.length === 0}
          onClick={() => {
            createCampaign({ advertiserEmail, adType, title, description, destination: destination || '/opportunities', placements, durationDays })
            onCreated()
          }}
        >
          Create campaign
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
