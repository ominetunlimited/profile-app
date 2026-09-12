import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routeRegistry } from '@/app/routeRegistry'
import { useAccount } from '@/app/AccountContext'
import { listAllAccounts } from '@/app/demoAccountStore'

interface PersonResult {
  kind: 'person'
  path: string
  screen: string
  sub: string
}

/**
 * §17 Discover/Smart Search + §10.2 UniversalSearch, merged into the same
 * overlay this build already had for route search (§29's Ctrl+K palette) —
 * one search surface, not two. Opens on Ctrl+K (power users) or the
 * `open-global-search` window event (the visible search button in
 * AppShell's header, for everyone else). §17.1's hard rule is respected by
 * construction: nothing here ever reads follower/like/view counts, because
 * this build has none.
 *
 * People/organisation results come from `listAllAccounts()` — every account
 * actually registered on this browser, never fabricated profiles — and only
 * accounts with a `username` are included, since that's the only thing
 * `/profile/:username` can resolve.
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
    function onExternalOpen() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('open-global-search', onExternalOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('open-global-search', onExternalOpen)
    }
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

  const people = useMemo<PersonResult[]>(() => {
    if (!account && !staffRole) return []
    return listAllAccounts()
      .filter((a) => 'username' in a && a.username)
      .map((a) => {
        const username = (a as { username?: string }).username!
        return {
          kind: 'person' as const,
          path: `/profile/${username}`,
          screen: a.legalName,
          // §9.4 Name Collision Resolution — never a bare name+username; carry
          // headline/org-type and country alongside so two "John Smith"s are
          // distinguishable at a glance, same rule ProfilePage's header follows.
          sub:
            a.accountType === 'organisation'
              ? `@${username} · ${a.orgType} · ${a.country}`
              : `@${username}${a.headline ? ` · ${a.headline}` : ''} · ${a.country}`,
        }
      })
  }, [account, staffRole])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return reachable.slice(0, 8).map((r) => ({ kind: 'route' as const, path: r.path, screen: r.screen, sub: r.path }))
    }
    const routeMatches = reachable
      .filter((r) => r.screen.toLowerCase().includes(q) || r.path.toLowerCase().includes(q))
      .map((r) => ({ kind: 'route' as const, path: r.path, screen: r.screen, sub: r.path }))
    const peopleMatches = people.filter((p) => p.screen.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q))
    return [...peopleMatches, ...routeMatches].slice(0, 8)
  }, [query, reachable, people])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/30 pt-[10vh]" onClick={() => setOpen(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search PROFILE"
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
          placeholder="Search people, organisations, or screens…"
          className="w-full border-b border-border bg-transparent px-3.5 py-3 text-sm text-text-0 outline-none"
        />
        <div>
          {results.length === 0 ? (
            <p className="px-3.5 py-4 text-sm text-text-1">No matches.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}-${r.path}`}
                onClick={() => {
                  navigate(r.path)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm"
                style={i === 0 ? { background: 'var(--surface-sunken)' } : undefined}
              >
                <span className="text-text-0">
                  {r.kind === 'person' && <span className="mr-1.5">👤</span>}
                  {r.screen}
                </span>
                <span className="font-mono text-[10.5px] text-text-2">{i === 0 ? '↵' : r.sub}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
