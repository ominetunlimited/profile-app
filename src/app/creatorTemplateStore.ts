import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/** Templates a creator has made, stored on the server (public.creator_templates). Uses, ratings and earnings can only be written by the platform, never by the creator. */
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

interface Row {
  id: string
  creator_email: string
  name: string
  type: 'cv' | 'portfolio'
  status: 'draft' | 'published'
  price: number
  rating: number | null
  uses: number
  published_at: string | null
  earnings: number
}

const table = createServerTable<Row>('creator_templates')
export const useCreatorTemplatesVersion = table.useVersion
const toRecord = (r: Row): CreatorTemplateRecord => ({ id: r.id, creatorEmail: r.creator_email, name: r.name, type: r.type, status: r.status, price: Number(r.price), rating: r.rating === null ? null : Number(r.rating), uses: r.uses, publishedAt: r.published_at, earnings: Number(r.earnings) })

export function listCreatorTemplates(creatorEmail: string): CreatorTemplateRecord[] {
  return table.rows().filter((t) => t.creator_email.toLowerCase() === creatorEmail.toLowerCase()).map(toRecord)
}

export function createDraftTemplate(creatorEmail: string, name: string, type: 'cv' | 'portfolio'): CreatorTemplateRecord {
  const row: Row = { id: crypto.randomUUID(), creator_email: creatorEmail.toLowerCase(), name, type, status: 'draft', price: 0, rating: null, uses: 0, published_at: null, earnings: 0 }
  table.set([...table.rows(), row])
  void persist(table, () => supabase.from('creator_templates').insert({ id: row.id, creator_email: row.creator_email, name, type })).catch(() => undefined)
  return toRecord(row)
}

export function publishTemplate(id: string, price: number): void {
  table.set(table.rows().map((t) => (t.id === id ? { ...t, status: 'published' as const, price, published_at: new Date().toISOString() } : t)))
  void persist(table, () => supabase.rpc('publish_creator_template', { p_id: id, p_price: price })).catch(() => undefined)
}
