import { AppShell } from '@/shared/ui/AppShell'

/**
 * Shared honest "not built yet" screen for real nav destinations that don't
 * have a feature behind them yet (Developer Platform, API Centre). Per §35's
 * Empty State Rule, this explains what's missing and isn't a dead link — the
 * route is real and renders — it's just honest that nothing is behind it,
 * rather than fabricating a fake feature to fill the space.
 */
export function ComingSoonPage({ title, description, planned }: { title: string; description: string; planned: string[] }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-text-0">{title}</h1>
        <p className="mb-6 text-sm text-text-1">{description}</p>
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-left">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">Planned</div>
          <ul className="flex flex-col gap-1.5 text-sm text-text-1">
            {planned.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
