import { Link } from 'react-router-dom'
import type { Account } from '@/app/accountTypes'
import { orgDisplayName, type JobListing } from '@/app/jobStore'
import { ActionBar } from './ActionBar'

/** One job card for every surface (Opportunity Hub, reposts, Saved). The
 * title area links to the detail page; the social actions sit below it, not
 * inside the link (no nested interactive elements). */
export function JobCard({ job, viewerAccount, viewerEmail }: { job: JobListing; viewerAccount: Account | null; viewerEmail: string }) {
  return (
    <article className="ds-card-hover rounded-xl border border-border bg-surface p-4 hover:border-accent">
      <Link to={`/job/${job.id}`} className="block">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-text-0">{job.title}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-text-2">{job.workType.replace('_', ' ')}</span>
          {job.status === 'closed' && <span className="rounded-full border border-warning px-2 py-0.5 text-[10.5px] text-warning">Closed</span>}
        </div>
        <p className="mb-1.5 text-xs text-text-2">
          {orgDisplayName(job.orgEmail)} · {job.location}
        </p>
        <p className="mb-2 line-clamp-2 text-sm text-text-1">{job.description}</p>
      </Link>
      <ActionBar target={{ type: 'job', id: job.id }} viewerEmail={viewerEmail} viewerAccount={viewerAccount} authorEmail={job.orgEmail} />
    </article>
  )
}
