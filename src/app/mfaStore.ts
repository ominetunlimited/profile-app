import { supabase } from './supabaseClient'

/** Real authenticator-app (TOTP) two-factor, via Supabase Auth's MFA. */

export interface TotpFactor {
  id: string
  friendlyName: string | null
  createdAt: string
}

export interface TotpEnrollment {
  factorId: string
  /** SVG data URL of the QR code to scan. */
  qrCode: string
  /** The same secret in text form, for manual entry. */
  secret: string
}

/** The signed-in account's verified authenticator factors. */
export async function listTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  return (data.totp ?? []).map((f) => ({ id: f.id, friendlyName: f.friendly_name ?? null, createdAt: f.created_at }))
}

/** Starts enrolment; the factor only counts once `confirmTotpEnrollment` succeeds. */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  // Clear any half-finished enrolment first, or Supabase rejects a duplicate friendly name.
  const { data: existing } = await supabase.auth.mfa.listFactors()
  for (const f of existing?.all ?? []) {
    if (f.factor_type === 'totp' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` })
  if (error) throw new Error(error.message)
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

export async function confirmTotpEnrollment(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
  if (cErr) throw new Error(cErr.message)
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
  if (error) throw new Error('That code is not right. Check your authenticator app and try again.')
}

export async function removeTotpFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw new Error(error.message)
}

/** After a password sign-in: does this account still owe a second factor? Returns the factor to challenge, or null. */
export async function pendingTotpFactor(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return null
  if (data.nextLevel !== 'aal2' || data.currentLevel === 'aal2') return null
  const factors = await listTotpFactors()
  return factors[0]?.id ?? null
}

export async function verifyTotpChallenge(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
  if (cErr) throw new Error(cErr.message)
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
  if (error) throw new Error('That code is not right. Try the newest code in your authenticator app.')
}
