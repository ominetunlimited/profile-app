import { Building2, Check, User } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
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
import { captureSession, emailIsRegistered, ensureSignedInAs, findAccountByUsername, restoreSession, saveDemoAccount } from '@/app/demoAccountStore'
import { resizeImage, saveAvatar, saveCover } from '@/app/mediaStore'
import { followOrg } from '@/app/followStore'

const INDIVIDUAL_STEP_ORDER = ['account-type', 'individual-info', 'consent', 'goals', 'profile-setup', 'journey-setup', 'done']
const INDIVIDUAL_STEP_NAMES: Record<string, string> = {
  'account-type': 'Choose account type',
  'individual-info': 'Create identity',
  consent: 'Consent',
  goals: 'Your goals',
  'profile-setup': 'Set up your PROFILE',
  'journey-setup': 'Journey setup',
  done: 'Done',
}
// 'individual-info' is borrowed from the individual flow
// when a not-yet-signed-in founder chooses "create my identity now" at the
// final org-identity-choice step (§2 override) — included here so the
// progress bar stays meaningful during that branch instead of resetting.
const ORG_STEP_ORDER = ['account-type', 'org-info', 'org-consent', 'org-identity-choice', 'individual-info', 'org-done']
const ORG_STEP_NAMES: Record<string, string> = {
  'account-type': 'Choose account type',
  'org-info': 'Workspace identity',
  'org-consent': 'Consent',
  'org-identity-choice': 'Link your identity',
  'individual-info': 'Create your identity',
  'org-done': 'Submitted',
}

/**
 * Bug report: user filled the form with a password that (invisibly to them)
 * lacked an uppercase letter, checked the terms box, and the Verify Email
 * button stayed disabled — the only explanation was one line of red text
 * below the whole form, easy to miss. `passwordMeetsPolicy` itself was never
 * wrong; the problem was that its five conditions were invisible while
 * typing. This renders each condition live, right under the field it
 * concerns, so "which requirement isn't met yet" is never a mystery.
 */
function PasswordRequirements({ password }: { password: string }) {
  const checks: [string, boolean][] = [
    ['8+ characters', password.length >= 8],
    ['One uppercase letter (A-Z)', /[A-Z]/.test(password)],
    ['One lowercase letter (a-z)', /[a-z]/.test(password)],
    ['One number (0-9)', /[0-9]/.test(password)],
    ['One symbol (e.g. ! @ # $)', /[^A-Za-z0-9]/.test(password)],
  ]
  return (
    <ul className="mt-1.5 grid grid-cols-1 gap-0.5 text-[11.5px] sm:grid-cols-2">
      {checks.map(([label, met]) => (
        <li key={label} className={met ? 'text-success' : 'text-text-2'}>
          {met ? '✓' : '○'} {label}
        </li>
      ))}
    </ul>
  )
}

/** §8 Registration & Onboarding System, in full — not the Handoff's compressed
 * 5-step prototype, per build doc §1's instruction that the Master Prompt
 * governs business logic/feature existence even where the Handoff simplified
 * it for the mockup. Visual chrome (progress header, card, input styling)
 * still follows the Handoff's Account Creation screen exactly. */
export function AccountCreationWizard() {
  const [s, setS] = useState<WizardState>(initialWizardState)
  // A real, visible, required checkbox at the very first data-entry step —
  // on top of (not instead of) §8.6's fuller two-document ConsentStep after
  // email verification. Reported bug: the disabled Continue/Verify Email
  // button gave no visible reason it was disabled, so an unchecked
  // agreement box (easy to miss when it's just a sentence of body text)
  // looked identical to a broken button. Making it a real checkbox makes
  // the missing step visible and interactive instead of invisible.
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const { account, setAccount } = useAccount()
  const navigate = useNavigate()
  const [wizardError, setWizardError] = useState<string | null>(null)

  const isOrgPath = s.accountKind === 'organisation'
  const stepOrder = isOrgPath ? ORG_STEP_ORDER : INDIVIDUAL_STEP_ORDER
  const stepNames = isOrgPath ? ORG_STEP_NAMES : INDIVIDUAL_STEP_NAMES
  const visibleIndex = stepOrder.indexOf(s.step)
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
    s.confirmPassword === s.password &&
    agreeToTerms

  const orgValid =
    s.orgLegalName.trim().length > 1 &&
    isOfficialDomainEmail(s.officialEmail) &&
    !emailIsRegistered(s.officialEmail) &&
    !!countryRec &&
    passwordMeetsPolicy(s.orgPassword) &&
    s.orgConfirmPassword === s.orgPassword

  async function finalizeIndividualAccount(): Promise<boolean> {
    const newAccount = {
      accountType: 'individual' as const,
      pathway: s.pathway!,
      careerStage: s.careerStage ?? undefined,
      legalName: s.legalName,
      // Bug fix: captured at Step 2 (§8.5) but never saved to the finalized
      // account — same "collected then silently discarded" class of bug as
      // the profile/cover photos above.
      username: s.username || undefined,
      headline: s.headline || undefined,
      email: s.email,
      country: s.country,
    }
    try {
      await saveDemoAccount(s.email, s.password, newAccount, 'private')
    } catch (err) {
      // Real failure mode now that this hits a real backend (e.g. the email
      // actually got registered a moment ago, on this device or another) —
      // send them back to fix it instead of silently stalling mid-wizard.
      setWizardError(err instanceof Error ? err.message : 'Could not create your account. Please try again.')
      patch({ step: 'individual-info' })
      return false
    }
    // Bug fix: §8.8's profilePicture/coverPicture were captured into wizard
    // state and previewed, but never actually saved anywhere — completing
    // registration silently discarded them. Now persisted through the same
    // real pipeline Settings' photo upload uses (mediaStore.ts).
    // Best-effort: the account exists either way, and Settings can retry the upload.
    if (s.profilePhoto) await saveAvatar(s.email, s.profilePhoto).catch(() => undefined)
    if (s.coverPhoto) await saveCover(s.email, s.coverPhoto).catch(() => undefined)
    setAccount(newAccount)
    setWizardError(null)
    return true
  }

  /**
   * V9 Unified Ecosystem Patch §2 override — `creatorEmail` is the human
   * identity this org is now linked to: either the person who was already
   * signed in as an individual, or the one just created inline via
   * `orgFinalizeAfterIndividual`. New, not in the old §8.4.1 flow: that
   * individual auto-follows the organisation the moment the link completes.
   */
  const [submitting, setSubmitting] = useState(false)
  async function afterIdentity() {
    setSubmitting(true)
    try {
      // This individual identity may exist purely to link to the organisation being registered
      // (a founder who chose "create my identity now"); finalize both here.
      if (s.orgFinalizeAfterIndividual) {
        if (!(await finalizeIndividualAccount())) return
        if (!(await finalizeOrgAccount(s.email))) return
        patch({ step: 'org-done' })
      } else {
        patch({ step: 'consent' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function finalizeOrgAccount(creatorEmail: string): Promise<boolean> {
    const newAccount = {
      accountType: 'organisation' as const,
      orgType: s.orgType!,
      legalName: s.orgLegalName,
      officialEmail: s.officialEmail,
      country: s.country,
      registryLevel: 'user_submitted' as const,
      orgRole: 'super_admin' as const,
    }
    // saveDemoAccount's signUp below switches the active Supabase session to
    // the new org — capture whoever is signed in right now (the human
    // founder, if any) so followOrg can run as them afterward: RLS ties
    // follows.follower_email to current_account_email(), and the founder's
    // password isn't something this wizard necessarily still has on hand.
    const creatorSession = await captureSession()
    try {
      await saveDemoAccount(s.officialEmail, s.orgPassword, newAccount)
    } catch (err) {
      setWizardError(err instanceof Error ? err.message : 'Could not create the workspace. Please try again.')
      patch({ step: 'org-info' })
      return false
    }
    if (creatorEmail) {
      await restoreSession(creatorSession)
      await followOrg(creatorEmail, s.officialEmail)
      // The active session must end up matching AccountContext's newAccount
      // (the org) for every subsequent RLS-checked action in this session.
      await ensureSignedInAs(s.officialEmail, s.orgPassword)
    }
    setAccount(newAccount)
    setWizardError(null)
    return true
  }

  return (
    <AuthChrome maxWidth={560} progress={progress}>
      {wizardError && (
        <div role="alert" aria-live="polite" className="mb-4 rounded-lg border border-danger bg-surface-sunken p-3 text-sm text-text-0">
          {wizardError}
        </div>
      )}
      {s.step === 'account-type' && (
        <AccountTypeStep
          s={s}
          patch={patch}
          onContinue={() => {
            if (s.accountKind === 'individual' && s.pathway) patch({ step: 'individual-info' })
            // §2 override — organisation registration no longer requires a
            // pre-existing individual account; it always starts here now.
            // The human identity link happens at org-identity-choice, the
            // LAST step, not as a prerequisite before this one.
            if (s.accountKind === 'organisation' && s.orgType) patch({ step: 'org-info' })
          }}
        />
      )}

      {s.step === 'org-info' && (
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Set up the workspace</h1>
          <p className="mb-4 text-sm leading-relaxed text-text-1">Registering a {s.orgType} workspace.</p>
          {account?.accountType === 'individual' && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-success bg-surface-sunken p-3">
              <UserAvatar ownerEmail={account.email} name={account.legalName} size={32} />
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
            <span className="font-mono font-semibold">user_submitted</span>.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" disabled={!orgValid} onClick={() => patch({ step: 'org-consent' })}>
              Continue
            </Button>
            <Button variant="ghost" className="w-full border border-border-strong sm:w-auto" onClick={() => patch({ step: 'account-type' })}>
              Back
            </Button>
          </div>
        </div>
      )}

      {s.step === 'org-consent' && (
        <ConsentStep
          s={s}
          patch={patch}
          onContinue={async () => {
            // §2 override — if this browser is already signed in as an
            // individual, that's the identity link, exactly as before.
            // Otherwise defer to org-identity-choice, the new final step.
            if (account?.accountType === 'individual') {
              if (!(await finalizeOrgAccount(account.email))) return
              patch({ step: 'org-done' })
            } else {
              patch({ step: 'org-identity-choice' })
            }
          }}
          onBack={() => patch({ step: 'org-info' })}
        />
      )}

      {s.step === 'org-identity-choice' && (
        <OrgIdentityChoiceStep
          onSignIn={() => navigate('/auth?mode=signin')}
          onCreateIdentity={(pathway) => patch({ orgFinalizeAfterIndividual: true, pathway, step: 'individual-info' })}
          onBack={() => patch({ step: 'org-consent' })}
        />
      )}

      {s.step === 'org-done' && <OrgDoneStep orgType={s.orgType!} />}

      {s.step === 'individual-info' && (
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Create your identity</h1>
          <p className="mb-5 text-sm text-text-1">Just enough to get you in. Everything else comes later, on your terms.</p>
          <div className="mb-4 flex flex-col gap-3.5">
            <Field label="Full name">
              <TextInput value={s.legalName} onChange={(e) => patch({ legalName: e.target.value })} placeholder="As it appears on your ID" />
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
            <Field label="Password">
              <PasswordInput value={s.password} onChange={(e) => patch({ password: e.target.value })} placeholder="At least 8 characters" />
              <PasswordRequirements password={s.password} />
            </Field>
            <Field label="Confirm password" error={s.confirmPassword && s.confirmPassword !== s.password ? "Passwords don't match yet." : undefined}>
              <PasswordInput value={s.confirmPassword} onChange={(e) => patch({ confirmPassword: e.target.value })} placeholder="Type it again" />
            </Field>
          </div>
          <label className="mb-5 flex items-start gap-2.5 rounded-lg border border-border-strong bg-surface p-3 text-xs text-text-1">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none"
            />
            <span>
              I agree to PROFILE's{' '}
              <Link to="/terms" className="text-accent" onClick={(e) => e.stopPropagation()}>
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-accent" onClick={(e) => e.stopPropagation()}>
                Privacy Policy
              </Link>
              . You'll review both again, in full, after verifying your email.
            </span>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" disabled={!individualValid || submitting} onClick={() => void afterIdentity()}>
              {submitting ? 'Creating…' : 'Continue'}
            </Button>
            <Button variant="ghost" className="w-full border border-border-strong sm:w-auto" onClick={() => patch({ step: s.orgFinalizeAfterIndividual ? 'org-identity-choice' : 'account-type' })}>
              Back
            </Button>
          </div>
          {!individualValid && (
            <p role="alert" aria-live="polite" className="mt-3 text-xs text-danger">
              {(() => {
                if (s.legalName.trim().length <= 1) return 'Enter your full name.'
                if (!countryRec) return 'Select your country.'
                if (s.dob === '') return 'Enter your date of birth.'
                if (dobUnderage) return `You need to be at least ${countryRec?.minAge} in ${s.country} to create a PROFILE account.`
                if (!isValidEmail(s.email)) return 'Enter a valid email address.'
                if (emailIsRegistered(s.email)) return 'An account already exists with this email — try signing in instead.'
                if (!passwordMeetsPolicy(s.password)) return 'Password needs 8+ characters, uppercase, lowercase, a number, and a symbol.'
                if (s.confirmPassword !== s.password) return "Passwords don't match yet."
                if (!agreeToTerms) return 'Check the box above to agree to the Terms and Privacy Policy.'
                return null
              })()}
            </p>
          )}
        </div>
      )}

      {s.step === 'consent' && <ConsentStep s={s} patch={patch} onContinue={() => patch({ step: 'goals' })} onBack={() => patch({ step: 'individual-info' })} />}

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
                  aria-pressed={checked}
                  className={`flex min-h-[48px] items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors ${
                    checked ? 'border-accent bg-accent-soft text-text-0' : 'border-border text-text-1 hover:border-border-strong'
                  }`}
                >
                  <span aria-hidden className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-[1.5px] ${checked ? 'border-accent bg-accent-solid text-white' : 'border-border-strong text-transparent'}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12l5 5 11-11" /></svg>
                  </span>
                  {g}
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" onClick={() => patch({ step: 'profile-setup' })}>Continue</Button>
            <Button variant="ghost" className="w-full border border-border-strong sm:w-auto" onClick={() => patch({ step: 'consent' })}>
              Back
            </Button>
          </div>
        </div>
      )}

      {s.step === 'profile-setup' && (
        <ProfileSetupStep
          s={s}
          patch={patch}
          onContinue={async () => {
            if (!(await finalizeIndividualAccount())) return
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
  const kinds = [
    { key: 'individual' as const, title: 'Individual', body: 'A person building a verified professional record: professionals, tradespeople, students, creatives.', Icon: User },
    { key: 'organisation' as const, title: 'Organisation', body: 'A company, institution, school, agency or association that hires, verifies or collaborates.', Icon: Building2 },
  ]
  const check = (on: boolean) => (
    <span aria-hidden className={`absolute end-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] ${on ? 'border-accent bg-accent-solid text-white' : 'border-border-strong text-transparent'}`}>
      <Check size={12} strokeWidth={3.2} />
    </span>
  )
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Who is this account for?</h1>
      <p className="mb-5 text-sm text-text-1">Choose one. You will not need to create a second account to do something else later.</p>

      <div role="radiogroup" aria-label="Account type" className="mb-6 grid gap-3 sm:grid-cols-2">
        {kinds.map(({ key, title, body, Icon }) => {
          const on = s.accountKind === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => patch(key === 'individual' ? { accountKind: 'individual', orgType: null } : { accountKind: 'organisation', pathway: null, careerStage: null })}
              className={`relative flex min-h-[132px] flex-col gap-2 rounded-2xl border-[1.5px] p-5 pe-12 text-left transition-colors ${on ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong'}`}
            >
              {check(on)}
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${on ? 'bg-accent-solid text-white' : 'bg-surface-sunken text-text-1'}`}>
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="text-[16px] font-semibold text-text-0">{title}</span>
              <span className="text-[12.5px] leading-snug text-text-1">{body}</span>
            </button>
          )
        })}
      </div>

      {s.accountKind === 'individual' && (
        <section aria-labelledby="path-h" className="mb-6">
          <h2 id="path-h" className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">What best describes your work?</h2>
          <div className="mb-5 grid grid-cols-1 gap-2">
            {(Object.keys(INDIVIDUAL_CATEGORIES) as Pathway[]).map((p) => {
              const on = s.pathway === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => patch({ pathway: p })}
                  aria-pressed={on}
                  className={`relative min-h-[84px] rounded-xl border-[1.5px] p-4 pe-11 text-left transition-colors ${on ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong'}`}
                >
                  {check(on)}
                  <div className="mb-1 text-[15px] font-semibold capitalize text-text-0">{p}</div>
                  <div className="text-[12.5px] leading-snug text-text-1">{INDIVIDUAL_CATEGORIES[p].description}</div>
                </button>
              )
            })}
          </div>
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
        </section>
      )}

      {s.accountKind === 'organisation' && (
        <section aria-labelledby="org-h" className="mb-6">
          <h2 id="org-h" className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">What kind of organisation?</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ORGANISATION_TYPES.map((t) => {
              const on = s.orgType === t
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ orgType: t as OrganisationType })}
                  className={`min-h-[48px] rounded-xl border-[1.5px] px-3 py-2 text-left text-[13px] font-medium transition-colors ${on ? 'border-accent bg-accent-soft text-text-0' : 'border-border text-text-1 hover:border-border-strong'}`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </section>
      )}

      <Button className="w-full sm:w-auto" disabled={!canContinue} onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}

/**
 * V9 Unified Ecosystem Patch §2 override's final step — the human identity
 * link the old §8.4.1 rule required up front, now asked only once the
 * workspace itself is fully filled in. "The organisation account cannot
 * become active... until that human identity link exists" is honoured:
 * finalizeOrgAccount() is only ever called after one of these two paths
 * completes, never before.
 */
function OrgIdentityChoiceStep({
  onSignIn,
  onCreateIdentity,
  onBack,
}: {
  onSignIn: () => void
  onCreateIdentity: (pathway: Pathway) => void
  onBack: () => void
}) {
  const [pathway, setPathway] = useState<Pathway | null>(null)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Link your identity</h1>
      <p className="mb-5 text-sm leading-relaxed text-text-1">
        Almost done. This workspace stays inactive — no posting, no submitting for verification, no inviting staff —
        until a real person is linked to it as its founder.
      </p>

      <div className="mb-5 rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-text-0">Already have a PROFILE account?</p>
        <Button variant="secondary" onClick={onSignIn}>
          Sign in with my @handle
        </Button>
        <p className="mt-2 text-[11px] text-text-2">This takes you to Sign In — you'll need to re-enter the workspace details above afterward.</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-text-0">New to PROFILE? Create your identity now, without leaving this workspace setup.</p>
        <p className="mb-2 text-xs text-text-2">What best describes you?</p>
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(INDIVIDUAL_CATEGORIES) as Pathway[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPathway(p)}
              className={`rounded-lg border p-2.5 text-left text-xs capitalize ${pathway === p ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <Button disabled={!pathway} onClick={() => pathway && onCreateIdentity(pathway)}>
          Continue to identity setup
        </Button>
      </div>

      <button onClick={onBack} className="mt-4 text-xs font-semibold text-text-1">
        ← Back
      </button>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button className="w-full sm:w-auto" disabled={!s.consentIdentity || !s.consentPrivacy} onClick={onContinue}>
          Continue
        </Button>
        <Button variant="ghost" className="w-full border border-border-strong sm:w-auto" onClick={onBack}>
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
            className="-mt-9 flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-full border-4 border-surface bg-accent-solid bg-cover bg-center text-white shadow"
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button className="w-full sm:w-auto" disabled={!s.journeyStage} onClick={onContinue}>
          Continue
        </Button>
        <Button variant="ghost" className="w-full border border-border-strong sm:w-auto" onClick={onBack}>
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
      <Link to={workspacePath} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent-solid px-5 text-sm font-semibold text-white">
        Go to your workspace
      </Link>
    </div>
  )
}
