/**
 * §12 Trust Center — the real submission half of the verification pipeline.
 * Previously there was no way to actually submit anything: Trust Centre
 * (public) only described the 7 modules, and Trust Passport only said "no
 * verification submission flow exists." This makes submission real; the
 * institution/staff review half (§12.2's institutionActions — Approve/
 * Reject/Request Evidence/Escalate/Revoke) has no reviewer UI wired to these
 * individual requests yet (VerificationReview.tsx today only reviews
 * organisation registration claims, a different queue) — so a real
 * submission here honestly stays at 'submitted' rather than being
 * auto-approved to look finished.
 */
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

/** §12.4 Verification Timeline, verbatim step order. */
export type VerificationStatus = 'submitted' | 'received' | 'institution_notified' | 'under_review' | 'approved' | 'verified' | 'rejected'

export const VERIFICATION_TIMELINE: VerificationStatus[] = ['submitted', 'received', 'institution_notified', 'under_review', 'approved', 'verified']

export interface VerificationRequest {
  id: string
  ownerEmail: string
  moduleKey: VerificationModuleKey
  moduleName: string
  identifierValue: string
  issuerName: string
  documentDataUrl: string | null
  status: VerificationStatus
  submittedAt: string
}

const STORAGE_KEY = 'profile:demo-verification-requests'

function readAll(): VerificationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(requests: VerificationRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listVerificationRequests(ownerEmail: string): VerificationRequest[] {
  return readAll()
    .filter((r) => r.ownerEmail === ownerEmail)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function submitVerificationRequest(input: {
  ownerEmail: string
  moduleKey: VerificationModuleKey
  moduleName: string
  identifierValue: string
  issuerName: string
  documentDataUrl: string | null
}): VerificationRequest {
  const request: VerificationRequest = { id: `vr-${Date.now()}`, ...input, status: 'submitted', submittedAt: new Date().toISOString() }
  const all = readAll()
  all.push(request)
  writeAll(all)
  return request
}
