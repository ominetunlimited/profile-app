/**
 * Liveness / face-match seam. A real liveness check (is a live person in front
 * of the camera, and does their face match the ID photo?) needs a specialised
 * identity-verification vendor — Smile Identity, Veriff, Onfido and the like.
 * This project has no vendor account, so none is wired and NOTHING here ever
 * reports a pass: the default provider honestly returns `pending_vendor`, and
 * a human reviewer compares the selfie to the ID by eye.
 *
 * When a vendor is chosen, implement `LivenessProvider` (the vendor's SDK
 * session, ideally verified server-side) and register it with
 * `setLivenessProvider`; the KYC flow and review screen already read the
 * result through this interface.
 */
export type LivenessStatus = 'pending_vendor' | 'passed' | 'failed'

export interface LivenessResult {
  status: LivenessStatus
  /** Vendor reference for audit, when a real provider produced the result. */
  providerReference?: string
}

export interface LivenessProvider {
  readonly name: string
  readonly available: boolean
  verify(input: { selfie: Blob; documentFront: Blob }): Promise<LivenessResult>
}

export const NoLivenessProvider: LivenessProvider = {
  name: 'none',
  available: false,
  async verify() {
    return { status: 'pending_vendor' }
  },
}

let provider: LivenessProvider = NoLivenessProvider
export function setLivenessProvider(p: LivenessProvider) {
  provider = p
}
export function getLivenessProvider(): LivenessProvider {
  return provider
}
