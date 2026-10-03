import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthChrome } from './AuthChrome'
import { Button } from '@/shared/ui/Button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/Field'
import { resetPassword } from '@/app/demoAccountStore'
import { supabase } from '@/app/supabaseClient'
import { passwordMeetsPolicy } from '@/app/accountTypes'

type RecoveryMethod = 'email' | 'phone' | 'device' | 'identity'
type Step = 'choose' | 'email-sent'

/**
 * §7.3 Account Recovery Flows — previously a genuinely dead link: SignInForm's
 * "Forgot password?" pointed at `/auth?mode=recover`, which AuthPage.tsx never
 * branched on, so it silently re-rendered the Sign In form with nothing
 * changed. All 4 paths are listed as real options; only path 1 (email reset
 * link) is fully implemented end-to-end — the other three are named honestly
 * with what they'd actually require (a phone/SMS backend, a real trusted-
 * device registry, and human admin review).
 *
 * Pipeline repair Phase A: this now sends a real Supabase Auth recovery
 * email (`resetPassword` → `supabase.auth.resetPasswordForEmail`) instead of
 * the old "any 6-digit code works" demo theater — that shortcut let anyone
 * take over any account just by knowing its email, which is a real
 * vulnerability once this is wired to a real backend. The link in that email
 * lands on `/auth/reset-password` (`ResetPasswordCallback` below), which is
 * where the new password is actually set.
 */
export function AccountRecoveryFlow() {
  const [method, setMethod] = useState<RecoveryMethod | null>(null)
  const [step, setStep] = useState<Step>('choose')
  const [email, setEmail] = useState('')

  if (method === null) {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Recover your account</h1>
        <p className="mb-5 text-sm text-text-1">Choose how you'd like to recover access.</p>
        <div className="flex flex-col gap-2">
          <RecoveryOption label="Email reset link" onClick={() => setMethod('email')} />
          <RecoveryOption label="Phone OTP recovery" note="Coming soon." onClick={() => setMethod('phone')} />
          <RecoveryOption label="Trusted device confirmation" note="Coming soon." onClick={() => setMethod('device')} />
          <RecoveryOption label="Identity recovery (admin-assisted)" note="Coming soon." onClick={() => setMethod('identity')} />
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
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Not available yet</h1>
        <p className="mb-5 text-sm text-text-1">
          {method === 'phone' && 'Phone recovery is not available yet. Use the email reset link instead.'}
          {method === 'device' && 'Trusted-device recovery is not available yet. Use the email reset link instead.'}
          {method === 'identity' && 'Assisted recovery is not available yet. Use the email reset link instead.'}
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
        <Button
          className="mt-4 w-full"
          disabled={!email.trim()}
          onClick={async () => {
            await resetPassword(email)
            setStep('email-sent')
          }}
        >
          Send reset link
        </Button>
      </AuthChrome>
    )
  }

  // Generic response regardless of whether the email is registered — never
  // confirm/deny which emails exist, the same principle a real backend uses.
  return (
    <AuthChrome>
      <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Check your email</h1>
      <p className="mb-5 text-sm text-text-1">
        If an account exists for {email}, a password reset link was sent — it may take a minute to arrive, and it's
        worth checking spam. Open it on this device to set a new password.
      </p>
      <Link to="/auth" className="text-sm font-semibold text-accent">
        ← Back to sign in
      </Link>
    </AuthChrome>
  )
}

/**
 * The far end of the real email link `resetPassword` sends. Supabase's
 * client auto-detects the recovery token in the URL and fires a
 * PASSWORD_RECOVERY auth event with a live session — this just waits for
 * that, then calls `supabase.auth.updateUser` with the new password.
 */
export function ResetPasswordCallback() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // If the tab was already open when the link redirected here, the event
    // may have already fired by the time this effect subscribes — a session
    // being present is the fallback signal.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const meetsPolicy = passwordMeetsPolicy(newPassword)
  const match = newPassword === confirmPassword && newPassword.length > 0

  if (done) {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Password reset</h1>
        <p className="mb-5 text-sm text-text-1">Your password has been updated.</p>
        <Button className="w-full" onClick={() => navigate('/auth')}>
          Sign in
        </Button>
      </AuthChrome>
    )
  }

  if (!ready) {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Checking your reset link…</h1>
        <p className="text-sm text-text-1">
          If this doesn't update in a few seconds, the link may have expired —{' '}
          <Link to="/auth?mode=recover" className="font-semibold text-accent">
            request a new one
          </Link>
          .
        </p>
      </AuthChrome>
    )
  }

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
      {error && (
        <p role="alert" aria-live="polite" className="mb-3 text-xs text-danger">
          {error}
        </p>
      )}
      <Button
        className="w-full"
        disabled={!meetsPolicy || !match}
        onClick={async () => {
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
          if (updateError) {
            setError(updateError.message)
            return
          }
          setDone(true)
        }}
      >
        Reset password
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
