/**
 * §8.9 Onboarding's closing visibility choice (design handoff gap audit —
 * PROFILE Onboarding.dc.html step 5: "Before you go — what should be
 * visible?"). Real, persisted choice. Honest scope limit: this build has
 * no search-indexing or recruiter-discovery surface that actually reads
 * this value yet (no public search index, no recruiter-facing discovery
 * feed) — it's captured as real intent for when those exist, not silently
 * wired to a fake enforcement.
 */
export type ProfileVisibility = 'private' | 'discoverable' | 'public'

const STORAGE_KEY = 'profile:demo-profile-visibility'

function readAll(): Record<string, ProfileVisibility> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, ProfileVisibility>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function getProfileVisibility(ownerEmail: string): ProfileVisibility {
  return readAll()[ownerEmail] ?? 'private'
}

export function setProfileVisibility(ownerEmail: string, visibility: ProfileVisibility): void {
  const all = readAll()
  all[ownerEmail] = visibility
  writeAll(all)
}
