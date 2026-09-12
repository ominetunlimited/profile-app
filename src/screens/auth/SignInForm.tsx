import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthChrome } from './AuthChrome'
import { Button } from '@/shared/ui/Button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { findDemoAccount, isKnownDevice, markDeviceKnown } from '@/app/demoAccountStore'

/** §7.1 Sign-In Screen + §7.2 conditional step-up MFA. */
export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [stage, setStage] = useState<'form' | 'mfa'>('form')
  const [mfaCode, setMfaCode] = useState('')
  const { setAccount, setStaffRole } = useAccount()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('return') ? decodeURIComponent(params.get('return')!) : '/home'

  function completeSignIn() {
    const account = findDemoAccount(email, password)
    if (!account) {
      setError(true)
      return
    }
    setError(false)
    setStaffRole(null)
    setAccount(account)
    if (!isKnownDevice()) {
      setStage('mfa')
      return
    }
    navigate(returnTo, { replace: true })
  }

  function finishMfa() {
    if (!/^\d{6}$/.test(mfaCode)) return
    markDeviceKnown()
    navigate(returnTo, { replace: true })
  }

  if (stage === 'mfa') {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Confirm it's you</h1>
        <p className="mb-5 text-sm text-text-1">We sent a 6-digit code to your email — this device hasn't signed in before.</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="mb-4 w-full rounded-lg border border-border-strong bg-surface py-3 text-center font-mono text-xl font-semibold tracking-[.3em] text-text-0 outline-none focus-visible:border-accent"
        />
        <Button className="w-full" disabled={!/^\d{6}$/.test(mfaCode)} onClick={finishMfa}>
          Verify and continue
        </Button>
        <p className="mt-4 text-center text-xs text-text-1">Any 6-digit code works in this demo build — no email backend exists yet.</p>
      </AuthChrome>
    )
  }

  return (
    <AuthChrome>
      <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Sign in</h1>
      <p className="mb-6 text-sm text-text-1">Continue building on proof.</p>

      {error && (
        <div role="alert" aria-live="polite" className="mb-4 rounded-lg border border-danger bg-surface-sunken p-3 text-sm text-text-0">
          That email and password don't match, or no account exists yet with those details.
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3.5">
        <Field label="Email address">
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </Field>
      </div>
      <div className="mb-4 text-right">
        <Link to="/auth?mode=recover" className="text-xs font-semibold text-accent">
          Forgot password?
        </Link>
      </div>
      <Button className="mb-3 w-full" onClick={completeSignIn} disabled={!email || !password}>
        Sign in
      </Button>

      <div className="mb-5 flex items-center gap-3 text-xs text-text-2">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mb-5 flex flex-col gap-2">
        {['Google', 'Microsoft', 'Apple'].map((provider) => (
          <SocialButton key={provider} provider={provider} />
        ))}
      </div>

      <div className="text-center text-sm text-text-1">
        New to PROFILE?{' '}
        <Link to="/auth?mode=signup" className="font-semibold text-accent">
          Open your PROFILE
        </Link>
      </div>
    </AuthChrome>
  )
}

function SocialButton({ provider }: { provider: string }) {
  const [note, setNote] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setNote(true)}
        className="flex w-full items-center justify-center rounded-lg border border-border-strong bg-surface py-2.5 text-sm font-medium text-text-0"
      >
        Continue with {provider}
      </button>
      {note && <p className="mt-1 text-xs text-warning">Social sign-in requires backend OAuth integration — not yet connected.</p>}
    </div>
  )
}
