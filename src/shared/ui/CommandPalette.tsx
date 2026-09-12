import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routeRegistry } from '@/app/routeRegistry'
import { useAccount } from '@/app/AccountContext'

/**
 * §29's Windows App reference: "keyboard-first navigation... a command
 * palette (Ctrl+K) rather than a wrapped website." A real, working
 * implementation rather than a native Windows/Electron shell this web
 * codebase can't produce (flagged separately) — searches the actual route
 * registry and only lists routes the current account can actually reach, so
 * it never offers a destination that then denies the user.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { account, staffRole, hub } = useAccount()
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
      lastFocusedRef.current?.focus()
      return
    }
    lastFocusedRef.current = document.activeElement as HTMLElement | null
  }, [open])

  // accessibility-spot-check.md gap #3: real keyboard-tested focus trapping
  // for this app's one real modal — Tab/Shift+Tab cycle within the dialog
  // instead of escaping to the page underneath, and focus returns to
  // whatever triggered the palette (handled above) when it closes.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const reachable = useMemo(() => {
    return routeRegistry.filter((route) => {
      if (route.path.includes(':')) return false // needs a real id this palette doesn't have
      switch (route.gate.kind) {
        case 'public':
          return true
        case 'authenticated':
        case 'individual':
          return !!account || !!staffRole
        case 'organisation': {
          if (account?.accountType !== 'organisation') return false
          const allowed = route.gate.hub ? (Array.isArray(route.gate.hub) ? route.gate.hub : [route.gate.hub]) : null
          return !allowed || (!!hub && allowed.includes(hub))
        }
        case 'staff':
          return staffRole === 'internal_staff' || staffRole === 'owner'
      }
    })
  }, [account, staffRole, hub])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? reachable.filter((r) => r.screen.toLowerCase().includes(q) || r.path.toLowerCase().includes(q)) : reachable.slice(0, 8)
    return list.slice(0, 8)
  }, [query, reachable])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/30 pt-[10vh]" onClick={() => setOpen(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="h-fit w-full max-w-[480px] overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) {
              navigate(results[0].path)
              setOpen(false)
            }
          }}
          placeholder="Search screens… (e.g. verify record)"
          className="w-full border-b border-border bg-transparent px-3.5 py-3 text-sm text-text-0 outline-none"
        />
        <div>
          {results.length === 0 ? (
            <p className="px-3.5 py-4 text-sm text-text-1">No matching screens.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.path}
                onClick={() => {
                  navigate(r.path)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm"
                style={i === 0 ? { background: 'var(--surface-sunken)' } : undefined}
              >
                <span className="text-text-0">{r.screen}</span>
                <span className="font-mono text-[10.5px] text-text-2">{i === 0 ? '↵' : r.path}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
