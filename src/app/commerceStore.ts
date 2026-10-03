import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'

/** Whether you have switched on your store and selling, saved on the server (public.commerce_settings, private to you). */
export interface CommerceSettings {
  storeActivated: boolean
  sellingActivated: boolean
}

interface Row {
  owner_email: string
  store_activated: boolean
  selling_activated: boolean
}

const table = createServerTable<Row>('commerce_settings')
export const useCommerceVersion = table.useVersion
const DEFAULTS: CommerceSettings = { storeActivated: false, sellingActivated: false }

export function getCommerceSettings(ownerEmail: string): CommerceSettings {
  const r = table.rows().find((x) => x.owner_email.toLowerCase() === ownerEmail.toLowerCase())
  return r ? { storeActivated: r.store_activated, sellingActivated: r.selling_activated } : DEFAULTS
}

export function setCommerceSettings(ownerEmail: string, settings: CommerceSettings): void {
  const row: Row = { owner_email: ownerEmail.toLowerCase(), store_activated: settings.storeActivated, selling_activated: settings.sellingActivated }
  table.set([...table.rows().filter((x) => x.owner_email.toLowerCase() !== row.owner_email), row])
  void persist(table, () => supabase.from('commerce_settings').upsert(row, { onConflict: 'owner_email' })).catch(() => undefined)
}
