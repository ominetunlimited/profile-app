import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/** Marketplace items, stored on the server (public.store_items): you manage your own; published items are visible to people who can see your profile. */
export type StoreItemType = 'digital_product' | 'service'

export interface StoreItem {
  id: string
  ownerEmail: string
  title: string
  shortDescription: string
  fullDescription: string
  category: string
  type: StoreItemType
  priceLabel: string
  coverImageDataUrl?: string
  status: 'draft' | 'published'
  createdAt: string
}

interface Row {
  id: string
  owner_email: string
  title: string
  short_description: string
  full_description: string
  category: string
  type: StoreItemType
  price_label: string
  cover_image_data_url: string | null
  status: 'draft' | 'published'
  created_at: string
}

const table = createServerTable<Row>('store_items', { orderBy: 'created_at' })
export const useStoreItemsVersion = table.useVersion
const toItem = (r: Row): StoreItem => ({
  id: r.id,
  ownerEmail: r.owner_email,
  title: r.title,
  shortDescription: r.short_description,
  fullDescription: r.full_description,
  category: r.category,
  type: r.type,
  priceLabel: r.price_label,
  coverImageDataUrl: r.cover_image_data_url ?? undefined,
  status: r.status,
  createdAt: r.created_at,
})

export function createStoreItem(input: Omit<StoreItem, 'id' | 'createdAt' | 'status'>): StoreItem {
  const row: Row = {
    id: crypto.randomUUID(),
    owner_email: input.ownerEmail.toLowerCase(),
    title: input.title,
    short_description: input.shortDescription,
    full_description: input.fullDescription,
    category: input.category,
    type: input.type,
    price_label: input.priceLabel,
    cover_image_data_url: input.coverImageDataUrl ?? null,
    status: 'draft',
    created_at: new Date().toISOString(),
  }
  table.set([row, ...table.rows()])
  void persist(table, () => supabase.from('store_items').insert(row)).catch(() => undefined)
  return toItem(row)
}

function setStatus(id: string, status: 'draft' | 'published') {
  table.set(table.rows().map((r) => (r.id === id ? { ...r, status } : r)))
  void persist(table, () => supabase.from('store_items').update({ status }).eq('id', id)).catch(() => undefined)
}
export const publishStoreItem = (id: string) => setStatus(id, 'published')
export const unpublishStoreItem = (id: string) => setStatus(id, 'draft')

export function listItemsForOwner(ownerEmail: string): StoreItem[] {
  const e = ownerEmail.toLowerCase()
  return table.rows().filter((i) => i.owner_email.toLowerCase() === e).map(toItem).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export const listPublishedItemsForOwner = (ownerEmail: string) => listItemsForOwner(ownerEmail).filter((i) => i.status === 'published')
export function listAllPublishedItems(): StoreItem[] {
  return table.rows().filter((i) => i.status === 'published').map(toItem).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export function getStoreItem(id: string): StoreItem | undefined {
  const r = table.rows().find((i) => i.id === id)
  return r ? toItem(r) : undefined
}
