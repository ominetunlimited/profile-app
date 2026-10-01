import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { listApplicationsFor, onApplicationsChange, withdrawApplication, type ApplicationStatus } from '@/app/applicationStore'
import { getJobById, orgDisplayName, useJobsCacheVersion } from '@/app/jobStore'
import { useEffect, useState } from 'react'

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  submitted: 'text-text-1',
  received: 'text-text-1',
  under_review: 'text-warning',
  shortlisted: 'text-accent',
  interview: 'text-accent',
  offer: 'text-success',
  rejected: 'text-danger',
  withdrawn: 'text-text-2',
}

/** §6.4 Application tracking — the real area an applicant returns to,
 * rather than being expected to remember which jobs they applied to. */
export function ApplicationsPage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  useJobsCacheVersion()
  const [applications, setApplications] = useState(() => listApplicationsFor(owner))

  // Pipeline repair Phase A: the applications cache loads asynchronously
  // (and can receive a Realtime push, e.g. a status change from the org) —
  // without this, this list would freeze at whatever the cache held on
  // mount.
  useEffect(() => onApplicationsChange(() => setApplications(listApplicationsFor(owner))), [owner])

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Applications</h1>
        <p className="mb-6 text-sm text-text-1">Every job you've applied to with PROFILE, and its real status.</p>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No applications yet.{' '}
            <Link to="/opportunities" className="font-semibold text-accent">
              Browse the Opportunity Hub →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {applications.map((a) => {
              const job = getJobById(a.jobId)
              return (
                <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/job/${a.jobId}`} className="font-semibold text-text-0 hover:text-accent">
                      {job?.title ?? 'Listing removed'}
                    </Link>
                    <span className={`text-xs font-semibold capitalize ${STATUS_COLOR[a.status]}`}>{a.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="mb-2 text-xs text-text-2">
                    {job ? orgDisplayName(job.orgEmail) : ''} · Applied {new Date(a.submittedAt).toLocaleDateString()}
                  </p>
                  {a.status !== 'withdrawn' && a.status !== 'rejected' && a.status !== 'offer' && (
                    <button
                      onClick={async () => {
                        await withdrawApplication(a.id, owner)
                        setApplications(listApplicationsFor(owner))
                      }}
                      className="text-xs font-semibold text-danger"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
