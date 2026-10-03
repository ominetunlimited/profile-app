/**
 * KYC submissions (migration 0013). A user files one submission of document
 * images (private bucket, 'credential' target) plus on-device-OCR fields they
 * confirmed; platform staff review it in the Admin Centre. Liveness is
 * `pending_vendor` (see kycLiveness.ts) — never faked. RLS: a user sees only
 * their own submissions, staff see all, and decisions can only be made by the
 * staff_review_kyc() function.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { uploadMediaAsset } from './mediaAssetStore'
import type { ExtractedFields } from './ocr'
import { getLivenessProvider } from './kycLiveness'

export type KycDocumentType = 'national_id' | 'passport' | 'drivers_licence' | 'residence_permit' | 'other'
export type KycStatus = 'submitted' | 'in_review' | 'approved' | 'rejected'

export const KYC_DOCUMENT_LABEL: Record<KycDocumentType, string> = {
  national_id: 'National ID card',
  passport: 'Passport',
  drivers_licence: "Driver's licence",
  residence_permit: 'Residence permit',
  other: 'Other government ID',
}
/** Documents with printed details on both sides. */
export const KYC_NEEDS_BACK: KycDocumentType[] = ['national_id', 'drivers_licence', 'residence_permit']

export interface KycSubmission {
  id: string
  userEmail: string
  documentType: KycDocumentType
  extracted: Partial<ExtractedFields> & { confirmed?: boolean }
  frontAsset: string | null
  backAsset: string | null
  selfieAsset: string | null
  livenessStatus: 'pending_vendor' | 'passed' | 'failed'
  status: KycStatus
  reviewerNote: string | null
  reviewedAt: string | null
  createdAt: string
}

interface Row {
  id: string
  user_email: string
  document_type: KycDocumentType
  extracted: KycSubmission['extracted']
  front_asset: string | null
  back_asset: string | null
  selfie_asset: string | null
  liveness_status: KycSubmission['livenessStatus']
  status: KycStatus
  reviewer_note: string | null
  reviewed_at: string | null
  created_at: string
}

const toSubmission = (r: Row): KycSubmission => ({
  id: r.id,
  userEmail: r.user_email,
  documentType: r.document_type,
  extracted: r.extracted ?? {},
  frontAsset: r.front_asset,
  backAsset: r.back_asset,
  selfieAsset: r.selfie_asset,
  livenessStatus: r.liveness_status,
  status: r.status,
  reviewerNote: r.reviewer_note,
  reviewedAt: r.reviewed_at,
  createdAt: r.created_at,
})

let rows: Row[] = []
let version = 0
const listeners = new Set<() => void>()
function bump() {
  version++
  listeners.forEach((fn) => fn())
}
export function useKycVersion(): number {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => version, () => version)
}

async function load() {
  const { data } = await supabase.from('kyc_submissions').select('*').order('created_at', { ascending: false })
  rows = (data ?? []) as Row[]
  bump()
}

if (typeof window !== 'undefined') {
  void load()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load()
  })
  joinRealtime(() =>
    supabase
      .channel('kyc-cache')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kyc_submissions' }, () => void load())
      .subscribe(),
  )
}

export function listKyc(): KycSubmission[] {
  return rows.map(toSubmission)
}
export function listMyKyc(email: string): KycSubmission[] {
  return listKyc().filter((k) => k.userEmail.toLowerCase() === email.toLowerCase())
}
export function latestKyc(email: string): KycSubmission | undefined {
  return listMyKyc(email)[0]
}
/** True only when a human reviewer approved this person's identity. */
export function hasApprovedKyc(email: string): boolean {
  return listMyKyc(email).some((k) => k.status === 'approved')
}

export interface KycCaptureSet {
  documentType: KycDocumentType
  front: File
  back: File | null
  selfie: File
  extracted: Partial<ExtractedFields>
}

/** Uploads the three images to the private bucket, then files the submission. */
export async function submitKyc(email: string, input: KycCaptureSet, onStep?: (label: string) => void): Promise<KycSubmission> {
  const id = crypto.randomUUID()
  onStep?.('Uploading ID front…')
  const front = await uploadMediaAsset({ file: input.front, ownerEmail: email, targetType: 'credential', targetId: id })
  let back = null
  if (input.back) {
    onStep?.('Uploading ID back…')
    back = await uploadMediaAsset({ file: input.back, ownerEmail: email, targetType: 'credential', targetId: id })
  }
  onStep?.('Uploading selfie…')
  const selfie = await uploadMediaAsset({ file: input.selfie, ownerEmail: email, targetType: 'credential', targetId: id })
  // Honest by construction: with no vendor configured this is always 'pending_vendor'.
  await getLivenessProvider().verify({ selfie: input.selfie, documentFront: input.front }) // no vendor => 'pending_vendor'; result recorded server-side only
  onStep?.('Submitting for review…')
  const { data, error } = await supabase
    .from('kyc_submissions')
    .insert({
      id,
      user_email: email,
      document_type: input.documentType,
      extracted: { ...input.extracted, confirmed: true },
      front_asset: front.id,
      back_asset: back?.id ?? null,
      selfie_asset: selfie.id,
      // Only the server/vendor can ever move this off 'pending_vendor' (RLS forces it on insert).
      liveness_status: 'pending_vendor',
    })
    .select()
    .single()
  if (error) throw new Error(error.message.includes('kyc_one_open_per_user') ? 'You already have an identity check awaiting review.' : error.message)
  rows = [data as Row, ...rows]
  bump()
  return toSubmission(data as Row)
}

export async function reviewKyc(id: string, decision: 'in_review' | 'approved' | 'rejected', note = ''): Promise<void> {
  const { error } = await supabase.rpc('staff_review_kyc', { kid: id, decision, note })
  if (error) throw new Error(error.message)
  await load()
}
