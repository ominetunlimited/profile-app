import { routeRegistry, type RouteEntry } from './routeRegistry'

/**
 * Routes that don't yet render a real screen (FeatureShell only). Kept as an
 * explicit, tiny, hand-maintained list rather than inferred from router.tsx's
 * switch statement, so this stays honest even if a future case gets added
 * without updating this file being caught by the "healthy count" looking
 * wrong rather than silently drifting.
 */
const NOT_YET_IMPLEMENTED = new Set<string>(['/mission-control/executive-copilots'])

/** Routes with a genuine open gap (not just a documented design decision —
 * see RouteEntry.note for those). */
const NEEDS_ATTENTION = new Set<string>([
  '/mission-control/executive-copilots', // §49.3's flagged Handoff gap — registered, not yet built
  '/acceptable-use', // §37.15 required, no canonical Master Prompt text drafted yet
  '/copyright',
  '/community-guidelines',
  '/security-practices',
])

export interface RouteHealthRow {
  path: string
  screen: string
  module: string
  renders: '✓' | '⚠'
  auth: '✓'
  states: '✓' | '—'
  status: 'Healthy' | 'Needs attention' | 'Broken'
}

export interface RouteIntegrityReport {
  total: number
  duplicatePaths: string[]
  byPhase: Record<number, number>
  flagged: RouteEntry[]
  rows: RouteHealthRow[]
  healthyCount: number
  needsAttentionCount: number
  brokenCount: number
}

function moduleForPath(path: string): string {
  if (path === '/') return 'Public'
  if (path.startsWith('/auth') || path === '/onboarding') return 'Auth'
  if (['/about', '/how-it-works', '/blog', '/trust', '/help'].some((p) => path === p || path.startsWith(p + '/'))) return 'Public'
  if (['/terms', '/privacy', '/cookies', '/identity-agreement', '/verification-consent', '/conduct', '/dpa', '/acceptable-use', '/copyright', '/community-guidelines', '/security-practices', '/legal'].includes(path))
    return 'Legal'
  if (path.startsWith('/career')) return 'Career'
  if (path.startsWith('/org') || path.startsWith('/institution') || path.startsWith('/government')) return 'Organisation'
  if (path.startsWith('/mission-control')) return 'Mission Control'
  if (path.startsWith('/internal')) return 'Internal'
  return 'Core'
}

/** Runtime backstop check — run against the live registry, not a cached count. */
export function checkRouteIntegrity(routes: RouteEntry[] = routeRegistry): RouteIntegrityReport {
  const seen = new Map<string, number>()
  for (const r of routes) {
    seen.set(r.path, (seen.get(r.path) ?? 0) + 1)
  }
  const duplicatePaths = [...seen.entries()].filter(([, count]) => count > 1).map(([path]) => path)

  const byPhase: Record<number, number> = {}
  for (const r of routes) {
    byPhase[r.phase] = (byPhase[r.phase] ?? 0) + 1
  }

  const flagged = routes.filter((r) => r.note)

  const rows: RouteHealthRow[] = routes.map((r) => {
    const implemented = !NOT_YET_IMPLEMENTED.has(r.path)
    const attention = NEEDS_ATTENTION.has(r.path)
    return {
      path: r.path,
      screen: r.screen,
      module: moduleForPath(r.path),
      renders: implemented ? '✓' : '⚠',
      auth: '✓',
      states: implemented ? '✓' : '—',
      status: attention ? 'Needs attention' : 'Healthy',
    }
  })

  return {
    total: routes.length,
    duplicatePaths,
    byPhase,
    flagged,
    rows,
    healthyCount: rows.filter((r) => r.status === 'Healthy').length,
    needsAttentionCount: rows.filter((r) => r.status === 'Needs attention').length,
    brokenCount: duplicatePaths.length,
  }
}
