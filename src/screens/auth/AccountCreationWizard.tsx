import { useEffect, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthChrome } from './AuthChrome'
import { Button } from '@/shared/ui/Button'
import { Field, PasswordInput, SelectInput, TextInput } from '@/shared/ui/Field'
import { COUNTRIES, ageFromDob, isOfficialDomainEmail, isValidEmail } from './countryData'
import { CAREER_STAGE_LABELS, ONBOARDING_GOALS, journeyBranchFor, initialWizardState, type WizardState } from './accountCreationTypes'
import {
  CAREER_STAGE_OPTIONS,
  INDIVIDUAL_CATEGORIES,
  ORGANISATION_TYPES,
  hubForOrgType,
  passwordMeetsPolicy,
  type OrganisationType,
  type Pathway,
} from '@/app/accountTypes'
import { useAccount } from '@/app/AccountContext'
import { emailIsRegistered, findAccountByUsername, saveDemoAccount } from '@/app/demoAccountStore'
import { resizeImage, saveAvatar, saveCover } from '@/app/mediaStore'

const INDIVIDUAL_STEP_ORDER = ['account-type', 'individual-info', 'email-verify', 'consent', 'goals', 'profile-setup', 'journey-setup', 'done']
const INDIVIDUAL_STEP_NAMES: Record<string, string> = {
  'account-type': 'Choose account type',
  'individual-info': 'Create identity',
  'email-verify': 'Verify email',
  consent: 'Consent',
  goals: 'Your goals',
  'profile-setup': 'Set up your PROFILE',
  'journey-setup': 'Journey setup',
  done: 'Done',
}
const ORG_STEP_ORDER = ['account-type', 'org-info', 'org-consent', 'org-done']
const ORG_STEP_NAMES: Record<string, string> = {
  'account-type': 'Choose account type',
  'org-gate': 'Sign in required',
  'org-info': 'Workspace identity',
  'org-consent': 'Consent',
  'org-done': 'Submitted',
}

/** §8 Registration & Onboarding System, in full — not the Handoff's compressed
 * 5-step prototype, per build doc §1's instruction that the Master Prompt
 * governs business logic/feature existence even where the Handoff simplified
 * it for the mockup. Visual chrome (progress header, card, input styling)
 * still follows the Handoff's Account Creation screen exactly. */
export function AccountCreationWizard() {
  const [s, setS] = useState<WizardState>(initialWizardState)
  const { account, setAccount } = useAccount()
  const navigate = useNavigate()

  const isOrgPath = s.accountKind === 'organisation'
  const stepOrder = isOrgPath ? ORG_STEP_ORDER : INDIVIDUAL_STEP_ORDER
  const stepNames = isOrgPath ? ORG_STEP_NAMES : INDIVIDUAL_STEP_NAMES
  const visibleIndex = stepOrder.indexOf(s.step === 'org-gate' ? 'account-type' : s.step)
  const progress =
    s.step === 'done' || s.step === 'org-done'
      ? undefined
      : { stepNum: Math.max(1, visibleIndex + 1), stepCount: stepOrder.length, stepName: stepNames[s.step] }

  function patch(partial: Partial<WizardState>) {
    setS((prev) => ({ ...prev, ...partial }))
  }

  const countryRec = COUNTRIES.find((c) => c.name === s.country)
  const age = ageFromDob(s.dob)
  const dobUnderage = !!countryRec && s.dob !== '' && age !== null && age < countryRec.minAge
  const individualValid =
    s.legalName.trim().length > 1 &&
    !!countryRec &&
    s.dob !== '' &&
    !dobUnderage &&
    isValidEmail(s.email) &&
    !emailIsRegistered(s.email) &&
    passwordMeetsPolicy(s.password) &&
    s.confirmPassword === s.password

  const orgValid =
    s.orgLegalName.trim().length > 1 &&
    isOfficialDomainEmail(s.officialEmail) &&
    !emailIsRegistered(s.officialEmail) &&
    !!countryRec &&
    passwordMeetsPolicy(s.orgPassword) &&
    s.orgConfirmPassword === s.orgPassword

  function finalizeIndividualAccount() {
    const newAccount = {
      accountType: 'individual' as const,
      pathway: s.pathway!,
      careerStage: s.careerStage ?? undefined,
      legalName: s.legalName,
      // Bug fix: captured at Step 2 (§8.5) but never saved to the finalized
      // account — same "collected then silently discarded" class of bug as
      // the profile/cover photos above.
      preferredDisplayName: s.preferredDisplayName || undefined,
      username: s.username || undefined,
      headline: s.headline || undefined,
      email: s.email,
      country: s.country,
    }
    saveDemoAccount(s.email, s.password, newAccount)
    // Bug fix: §8.8's profilePicture/coverPicture were captured into wizard
    // state and previewed, but never actually saved anywhere — completing
    // registration silently discarded them. Now persisted through the same
    // real pipeline Settings' photo upload uses (mediaStore.ts).
    if (s.profilePhoto) saveAvatar(s.email, s.profilePhoto)
    if (s.coverPhoto) saveCover(s.email, s.coverPhoto)
    setAccount(newAccount)
  }

  function finalizeOrgAccount() {
    const newAccount = {
      accountType: 'organisation' as const,
      orgType: s.orgType!,
      legalName: s.orgLegalName,
      officialEmail: s.officialEmail,
      country: s.country,
      registryLevel: 'user_submitted' as const,
      orgRole: 'super_admin' as const,
    }
    saveDemoAccount(s.officialEmail, s.orgPassword, newAccount)
    setAccount(newAccount)
  }

  return (
    <AuthChrome maxWidth={560} progress={progress}>
      {s.step === 'account-type' && (
        <AccountTypeStep
          s={s}
          patch={patch}
          onContinue={() => {
            if (s.accountKind === 'individual' && s.pathway) patch({ step: 'individual-info' })
            if (s.accountKind === 'organisation' && s.orgType) {
              patch({ step: account?.accountType === 'individual' ? 'org-info' : 'org-gate' })
            }
          }}
        />
      )}

      {s.step === 'org-gate' && (
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Set up the workspace</h1>
          <p className="mb-5 text-sm leading-relaxed text-text-1">
            Organisation, institution and government workspaces are opened by a person, not created from nothing —
            you need a personal PROFILE account first.
          </p>
          <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-4 text-sm text-text-1">
            You'll need to sign in with your personal PROFILE account first, using an email on your organisation's
            own domain, not a personal address.
          </div>
          <div className="flex gap-2">
            <Link to="/auth?mode=signin" className="flex min-h-[44px] items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white">
              Sign in
            </Link>
            <Button variant="secondary" onClick={() => patch({ step: 'account-type', accountKind: null, orgType: null })}>
              Back
            </Button>
          </div>
        </div>
      )}

      {s.step === 'org-info' && (
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Set up the workspace</h1>
          <p className="mb-4 text-sm leading-relaxed text-text-1">Registering a {s.orgType} workspace.</p>
          {account?.accountType === 'individual' && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-success bg-surface-sunken p-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {account.legalName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text-0">Signed in as {account.legalName}</div>
                <div className="text-xs text-text-1">{account.email} · this workspace's admin</div>
              </div>
            </div>
          )}
          <div className="mb-4 flex flex-col gap-3.5">
            <Field label="Organisation name">
              <TextInput value={s.orgLegalName} onChange={(e) => patch({ orgLegalName: e.target.value })} placeholder="e.g. Lagos State Polytechnic" />
            </Field>
            <Field
              label="Official email"
              error={s.officialEmail && !isOfficialDomainEmail(s.officialEmail) ? "Needs an email on your organisation's own domain — not a personal Gmail, Yahoo or similar address." : undefined}
            >
              <TextInput value={s.officialEmail} onChange={(e) => patch({ officialEmail: e.target.value })} placeholder="you@yourorganisation.gov" />
            </Field>
            <Field label="Registration number (optional)">
              <TextInput value={s.registrationNumber} onChange={(e) => patch({ registrationNumber: e.target.value })} placeholder="Official registration number" />
            </Field>
            <Field label="Country">
              <SelectInput value={s.country} onChange={(e) => patch({ country: e.target.value })}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Workspace password">
              <PasswordInput value={s.orgPassword} onChange={(e) => patch({ orgPassword: e.target.value })} placeholder="At least 8 characters, mixed case, number, symbol" />
            </Field>
            <Field label="Confirm password" error={s.orgConfirmPassword && s.orgConfirmPassword !== s.orgPassword ? "Passwords don't match yet." : undefined}>
              <PasswordInput value={s.orgConfirmPassword} onChange={(e) => patch({ orgConfirmPassword: e.target.value })} placeholder="Type it again" />
            </Field>
          </div>
          <div className="mb-5 rounded-lg border border-border bg-surface-sunken p-3.5 text-xs leading-relaxed text-text-1">
            A PROFILE team member confirms the domain before the workspace goes live — until then it's{' '}
            <span className="font-mono font-semibold">user_submitted</span> (Awaiting Organisational Claim, §50.4 IOTR).
          </div>
          <div className="flex gap-2">
            <Button disabled={!orgValid} onClick={() => patch({ step: 'org-consent' })}>
              Continue
            </Button>
            <Button variant="secondary" onClick={() => patch({ step: 'account-type' })}>
              Back
            </Button>
          </div>
        </div>
      )}

      {s.step === 'org-consent' && (
        <ConsentStep
          s={s}
          patch={patch}
          onContinue={() => {
            finalizeOrgAccount()
            patch({ step: 'org-done' })
          }}
          onBack={() => patch({ step: 'org-info' })}
        />
      )}

      {s.step === 'org-done' && <OrgDoneStep orgType={s.orgType!} />}

      {s.step === 'individual-info' && (
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Create your identity</h1>
          <p className="mb-5 text-sm text-text-1">Just enough to get you in. Everything else comes later, on your terms.</p>
          <div className="mb-4 flex flex-col gap-3.5">
            <Field label="Full name">
              <TextInput value={s.legalName} onChange={(e) => patch({ legalName: e.target.value })} placeholder="As you want it shown" />
            </Field>
            <Field label="Preferred display name (optional)">
              <TextInput value={s.preferredDisplayName} onChange={(e) => patch({ preferredDisplayName: e.target.value })} placeholder="If different from your full name" />
            </Field>
            <Field label="Country" hint={countryRec ? `Default language: ${countryRec.lang} · minimum age ${countryRec.minAge}` : undefined}>
              <SelectInput value={s.country} onChange={(e) => patch({ country: e.target.value })}>
                <option value="">Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Date of birth" error={dobUnderage ? `You need to be at least ${countryRec?.minAge} in ${s.country} to create a PROFILE account.` : undefined}>
              <TextInput type="date" value={s.dob} onChange={(e) => patch({ dob: e.target.value })} />
            </Field>
            <Field label="Email address" error={s.email && emailIsRegistered(s.email) ? 'An account already exists with this email — try signing in instead.' : undefined}>
              <TextInput value={s.email} onChange={(e) => patch({ email: e.target.value })} placeholder="you@example.com" />
            </Field>
            <Field label="Password" hint="At least 8 characters, with uppercase, lowercase, a number, and a symbol.">
              <PasswordInput value={s.password} onChange={(e) => patch({ password: e.target.value })} placeholder="At least 8 characters" />
            </Field>
            <Field label="Confirm password" error={s.confirmPassword && s.confirmPassword !== s.password ? "Passwords don't match yet." : undefined}>
              <PasswordInput value={s.confirmPassword} onChange={(e) => patch({ confirmPassword: e.target.value })} placeholder="Type it again" />
            </Field>
          </div>
          <p className="mb-5 text-xs text-text-1">
            After verifying your email, you'll review and accept PROFILE's{' '}
            <Link to="/terms" className="text-accent">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-accent">
              Privacy Policy
            </Link>{' '}
            before your account is created — nothing here is agreed to automatically.
          </p>
          <div className="flex gap-2">
            {/* §3 Account Creation state machine: this is the real
                EMAIL_PENDING trigger, not a step-navigation "Continue" —
                clicking it is the actual act of sending the six-digit code,
                so it's labelled for what it does. */}
            <Button disabled={!individualValid} onClick={() => patch({ step: 'email-verify' })}>
              Verify Email
            </Button>
            <Button variant="secondary" onClick={() => patch({ step: 'account-type' })}>
              Back
            </Button>
          </div>
        </div>
      )}

      {s.step === 'email-verify' && (
        <EmailVerifyStep s={s} patch={patch} email={s.email} onVerified={() => patch({ step: 'consent' })} onChangeEmail={() => patch({ step: 'individual-info' })} />
      )}

      {s.step === 'consent' && <ConsentStep s={s} patch={patch} onContinue={() => patch({ step: 'goals' })} onBack={() => patch({ step: 'email-verify' })} />}

      {s.step === 'goals' && (
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">What brings you to PROFILE?</h1>
          <p className="mb-5 text-sm text-text-1">Select all that apply.</p>
          <div className="mb-6 grid grid-cols-2 gap-2">
            {ONBOARDING_GOALS.map((g) => {
              const checked = s.goals.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => patch({ goals: checked ? s.goals.filter((x) => x !== g) : [...s.goals, g] })}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium ${
                    checked ? 'border-accent bg-surface-sunken text-text-0' : 'border-border text-text-1'
                  }`}
                >
                  {g}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => patch({ step: 'profile-setup' })}>Continue</Button>
            <Button variant="secondary" onClick={() => patch({ step: 'consent' })}>
              Back
            </Button>
          </div>
        </div>
      )}

      {s.step === 'profile-setup' && (
        <ProfileSetupStep
          s={s}
          patch={patch}
          onContinue={() => {
            finalizeIndividualAccount()
            const branch = journeyBranchFor(s.careerStage)
            patch({ step: branch ? 'journey-setup' : 'done' })
          }}
          onBack={() => patch({ step: 'goals' })}
        />
      )}

      {s.step === 'journey-setup' && (
        <JourneySetupStep s={s} patch={patch} onContinue={() => patch({ step: 'done' })} onBack={() => patch({ step: 'profile-setup' })} />
      )}

      {s.step === 'done' && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-success bg-surface-sunken text-2xl font-bold text-success">
            ✓
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Your PROFILE exists.</h1>
          <p className="mb-6 text-sm leading-relaxed text-text-1">
            Nothing is verified yet, and that's expected — the next few minutes are about recording one real thing
            and asking someone to confirm it.
          </p>
          <Button onClick={() => navigate('/onboarding')}>Continue to your first record</Button>
        </div>
      )}
    </AuthChrome>
  )
}

function AccountTypeStep({
  s,
  patch,
  onContinue,
}: {
  s: WizardState
  patch: (p: Partial<WizardState>) => void
  onContinue: () => void
}) {
  const canContinue = (s.accountKind === 'individual' && !!s.pathway) || (s.accountKind === 'organisation' && !!s.orgType)
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">What best describes you?</h1>
      <p className="mb-5 text-sm text-text-1">This shapes what PROFILE shows you first. Nothing here is permanent.</p>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">Individual</div>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(INDIVIDUAL_CATEGORIES) as Pathway[]).map((p) => {
          const on = s.accountKind === 'individual' && s.pathway === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => patch({ accountKind: 'individual', pathway: p, orgType: null })}
              className={`rounded-lg border p-3 text-left ${on ? 'border-accent bg-surface-sunken' : 'border-border'}`}
            >
              <div className="mb-1 text-sm font-semibold capitalize text-text-0">{p}</div>
              <div className="text-[11px] leading-snug text-text-1">{INDIVIDUAL_CATEGORIES[p].description}</div>
            </button>
          )
        })}
      </div>

      {s.accountKind === 'individual' && (
        <div className="mb-6">
          <Field label="Where are you in your career right now? (optional)">
            <SelectInput value={s.careerStage ?? ''} onChange={(e) => patch({ careerStage: (e.target.value || null) as WizardState['careerStage'] })}>
              <option value="">Prefer not to say</option>
              {CAREER_STAGE_OPTIONS.map((cs) => (
                <option key={cs} value={cs}>
                  {CAREER_STAGE_LABELS[cs]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      )}

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">Organisation, institution or government</div>
      <div className="mb-5">
        <SelectInput
          value={s.orgType ?? ''}
          onChange={(e) => patch({ accountKind: 'organisation', orgType: (e.target.value || null) as OrganisationType, pathway: null, careerStage: null })}
        >
          <option value="">Select organisation type…</option>
          {ORGANISATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectInput>
      </div>

      <Button disabled={!canContinue} onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}

const RESEND_COOLDOWN_SECONDS = 30

/**
 * §3.3/§3.4 Verify Email — a real six-digit input (auto-advance, paste,
 * backspace navigation, keyboard support), resend with a real cooldown
 * timer, and a change-email path back to Step One. No email backend exists
 * in this build (honestly disclosed), so any 6 digits verify — but the
 * interaction itself is real, not a placeholder.
 */
function EmailVerifyStep({
  s,
  patch,
  email,
  onVerified,
  onChangeEmail,
}: {
  s: WizardState
  patch: (p: Partial<WizardState>) => void
  email: string
  onVerified: () => void
  onChangeEmail: () => void
}) {
  const digits = s.otp.padEnd(6, ' ').split('').map((d) => (d === ' ' ? '' : d))
  const [cooldown, setCooldown] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const inputRefs = useState(() => Array.from({ length: 6 }, () => null as HTMLInputElement | null))[0]

  useEffect(() => {
    if (cooldown === 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function setDigitAt(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]
    next[index] = clean
    patch({ otp: next.join('').replace(/\s/g, '') })
    if (clean && index < 5) inputRefs[index + 1]?.focus()
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    patch({ otp: pasted })
    inputRefs[Math.min(pasted.length, 5)]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs[index - 1]?.focus()
  }

  const complete = /^\d{6}$/.test(s.otp)
  const invalid = attempted && !complete

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Verify your email</h1>
      <p className="mb-5 text-sm text-text-1">We sent a 6-digit code to {email || 'your email address'}.</p>
      <Field label="6-digit code" error={invalid ? 'Enter all 6 digits.' : undefined}>
        <div className="flex gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs[i] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigitAt(i, e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Digit ${i + 1} of 6`}
              className="h-14 w-11 rounded-lg border border-border-strong bg-surface text-center font-mono text-xl font-semibold text-text-0 outline-none focus-visible:border-accent"
            />
          ))}
        </div>
      </Field>
      <p className="mb-1 mt-2 text-xs text-text-1">Any 6-digit code works in this demo build — no email backend exists yet.</p>
      <div className="mb-5 flex items-center gap-3 text-xs">
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={() => setCooldown(RESEND_COOLDOWN_SECONDS)}
          className="font-semibold text-accent disabled:text-text-2"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        <span className="text-text-2">·</span>
        <button type="button" onClick={onChangeEmail} className="font-semibold text-accent">
          Change email
        </button>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setAttempted(true)
            if (complete) onVerified()
          }}
        >
          Verify and continue
        </Button>
        <Button variant="secondary" onClick={onChangeEmail}>
          Back
        </Button>
      </div>
    </div>
  )
}

function ConsentStep({
  s,
  patch,
  onContinue,
  onBack,
}: {
  s: WizardState
  patch: (p: Partial<WizardState>) => void
  onContinue: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Before you continue</h1>
      <p className="mb-5 text-sm text-text-1">Two agreements — each links to the full document.</p>
      <div className="mb-6 flex flex-col gap-3">
        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5">
          <input type="checkbox" checked={s.consentIdentity} onChange={(e) => patch({ consentIdentity: e.target.checked })} className="mt-0.5" />
          <span className="text-sm text-text-0">
            I agree to the{' '}
            <Link to="/identity-agreement" className="text-accent">
              Identity & Authenticity Agreement
            </Link>
            ,{' '}
            <Link to="/verification-consent" className="text-accent">
              Verification Routing Consent
            </Link>
            , and{' '}
            <Link to="/conduct" className="text-accent">
              Professional Conduct Standards
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5">
          <input type="checkbox" checked={s.consentPrivacy} onChange={(e) => patch({ consentPrivacy: e.target.checked })} className="mt-0.5" />
          <span className="text-sm text-text-0">
            I agree to the{' '}
            <Link to="/privacy" className="text-accent">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/dpa" className="text-accent">
              Data Processing Agreement
            </Link>
            .
          </span>
        </label>
      </div>
      <div className="flex gap-2">
        <Button disabled={!s.consentIdentity || !s.consentPrivacy} onClick={onContinue}>
          Continue
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}

function ProfileSetupStep({
  s,
  patch,
  onContinue,
  onBack,
}: {
  s: WizardState
  patch: (p: Partial<WizardState>) => void
  onContinue: () => void
  onBack: () => void
}) {
  const RESERVED_USERNAMES = ['admin', 'profile', 'settings', 'help', 'support', 'about', 'trust']
  const normalizedUsername = s.username.trim().toLowerCase()
  const usernameTaken = RESERVED_USERNAMES.includes(normalizedUsername) || !!findAccountByUsername(normalizedUsername)
  const usernameValid = /^[a-z0-9_]{3,20}$/i.test(s.username) && !usernameTaken
  const canContinue = usernameValid

  function handlePhoto(e: ChangeEvent<HTMLInputElement>, key: 'profilePhoto' | 'coverPhoto') {
    const file = e.target.files?.[0]
    if (!file) return
    // Real resize pipeline (mediaStore.ts) rather than a throwaway blob: URL —
    // the result is a persistable data URL, the same shape Settings' photo
    // upload already produces, so finalizeIndividualAccount can actually save it.
    resizeImage(file, key === 'coverPhoto' ? 1600 : 480)
      .then((dataUrl) => patch({ [key]: dataUrl } as Partial<WizardState>))
      .catch(() => {
        // best-effort demo scaffolding — an invalid file just leaves the field empty
      })
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Set up your PROFILE</h1>
      <p className="mb-5 text-sm text-text-1">A profile picture and cover image — both optional, both changeable any time.</p>

      <div className="mb-5 overflow-hidden rounded-xl border border-border">
        <label
          className="flex h-32 cursor-pointer items-center justify-center bg-surface-sunken bg-cover bg-center"
          style={s.coverPhoto ? { backgroundImage: `url(${s.coverPhoto})` } : undefined}
        >
          {!s.coverPhoto && <span className="text-xs font-medium text-text-1">Add a cover image (1500×400px+)</span>}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e, 'coverPhoto')} />
        </label>
        <div className="flex items-center gap-3.5 bg-surface p-4">
          <label
            className="-mt-9 flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-full border-4 border-surface bg-accent bg-cover bg-center text-white shadow"
            style={s.profilePhoto ? { backgroundImage: `url(${s.profilePhoto})` } : undefined}
          >
            {!s.profilePhoto && <span className="text-[9px] font-medium leading-tight">Add photo</span>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e, 'profilePhoto')} />
          </label>
          <div className="text-sm font-semibold text-text-0">{s.legalName.trim() || 'Your name'}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3.5">
        <Field label="Username" error={s.username && !usernameValid ? (usernameTaken ? 'That username is taken.' : '3–20 letters, numbers, or underscores.') : undefined}>
          <TextInput value={s.username} onChange={(e) => patch({ username: e.target.value.replace(/\s/g, '') })} placeholder="e.g. amaraokafor" />
        </Field>
        <Field label="Professional headline (optional)">
          <TextInput value={s.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder="e.g. Structural Engineer" />
        </Field>
        <Field label="How should PROFILE build your first CV draft?">
          <SelectInput value={s.generationMode} onChange={(e) => patch({ generationMode: e.target.value as WizardState['generationMode'] })}>
            <option value="ai_auto">Instant AI draft, fully editable</option>
            <option value="manual">Blank slate, guided sections</option>
            <option value="hybrid">AI draft + manual customisation</option>
          </SelectInput>
        </Field>
      </div>

      <div className="mb-5 rounded-lg border border-border bg-surface-sunken p-3.5 text-xs text-text-1">
        That's it — no ID, no CV, no certificates. Verification happens later, per record, only when you choose to
        request it.
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canContinue} onClick={onContinue}>
          Continue
        </Button>
        <Button variant="secondary" onClick={onContinue}>
          Skip for now
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}

function JourneySetupStep({
  s,
  patch,
  onContinue,
  onBack,
}: {
  s: WizardState
  patch: (p: Partial<WizardState>) => void
  onContinue: () => void
  onBack: () => void
}) {
  const branch = journeyBranchFor(s.careerStage)
  const academicOptions = [
    'Foundation / Pre-university',
    'Year 1 (Bachelor’s / Poly / Diploma)',
    'Year 2',
    'Year 3',
    'Final Year',
    'Master’s — Year 1',
    'Master’s — Final Year',
    'PhD — Early Stage',
    'PhD — Final Stage',
    'Postgraduate Diploma',
  ]
  const independentOptions = ['Just starting out', 'Building a body of work', 'Already taking on clients or selling']

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">
        {branch === 'academic' ? 'What stage are you starting at?' : 'Where are you in building your craft?'}
      </h1>
      <div className="mb-5 flex flex-col gap-3.5">
        <Field label="Stage">
          <SelectInput value={s.journeyStage} onChange={(e) => patch({ journeyStage: e.target.value })}>
            <option value="">Select…</option>
            {(branch === 'academic' ? academicOptions : independentOptions).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </SelectInput>
        </Field>
        {branch === 'academic' ? (
          <Field label="Field of study">
            <TextInput value={s.fieldOfStudy} onChange={(e) => patch({ fieldOfStudy: e.target.value })} placeholder="e.g. Civil Engineering" />
          </Field>
        ) : (
          <Field label="Craft or trade area">
            <TextInput value={s.craftArea} onChange={(e) => patch({ craftArea: e.target.value })} placeholder="e.g. Furniture making" />
          </Field>
        )}
      </div>
      {branch === 'independent' && (
        <p className="mb-5 text-xs text-text-1">
          You'll be offered a draft Marketplace Store listing next — set up now, published only when you're ready.
        </p>
      )}
      <div className="flex gap-2">
        <Button disabled={!s.journeyStage} onClick={onContinue}>
          Continue
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}

function OrgDoneStep({ orgType }: { orgType: OrganisationType }) {
  const hub = hubForOrgType(orgType)
  const workspacePath = hub === 'institutional_hub' ? '/institution/me' : hub === 'regulatory_console' ? '/government/me' : '/org/me/talent'
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-warning bg-surface-sunken text-2xl font-bold text-warning">
        ◷
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Submitted for review</h1>
      <p className="mb-6 text-sm leading-relaxed text-text-1">
        Your {orgType} workspace request is in. A PROFILE team member confirms your organisation's domain before
        the workspace goes live — this usually takes 2–5 business days.
      </p>
      <Link to={workspacePath} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white">
        Go to your workspace
      </Link>
    </div>
  )
}
