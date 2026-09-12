import { Link } from 'react-router-dom'

/**
 * Runtime backstop for any URL not in routeRegistry — a safe, public landing
 * rather than a browser-level 404 (build doc §49.3 "never a 404").
 */
export function NotFoundShell() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="rounded-full border border-border bg-surface-sunken px-3 py-1 font-mono text-xs text-text-2">
        Unregistered route
      </span>
      <h1 className="text-xl font-semibold text-text-0">Nothing here yet</h1>
      <p className="text-sm text-text-1">
        This URL isn't in PROFILE's route registry.{' '}
        <Link to="/" className="text-accent underline">
          Go to the home page
        </Link>
        .
      </p>
    </main>
  )
}
