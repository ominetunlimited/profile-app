import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { RequireIndividual } from '@/app/guards'
import { buildCvData } from '@/app/careerData'
import { buildCoverLetterDraft, COVER_LETTER_TONES as TONES } from '@/app/coverLetterEngine'

/**
 * §47.4 PROFILE Cover Letter — opportunity-aware. §48.0 forbids AI fabricating
 * experience, and no AI Gateway backend exists in this build, so this
 * assembles a real letter from the account's own recorded activities via
 * deterministic templating — clearly labelled as such, never presented as AI
 * generation it can't actually deliver honestly yet.
 */
function CoverLetterInner() {
  const { account } = useAccount()
  const cv = buildCvData(account)
  const [targetRole, setTargetRole] = useState('')
  const [targetOrg, setTargetOrg] = useState('')
  const [tone, setTone] = useState<(typeof TONES)[number]>('Direct')

  const body = buildCoverLetterDraft(cv, targetRole, targetOrg, tone)

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-2">Career Engine</div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Cover letter</h1>

        <div className="flex flex-wrap gap-6">
          <div className="flex min-w-[260px] flex-1 flex-col gap-4">
            <Field label="Target role">
              <TextInput value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Renewable Systems Lead" />
            </Field>
            <Field label="Target organisation (optional)">
              <TextInput value={targetOrg} onChange={(e) => setTargetOrg(e.target.value)} placeholder="e.g. Aurora Power" />
            </Field>
            <Field label="Tone">
              <SelectInput value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </SelectInput>
            </Field>

            <div className="rounded-xl border-l-[3px] border-trust bg-surface-sunken p-4">
              <div className="mb-2 font-mono text-[9.5px] font-semibold tracking-widest text-trust">
                TEMPLATE-ASSEMBLED FROM {cv.experience.length} RECORDED {cv.experience.length === 1 ? 'ACTIVITY' : 'ACTIVITIES'}
              </div>
              <p className="text-xs leading-relaxed text-text-0">
                This isn't AI-generated — no AI Gateway backend is connected in this build. It's assembled directly from
                your own recorded activities, the same evidence-only rule an AI draft would have to follow anyway.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 font-semibold text-text-0">Rules this draft follows</div>
              <p className="text-xs leading-relaxed text-text-1">
                Never claims a skill or achievement your records don't support. Never invents dates, employers, or
                outcomes. Always editable — nothing here is final until you say so.
              </p>
            </div>
          </div>

          <div className="min-w-[280px] flex-[1.2]">
            <div className="rounded-2xl border border-border bg-surface p-9 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-text-0">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="whitespace-pre-line text-sm leading-relaxed text-text-0">{body}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/opportunities">
                <Button>Find a job to apply for</Button>
              </Link>
              <Button variant="secondary" onClick={() => window.print()}>
                Download PDF
              </Button>
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
