import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { RequireIndividual } from '@/app/guards'
import { buildCvData } from '@/app/careerData'
import { buildCoverLetterDraft, COVER_LETTER_TONES as TONES } from '@/app/coverLetterEngine'
import { listOpenJobs, orgDisplayName, useJobsCacheVersion } from '@/app/jobStore'

const CUSTOM = '__custom__'

/** Prints just the letter (a new window with only its text), not the whole app page. */
function printLetter(date: string, body: string) {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  w.document.write(`<!doctype html><title>Cover letter</title><body style="font:14px/1.7 Inter,Arial,sans-serif;max-width:680px;margin:48px auto;color:#1e293b"><p style="font-weight:600">${esc(date)}</p><div style="white-space:pre-line">${esc(body)}</div></body>`)
  w.document.close()
  w.focus()
  w.print()
}

/**
 * Cover letter, written for a real opportunity. It is assembled from the account's own recorded
 * activities (no AI writing), so it only ever says what the evidence supports.
 */
function CoverLetterInner() {
  const { account } = useAccount()
  useJobsCacheVersion()
  const cv = buildCvData(account)
  const jobs = listOpenJobs()
  const [choice, setChoice] = useState<string>(jobs[0]?.id ?? CUSTOM)
  const [customRole, setCustomRole] = useState('')
  const [customOrg, setCustomOrg] = useState('')
  const [tone, setTone] = useState<(typeof TONES)[number]>('Direct')
  const [showSources, setShowSources] = useState(false)

  const job = jobs.find((j) => j.id === choice)
  const targetRole = job ? job.title : customRole
  const targetOrg = job ? orgDisplayName(job.orgEmail) : customOrg
  const body = buildCoverLetterDraft(cv, targetRole, targetOrg, tone)
  const today = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-8">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-text-2">Career Engine</div>
        <h1 className="mb-[18px] text-[26px] font-bold leading-tight tracking-tight text-text-0">Cover letter</h1>

        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
            <div className="rounded-[13px] border border-border bg-surface px-[18px] py-4 shadow-sm">
              <label className="mb-3.5 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-0">Writing for which opportunity?</span>
                <select
                  value={choice}
                  onChange={(e) => setChoice(e.target.value)}
                  className="min-h-[42px] rounded-[9px] border border-border-strong bg-surface px-3 text-[13.5px] text-text-0 outline-none focus-visible:border-accent"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {orgDisplayName(j.orgEmail)}
                    </option>
                  ))}
                  <option value={CUSTOM}>Another role…</option>
                </select>
              </label>
              {choice === CUSTOM && (
                <div className="mb-3.5 flex flex-col gap-2.5">
                  <TextInput value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Role, e.g. Renewable Systems Lead" aria-label="Role" />
                  <TextInput value={customOrg} onChange={(e) => setCustomOrg(e.target.value)} placeholder="Organisation (optional)" aria-label="Organisation" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-0">Tone</span>
                <div role="radiogroup" aria-label="Tone" className="flex flex-wrap gap-[7px]">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={tone === t}
                      onClick={() => setTone(t)}
                      className={`h-8 rounded-full border-[1.5px] px-3 text-xs font-semibold ${tone === t ? 'border-accent bg-accent-soft text-accent' : 'border-border-strong bg-surface text-text-1'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-r-xl border-l-[3px] border-trust bg-trust-soft px-[17px] py-[15px]">
              <div className="mb-2 font-mono text-[9.5px] font-semibold tracking-[.09em] text-trust">
                ASSEMBLED FROM {cv.experience.length} RECORDED {cv.experience.length === 1 ? 'ACTIVITY' : 'ACTIVITIES'}
              </div>
              <p className="mb-2.5 text-[12.5px] leading-[1.65] text-text-0">
                {cv.experience.length > 0
                  ? "This draft cites the work you've recorded on PROFILE. It isn't AI-written, so it only ever says what your evidence supports."
                  : "You haven't recorded any work yet, so there is nothing to cite. Record your first activity from Home and this letter fills in."}
              </p>
              <button type="button" onClick={() => setShowSources((v) => !v)} aria-expanded={showSources} className="h-8 rounded-lg border border-border-strong bg-surface px-3 text-xs font-semibold text-text-0">
                {showSources ? 'Hide sources' : 'Show sources'}
              </button>
              {showSources && (
                <ul className="mt-2.5 list-disc ps-4 text-xs text-text-1">
                  {cv.experience.length === 0 ? <li>None yet.</li> : cv.experience.map((e, i) => <li key={i}>{e.title} — {e.org}</li>)}
                </ul>
              )}
            </div>

            <div className="rounded-[13px] border border-border bg-surface px-[17px] py-[15px]">
              <div className="mb-[9px] text-[12.5px] font-semibold text-text-0">Rules this draft follows</div>
              <p className="text-xs leading-[1.7] text-text-1">
                Never claims a skill or achievement your records don't support. Never invents dates, employers or outcomes. Always editable — nothing here is final until you say so.
              </p>
            </div>
          </div>

          <div className="min-w-[280px] flex-[1_1_420px]">
            <div className="rounded-[14px] border border-border bg-surface px-[clamp(20px,3vw,38px)] py-[34px] shadow-lg">
              <div className="mb-4 text-[13px] font-semibold text-text-0">{today}</div>
              <div className="whitespace-pre-line text-[13px] leading-[1.7] text-text-0">{body}</div>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {job ? (
                <Link to={`/apply/${job.id}`} className="inline-flex h-[38px] items-center rounded-[9px] bg-accent-solid px-[15px] text-[13px] font-semibold text-white no-underline">
                  Use with this application
                </Link>
              ) : (
                <Link to="/opportunities" className="inline-flex h-[38px] items-center rounded-[9px] bg-accent-solid px-[15px] text-[13px] font-semibold text-white no-underline">
                  Find a job to apply for
                </Link>
              )}
              <button type="button" onClick={() => printLetter(today, body)} className="h-[38px] rounded-[9px] border border-border-strong bg-surface px-[13px] text-[13px] font-semibold text-text-0">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export function CoverLetterPage() {
  return (
    <RequireIndividual>
      <CoverLetterInner />
    </RequireIndividual>
  )
}
