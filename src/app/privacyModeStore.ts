/**
 * §9.7 Private Professional Mode — a general privacy capability, not a
 * special account type. Real, but scoped to what this build can actually
 * honour: when `legalNamePublicVisibility` is 'private', anyone viewing this
 * account who isn't its owner sees `preferredDisplayName` (falling back to
 * the legal name if none was set) instead of the legal name — the legal
 * name is never removed from the account, only never rendered to a non-
 * owner. Trust Score / verification weighting already never reads this
 * field either way (computeTrustScore has no name input at all), so
 * §9.7's non-discrimination rule holds by construction, not by a special case.
 */
export interface PrivacyModeSettings {
  legalNamePublicVisibility: 'public' | 'private'
}

const STORAGE_KEY = 'profile:demo-privacy-mode'
const DEFAULTS: PrivacyModeSettings = { legalNamePublicVisibility: 'public' }

function readAll(): Record<string, PrivacyModeSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, PrivacyModeSettings>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function getPrivacyMode(ownerEmail: string): PrivacyModeSettings {
  return readAll()[ownerEmail] ?? DEFAULTS
}

export function setPrivacyMode(ownerEmail: string, settings: PrivacyModeSettings): void {
  const all = readAll()
  all[ownerEmail] = settings
  writeAll(all)
}

/** The one function every display site should call instead of reading
 * `legalName` directly, so the private-mode rule can't be forgotten at a
 * new call site the way the discarded-photo/displayName bugs were. */
export function publicDisplayName(ownerEmail: string, legalName: string, preferredDisplayName: string | undefined, viewerIsOwner: boolean): string {
  if (viewerIsOwner) return legalName
  const mode = getPrivacyMode(ownerEmail)
  if (mode.legalNamePublicVisibility === 'private') return preferredDisplayName || legalName
  return legalName
}
