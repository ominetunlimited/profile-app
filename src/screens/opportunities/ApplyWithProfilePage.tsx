import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { RequireIndividual } from '@/app/guards'
import { ownerKey } from '@/app/activityStore'
import { getJobById, orgDisplayName, useJobsCacheVersion } from '@/app/jobStore'
import { myApplicationFor, submitApplication, useApplicationsCacheVersion } from '@/app/applicationStore'
import { buildCvData } from '@/app/careerData'
import { buildCoverLetterDraft, COVER_LETTER_TONES } from '@/app/coverLetterEngine'
import { CV_TEMPLATES } from '@/screens/career/cv/cvTemplates'

const STEPS = ['review', 'cover-letter', 'submit'] as const

/**
 * §6.1 Apply With PROFILE. Job → Apply → review profile → cover letter
 * (§6.3 — the exact same buildCoverLetterDraft engine CoverLetterPage.tsx
 * uses, not a second design) → review → submit → confirmation. §6.2's hard
 * rule: the applicant sees exactly what's being sent before it goes,
 * never a silent full-PROFILE dump to the employer.
 */
function ApplyInner() {
  const { jobId } = useParams<{ jobId: string }>()
  const { account } = useAccount()
  const navigate = useNavigate()
  // Pipeline repair Phase A: jobs/applications caches load asynchronously —
  // without depending on these, a direct link here could render "Job not
  // found" once and never recheck.
  useJobsCacheVersion()
  useApplicationsCacheVersion()
  const job = jobId ? getJobById(jobId) : undefined
  const cv = buildCvData(account)
  const CvComponent = CV_TEMPLATES[0].Component

  const [step, setStep] = useState<(typeof STEPS)[number]>('review')
  const [targetRole, setTargetRole] = useState(job?.title ?? '')
  const [targetOrg, setTargetOrg] = useState(job ? orgDisplayName(job.orgEmail) : '')
  const [tone, setTone] = useState<(typeof COVER_LETTER_TONES)[number]>('Direct')
  const [coverLetter, setCoverLetter] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!job || !account) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Job not found</h1>
          <Link to="/opportunities" className="text-sm font-semibold text-accent">
            Back to Opportunity Hub
          </Link>
        </div>
      </AppShell>
    )
  }

  const alreadyApplied = myApplicationFor(job.id, ownerKey(account))
  if (alreadyApplied && !submitted) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Already applied</h1>
          <p className="text-sm text-text-1">You applied for this job on {new Date(alreadyApplied.submittedAt).toLocaleDateString()}.</p>
          <Link to="/applications" className="text-sm font-semibold text-accent">
            Track your applications →
          </Link>
        </div>
      </AppShell>
    )
  }

  const draft = coverLetter || buildCoverLetterDraft(cv, targetRole, targetOrg, tone)

  async function handleSubmit() {
    if (!account) return
    await submitApplication({ jobId: job!.id, applicantEmail: ownerKey(account), orgEmail: job!.orgEmail, coverLetter: draft })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="rounded-full border border-success px-3 py-1 text-xs font-semibold text-success">Submitted</span>
          <h1 className="text-xl font-bold text-text-0">Application sent</h1>
          <p className="text-sm text-text-1">
            {orgDisplayName(job.orgEmail)} has been notified. Track its status from Applications.
          </p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => navigate('/applications')}>Track applications</Button>
            <Button variant="secondary" onClick={() => navigate('/opportunities')}>
              Back to Opportunity Hub
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-2">Apply With PROFILE</div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">
          {job.title} at {orgDisplayName(job.orgEmail)}
        </h1>

        <div className="mb-6 flex gap-2 text-xs">
          {STEPS.map((s, i) => (
            <span key={s} className={`rounded-full border px-2.5 py-1 font-semibold capitalize ${step === s ? 'border-accent text-accent' : 'border-border text-text-2'}`}>
              {i + 1}. {s.replace('-', ' ')}
            </span>
          ))}
        </div>

        {step === 'review' && (
          <div>
            <p className="mb-3 text-sm text-text-1">
              This is exactly what {orgDisplayName(job.orgEmail)} will see — your verified profile and CV, never your
              private data (§6.2).
            </p>
            <div className="mb-4 overflow-hidden rounded-xl bg-surface-sunken p-4">
              <CvComponent cv={cv} />
            </div>
            <Button onClick={() => setStep('cover-letter')}>Continue to cover letter</Button>
          </div>
        )}

        {step === 'cover-letter' && (
          <div>
            <div className="mb-4 flex flex-wrap gap-3">
              <Field label="Target role">
                <TextInput value={targetRole} onChange={(e) => { setTargetRole(e.target.value); setCoverLetter('') }} />
              </Field>
              <Field label="Target organisation">
                <TextInput value={targetOrg} onChange={(e) => { setTargetOrg(e.target.value); setCoverLetter('') }} />
              </Field>
              <Field label="Tone">
                <SelectInput value={tone} onChange={(e) => { setTone(e.target.value as typeof tone); setCoverLetter('') }}>
                  {COVER_LETTER_TONES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <Field label="Cover letter (editable)">
              <textarea
                value={draft}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
              />
            </Field>
            <p className="mb-4 mt-1 text-xs text-text-2">Kept with this application only — never published publicly.</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep('submit')}>Review application</Button>
              <Button variant="secondary" onClick={() => setStep('review')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'submit' && (
          <div>
            <h2 className="mb-2 font-semibold text-text-0">Review before you submit</h2>
            <div className="mb-4 rounded-xl border border-border bg-surface p-4">
              <div className="mb-1 text-sm font-semibold text-text-0">{job.title}</div>
              <div className="mb-3 text-xs text-text-2">{orgDisplayName(job.orgEmail)} · {job.location}</div>
              <div className="whitespace-pre-line rounded-lg bg-surface-sunken p-3 text-sm text-text-1">{draft}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Submit application</Button>
              <Button variant="secondary" onClick={() => setStep('cover-letter')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export function ApplyWithProfilePage() {
  return (
    <RequireIndividual>
      <ApplyInner />
    </RequireIndividual>
  )
}
