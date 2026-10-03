import { Link } from 'react-router-dom'
import type { Account } from '@/app/accountTypes'
import { orgDisplayName, type JobListing } from '@/app/jobStore'
import { ActionBar } from './ActionBar'

/** One job card for every surface (Opportunity Hub, reposts, Saved). The
 * title area links to the detail page; the social actions sit below it, not
 * inside the link (no nested interactive elements). */
export function JobCard({ job, viewerAccount, viewerEmail, matchPct }: { job: JobListing; viewerAccount: Account | null; viewerEmail: string; matchPct?: number | null }) {
  return (
    <article className="ds-card-hover rounded-[13px] border border-border bg-surface px-[18px] py-4 shadow-sm hover:border-accent">
      <Link to={`/job/${job.id}`} className="block">
        <div className="mb-[5px] flex flex-wrap justify-between gap-2.5">
          <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-text-0">
            {job.title}
            {job.status === 'closed' && <span className="rounded-full border border-warning px-2 py-0.5 text-[10.5px] font-medium text-warning">Closed</span>}
          </span>
          {typeof matchPct === 'number' && <span className="font-mono text-sm font-bold text-trust">{matchPct}% match</span>}
        </div>
        <p className="mb-2 text-xs text-text-1">
          {orgDisplayName(job.orgEmail)} · {job.location} · {job.workType.replace('_', ' ')}
        </p>
        <p className="mb-2 line-clamp-2 text-sm text-text-1">{job.description}</p>
        {job.requiredSkills.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {job.requiredSkills.slice(0, 5).map((s) => (
              <span key={s} className="rounded-full bg-surface-sunken px-[9px] py-0.5 text-[11px] font-medium text-text-1">{s}</span>
            ))}
          </div>
        )}
      </Link>
      <ActionBar target={{ type: 'job', id: job.id }} viewerEmail={viewerEmail} viewerAccount={viewerAccount} authorEmail={job.orgEmail} />
    </article>
  )
}
