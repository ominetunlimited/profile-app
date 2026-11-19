import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Field, PasswordInput, TextInput } from '@/shared/ui/Field'
import { ProfileLogo } from '@/shared/ui/ProfileLogo'
import { useAdmin } from '@/app/AdminContext'

/**
 * The Admin Centre's own sign-in — deliberately not the consumer
 * SignInForm.tsx (different identity space entirely, see AdminContext.tsx).
 * A real Supabase password check, same mechanism as the consumer app, just
 * checked against `platform_admins` instead of `accounts`.
 */
export function AdminLoginPage() {
  const { admin, signIn } = useAdmin()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (admin) return <Navigate to="/admin" replace />

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-strong bg-surface p-7 shadow-2xl">
        <ProfileLogo variant="horizontal" className="mb-6 h-7 w-auto" />
        <h1 className="mb-1 text-lg font-bold text-text-0">Admin Centre</h1>
        <p className="mb-5 text-sm text-text-1">PROFILE staff sign-in — not your PROFILE account.</p>

        {error && (
          <div role="alert" aria-live="polite" className="mb-4 rounded-lg border border-danger bg-surface-sunken p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3.5">
          <Field label="Email">
            <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@profile.com" />
          </Field>
          <Field label="Password">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
        <Button className="w-full" disabled={!email || !password || submitting} onClick={handleSubmit}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </div>
  )
}
