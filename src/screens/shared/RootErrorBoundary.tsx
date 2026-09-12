import { Link, useRouteError } from 'react-router-dom'

/**
 * §34.1 Resilience & Failsafe Architecture — "Users must NEVER see blank
 * screens... white pages" and "Users must NOT experience the recovery
 * process." A full separate offline-recovery-renderer stack (Layer 3) isn't
 * realistic for a client-only build with no backend to fail over from, but
 * this build had ZERO error boundary anywhere — any render-time throw (like
 * the activityStore crash this build once had) fell through to React
 * Router's own default error screen: an unbranded, dead-end "Unexpected
 * Application Error!" with no way back in. This is the honest equivalent
 * Layer 4 for a client-only app: catch it, never leave a dead end, always
 * offer a real way forward.
 */
export function RootErrorBoundary() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.'

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="rounded-full border border-danger px-3 py-1 font-mono text-xs text-danger">Something went wrong</span>
      <h1 className="text-xl font-semibold text-text-0">This page hit a snag</h1>
      <p className="text-sm text-text-1">
        Nothing else on PROFILE is affected — this screen just failed to render. Reloading usually fixes it.
      </p>
      <p className="max-w-full overflow-x-auto rounded-lg bg-surface-sunken px-3 py-2 font-mono text-xs text-text-2">{message}</p>
      <div className="mt-2 flex gap-2">
        <button onClick={() => window.location.reload()} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
          Reload page
        </button>
        <Link to="/" className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text-0">
          Go home
        </Link>
      </div>
    </main>
  )
}
