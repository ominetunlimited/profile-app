import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { listCreatorTemplates, useCreatorTemplatesVersion } from '@/app/creatorTemplateStore'

/** §19/§38.20 Creator Earnings — real zero-state stats, not the Handoff's
 * illustrative ₦42,300 sample (build doc §49.8: never fabricate a number). */
export function CreatorEarnings() {
  useCreatorTemplatesVersion()
  const { account } = useAccount()
  const templates = listCreatorTemplates(ownerKey(account))
  const published = templates.filter((t) => t.status === 'published')
  const totalEarned = templates.reduce((sum, t) => sum + t.earnings, 0)
  const totalUses = templates.reduce((sum, t) => sum + t.uses, 0)

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <Link to="/career/advisor" className="mb-3 inline-block text-sm font-semibold text-accent">
          ← Creator Hub
        </Link>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Earnings &amp; analytics</h1>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total earned" value={`₦${totalEarned.toLocaleString()}`} />
          <Stat label="This month" value="₦0" />
          <Stat label="Total template uses" value={totalUses.toString()} />
          <Stat label="Published templates" value={published.length.toString()} />
        </div>

        <div className="mb-6 rounded-xl border border-border bg-surface p-5">
          <div className="mb-3.5 font-semibold text-text-0">Per-template performance</div>
          {published.length === 0 ? (
            <p className="text-sm text-text-1">No published templates yet — publish one from the Creator Hub.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {published.map((t) => (
                <div key={t.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-text-0">{t.name}</span>
                    <span className="font-mono text-xs text-text-1">
                      {t.uses} uses · ₦{t.earnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${t.uses > 0 ? 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-text-0">Payout history</span>
            <button className="rounded-lg border border-border-strong bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-text-0" disabled={totalEarned === 0}>
              Request payout
            </button>
          </div>
          <p className="text-sm text-text-1">No payouts yet.</p>
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <div className="mb-1 font-mono text-[10px] tracking-wide text-text-2">{label.toUpperCase()}</div>
      <div className="font-mono text-xl font-semibold text-text-0">{value}</div>
    </div>
  )
}
