import { Link } from 'react-router-dom'
import { useState, type ReactNode } from 'react'

/** §6.2/§7.1/§8 shared chrome: logo + theme toggle, matching the Handoff's Sign
 * In / Account Creation pages exactly (a plain header, no full public nav). */
export function AuthChrome({
  maxWidth = 460,
  progress,
  children,
}: {
  maxWidth?: number
  progress?: { stepNum: number; stepCount: number; stepName: string }
  children: ReactNode
}) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="w-full" style={{ maxWidth }}>
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-0">PROFILE</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              document.documentElement.classList.toggle('dark')
              setDark((d) => !d)
            }}
            className="h-8 rounded-lg border border-border-strong bg-surface px-3 text-xs font-medium text-text-0"
          >
            {dark ? 'Dark' : 'Light'}
          </button>
        </div>

        {progress && (
          <div className="mb-6 flex items-center gap-3 rounded-t-2xl border border-b-0 border-border bg-surface-sunken px-4 py-3">
            <span className="flex-1 text-xs text-text-1">
              Step {progress.stepNum} of {progress.stepCount} · {progress.stepName}
            </span>
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.round((progress.stepNum / progress.stepCount) * 100)}%` }}
              />
            </span>
          </div>
        )}

        <div
          className={`rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8 ${progress ? 'rounded-t-none border-t-0' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
