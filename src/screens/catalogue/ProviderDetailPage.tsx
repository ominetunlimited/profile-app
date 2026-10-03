import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { getProvider, listToolsForProvider } from '@/app/toolCatalogue'
import { referenceCountForTool } from '@/app/providerReferenceStore'

/**
 * §1.3 Provider Entity. A provider account (a real, separate account type
 * that could claim this page, set notification preferences, and see
 * analytics) doesn't exist anywhere in this build yet — this is the
 * honest read-only version: real tools, real usage counts, explicitly
 * never claiming verification or endorsement it can't back up.
 */
export function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const provider = id ? getProvider(id) : undefined

  if (!provider) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Provider not found</h1>
        </div>
      </AppShell>
    )
  }

  const tools = listToolsForProvider(provider.id)
  const totalReferences = tools.reduce((sum, t) => sum + referenceCountForTool(t.id), 0)

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-0">{provider.name}</h1>
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10.5px] font-medium text-text-1">Unclaimed</span>
        </div>
        <p className="mb-6 text-sm text-text-1">
          No verified provider account has claimed {provider.name} yet — this is a read-only catalogue entry, never an endorsement. {provider.website && (
            <a href={provider.website} target="_blank" rel="noreferrer" className="font-semibold text-accent">
              {provider.website}
            </a>
          )}
        </p>

        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-2xl font-semibold text-text-0">{totalReferences}</div>
          <div className="text-xs text-text-1">total real uses recorded across {tools.length} recognised {tools.length === 1 ? 'tool' : 'tools'}</div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-0">Tools</h2>
          <div className="flex flex-col gap-2">
            {tools.map((t) => (
              <Link key={t.id} to={`/tool/${t.id}`} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm hover:border-accent">
                <span className="text-text-0">{t.canonicalName}</span>
                <span className="text-xs text-text-2">{referenceCountForTool(t.id)} used</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
