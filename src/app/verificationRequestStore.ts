/**
 * Verification requests — server-side (public.verification_requests, RLS-enforced) and cross-user:
 * a person asks a named institution to confirm a record, the institution (a registered organisation
 * account) sees it in its inbox and decides, every transition is audited, and the owner is notified.
 *
 * Same cache + Realtime pattern as the other stores: reads are synchronous over a live cache of the rows
 * RLS lets this account see (its own requests, and requests addressed to it); writes are async.
 * Decisions go through role-checked server functions, never direct updates.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { findAccountByEmail, listAllOrganisations } from './demoAccountStore'

export type VerificationModuleKey =
  | 'identity'
  | 'academic'
  | 'employment'
  | 'professional_licence'
  | 'trade_competence'
  | 'certification'
  | 'custom'

export const VERIFICATION_MODULES: { key: VerificationModuleKey; name: string; identifierLabel: string }[] = [
  { key: 'identity', name: 'Identity Verification', identifierLabel: 'ID/Passport/Licence number' },
  { key: 'academic', name: 'Academic Verification', identifierLabel: 'Matriculation / Student / Degree reference number' },
  { key: 'employment', name: 'Employment Verification', identifierLabel: 'Employee ID / Staff number' },
  { key: 'professional_licence', name: 'Professional Licence Verification', identifierLabel: 'Licence / Registration number' },
  { key: 'trade_competence', name: 'Trade & Competence Verification', identifierLabel: 'Guild / apprenticeship reference' },
  { key: 'certification', name: 'Certification Verification', identifierLabel: 'Certificate / Validation code' },
  { key: 'custom', name: 'Universal Custom Verification', identifierLabel: 'Any reference number' },
]

export type VerificationStatus = 'submitted' | 'received' | 'institution_notified' | 'under_review' | 'approved' | 'verified' | 'rejected'

export const VERIFICATION_TIMELINE: VerificationStatus[] = ['submitted', 'received', 'institution_notified', 'under_review', 'approved', 'verified']

export interface VerificationRequest {
  id: string
  ownerEmail: string
  moduleKey: VerificationModuleKey
  moduleName: string
  identifierValue: string
  issuerName: string
  /** The registered organisation it was addressed to; null when the named issuer isn't on PROFILE (staff decide those). */
  issuerEmail: string | null
  documentMediaAssetId: string | null
  documentCopyrightId: string | null
  status: VerificationStatus
  decisionNote: string | null
  decidedAt: string | null
  submittedAt: string
}

export interface VerificationEvent {
  id: string
  actorEmail: string | null
  fromStatus: string | null
  toStatus: string
  note: string | null
  at: string
}

interface Row {
  id: string
  owner_email: string
  module_key: VerificationModuleKey
  module_name: string
  identifier_value: string
  issuer_name: string
  issuer_email: string | null
  document_media_asset_id: string | null
  document_copyright_id: string | null
  status: VerificationStatus
  decision_note: string | null
  decided_at: string | null
  created_at: string
}

const toRequest = (r: Row): VerificationRequest => ({
  id: r.id,
  ownerEmail: r.owner_email,
  moduleKey: r.module_key,
  moduleName: r.module_name,
  identifierValue: r.identifier_value,
  issuerName: r.issuer_name,
  issuerEmail: r.issuer_email,
  documentMediaAssetId: r.document_media_asset_id,
  documentCopyrightId: r.document_copyright_id,
  status: r.status,
  decisionNote: r.decision_note,
  decidedAt: r.decided_at,
  submittedAt: r.created_at,
})

let cache: Row[] = []
let version = 0
const listeners = new Set<() => void>()
const notify = () => {
  version++
  listeners.forEach((fn) => fn())
}

async function load() {
  const { data } = await supabase.from('verification_requests').select('*')
  cache = (data as Row[] | null) ?? []
  notify()
}

function upsert(row: Row) {
  const i = cache.findIndex((r) => r.id === row.id)
  cache = i === -1 ? [...cache, row] : [...cache.slice(0, i), row, ...cache.slice(i + 1)]
  notify()
}

if (typeof window !== 'undefined') {
  void load()
  // Re-read after a sign-in/out so the cache always matches who is signed in.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load()
  })
  joinRealtime(() =>
    supabase
      .channel('verification-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          cache = cache.filter((r) => r.id !== (payload.old as Row).id)
          notify()
        } else upsert(payload.new as Row)
      })
      .subscribe(),
  )
}

export function onVerificationsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useVerificationVersion(): number {
  return useSyncExternalStore(onVerificationsChange, () => version, () => version)
}

const byNewest = (a: VerificationRequest, b: VerificationRequest) => b.submittedAt.localeCompare(a.submittedAt)

/** Requests this account filed. */
export function listVerificationRequests(ownerEmail: string): VerificationRequest[] {
  const me = ownerEmail.toLowerCase()
  return cache.filter((r) => r.owner_email.toLowerCase() === me).map(toRequest).sort(byNewest)
}

/** Requests addressed to an organisation account (its inbox). */
export function listRequestsForIssuerEmail(issuerEmail: string): VerificationRequest[] {
  const me = issuerEmail.toLowerCase()
  return cache.filter((r) => r.issuer_email?.toLowerCase() === me).map(toRequest).sort(byNewest)
}

/** Same inbox, looked up by the organisation's legal name. */
export function listRequestsForIssuer(issuerName: string): VerificationRequest[] {
  const target = issuerName.trim().toLowerCase()
  const org = listAllOrganisations().find((o) => o.legalName.trim().toLowerCase() === target)
  return org ? listRequestsForIssuerEmail(org.officialEmail) : []
}

/** Requests whose named issuer isn't a registered organisation — decided by PROFILE staff. */
export function listUnroutedRequests(): VerificationRequest[] {
  return cache.filter((r) => r.issuer_email === null).map(toRequest).sort(byNewest)
}

/** The registered organisation a free-text issuer name refers to, if exactly one matches. */
export function resolveIssuerEmail(issuerName: string): string | null {
  const target = issuerName.trim().toLowerCase()
  if (!target) return null
  const matches = listAllOrganisations().filter((o) => o.legalName.trim().toLowerCase() === target)
  return matches.length === 1 ? matches[0].officialEmail : null
}

export async function submitVerificationRequest(input: {
  ownerEmail: string
  moduleKey: VerificationModuleKey
  moduleName: string
  identifierValue: string
  issuerName: string
  documentMediaAssetId?: string | null
  documentCopyrightId?: string | null
}): Promise<VerificationRequest> {
  const issuerEmail = resolveIssuerEmail(input.issuerName)
  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      owner_email: input.ownerEmail,
      module_key: input.moduleKey,
      module_name: input.moduleName,
      identifier_value: input.identifierValue.trim(),
      issuer_name: input.issuerName.trim(),
      issuer_email: issuerEmail && issuerEmail.toLowerCase() !== input.ownerEmail.toLowerCase() ? issuerEmail : null,
      document_media_asset_id: input.documentMediaAssetId ?? null,
      document_copyright_id: input.documentCopyrightId ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  upsert(data as Row)
  return toRequest(data as Row)
}

/** The institution (or, for unrouted requests, PROFILE staff) records a decision. */
export async function setVerificationRequestStatus(id: string, status: Exclude<VerificationStatus, 'submitted'>, note = ''): Promise<void> {
  const row = cache.find((r) => r.id === id)
  const fn = row && row.issuer_email === null ? 'staff_decide_verification_request' : 'institution_set_verification_status'
  const { error } = await supabase.rpc(fn, { rid: id, new_status: status, note })
  if (error) throw new Error(error.message)
  await load()
}

export async function fetchVerificationEvents(requestId: string): Promise<VerificationEvent[]> {
  const { data, error } = await supabase.from('verification_request_events').select('*').eq('request_id', requestId).order('at')
  if (error) throw new Error(error.message)
  return (data ?? []).map((e) => ({ id: e.id, actorEmail: e.actor_email, fromStatus: e.from_status, toStatus: e.to_status, note: e.note, at: e.at }))
}

export function personName(email: string): string {
  return findAccountByEmail(email)?.legalName ?? email
}
