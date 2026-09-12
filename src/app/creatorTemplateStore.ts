/** Temporary client-only scaffolding, same caveats as demoAccountStore.ts. */

/** data-model.md "Creator Template" entity, verbatim shape. */
export interface CreatorTemplateRecord {
  id: string
  creatorEmail: string
  name: string
  type: 'cv' | 'portfolio'
  status: 'draft' | 'published'
  price: number
  rating: number | null
  uses: number
  publishedAt: string | null
  earnings: number
}

const STORAGE_KEY = 'profile:demo-creator-templates'

function readAll(): CreatorTemplateRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(records: CreatorTemplateRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listCreatorTemplates(creatorEmail: string): CreatorTemplateRecord[] {
  return readAll().filter((t) => t.creatorEmail === creatorEmail)
}

export function createDraftTemplate(creatorEmail: string, name: string, type: 'cv' | 'portfolio'): CreatorTemplateRecord {
  const record: CreatorTemplateRecord = {
    id: crypto.randomUUID(),
    creatorEmail,
    name,
    type,
    status: 'draft',
    price: 0,
    rating: null,
    uses: 0,
    publishedAt: null,
    earnings: 0,
  }
  writeAll([...readAll(), record])
  return record
}

export function publishTemplate(id: string, price: number): void {
  const all = readAll()
  const idx = all.findIndex((t) => t.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'published', price, publishedAt: new Date().toISOString() }
  writeAll(all)
}
