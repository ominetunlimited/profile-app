import { useState, type FormEvent, type ReactNode } from 'react'

/**
 * Patch (pre-Phase-7) B9: a *secondary* gate in front of the Owner/Internal
 * area, on top of (never instead of) the existing role check (RequireStaff /
 * RequireOwner in guards.tsx). There is no real backend yet, so this cannot
 * be a genuine security boundary — it is a session-scoped (sessionStorage,
 * cleared on tab close) demo passphrase, clearly labelled as such, matching
 * this build's "temporary client-only scaffolding" pattern everywhere else.
 * A real backend replaces this with a server-verified second factor.
 */
const SESSION_KEY = 'profile:internal-gate-unlocked'
const DEMO_PASSPHRASE = 'profile-internal'

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function unlock() {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true')
  } catch {
    // best-effort demo scaffolding only
  }
}

export function RequireInternalAccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  function submit(e: FormEvent) {
    e.preventDefault()
    if (input === DEMO_PASSPHRASE) {
      unlock()
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="mb-1 text-lg font-bold text-text-0">Owner / Internal area</h1>
        <p className="mb-4 text-sm text-text-1">
          This area requires a second passphrase in addition to your staff role. This is a demo-only,
          session-scoped gate — not a real security boundary until a backend exists.
        </p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(false)
          }}
          placeholder="Passphrase"
          className="mb-2 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-text-0"
        />
        {error && <p className="mb-2 text-sm text-danger">Incorrect passphrase.</p>}
        <button type="submit" className="w-full rounded-lg bg-accent-solid px-3 py-2 text-sm font-semibold text-white">
          Unlock
        </button>
      </form>
    </div>
  )
}
