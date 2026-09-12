import { useSearchParams } from 'react-router-dom'
import { SignInForm } from './SignInForm'
import { AccountCreationWizard } from './AccountCreationWizard'

/** §6.6 — Sign In and Account Creation share one `/auth` route, mode via query
 * param, per Master Prompt §6.6/§34.2 rather than the Handoff README's informal
 * separate-path guess. */
export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode')
  return mode === 'signup' ? <AccountCreationWizard /> : <SignInForm />
}
