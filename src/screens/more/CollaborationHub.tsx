import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey } from '@/app/activityStore'

/**
 * §10.4 Hamburger Menu's "Collaboration Hub" — a real cross-link surface
 * over Messaging, Communities, and 'Collaboration'-type activities, rather
 * than a duplicate inbox. Honest about that scope rather than pretending to
 * be a separate messaging system.
 */
export function CollaborationHub() {
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  const collaborations = owner ? listActivities(owner).filter((a) => a.type === 'Collaboration') : []

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Collaboration Hub</h1>
        <p className="mb-6 text-sm text-text-1">Your collaboration activity, and quick links into Messages and Communities where collaboration actually happens.</p>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Recorded collaborations</h2>
          {collaborations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              No collaborations recorded yet — record one from Home with type "Collaboration".
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {collaborations.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-surface p-3 text-sm text-text-0">{c.title}</div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/messages" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Messages</div>
            <div className="text-sm text-text-1">Direct conversations with collaborators.</div>
          </Link>
          <Link to="/communities" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Communities</div>
            <div className="text-sm text-text-1">Group discussions and shared work.</div>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
