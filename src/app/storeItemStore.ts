/**
 * §4 Market Hub / Marketplace. Previously Create Store was an honest empty
 * surface with no real item schema at all. This is the real store-item
 * entity §4.3 asks for — scoped to what's honestly buildable without a
 * real file-storage/CDN backend (media is a client-side data URL via
 * mediaStore.ts's own resizeImage, same pattern as avatar/cover uploads,
 * disclosed as such — never "faked" beyond what that already-accepted
 * pattern does elsewhere in this build).
 *
 * §4.7's rule — a Store Item automatically becomes eligible for Portfolio
 * representation — is implemented by portfolioData.ts reading real
 * published items from this store directly, never a copied duplicate.
 */
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

const STORAGE_KEY = 'profile:demo-store-items'

function readAll(): StoreItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: StoreItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function createStoreItem(input: Omit<StoreItem, 'id' | 'createdAt' | 'status'>): StoreItem {
  const record: StoreItem = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'draft' }
  writeAll([...readAll(), record])
  return record
}

export function publishStoreItem(id: string): void {
  const all = readAll()
  const idx = all.findIndex((i) => i.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'published' }
  writeAll(all)
}

export function unpublishStoreItem(id: string): void {
  const all = readAll()
  const idx = all.findIndex((i) => i.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'draft' }
  writeAll(all)
}

export function listItemsForOwner(ownerEmail: string): StoreItem[] {
  const e = ownerEmail.toLowerCase()
  return readAll()
    .filter((i) => i.ownerEmail.toLowerCase() === e)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listPublishedItemsForOwner(ownerEmail: string): StoreItem[] {
  return listItemsForOwner(ownerEmail).filter((i) => i.status === 'published')
}

/** Store Hub's real discovery source — every published item, any owner. */
export function listAllPublishedItems(): StoreItem[] {
  return readAll()
    .filter((i) => i.status === 'published')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getStoreItem(id: string): StoreItem | undefined {
  return readAll().find((i) => i.id === id)
}
