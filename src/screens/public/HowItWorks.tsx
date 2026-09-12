import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'

const STEPS = [
  'Create Account',
  'Build CV / Portfolio',
  'Connect Institutions',
  'Upload Credentials to Trust Center',
  'Request Verification',
  'Receive Verified Badges',
  'Increase Trust Score',
  'Become Discoverable',
  'Access Opportunities',
  'Earn Through Your Verified Identity',
]

/** §31.1 How PROFILE Works. */
export function HowItWorks() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[720px] px-4 py-14 sm:px-8">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-text-0">How PROFILE works</h1>
        <p className="mb-10 text-text-1">Ten steps from creating an account to earning through a verified identity.</p>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-sunken font-mono text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <span className="font-medium text-text-0">{step}</span>
            </li>
          ))}
        </ol>
      </main>
      <PublicFooter />
    </div>
  )
}
