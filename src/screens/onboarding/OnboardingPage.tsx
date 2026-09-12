import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Field, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey, postActivity } from '@/app/activityStore'
import { BRAND } from '@/shared/brand/assets'

/**
 * §8.10 Post-Registration Progress Tracker — persistent, dismissible.
 *
 * Phase 7 hardening: every step past the first two was previously hardcoded
 * `completed: false` regardless of actual account/activity state — a §35
 * "static placeholder" progress indicator that never actually tracked
 * progress. `photo`, `trust_center`, and `discoverable` stay honestly false:
 * this build has no photo-upload pipeline, no Trust Center setup flow, and no
 * discoverability toggle yet, so there is no real state to check them
 * against — flagging that here rather than inventing a fake "done."
 * `opportunity` stays false for the same reason (no opportunity-matching
 * backend exists to ever really satisfy it).
 */
function buildSteps(hasHeadline: boolean, hasSkill: boolean, hasActivity: boolean) {
  return [
    { id: 'account', label: 'Account Created', completed: true },
    { id: 'verified', label: 'Email Verified', completed: true },
    { id: 'photo', label: 'Add Profile Photo', completed: false },
    { id: 'headline', label: 'Add Professional Headline', completed: hasHeadline },
    { id: 'skill', label: 'Add Your First Skill', completed: hasSkill },
    { id: 'activity', label: 'Record Your First Activity', completed: hasActivity },
    { id: 'trust_center', label: 'Complete Trust Center Setup', completed: false },
    { id: 'discoverable', label: 'Become Discoverable', completed: false },
    { id: 'opportunity', label: 'Receive Your First Opportunity', completed: false },
  ]
}

/** §8.8-8.10 Onboarding — first-record + verification nudges post-signup. */
export function OnboardingPage() {
  const { account } = useAccount()
  const navigate = useNavigate()
  const [recordTitle, setRecordTitle] = useState('')
  const [recordDone, setRecordDone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const name = account?.accountType === 'individual' ? account.legalName.split(' ')[0] : 'there'
  const activities = account ? listActivities(ownerKey(account)) : []
  const hasHeadline = account?.accountType === 'individual' && !!account.headline
  const hasSkill = activities.some((a) => a.skills.length > 0)
  const hasActivity = recordDone || activities.length > 0
  const steps = buildSteps(hasHeadline, hasSkill, hasActivity)

  return (
    <div className="min-h-screen bg-bg px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        {/* A user should never get stuck mid-flow (no exception) — onboarding
            previously had no persistent way out at all except the two
            in-flow buttons below, which only ever offer "skip"/"continue",
            never a plain way back to the app. */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/home" aria-label="Skip onboarding, go to Home">
            <img src={BRAND.mark} alt="" className="h-7 w-7" />
          </Link>
          <Link to="/home" className="text-xs font-semibold text-text-1 hover:text-text-0">
            Skip to Home →
          </Link>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Welcome, {name}.</h1>
        <p className="mb-8 text-sm text-text-1">
          Nothing is verified yet, and that's expected. Record one real thing, then ask someone to confirm it.
        </p>

        {!dismissed && (
          <div className="mb-8 rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-text-0">Getting started</span>
              <button onClick={() => setDismissed(true)} className="text-xs text-text-2" aria-label="Dismiss checklist">
                Dismiss
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] ${
                      step.completed ? 'bg-success text-white' : 'border border-border-strong text-text-2'
                    }`}
                  >
                    {step.completed ? '✓' : ''}
                  </span>
                  <span className={step.completed ? 'text-text-1 line-through' : 'text-text-0'}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!recordDone ? (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-1.5 text-lg font-semibold text-text-0">Record your first activity</h2>
            <p className="mb-4 text-sm text-text-1">
              What's one real thing you've done — a project, a role, a piece of work? You'll be able to request
              verification for it once it's here.
            </p>
            <Field label="What did you do?">
              <TextInput value={recordTitle} onChange={(e) => setRecordTitle(e.target.value)} placeholder="e.g. Led the redesign of the client onboarding flow" />
            </Field>
            <div className="mt-4 flex gap-2">
              <Button
                disabled={!recordTitle.trim()}
                onClick={() => {
                  postActivity({
                    ownerEmail: ownerKey(account),
                    type: 'Project',
                    title: recordTitle,
                    description: '',
                    skills: [],
                    tools: [],
                    collaborators: [],
                    cvPortfolioInclude: true,
                    visibility: 'public',
                  })
                  setRecordDone(true)
                }}
              >
                Save and continue
              </Button>
              <Button variant="secondary" onClick={() => navigate('/home')}>
                Skip for now
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-success bg-surface p-5 text-center">
            <p className="mb-1 font-semibold text-text-0">"{recordTitle}" recorded.</p>
            <p className="mb-4 text-sm text-text-1">
              You can request verification for it from the Trust Center whenever you're ready — never required to
              finish onboarding.
            </p>
            <Button onClick={() => navigate('/home')}>Go to your PROFILE</Button>
          </div>
        )}
      </div>
    </div>
  )
}
