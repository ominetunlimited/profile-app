/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts.
 * §38.6a CommerceSettings: `storeActivated`/`sellingActivated`, both off by
 * default, both toggled only through Settings — exactly the mechanism
 * behind Store Hub's "Create Store" section gate.
 */
export interface CommerceSettings {
  storeActivated: boolean
  sellingActivated: boolean
}

const STORAGE_KEY = 'profile:demo-commerce-settings'

function readAll(): Record<string, CommerceSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, CommerceSettings>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}

const DEFAULTS: CommerceSettings = { storeActivated: false, sellingActivated: false }

export function getCommerceSettings(ownerEmail: string): CommerceSettings {
  return readAll()[ownerEmail] ?? DEFAULTS
}

export function setCommerceSettings(ownerEmail: string, settings: CommerceSettings): void {
  const all = readAll()
  all[ownerEmail] = settings
  writeAll(all)
}
