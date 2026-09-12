import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { useAccount } from '@/app/AccountContext'

const TRUST_TIERS = [
  { range: '0–199', tier: 'Emerging', color: '#94A3B8' },
  { range: '200–399', tier: 'Established', color: 'var(--accent)' },
  { range: '400–599', tier: 'Trusted', color: 'var(--trust)' },
  { range: '600–799', tier: 'Expert', color: '#003A8C' },
  { range: '800–1000', tier: 'Master', color: 'var(--gold)' },
]

const TRUST_PRINCIPLES = [
  { title: 'Evidence over claims', body: 'Nothing is presented as verified unless a named institution, employer, or authority confirmed it.' },
  { title: 'Transparency by default', body: 'Every trust score change cites its source.' },
  { title: 'No vanity metrics', body: 'Followers, likes, and views never factor into ranking or trust.' },
  { title: 'User-controlled visibility', body: 'You decide what’s public, what’s shared per-link, and what stays private.' },
  { title: 'Right to appeal', body: 'Every verification decision can be appealed within 14 days.' },
]

const TRUST_CENTER_MODULES = [
  'Identity Verification',
  'Academic Verification',
  'Employment Verification',
  'Professional Licence Verification',
  'Trade & Competence Verification',
  'Certification Verification',
  'Universal Custom Verification',
]

/** §31/§46.2 public route, §12/§13 flagship system. "Public + Auth" per §31's route
 * table — the same route additionally surfaces a link into the authenticated Trust
 * Passport (§12.6, /profile — Phase 3) once that account exists. */
export function TrustCentre() {
  const { account } = useAccount()

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[880px] px-4 py-14 sm:px-8">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-text-0">Trust Centre</h1>
        <p className="mb-4 max-w-[60ch] text-text-1">
          <strong className="text-text-0">In plain terms:</strong> we don't rank you by popularity, we tell you
          exactly why your trust score changed, and no verification badge appears unless the issuing institution
          confirmed it.
        </p>

        {account && (
          <Link
            to="/profile"
            className="mb-10 inline-flex items-center gap-2 rounded-lg border border-trust bg-surface px-4 py-2 text-sm font-semibold text-trust"
          >
            View your Trust Passport →
          </Link>
        )}

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-text-0">Trust Score tiers</h2>
          <div className="flex flex-col gap-2">
            {TRUST_TIERS.map((t) => (
              <div key={t.tier} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
                <span className="h-3 w-3 flex-none rounded-full" style={{ background: t.color }} />
                <span className="w-24 flex-none font-mono text-xs text-text-1">{t.range}</span>
                <span className="font-semibold text-text-0">{t.tier}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-text-0">Trust principles</h2>
          <ol className="flex flex-col gap-3">
            {TRUST_PRINCIPLES.map((p, i) => (
              <li key={p.title} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
                <span className="flex-none font-mono text-sm text-text-2">{i + 1}</span>
                <div>
                  <div className="font-semibold text-text-0">{p.title}</div>
                  <div className="text-sm text-text-1">{p.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-text-0">What gets verified</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TRUST_CENTER_MODULES.map((m) => (
              <div key={m} className="rounded-lg border border-border bg-surface p-3 text-sm text-text-0">
                {m}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-1">
            ZERO credential uploads, institutional identifiers, or verification documents belong anywhere in
            registration or onboarding. All of it lives exclusively in the Trust Center, after sign-up.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
