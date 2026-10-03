import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'
import { emitEvent } from './eventBus'

/**
 * Trust Passport shares, stored on the server (public.trust_passport_shares, private to the owner). Each share has a link
 * (/passport/<id>) that the recipient opens without signing in; it shows only confirmed facts, stops working when the share
 * is revoked or expires, and every opening is recorded so the owner can see who has actually looked.
 */
export type PassportAccessExpiry = '30_days' | '90_days' | 'until_revoked'

export interface PassportShare {
  id: string
  ownerEmail: string
  sharedWith: string
  accessExpiry: PassportAccessExpiry
  sharedAt: string
  expiresAt: string | null
  revoked: boolean
}

interface Row {
  id: string
  owner_email: string
  shared_with: string
  access_expiry: PassportAccessExpiry
  shared_at: string
  expires_at: string | null
  revoked: boolean
}

interface LogRow {
  id: string
  share_id: string
  opened_at: string
}

const table = createServerTable<Row>('trust_passport_shares')
const opens = createServerTable<LogRow>('passport_access_log')
export const useSharesVersion = () => table.useVersion() + opens.useVersion()
const toShare = (r: Row): PassportShare => ({ id: r.id, ownerEmail: r.owner_email, sharedWith: r.shared_with, accessExpiry: r.access_expiry, sharedAt: r.shared_at, expiresAt: r.expires_at, revoked: r.revoked })

function expiryDate(expiry: PassportAccessExpiry): string | null {
  if (expiry === 'until_revoked') return null
  return new Date(Date.now() + (expiry === '30_days' ? 30 : 90) * 86400000).toISOString()
}

export function listSharesFor(ownerEmail: string): PassportShare[] {
  const e = ownerEmail.toLowerCase()
  return table
    .rows()
    .filter((s) => s.owner_email.toLowerCase() === e && !s.revoked)
    .map(toShare)
    .sort((a, b) => b.sharedAt.localeCompare(a.sharedAt))
}

/** When the recipient last opened the link, and how many times. */
export function opensFor(shareId: string): { count: number; last: string | null } {
  const mine = opens.rows().filter((o) => o.share_id === shareId)
  return { count: mine.length, last: mine.map((o) => o.opened_at).sort().at(-1) ?? null }
}

export function shareLink(shareId: string): string {
  return `${window.location.origin}/passport/${shareId}`
}

export function shareTrustPassport(ownerEmail: string, sharedWith: string, accessExpiry: PassportAccessExpiry): PassportShare {
  const row: Row = { id: crypto.randomUUID(), owner_email: ownerEmail.toLowerCase(), shared_with: sharedWith.trim(), access_expiry: accessExpiry, shared_at: new Date().toISOString(), expires_at: expiryDate(accessExpiry), revoked: false }
  table.set([...table.rows(), row])
  void persist(table, () => supabase.from('trust_passport_shares').insert(row)).catch(() => undefined)
  return toShare(row)
}

export function revokePassportShare(id: string, ownerEmail: string): void {
  const target = table.rows().find((s) => s.id === id)
  table.set(table.rows().map((s) => (s.id === id ? { ...s, revoked: true } : s)))
  void persist(table, () => supabase.from('trust_passport_shares').update({ revoked: true }).eq('id', id))
    .then(() => emitEvent('passport_revoked', ownerEmail, { deepLink: '/trust-passport', vars: { detail: target?.shared_with ?? '' } }))
    .catch(() => undefined)
}

/** What a recipient is shown when they open a share link. Throws if the link is revoked, expired or unknown. */
export interface SharedPassport {
  name: string
  headline: string | null
  country: string | null
  shared_with: string
  shared_at: string
  expires_at: string | null
  identity_verified: boolean
  confirmed_records: { record: string; confirmed_by: string; confirmed_at: string | null }[]
  recorded_activities: number
}

export async function openSharedPassport(shareId: string): Promise<SharedPassport> {
  const { data, error } = await supabase.rpc('get_shared_passport', { p_share: shareId })
  if (error) throw new Error(error.code === 'P0002' ? 'This passport link is no longer valid.' : error.message)
  return data as SharedPassport
}

export function displayPid(ownerEmail: string): string {
  let hash = 0
  for (let i = 0; i < ownerEmail.length; i++) hash = (hash * 31 + ownerEmail.charCodeAt(i)) >>> 0
  const hex = hash.toString(16).toUpperCase().padStart(8, '0')
  return `PID-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}
