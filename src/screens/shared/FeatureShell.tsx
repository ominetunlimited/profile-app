import { motion } from 'framer-motion'
import type { RouteEntry } from '@/app/routeRegistry'

/**
 * Explicit "being finished" state per build doc §49.3 — every registered route
 * that doesn't have a real screen yet renders this instead of a 404 or a blank
 * page, so navigation never dead-ends during the phased build.
 */
export function FeatureShell({ route }: { route: RouteEntry }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <span className="rounded-full border border-border bg-surface-sunken px-3 py-1 font-mono text-xs text-text-2">
        Phase {route.phase} · {route.masterPromptRef}
      </span>
      <h1 className="text-xl font-semibold text-text-0">{route.screen}</h1>
      <p className="text-sm text-text-1">This screen is being finished. It's registered and reachable — just not built yet.</p>
    </motion.main>
  )
}
