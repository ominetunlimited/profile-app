/**
 * Phase 7+ recovery patch: Settings → Accessibility's four toggles
 * (`AccessibilityTab` in settingsTabs.tsx) were a pure static stub —
 * uncontrolled inputs with no `checked`/`onChange`, no persistence, no real
 * effect at all (a §35 Activation Audit "static button, no handler"
 * violation). This store + `AccessibilityEffects` (mounted once at the app
 * root in App.tsx) make all four real: persisted, and each one actually
 * changes document behaviour, not just its own toggle state.
 */
export type TextSize = 'default' | 'large' | 'larger'

export interface AccessibilityPrefs {
  reduceMotion: boolean
  highContrast: boolean
  screenReaderOptimised: boolean
  textSize: TextSize
}

const DEFAULTS: AccessibilityPrefs = {
  reduceMotion: false,
  highContrast: false,
  screenReaderOptimised: false,
  textSize: 'default',
}

const STORAGE_KEY = 'profile:accessibility-prefs'

export function getAccessibilityPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function saveAccessibilityPrefs(prefs: AccessibilityPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // best-effort — accessibility prefs simply won't persist this session
  }
}
