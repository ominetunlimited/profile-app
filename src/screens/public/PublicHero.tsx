import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { useLanguage } from '@/app/LanguageContext'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'
import { ProfileBackground } from '@/shared/ui/profile/ProfileBackground'
import { ArrowRight, BadgeCheck, Check, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import { ProfileLogo } from '@/shared/ui/ProfileLogo'
import { ProfileSeal } from '@/shared/ui/profile/ProfileSeal'
import { TRUST_TIERS, type TrustScoreResult } from '@/app/trustScore'

// Design handoff gap audit: this page had its own second, hand-rolled
// conic-gradient trust ring — the Design System doc is explicit that the
// point of extracting TrustScoreRing.tsx was "never two independent-
// looking trust rings." This is a real, honestly-labelled illustrative
// figure (no anonymous visitor has a real score to show), not a live
// computation — hence a constructed result object rather than
// computeTrustScore(), but it now renders through the one real component.
const ILLUSTRATIVE_TRUST_SCORE: TrustScoreResult = {
  total: 812,
  tier: TRUST_TIERS[4],
  confidenceLevel: 'high',
  dimensions: {
    identityTrust: 0,
    academicTrust: 0,
    professionalTrust: 0,
    employmentTrust: 0,
    marketplaceTrust: 0,
    organisationalTrust: 0,
    recruitmentTrust: 0,
    contributionTrust: 0,
  },
  signals: [],
  formulaVersion: 'illustrative',
  lastCalculated: new Date(0).toISOString(),
}

const LOOP_STEPS = ['Learning', 'Identity', 'Evidence', 'Verification', 'Trust', 'Opportunity', 'Growth', 'Prosperity']
const LOOP_PILL = ['bg-surface-secondary text-accent', 'bg-gold-soft text-gold', 'bg-surface-sunken text-text-1']

const LOOP_TONES = ['bg-accent-soft text-accent', 'bg-trust-soft text-trust', 'bg-gold-soft text-gold', 'bg-coral-soft text-coral']

const LOOP_CARDS = [
  { title: 'Record the work', body: 'Structured evidence — what happened, for whom, with what changed as a result.' },
  { title: 'Get it verified', body: 'The institution or person who was there confirms it directly, in their own words.' },
  { title: 'Build trust', body: 'An explainable score, never a mystery number — every input shown, every cap stated.' },
  { title: 'Grow from it', body: 'Trusted evidence powers your CV, your portfolio, and what opportunities find you.' },
]

const AUDIENCE_CARDS = [
  { title: 'Individuals', body: 'Build and control a professional identity that’s actually yours.' },
  { title: 'Students', body: 'Turn coursework and early projects into evidence that counts.' },
  { title: 'Professionals', body: 'A career history other people can verify, not just read.' },
  { title: 'Freelancers', body: 'Show what you deliver, confirmed by who you delivered it for.' },
  { title: 'Organisations', body: 'Discover and develop talent through verified, not advertised, evidence.' },
  { title: 'Institutions', body: 'Confirm credentials and records directly, with a full audit trail.' },
]

/** §6 Hero Gateway & Landing Experience. */
export function PublicHero() {
  const { t } = useLanguage()
  const words = t('hero.headline').trim().split(' ')
  const headTail = words.slice(-1).join(' ')
  const headLead = words.slice(0, -1).join(' ')
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <section className="relative overflow-hidden px-4 py-12 sm:px-8 lg:flex lg:min-h-[78vh] lg:items-center lg:py-16">
        <ProfileBackground className="absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="min-w-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-surface-secondary px-3 py-1.5">
              <Zap size={12} className="text-accent" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-wide text-accent">{t('hero.tag')}</span>
            </div>
            <div className="mb-6">
              <ProfileLogo variant="primary" priority className="h-auto w-[190px] sm:w-[240px]" />
            </div>
            <h1 className="text-balance text-[clamp(36px,5.6vw,60px)] font-black leading-[1.06] tracking-tight text-text-0">
              {headLead}
              <span className="text-accent"> {headTail}</span>
            </h1>
            <p className="mt-5 max-w-[54ch] text-[clamp(16px,1.5vw,18px)] leading-relaxed text-text-1">{t('hero.subhead')}</p>

            <ol aria-label="From learning to prosperity" className="mt-6 flex flex-wrap gap-y-2">
              {LOOP_STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-1 text-xs font-semibold text-text-2">
                  <span className={`rounded-full px-2.5 py-1 ${LOOP_PILL[i % 3]}`}>{step}</span>
                  {i < LOOP_STEPS.length - 1 && <span aria-hidden className="mx-0.5 text-border-strong">→</span>}
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth?mode=signup"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-accent-solid px-6 text-base font-bold text-white shadow-md transition hover:shadow-xl"
              >
                {t('hero.cta.primary')}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <a
                href="#story"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl border border-border-strong px-6 text-base font-bold text-text-0 transition hover:bg-surface-sunken"
              >
                {t('hero.cta.secondary')}
              </a>
            </div>
          </div>

          <aside aria-label="Illustrative preview, not live data" className="relative hidden h-[470px] lg:block">
            <div className="absolute inset-x-0 top-[92px] rounded-3xl border border-border bg-surface p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-text-2">Illustrative profile</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-solid px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  <BadgeCheck size={12} aria-hidden /> Verified
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[var(--profile-royal)] text-lg font-bold text-white">AO</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-bold text-text-0">Amara Okafor</div>
                  <div className="text-sm text-text-1">Policy researcher, Abuja</div>
                </div>
                <TrustScoreRing trust={ILLUSTRATIVE_TRUST_SCORE} size={56} />
              </div>
              <ul className="mt-4 space-y-2">
                {['Degree confirmed by the institution', 'Role confirmed by the employer', 'Project evidence attached'].map((row) => (
                  <li key={row} className="flex items-center gap-2.5 rounded-xl bg-surface-sunken px-3 py-2.5 text-[13px] font-medium text-text-0">
                    <Check size={15} className="flex-none text-accent" aria-hidden />
                    {row}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['Policy analysis', 'Housing', 'Field research'].map((k) => (
                  <span key={k} className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold text-accent">{k}</span>
                ))}
              </div>
            </div>
            <div className="absolute -right-3 top-0 w-[250px] rounded-2xl border border-border bg-surface p-3.5 shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-secondary text-accent"><TrendingUp size={13} aria-hidden /></span>
                Recruiter alert
              </div>
              <p className="mt-1.5 text-[11.5px] leading-snug text-text-1">A recruiter viewed your profile and matched it to an open role.</p>
            </div>
            <div className="absolute -left-4 bottom-4 rounded-2xl bg-[var(--profile-royal)] px-4 py-3 text-white shadow-lg">
              <div className="flex items-center gap-2 text-[12px] font-bold"><ShieldCheck size={15} aria-hidden /> Credential verified</div>
              <div className="mt-0.5 text-[11px] text-white/75">Confirmed by the issuing institution</div>
            </div>
          </aside>
        </div>
      </section>

      <section id="story" className="border-t border-border bg-surface-sunken px-4 py-14 sm:px-8">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-accent">THE PROBLEM</div>
            <h2 className="mb-2 text-[clamp(22px,2.8vw,30px)] font-bold tracking-tight text-text-0">Professional identity has changed.</h2>
            <p className="text-sm leading-relaxed text-text-1">
              Credentials sit in one place, work sits in another, and neither is easy for someone else to trust at
              a glance. Attention got measured. Proof mostly didn't.
            </p>
          </div>
          <div>
            <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-trust">THE ANSWER</div>
            <h2 className="mb-2 text-[clamp(22px,2.8vw,30px)] font-bold tracking-tight text-text-0">One professional identity, built on proof.</h2>
            <p className="text-sm leading-relaxed text-text-1">
              PROFILE turns what you have actually done into evidence, gets it confirmed by the people who were
              there, and carries that trust into the opportunities that fit.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-9 text-center">
            <h2 className="mb-2 text-[clamp(22px,2.8vw,30px)] font-bold tracking-tight text-text-0">From work to growth, in one loop.</h2>
            <p className="mx-auto max-w-[56ch] text-sm text-text-1">
              Each stage feeds the next. Nothing here is separate software pretending to be one product.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP_CARDS.map((c, i) => (
              <div key={c.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${LOOP_TONES[i]}`}>
                  {i + 1}
                </span>
                <div className="mb-1.5 font-semibold text-text-0">{c.title}</div>
                <div className="text-[12.5px] leading-relaxed text-text-1">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="border-y border-border bg-surface-sunken px-4 py-16 sm:px-8">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-8">
          <div className="min-w-0 flex-1 basis-[340px]">
            <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-trust">TRUST</div>
            <h2 className="mb-3 text-[clamp(22px,2.8vw,30px)] font-bold tracking-tight text-text-0">
              Credibility should be earned, not assumed.
            </h2>
            <p className="mb-4 max-w-[52ch] text-sm leading-relaxed text-text-1">
              Every trust-bearing number on PROFILE opens into a plain-language explanation of how it was
              calculated. No score is ever just asserted.
            </p>
            <Link to="/trust" className="text-sm font-semibold text-accent">
              Visit the Trust Centre →
            </Link>
          </div>
          <div className="min-w-[260px] flex-1 basis-[300px] rounded-2xl border border-trust bg-surface p-5 shadow-lg">
            <div className="mb-3.5 flex items-center gap-3.5">
              <div className="h-16 w-16 flex-none">
                <TrustScoreRing trust={ILLUSTRATIVE_TRUST_SCORE} size={64} />
              </div>
              <div className="text-[12.5px] leading-relaxed text-text-1">Illustrative example, not a real Trust Score.</div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-text-0">
              <div className="flex items-center gap-2">
                <ProfileSeal size={14} tone="green" /> Verified evidence
              </div>
              <div className="flex items-center gap-2">
                <ProfileSeal size={14} tone="green" /> Strength of verifiers
              </div>
              <div className="flex items-center gap-2">
                <ProfileSeal size={14} tone="green" /> Credential standing
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-2 text-center font-mono text-[10.5px] font-medium tracking-[.09em] text-accent">
            BUILT FOR EVERY PROFESSIONAL JOURNEY
          </div>
          <h2 className="mb-7 text-center text-[clamp(22px,2.8vw,30px)] font-bold tracking-tight text-text-0">PROFILE for...</h2>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE_CARDS.map((a) => (
              <div key={a.title} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-1.5 font-semibold text-text-0">{a.title}</div>
                <div className="text-xs leading-relaxed text-text-1">{a.body}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-text-1">
            Every account starts as one identity. Organisation, institution and enterprise workspaces are
            provisioned separately and never opened by self-serve sign-up.
          </p>
        </div>
      </section>

      <section className="bg-text-0 px-4 py-20 text-center sm:px-8">
        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4">
          <h2 className="text-[clamp(24px,3.4vw,34px)] font-bold tracking-tight text-bg">Your work already tells a story.</h2>
          <p className="text-[15px] text-bg opacity-75">PROFILE helps turn that story into trusted professional identity.</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2.5">
            <Link to="/auth?mode=signup" className="flex h-[46px] items-center rounded-lg bg-accent-solid px-5 text-[14.5px] font-semibold text-white">
              Open Your PROFILE
            </Link>
            <a href="#story" className="flex h-[46px] items-center rounded-lg border border-white/30 px-[18px] text-[14.5px] font-semibold text-bg">
              Explore how PROFILE works
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
