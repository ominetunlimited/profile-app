/**
 * §7.4 Session Management — real, but honestly scoped: this build has one
 * browser tab and no backend session store, so there is only ever one real
 * "device" to show (this one) and one real login-history log (sign-ins that
 * actually happened in this browser). Previously Settings → Security's
 * "Sessions & devices" was a hardcoded sentence ("No other active sessions")
 * that never read any real state at all — this makes it a real, growing log
 * instead, without inventing other devices that don't exist.
 */
export interface LoginEvent {
  id: string
  ownerEmail: string
  device: string
  signedInAt: string
}

const STORAGE_KEY = 'profile:demo-login-history'
const ALERTS_KEY = 'profile:suspicious-login-alerts'

function readAll(): LoginEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(events: LoginEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // best-effort demo scaffolding only
  }
}

function deviceLabel(): string {
  const ua = navigator.userAgent
  if (/Windows/.test(ua)) return 'Windows · ' + (/Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Edg/.test(ua) ? 'Edge' : 'Browser')
  if (/Mac/.test(ua)) return 'Mac · ' + (/Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Browser')
  if (/Android/.test(ua)) return 'Android · Browser'
  if (/iPhone|iPad/.test(ua)) return 'iOS · Safari'
  return 'This device'
}

export function recordLogin(ownerEmail: string): void {
  const event: LoginEvent = { id: `login-${Date.now()}`, ownerEmail, device: deviceLabel(), signedInAt: new Date().toISOString() }
  const all = readAll()
  all.push(event)
  writeAll(all.slice(-20)) // keep the log real but bounded
}

export function listLoginHistory(ownerEmail: string): LoginEvent[] {
  return readAll()
    .filter((e) => e.ownerEmail === ownerEmail)
    .sort((a, b) => b.signedInAt.localeCompare(a.signedInAt))
}

export function getSuspiciousLoginAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(ALERTS_KEY) !== 'false' // default on
  } catch {
    return true
  }
}

export function setSuspiciousLoginAlertsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ALERTS_KEY, String(enabled))
  } catch {
    // best-effort
  }
}
