import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthChrome } from './AuthChrome'
import { Button } from '@/shared/ui/Button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/Field'
import { emailIsRegistered, resetPassword } from '@/app/demoAccountStore'
import { passwordMeetsPolicy } from '@/app/accountTypes'

type RecoveryMethod = 'email' | 'phone' | 'device' | 'identity'
type Step = 'choose' | 'email-sent' | 'email-code' | 'email-new-password' | 'email-done'

/**
 * §7.3 Account Recovery Flows — previously a genuinely dead link: SignInForm's
 * "Forgot password?" pointed at `/auth?mode=recover`, which AuthPage.tsx never
 * branched on, so it silently re-rendered the Sign In form with nothing
 * changed. All 4 paths are listed as real options; only path 1 (email reset
 * link) is fully implemented end-to-end — the other three are named honestly
 * with what they'd actually require (a phone/SMS backend, a real trusted-
 * device registry, and human admin review), matching this build's "no email
 * backend, so any 6-digit code works" pattern already established for MFA.
 */
export function AccountRecoveryFlow() {
  const navigate = useNavigate()
  const [method, setMethod] = useState<RecoveryMethod | null>(null)
  const [step, setStep] = useState<Step>('choose')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (method === null) {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Recover your account</h1>
        <p className="mb-5 text-sm text-text-1">Choose how you'd like to recover access.</p>
        <div className="flex flex-col gap-2">
          <RecoveryOption label="Email reset link" onClick={() => setMethod('email')} />
          <RecoveryOption label="Phone OTP recovery" note="Requires an SMS backend — not connected in this build." onClick={() => setMethod('phone')} />
          <RecoveryOption label="Trusted device confirmation" note="Requires a real trusted-device registry — not built in this demo." onClick={() => setMethod('device')} />
          <RecoveryOption label="Identity recovery (admin-assisted)" note="Requires human PROFILE staff review — no support queue exists in this build." onClick={() => setMethod('identity')} />
        </div>
        <div className="mt-5 text-center text-sm text-text-1">
          <Link to="/auth" className="font-semibold text-accent">
            ← Back to sign in
          </Link>
        </div>
      </AuthChrome>
    )
  }

  if (method !== 'email') {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Not available in this build</h1>
        <p className="mb-5 text-sm text-text-1">
          {method === 'phone' && 'Phone OTP recovery needs a real SMS delivery backend, which does not exist yet.'}
          {method === 'device' && 'Trusted device confirmation needs a real per-device registry tied to a backend session, which does not exist yet.'}
          {method === 'identity' && 'Admin-assisted identity recovery needs a real PROFILE staff support queue, which does not exist yet.'}
        </p>
        <Button variant="secondary" onClick={() => setMethod(null)}>
          ← Choose a different method
        </Button>
      </AuthChrome>
    )
  }

  if (step === 'choose') {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Reset your password</h1>
        <p className="mb-5 text-sm text-text-1">Enter the email on your account.</p>
        <Field label="Email address">
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Button className="mt-4 w-full" disabled={!email.trim()} onClick={() => setStep('email-sent')}>
          Send reset code
        </Button>
      </AuthChrome>
    )
  }

  if (step === 'email-sent') {
    // Generic response regardless of whether the email is registered — never
    // confirm/deny which emails exist, the same principle a real backend uses.
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Check your email</h1>
        <p className="mb-5 text-sm text-text-1">
          If an account exists for {email}, a 6-digit reset code was sent. No email backend exists in this demo — any
          6-digit code works, same as sign-in's MFA step.
        </p>
        <Button className="w-full" onClick={() => setStep('email-code')}>
          I have a code
        </Button>
      </AuthChrome>
    )
  }

  if (step === 'email-code') {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Enter your code</h1>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="mb-4 w-full rounded-lg border border-border-strong bg-surface py-3 text-center font-mono text-xl font-semibold tracking-[.3em] text-text-0 outline-none focus-visible:border-accent"
        />
        <Button className="w-full" disabled={!/^\d{6}$/.test(code)} onClick={() => setStep('email-new-password')}>
          Verify code
        </Button>
      </AuthChrome>
    )
  }

  if (step === 'email-new-password') {
    const meetsPolicy = passwordMeetsPolicy(newPassword)
    const match = newPassword === confirmPassword && newPassword.length > 0
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Set a new password</h1>
        <div className="mb-3.5 flex flex-col gap-3.5">
          <Field label="New password" hint="At least 8 characters, mixed case, a number, and a symbol." error={newPassword && !meetsPolicy ? 'Too weak.' : undefined}>
            <PasswordInput showStrength value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <Field label="Confirm new password" error={confirmPassword && !match ? "Passwords don't match." : undefined}>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
        </div>
        <Button
          className="w-full"
          disabled={!meetsPolicy || !match}
          onClick={() => {
            resetPassword(email, newPassword)
            setStep('email-done')
          }}
        >
          Reset password
        </Button>
      </AuthChrome>
    )
  }

  return (
    <AuthChrome>
      <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Password reset</h1>
      <p className="mb-5 text-sm text-text-1">
        {emailIsRegistered(email) ? 'Your password has been updated.' : 'If that email had an account, its password has been updated.'}
      </p>
      <Button className="w-full" onClick={() => navigate('/auth')}>
        Sign in
      </Button>
    </AuthChrome>
  )
}

function RecoveryOption({ label, note, onClick }: { label: string; note?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-border-strong bg-surface p-3 text-left hover:border-accent">
      <div className="text-sm font-semibold text-text-0">{label}</div>
      {note && <div className="mt-0.5 text-xs text-text-2">{note}</div>}
    </button>
  )
}
