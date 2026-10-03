import { useEffect, useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Link } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { orgRoleCan, canAccessRecruiterHub } from '@/app/accountTypes'
import { ownerKey } from '@/app/activityStore'
import { postJob, listJobsByOrg, closeJob, onJobsChange, FREE_TIER_MAX_HIRES, type JobListing } from '@/app/jobStore'
import { listApplicationsForJob, updateApplicationStatus, scheduleInterview, hiredCountForJob, onApplicationsChange, type Application, type ApplicationStatus } from '@/app/applicationStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { computeTrustScore } from '@/app/trustScore'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { Button } from '@/shared/ui/Button'
import { OrgSubPageShell, SectorAccessDenied } from './OrgWorkspaceShell'

/** §18.3/§39 Recruiter Workflow — candidate pipeline, interview scheduling. */
const KANBAN_PIPELINE: ApplicationStatus[] = ['submitted', 'under_review', 'shortlisted', 'interview', 'offer']
const STAGE_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'Applied',
  received: 'Received',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview Scheduled',
  offer: 'Offer Made',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}
const NEXT_STAGE: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  submitted: 'under_review',
  under_review: 'shortlisted',
  shortlisted: 'interview',
  interview: 'offer',
}

/** Real calendar-derived slots (next two weekdays, two business-hour
 * openings each, starting tomorrow), not the mockup's fixed illustrative
 * dates. */
function upcomingInterviewSlots(): string[] {
  const slots: string[] = []
  const cursor = new Date()
  cursor.setDate(cursor.getDate() + 1)
  while (slots.length < 4) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) {
      const label = cursor.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
      slots.push(`${label} · 10:00`, `${label} · 14:00`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return slots.slice(0, 4)
}

export function RecruiterWorkflow() {
  const { account } = useAccount()
  const canManage = account ? orgRoleCan(account, 'manageHiring') : false
  const owner = ownerKey(account)
  const [jobs, setJobs] = useState<JobListing[]>(() => listJobsByOrg(owner))
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [schedulingFor, setSchedulingFor] = useState<Application | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const slots = useState(upcomingInterviewSlots)[0]

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0]
  const applications: Application[] = selectedJob ? listApplicationsForJob(selectedJob.id) : []

  function refreshApplications() {
    setJobs(listJobsByOrg(owner))
  }

  // Pipeline repair Phase A: jobs/applications caches load asynchronously
  // (and receive Realtime pushes — a new application arriving live) —
  // without this, the pipeline would freeze at whatever the cache held on
  // mount.
  useEffect(() => {
    const unsub1 = onJobsChange(refreshApplications)
    const unsub2 = onApplicationsChange(refreshApplications)
    return () => {
      unsub1()
      unsub2()
    }
  }, [owner])

  // §34.2a — recruiter_hub (job posting/hiring pipeline) is `company` sector's
  // module within business_hub, not `hospital`'s. The route-level guard only
  // checks hub==='business_hub', so without this a Hospital account could
  // reach this screen the same way a Research Institute could previously
  // reach University-only tools.
  if (!account || !canAccessRecruiterHub(account)) {
    return <SectorAccessDenied toolName="Recruiter Hub" scopeDescription="companies, startups, recruitment agencies, and consulting firms" />
  }

  const orgLabel = account?.accountType === 'organisation' ? account.legalName : 'Organisation'

  return (
    <OrgSubPageShell title={selectedJob ? `${selectedJob.title} — pipeline` : 'Recruiter Workflow'} back={{ to: '/org/me/talent', label: `${orgLabel} workspace` }}>
      {!canManage && (
        <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
          Managing the hiring pipeline requires super_admin, admin, or hr_manager — view only for your role.
        </div>
      )}

      {canManage && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          {!posting ? (
            <button onClick={() => setPosting(true)} className="w-full rounded-lg border border-dashed border-border-strong py-3 text-sm font-medium text-text-1">
              + Post a job
            </button>
          ) : (
            <PostJobForm
              orgEmail={owner}
              onClose={() => setPosting(false)}
              onPosted={() => {
                setPosting(false)
                setJobs(listJobsByOrg(owner))
              }}
            />
          )}
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-text-1">No jobs posted yet — post one above to open a real, working candidate pipeline.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJobId(j.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${(selectedJob?.id === j.id) ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
              >
                {j.title} ({listApplicationsForJob(j.id).length})
              </button>
            ))}
          </div>

          {selectedJob && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <Link to={`/job/${selectedJob.id}`} className="text-sm font-semibold text-text-0 hover:text-accent">
                  {selectedJob.title} →
                </Link>
                <span className="text-xs text-text-2">
                  {hiredCountForJob(selectedJob.id)}/{selectedJob.maxHires} hired (free tier cap)
                </span>
                {selectedJob.status === 'open' && canManage && (
                  <button
                    onClick={async () => {
                      await closeJob(selectedJob.id)
                      setJobs(listJobsByOrg(owner))
                    }}
                    className="text-xs font-semibold text-danger"
                  >
                    Close listing
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {KANBAN_PIPELINE.map((stage) => {
                  const stageApplications = applications.filter((a) => a.status === stage)
                  return (
                    <div key={stage} className="rounded-xl border border-border bg-surface-sunken p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-text-1">{STAGE_LABEL[stage]}</span>
                        <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] text-text-2">{stageApplications.length}</span>
                      </div>
                      {stageApplications.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border-strong p-4 text-center text-[11px] text-text-2">Empty</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {stageApplications.map((a) => {
                            const applicant = findAccountByEmail(a.applicantEmail)
                            const username = applicant && 'username' in applicant ? applicant.username : undefined
                            const trust = computeTrustScore(applicant ?? null)
                            const next = NEXT_STAGE[a.status]
                            const atHireCap = next === 'offer' && hiredCountForJob(selectedJob.id) >= selectedJob.maxHires
                            return (
                              <div key={a.id} className="rounded-lg border border-border bg-surface p-2.5 text-xs">
                                <div className="mb-0.5 flex items-center gap-1.5">
                                  <UserAvatar ownerEmail={a.applicantEmail} name={applicant?.legalName ?? 'Applicant'} size={22} />
                                  {username ? (
                                    <Link to={`/profile/${username}`} className="font-semibold text-text-0 hover:text-accent">
                                      {applicant?.legalName}
                                    </Link>
                                  ) : (
                                    <span className="font-semibold text-text-0">{applicant?.legalName ?? 'Applicant'}</span>
                                  )}
                                  <span className="rounded-full border border-trust px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-trust">{trust.total}</span>
                                </div>
                                {a.status === 'interview' && a.interviewSlot && (
                                  <div className="mb-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium text-accent">{a.interviewSlot}</div>
                                )}
                                {canManage && (
                                  <div className="mt-1.5 flex gap-1.5">
                                    {next && (
                                      <button
                                        disabled={atHireCap}
                                        title={atHireCap ? `Free tier cap reached — ${selectedJob.maxHires} hires on this listing` : undefined}
                                        onClick={async () => {
                                          if (next === 'interview') {
                                            setSchedulingFor(a)
                                            setSelectedSlot(null)
                                          } else {
                                            await updateApplicationStatus(a.id, next)
                                            refreshApplications()
                                          }
                                        }}
                                        className="font-semibold text-accent disabled:cursor-not-allowed disabled:text-text-2"
                                      >
                                        Advance →
                                      </button>
                                    )}
                                    <button
                                      onClick={async () => {
                                        await updateApplicationStatus(a.id, 'rejected')
                                        refreshApplications()
                                      }}
                                      className="font-semibold text-danger"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {schedulingFor && (
                <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-3.5 text-sm font-semibold text-text-0">
                    Schedule interview — {findAccountByEmail(schedulingFor.applicantEmail)?.legalName ?? schedulingFor.applicantEmail}
                  </div>
                  <div className="mb-3.5 flex flex-wrap gap-2.5">
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSlot(s)}
                        className={`rounded-lg border-[1.5px] px-3.5 py-2.5 text-xs font-semibold ${selectedSlot === s ? 'border-accent bg-accent-solid text-white' : 'border-border-strong bg-surface text-text-1'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={!selectedSlot}
                      onClick={async () => {
                        await scheduleInterview(schedulingFor.id, owner, selectedSlot!)
                        setSchedulingFor(null)
                        setSelectedSlot(null)
                        refreshApplications()
                      }}
                      className="h-10 rounded-lg bg-accent-solid px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Confirm &amp; send invite
                    </button>
                    <button onClick={() => setSchedulingFor(null)} className="h-10 rounded-lg border border-border-strong px-3.5 text-sm font-semibold text-text-0">
                      Cancel
                    </button>
                  </div>
                  <p className="mt-2.5 text-[11.5px] leading-relaxed text-text-1">
                    {findAccountByEmail(schedulingFor.applicantEmail)?.legalName ?? 'They'} receive this on their own Messages — interview scheduling never bypasses their notice or consent.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      <p className="mt-6 text-sm text-text-1">Candidates apply with their verified PROFILE, never a CV upload.</p>
    </OrgSubPageShell>
  )
}

function PostJobForm({ orgEmail, onClose, onPosted }: { orgEmail: string; onClose: () => void; onPosted: () => void }) {
  const [title, setTitle] = useState('')
  const [workType, setWorkType] = useState<JobListing['workType']>('remote')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [maxHires, setMaxHires] = useState(FREE_TIER_MAX_HIRES)

  return (
    <div className="flex flex-col gap-3">
      <Field label="Job title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Product Designer" />
      </Field>
      <Field label="Work type">
        <SelectInput value={workType} onChange={(e) => setWorkType(e.target.value as JobListing['workType'])}>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="on_site">On-site</option>
        </SelectInput>
      </Field>
      <Field label="Location">
        <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
          placeholder="Responsibilities, requirements, and what success looks like"
        />
      </Field>
      <Field label="Required skills (optional)" hint="Comma-separated">
        <TextInput value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g. Figma, User Research" />
      </Field>
      <div className="flex flex-wrap gap-3">
        <Field label="Salary range (optional)">
          <TextInput value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g. ₦400k–600k/mo" />
        </Field>
        <Field label="Closing date (optional)">
          <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 text-sm" />
        </Field>
        <Field label="Hires on this listing" hint={`Free tier: up to ${FREE_TIER_MAX_HIRES}`}>
          <SelectInput value={String(maxHires)} onChange={(e) => setMaxHires(Number(e.target.value))}>
            {Array.from({ length: FREE_TIER_MAX_HIRES }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!title.trim() || !description.trim() || !location.trim()}
          onClick={async () => {
            await postJob({
              orgEmail,
              title,
              workType,
              location,
              description,
              requiredSkills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
              salaryRange: salaryRange || undefined,
              closingDate: closingDate || undefined,
              maxHires,
            })
            onPosted()
          }}
        >
          Post job
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
