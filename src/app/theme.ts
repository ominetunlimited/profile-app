import { useSyncExternalStore } from 'react'

/**
 * The one colour-mode system: a stored preference (light / dark / system)
 * resolved to the `dark` class on <html>. Every control (public header, auth
 * screens, Settings) reads and writes through here, so they stay in sync and
 * the choice survives reloads and other tabs.
 */
export type ColourMode = 'light' | 'dark' | 'system'

const KEY = 'profile:colour-mode'
const listeners = new Set<() => void>()
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readStored(): ColourMode {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

let mode: ColourMode = readStored()

export function resolvedIsDark(m: ColourMode = mode): boolean {
  return m === 'dark' || (m === 'system' && !!media?.matches)
}

function apply() {
  const root = document.documentElement
  root.classList.toggle('dark', resolvedIsDark())
  root.style.colorScheme = resolvedIsDark() ? 'dark' : 'light'
}

function emit() {
  apply()
  listeners.forEach((fn) => fn())
}

export function setColourMode(next: ColourMode) {
  mode = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // preference still applies for this session
  }
  emit()
}

export function getColourMode(): ColourMode {
  return mode
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useColourMode(): ColourMode {
  return useSyncExternalStore(subscribe, () => mode, () => 'system' as ColourMode)
}

if (typeof window !== 'undefined') {
  apply()
  media?.addEventListener('change', () => {
    if (mode === 'system') emit()
  })
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      mode = readStored()
      emit()
    }
  })
}
