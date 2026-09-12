import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied } from './OrgWorkspaceShell'

const QUEUES = ['pending', 'approval', 'reject', 'escalation'] as const

/** §16.5 Institutional Review Console — bulk verification queue.
 * §10.5 hard rule enforced here, not just at the route gate: hub match AND
 * registryLevel==='verified', both required, checked live against the
 * account, not assumed from having reached this component at all. */
export function InstitutionWorkspace() {
  const { account } = useAccount()
  const [queue, setQueue] = useState<(typeof QUEUES)[number]>('pending')

  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }

  return (
    <OrgWorkspaceShell title="Bulk Verification Queue">
      <div className="mb-6 flex flex-wrap gap-1.5">
        {QUEUES.map((q) => (
          <button
            key={q}
            onClick={() => setQueue(q)}
            className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold capitalize ${queue === q ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
        No submissions in the {queue} queue yet. Bulk record ingestion (§16.3 — CSV/XLSX/JSON/XML/API feeds) isn't
        wired to a backend in this build; this is the real queue UI, ready for it.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard title="Institution actions" body="Approve · Reject · Request Information · Escalate · Suspend · Revoke — every action auditable, documented, timestamped (§16.5)." />
        <InfoCard title="Bulk ingestion formats" body="CSV, XLSX, JSON, XML, TXT, signed encrypted files, secure API feeds, webhooks (§16.3)." />
      </div>
    </OrgWorkspaceShell>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 font-semibold text-text-0">{title}</div>
      <p className="text-xs leading-relaxed text-text-1">{body}</p>
    </div>
  )
}
