import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { useAccount } from '@/app/AccountContext'
import { TRUST_TIERS, TRUST_WEIGHTS } from '@/app/trustScore'
import { ProfileSealMotif, ProfileNode, ProfilePath, ProfileFrame } from '@/shared/ui/profile/motifs'

type PillarMotif = 'seal' | 'node' | 'path' | 'frame'
const PILLARS: { motif: PillarMotif; glyph?: string; tone: string; title: string; body: string }[] = [
  { motif: 'frame', glyph: 'E', tone: 'bg-accent-soft text-accent', title: 'Evidence', body: 'Structured records of what happened, not posts.' },
  { motif: 'seal', tone: 'bg-trust-soft text-trust', title: 'Verification', body: 'Confirmed by the institution or person who was there.' },
  { motif: 'node', tone: 'bg-gold-soft text-gold', title: 'Trust Score', body: 'Capped, explainable inputs. Never a mystery number.' },
  { motif: 'path', tone: 'bg-accent-soft text-accent', title: 'Trust Passport', body: 'A signed, revocable summary you share on your terms.' },
]

function PillarIcon({ motif }: { motif: PillarMotif }) {
  if (motif === 'seal') return <ProfileSealMotif size={20} />
  if (motif === 'node') return <ProfileNode size={20} />
  if (motif === 'path') return <ProfilePath size={20} />
  return <ProfileFrame size={20} />
}

// The five largest real inputs, from the platform's own weights — each one is capped.
const SCORE_INPUTS: { label: string; cap: number }[] = [
  { label: 'Identity verification', cap: TRUST_WEIGHTS.identity_verification },
  { label: 'Employment verification', cap: TRUST_WEIGHTS.employment_verification },
  { label: 'Academic degree verification', cap: TRUST_WEIGHTS.academic_degree_verification },
  { label: 'Professional licence', cap: TRUST_WEIGHTS.professional_licence },
  { label: 'Organisation affiliation', cap: TRUST_WEIGHTS.organisation_affiliation },
]
const MAX_CAP = Math.max(...SCORE_INPUTS.map((s) => s.cap))

const FLOW = [
  { label: 'Draft', tone: 'border-border-strong bg-surface text-text-1' },
  { label: 'Submitted', tone: 'border-border-strong bg-surface-sunken text-text-0' },
  { label: 'Pending with verifier', tone: 'border-border-strong bg-surface text-text-1' },
  { label: 'Verified', tone: 'border-trust bg-trust-soft text-trust' },
  { label: 'Counted in Trust Score', tone: 'border-trust bg-trust-soft text-trust' },
]

const MODULES = [
  'Identity Verification',
  'Academic Verification',
  'Employment Verification',
  'Professional Licence Verification',
  'Trade & Competence Verification',
  'Certification Verification',
  'Universal Custom Verification',
]

/** Public Trust Centre: how trust works on PROFILE, in plain terms. */
export function TrustCentre() {
  const { account } = useAccount()
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-7">
        <div className="pb-8 pt-11 text-center">
          <div className="mb-2.5 font-mono text-[11px] font-medium tracking-[.1em] text-trust">TRUST CENTRE</div>
          <h1 className="mb-3 text-[clamp(26px,3.6vw,38px)] font-bold leading-[1.15] tracking-tight text-text-0">Credibility should be earned, not assumed.</h1>
          <p className="mx-auto max-w-[60ch] text-[14.5px] leading-relaxed text-text-1">
            Every trust-bearing number on PROFILE opens into a plain-language explanation. No score is ever just asserted — and none of it counts followers, likes or views.
          </p>
          {account && (
            <Link to="/trust-passport" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-trust bg-surface px-4 py-2 text-sm font-semibold text-trust">
              View your Trust Passport →
            </Link>
          )}
        </div>

        <div className="mb-11 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-[13px] border border-border bg-surface px-[17px] py-[18px] shadow-sm">
              <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-[9px] ${p.tone}`}>
                <PillarIcon motif={p.motif} />
              </span>
              <div className="mb-1.5 text-[13.5px] font-semibold text-text-0">{p.title}</div>
              <div className="text-xs leading-relaxed text-text-1">{p.body}</div>
            </div>
          ))}
        </div>

        <section className="mb-11 rounded-2xl border border-trust bg-surface px-[clamp(20px,4vw,40px)] py-[30px] shadow-lg" aria-labelledby="how-score">
          <div className="flex flex-wrap items-center gap-[26px]">
            <div className="relative h-[120px] w-[120px] flex-none">
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(var(--trust) 0turn .81turn, var(--surface-sunken) .81turn 1turn)' }} />
              <div className="absolute inset-3 flex items-center justify-center rounded-full bg-surface font-mono text-[30px] font-bold text-text-0">812</div>
            </div>
            <div className="min-w-[260px] flex-1">
              <h2 id="how-score" className="mb-2 text-[17px] font-bold text-text-0">How the Trust Score is calculated</h2>
              <div className="flex flex-col gap-[9px]">
                {SCORE_INPUTS.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-[12.5px] font-medium text-text-0">{s.label}</span>
                      <span className="font-mono text-[11px] text-text-1">cap {s.cap}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-[3px] bg-surface-sunken">
                      <div className="h-full rounded-[3px] bg-trust" style={{ width: `${Math.round((s.cap / MAX_CAP) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-text-1">Illustrative example. Every input has a cap — no single one can carry a score.</p>
            </div>
          </div>
        </section>

        <section className="mb-11" aria-labelledby="plain-terms">
          <h2 id="plain-terms" className="mb-[18px] text-center text-[22px] font-bold leading-tight tracking-tight text-text-0">Verification, in plain terms</h2>
          <ol className="flex flex-wrap justify-center gap-3">
            {FLOW.map((f, i) => (
              <li key={f.label} className="flex items-center gap-2.5">
                <span className={`rounded-full border-[1.5px] px-3.5 py-[7px] text-xs font-semibold ${f.tone}`}>{f.label}</span>
                {i < FLOW.length - 1 && (
                  <span aria-hidden className="text-text-2">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="mb-11 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          <div className="rounded-[14px] border border-border bg-surface px-[22px] py-5">
            <div className="mb-2.5 text-[15px] font-bold text-text-0">Two pathways, ranked equally</div>
            <p className="text-[13px] leading-[1.7] text-text-1">
              Academic credentials and hands-on competency evidence carry the same weight. PROFILE never treats a degree as inherently stronger proof than eleven years of verified fieldwork.
            </p>
          </div>
          <div className="rounded-[14px] border border-border bg-surface px-[22px] py-5">
            <div className="mb-2.5 text-[15px] font-bold text-text-0">Disagreements get a human</div>
            <p className="mb-3 text-[13px] leading-[1.7] text-text-1">
              A rejected or revoked record can be disputed. A PROFILE reviewer examines both sides' evidence and both parties receive a written outcome — never an automated final answer.
            </p>
            <Link to={account ? '/disputes/new' : '/help'} className="text-[12.5px] font-semibold text-accent">
              See the dispute flow →
            </Link>
          </div>
        </div>

        <section className="mb-11" aria-labelledby="tiers">
          <h2 id="tiers" className="mb-4 text-[22px] font-bold leading-tight tracking-tight text-text-0">Trust Score tiers</h2>
          <div className="flex flex-col gap-2">
            {TRUST_TIERS.map((t) => (
              <div key={t.tier} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
                <span className="h-3 w-3 flex-none rounded-full" style={{ background: t.color }} />
                <span className="w-24 flex-none font-mono text-xs text-text-1">
                  {t.range[0]}–{t.range[1]}
                </span>
                <span className="font-semibold text-text-0">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-11" aria-labelledby="what-verified">
          <h2 id="what-verified" className="mb-4 text-[22px] font-bold leading-tight tracking-tight text-text-0">What gets verified</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MODULES.map((m) => (
              <div key={m} className="rounded-lg border border-border bg-surface p-3 text-sm text-text-0">
                {m}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-1">Creating an account never asks for credential documents. Verification happens afterwards, per record, only when you choose to request it.</p>
        </section>

        <div className="py-8 text-center">
          <h2 className="mb-2.5 text-[22px] font-bold leading-tight tracking-tight text-text-0">See it on a real profile</h2>
          <Link to="/auth?mode=signup" className="inline-flex h-11 items-center rounded-[10px] bg-accent-solid px-5 text-[13.5px] font-semibold text-white">
            Open Your PROFILE
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
