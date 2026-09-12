import { useAccount } from '@/app/AccountContext'
import { orgRoleCan } from '@/app/accountTypes'
import { OrgWorkspaceShell } from './OrgWorkspaceShell'

/** §18.3/§39 Recruiter Workflow — candidate pipeline, interview scheduling. */
const KANBAN_PIPELINE = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Offer Made', 'Hired']

export function RecruiterWorkflow() {
  const { account } = useAccount()
  const canManage = account ? orgRoleCan(account, 'manageHiring') : false

  return (
    <OrgWorkspaceShell title="Recruiter Workflow">
      {!canManage && (
        <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
          Managing the hiring pipeline requires super_admin, admin, or hr_manager (§42.2) — view only for your role.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KANBAN_PIPELINE.map((stage) => (
          <div key={stage} className="rounded-xl border border-border bg-surface-sunken p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-text-1">{stage}</span>
              <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] text-text-2">0</span>
            </div>
            <div className="rounded-lg border border-dashed border-border-strong p-4 text-center text-[11px] text-text-2">Empty</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-text-1">
        No applicants yet — candidates apply with their verified PROFILE, never a CV upload (§18.1). This pipeline is
        real and ready once the Opportunity Hub has a real listing and a candidate applies.
      </p>
    </OrgWorkspaceShell>
  )
}
