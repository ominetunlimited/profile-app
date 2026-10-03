import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { getCommerceSettings, useCommerceVersion } from '@/app/commerceStore'
import { createStoreItem, listAllPublishedItems, listItemsForOwner, publishStoreItem, unpublishStoreItem, type StoreItem, type StoreItemType, useStoreItemsVersion } from '@/app/storeItemStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { resizeImage } from '@/app/mediaStore'
import { listActiveCampaignsForPlacement, useCampaignsCacheVersion } from '@/app/adStore'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'

const CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Education', 'Consulting', 'Photography', 'Video', 'Other']

/**
 * §4.1/§4.2 Store Hub / Create Store — Market is always visible; Create
 * Store only appears once Settings → Commerce & Selling's storeActivated
 * is on, and explains itself rather than silently disappearing when it
 * isn't (§49.8 honest-empty-state rule). Real item creation
 * (storeItemStore.ts), real publish/unpublish, real Market discovery over
 * every published item on this browser.
 */
export function StoreHub() {
  useCommerceVersion()
  const { account } = useAccount()
  const owner = ownerKey(account)
  const { storeActivated, sellingActivated } = getCommerceSettings(owner)
  useStoreItemsVersion()
  const myItems = listItemsForOwner(owner)
  const [creating, setCreating] = useState(false)
  const marketItems = listAllPublishedItems()
  useCampaignsCacheVersion()
  // V9 Unified Ecosystem Patch §10 — 'market_hub' was a selectable, billed
  // ad placement in AdsCentrePage that never actually rendered anywhere.
  const sponsoredCampaigns = listActiveCampaignsForPlacement('market_hub')

  function refresh() {
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Store Hub</h1>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Market</h2>
          <p className="mb-4 text-sm text-text-1">Browse digital products and services listed by sellers on PROFILE.</p>
          {sponsoredCampaigns[0] && (
            <div className="mb-3">
              <SponsoredCard campaign={sponsoredCampaigns[0]} viewerAccount={account} viewerEmail={owner} />
            </div>
          )}
          {marketItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No listings yet. Items appear here as soon as sellers add them.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {marketItems.map((item) => (
                <StoreItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-text-0">Create Store</h2>
          {!storeActivated ? (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">
              Your store isn't activated yet. Turn it on from{' '}
              <Link to="/settings?tab=commerce" className="font-semibold text-accent">
                Settings → Commerce &amp; Selling
              </Link>{' '}
              to list digital products or services here.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-3 text-sm text-text-1">
                  Store activated{sellingActivated ? ' with payments enabled' : ' — payments not yet accepted, price is informational only'}.
                </p>
                {!creating ? (
                  <button onClick={() => setCreating(true)} className="w-full rounded-lg border border-dashed border-border-strong py-3 text-sm font-medium text-text-1">
                    + Create item
                  </button>
                ) : (
                  <CreateItemForm
                    owner={owner}
                    onClose={() => setCreating(false)}
                    onCreated={() => {
                      setCreating(false)
                      refresh()
                    }}
                  />
                )}
              </div>

              {myItems.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-text-0">Your items</h3>
                  <div className="flex flex-col gap-2">
                    {myItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                        <div>
                          <div className="text-sm font-semibold text-text-0">{item.title}</div>
                          <div className="text-xs text-text-2">
                            {item.category} · {item.priceLabel} · {item.status === 'published' ? 'Published — visible in Market and your Portfolio' : 'Draft'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (item.status === 'published') unpublishStoreItem(item.id)
                            else publishStoreItem(item.id)
                            refresh()
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${item.status === 'published' ? 'border border-border-strong text-text-1' : 'bg-accent-solid text-white'}`}
                        >
                          {item.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function StoreItemCard({ item }: { item: StoreItem }) {
  const owner = findAccountByEmail(item.ownerEmail)
  const username = owner && 'username' in owner ? owner.username : undefined
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {item.coverImageDataUrl && <img src={item.coverImageDataUrl} alt="" className="h-32 w-full object-cover" />}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-semibold text-text-0">{item.title}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-2">{item.type === 'digital_product' ? 'Digital' : 'Service'}</span>
        </div>
        <p className="mb-2 text-sm text-text-1">{item.shortDescription}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-accent">{item.priceLabel}</span>
          {username ? (
            <Link to={`/profile/${username}`} className="text-text-2 hover:text-accent">
              {owner?.legalName}
            </Link>
          ) : (
            <span className="text-text-2">{owner?.legalName}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateItemForm({ owner, onClose, onCreated }: { owner: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [type, setType] = useState<StoreItemType>('digital_product')
  const [priceLabel, setPriceLabel] = useState('')
  const [coverImageDataUrl, setCoverImageDataUrl] = useState<string | undefined>(undefined)

  async function handleCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const resized = await resizeImage(file, 800)
      setCoverImageDataUrl(resized)
    } catch {
      // best-effort demo scaffolding — cover image is optional
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand Identity Design Package" />
      </Field>
      <Field label="Short description">
        <TextInput value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One line for the Market card" />
      </Field>
      <Field label="Full description">
        <textarea
          value={fullDescription}
          onChange={(e) => setFullDescription(e.target.value)}
          rows={3}
          className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
        />
      </Field>
      <div className="flex flex-wrap gap-3">
        <Field label="Type">
          <SelectInput value={type} onChange={(e) => setType(e.target.value as StoreItemType)}>
            <option value="digital_product">Digital product</option>
            <option value="service">Service</option>
          </SelectInput>
        </Field>
        <Field label="Category">
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Price" hint="Shown to buyers for information — online payment is not switched on yet">
          <TextInput value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="e.g. $49 or Contact for quote" />
        </Field>
      </div>
      <Field label="Cover image (optional)">
        <input type="file" accept="image/*" onChange={handleCover} className="text-sm text-text-1" />
      </Field>
      <div className="flex gap-2">
        <Button
          disabled={!title.trim() || !shortDescription.trim()}
          onClick={() => {
            createStoreItem({ ownerEmail: owner, title, shortDescription, fullDescription, category, type, priceLabel: priceLabel || 'Contact for pricing', coverImageDataUrl })
            onCreated()
          }}
        >
          Create item
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
