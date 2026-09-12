import { useSearchParams } from 'react-router-dom'
import { SignInForm } from './SignInForm'
import { AccountCreationWizard } from './AccountCreationWizard'
import { AccountRecoveryFlow } from './AccountRecoveryFlow'

/** §6.6 — Sign In and Account Creation share one `/auth` route, mode via query
 * param, per Master Prompt §6.6/§34.2 rather than the Handoff README's informal
 * separate-path guess.
 *
 * `mode=recover` was a real dead link until this fix: SignInForm's "Forgot
 * password?" already pointed here, but nothing branched on it, so it just
 * silently re-rendered Sign In (§7.3 Account Recovery Flows). */
export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode')
  if (mode === 'signup') return <AccountCreationWizard />
  if (mode === 'recover') return <AccountRecoveryFlow />
  return <SignInForm />
}
