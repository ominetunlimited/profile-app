import { useEffect, useState } from 'react'
import { getAccessibilityPrefs, type AccessibilityPrefs } from '@/app/accessibilityStore'

const TEXT_SIZE_CLASS: Record<AccessibilityPrefs['textSize'], string | null> = {
  default: null,
  large: 'a11y-text-large',
  larger: 'a11y-text-larger',
}

/** Mounted once at the app root — applies Settings → Accessibility's saved
 * prefs to `document.documentElement` on load and whenever they change
 * (via the `accessibility-prefs-changed` event `AccessibilityTab` fires). */
export function AccessibilityEffects() {
  const [prefs, setPrefs] = useState(getAccessibilityPrefs)

  useEffect(() => {
    function onChange() {
      setPrefs(getAccessibilityPrefs())
    }
    window.addEventListener('accessibility-prefs-changed', onChange)
    return () => window.removeEventListener('accessibility-prefs-changed', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion)
    root.classList.toggle('a11y-high-contrast', prefs.highContrast)
    root.classList.toggle('a11y-sr-optimized', prefs.screenReaderOptimised)
    for (const cls of Object.values(TEXT_SIZE_CLASS)) if (cls) root.classList.remove(cls)
    const cls = TEXT_SIZE_CLASS[prefs.textSize]
    if (cls) root.classList.add(cls)
  }, [prefs])

  return null
}
