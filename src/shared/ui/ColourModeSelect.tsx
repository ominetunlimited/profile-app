import { setColourMode, useColourMode, type ColourMode } from '@/app/theme'

/** Compact Light / Dark / System switch for headers; Settings uses the same store. */
export function ColourModeSelect({ className = '' }: { className?: string }) {
  const mode = useColourMode()
  return (
    <select
      aria-label="Colour mode"
      value={mode}
      onChange={(e) => setColourMode(e.target.value as ColourMode)}
      className={`rounded-lg border border-border-strong bg-surface px-2 text-xs font-medium text-text-0 ${className}`}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  )
}
