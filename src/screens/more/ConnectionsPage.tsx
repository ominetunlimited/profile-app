import { AppShell } from '@/shared/ui/AppShell'

/**
 * §10.1 Mobile Bottom Navigation's "connections" tab — no social-graph
 * backend exists yet (no follow/connect request pipeline anywhere in this
 * build), so this is honestly empty rather than seeded with fake contacts.
 * Real once a connections store exists; Search (header) is the real way to
 * find people/organisations today.
 */
export function ConnectionsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-text-0">Connections</h1>
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-sm text-text-1">
          You have no connections yet — this build has no connection-request pipeline yet, so nothing is fabricated
          here. Use Search in the header to find people and organisations on PROFILE.
        </div>
      </div>
    </AppShell>
  )
}
