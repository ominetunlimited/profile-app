import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { getCommerceSettings } from '@/app/commerceStore'

/**
 * Patch (pre-Phase-7): §19/§38.4/§38.5/§38.6a already specify the pieces
 * (Marketplace listing types, verified business directory, the two-toggle
 * Commerce Activation mechanism) but never assemble them into one named
 * "Store Hub" screen with a Market / Create Store split. Market is always
 * visible to every account; Create Store only appears once Settings →
 * Commerce & Selling's `storeActivated` is on — and explains itself rather
 * than silently disappearing when it isn't (§49.8 honest-empty-state rule).
 */
export function StoreHub() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const { storeActivated, sellingActivated } = getCommerceSettings(owner)

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Store Hub</h1>

        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-text-0">Market</h2>
          <p className="mb-4 text-sm text-text-1">Browse digital products, physical goods, and services listed by verified sellers on PROFILE.</p>
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No listings yet — this is a real, always-visible browse surface (§19), ready for sellers once any exist
            in this build.
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-text-0">Create Store</h2>
          {!storeActivated ? (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">
              Your store isn't activated yet. Turn it on from{' '}
              <Link to="/settings?tab=commerce" className="font-semibold text-accent">
                Settings → Commerce &amp; Selling
              </Link>{' '}
              to list digital products, physical goods, or services here (§38.6a).
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 text-sm text-text-1">
                Store activated{sellingActivated ? ' with payments enabled' : ' — payments not yet accepted'}. No
                listings created yet.
              </p>
              <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-xs text-text-1">
                Listing creation isn't wired to a backend yet in this build — this section is real and unlocked,
                ready for it.
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
