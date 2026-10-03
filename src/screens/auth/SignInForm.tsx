import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthChrome } from './AuthChrome'
import { Button } from '@/shared/ui/Button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { findDemoAccount } from '@/app/demoAccountStore'
import { recordLogin } from '@/app/sessionStore'
import { pendingTotpFactor, verifyTotpChallenge } from '@/app/mfaStore'
import { supabase } from '@/app/supabaseClient'
import type { Account } from '@/app/accountTypes'
import { ownerKey } from '@/app/activityStore'

/** Sign In, with a real authenticator-app second factor for accounts that have set one up. */
export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [stage, setStage] = useState<'form' | 'mfa'>('form')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaFactor, setMfaFactor] = useState<string | null>(null)
  const [pendingAccount, setPendingAccount] = useState<Account | null>(null)
  const [busy, setBusy] = useState(false)
  const [remember, setRememberState] = useState(false)
  const { setAccount, setStaffRole, setRemember } = useAccount()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('return') ? decodeURIComponent(params.get('return')!) : '/home'

  function enter(account: Account) {
    setStaffRole(null)
    setRemember(remember)
    setAccount(account)
    recordLogin(ownerKey(account))
    navigate(returnTo, { replace: true })
  }

  async function completeSignIn() {
    setBusy(true)
    const account = await findDemoAccount(email, password)
    if (!account) {
      setError(true)
      setBusy(false)
      return
    }
    setError(false)
    // The account is only entered once any second factor is satisfied.
    const factor = await pendingTotpFactor().catch(() => null)
    setBusy(false)
    if (factor) {
      setPendingAccount(account)
      setMfaFactor(factor)
      setStage('mfa')
      return
    }
    enter(account)
  }

  async function finishMfa() {
    if (!/^\d{6}$/.test(mfaCode) || !mfaFactor || !pendingAccount) return
    setBusy(true)
    setMfaError(null)
    try {
      await verifyTotpChallenge(mfaFactor, mfaCode)
      enter(pendingAccount)
    } catch (e) {
      setMfaError((e as Error).message)
      setMfaCode('')
    }
    setBusy(false)
  }

  async function cancelMfa() {
    await supabase.auth.signOut()
    setStage('form')
    setMfaCode('')
    setMfaError(null)
    setPendingAccount(null)
    setPassword('')
  }

  if (stage === 'mfa') {
    return (
      <AuthChrome>
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Confirm it's you</h1>
        <p className="mb-5 text-sm text-text-1">Enter the 6-digit code from your authenticator app.</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          aria-label="6-digit code"
          className="mb-3 w-full rounded-lg border border-border-strong bg-surface py-3 text-center font-mono text-xl font-semibold tracking-[.3em] text-text-0 outline-none focus-visible:border-accent"
        />
        {mfaError && (
          <p role="alert" className="mb-3 text-xs text-danger">
            {mfaError}
          </p>
        )}
        <Button className="w-full" disabled={!/^\d{6}$/.test(mfaCode) || busy} onClick={() => void finishMfa()}>
          Verify and continue
        </Button>
        <button type="button" onClick={() => void cancelMfa()} className="mt-3 w-full text-center text-xs font-semibold text-text-1">
          Cancel and sign out
        </button>
      </AuthChrome>
    )
  }

  return (
    <AuthChrome>
      <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-text-0">Sign in</h1>
      <p className="mb-6 text-sm text-text-1">Continue building on proof.</p>

      {error && (
        <div role="alert" aria-live="polite" className="mb-4 rounded-lg border border-danger bg-surface-sunken p-3 text-sm text-text-0">
          That email and password don't match.{' '}
          <Link to="/auth?mode=recover" className="font-semibold text-accent">
            Reset your password
          </Link>{' '}
          or try again.
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
      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-text-1">
          <input type="checkbox" checked={remember} onChange={(e) => setRememberState(e.target.checked)} />
          Remember me
        </label>
        <Link to="/auth?mode=recover" className="text-xs font-semibold text-accent">
          Forgot password?
        </Link>
      </div>
      <Button className="mb-3 w-full" onClick={() => void completeSignIn()} disabled={!email || !password || busy}>
        Sign in
      </Button>

      <div className="text-center text-sm text-text-1">
        New to PROFILE?{' '}
        <Link to="/auth?mode=signup" className="font-semibold text-accent">
          Open your PROFILE
        </Link>
      </div>
    </AuthChrome>
  )
}
