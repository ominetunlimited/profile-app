import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { getJobById, orgDisplayName } from '@/app/jobStore'
import { myApplicationFor } from '@/app/applicationStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { computeTrustScore } from '@/app/trustScore'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'

/**
 * §6 Job Adverts and Apply With PROFILE — a real detail page, not just the
 * advertiser's profile (§6's explicit "do not merely open the advertiser's
 * profile" rule).
 */
export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { account } = useAccount()
  const job = id ? getJobById(id) : undefined

  if (!job) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Job not found</h1>
          <p className="text-sm text-text-1">This listing doesn't exist on this browser, or has closed.</p>
          <Link to="/opportunities" className="mt-2 text-sm font-semibold text-accent">
            Back to Opportunity Hub
          </Link>
        </div>
      </AppShell>
    )
  }

  const org = findAccountByEmail(job.orgEmail)
  const orgUsername = org && 'username' in org ? org.username : undefined
  const orgTrust = computeTrustScore(org ?? null)
  const isIndividualViewer = account?.accountType === 'individual'
  const existingApplication = isIndividualViewer ? myApplicationFor(job.id, ownerKey(account)) : undefined

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">{orgDisplayName(job.orgEmail).slice(0, 1)}</span>
            <div>
              {orgUsername ? (
                <Link to={`/profile/${orgUsername}`} className="font-semibold text-text-0 hover:text-accent">
                  {orgDisplayName(job.orgEmail)}
                </Link>
              ) : (
                <span className="font-semibold text-text-0">{orgDisplayName(job.orgEmail)}</span>
              )}
              <div className="text-xs text-text-2">{job.location}</div>
            </div>
          </div>
          <TrustScoreRing trust={orgTrust} size={40} />
        </div>

        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">{job.title}</h1>
        <div className="mb-5 flex flex-wrap gap-2 text-xs text-text-2">
          <span className="rounded-full border border-border px-2 py-0.5">{job.workType.replace('_', ' ')}</span>
          {job.salaryRange && <span className="rounded-full border border-border px-2 py-0.5">{job.salaryRange}</span>}
          {job.closingDate && <span className="rounded-full border border-border px-2 py-0.5">Closes {new Date(job.closingDate).toLocaleDateString()}</span>}
        </div>

        <section className="mb-5">
          <h2 className="mb-2 font-semibold text-text-0">Description</h2>
          <p className="whitespace-pre-line text-sm text-text-1">{job.description}</p>
        </section>

        {job.requiredSkills.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 font-semibold text-text-0">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <span key={s} className="rounded-full border border-border px-2.5 py-1 text-xs text-text-1">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {isIndividualViewer ? (
          existingApplication ? (
            <div className="rounded-xl border border-success bg-surface-sunken p-4 text-sm text-text-0">
              ✓ You applied {new Date(existingApplication.submittedAt).toLocaleDateString()} — status: <span className="font-semibold capitalize">{existingApplication.status.replace(/_/g, ' ')}</span>.{' '}
              <Link to="/applications" className="font-semibold text-accent">
                Track your applications →
              </Link>
            </div>
          ) : (
            <Link to={`/apply/${job.id}`} className="inline-block rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white">
              Apply With PROFILE
            </Link>
          )
        ) : (
          <p className="text-sm text-text-1">Sign in with an individual account to apply.</p>
        )}
      </div>
    </AppShell>
  )
}
