import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { Composer } from '@/screens/home/HomePage'

/**
 * §10.1 Mobile Bottom Navigation's primary "create_activity" action — a
 * dedicated full-page route for the same real Composer Home already uses
 * inline, reused rather than duplicated.
 */
export function RecordActivityPage() {
  const { account } = useAccount()
  const navigate = useNavigate()
  const owner = ownerKey(account)

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-text-0">Record work</h1>
        <div className="rounded-xl border border-border bg-surface p-4">
          <Composer owner={owner} onClose={() => navigate('/home')} onPosted={() => navigate('/home')} />
        </div>
      </div>
    </AppShell>
  )
}
