import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { TOOL_CATALOGUE } from '@/app/toolCatalogue'
import { listReferencesForTool, useProviderReferencesVersion } from '@/app/providerReferenceStore'
import { findAccountByEmail } from '@/app/demoAccountStore'

/**
 * §1.2 Tool Entity + §9 Search Integration's "Tool: Adobe Photoshop" result
 * target. Every number here is a real referenceCountForTool query — no
 * fabricated "trending" metric.
 */
export function ToolDetailPage() {
  useProviderReferencesVersion()
  const { id } = useParams<{ id: string }>()
  const tool = TOOL_CATALOGUE.find((t) => t.id === id)

  if (!tool) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Tool not found</h1>
          <p className="text-sm text-text-1">This tool isn't in PROFILE's catalogue yet.</p>
        </div>
      </AppShell>
    )
  }

  const references = listReferencesForTool(tool.id)

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-2">{tool.category}</div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">{tool.canonicalName}</h1>
        {tool.provider ? (
          <p className="mb-6 text-sm text-text-1">
            Made by{' '}
            <Link to={`/provider/${tool.provider.id}`} className="font-semibold text-accent">
              {tool.provider.name}
            </Link>
            . No verified provider account has claimed this entity yet.
          </p>
        ) : (
          <p className="mb-6 text-sm text-text-1">No recognised provider in the catalogue.</p>
        )}

        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-2xl font-semibold text-text-0">{references.length}</div>
          <div className="text-xs text-text-1">{references.length === 1 ? 'person has' : 'people have'} used this in a real recorded activity</div>
        </div>

        {references.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text-0">Recently used by</h2>
            <div className="flex flex-col gap-2">
              {references.slice(0, 10).map((r) => {
                const user = findAccountByEmail(r.userEmail)
                const username = user && 'username' in user ? user.username : undefined
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm">
                    {username ? (
                      <Link to={`/profile/${username}`} className="font-semibold text-text-0 hover:text-accent">
                        {user?.legalName}
                      </Link>
                    ) : (
                      <span className="text-text-0">{user?.legalName ?? 'Someone'}</span>
                    )}
                    <Link to={`/activity/${r.activityId}`} className="text-xs font-semibold text-accent">
                      View activity →
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
