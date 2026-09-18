import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { useLanguage } from '@/app/LanguageContext'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'
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
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <section className="px-4 py-16 text-center sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-[900px] flex-col items-center gap-4">
          <span className="rounded-full border border-border-strong bg-surface px-3.5 py-1 text-[11.5px] font-medium text-text-1">
            {t('hero.tag')}
          </span>
          <h1 className="text-balance text-[clamp(34px,6.4vw,64px)] font-extrabold leading-[1.05] tracking-tight text-text-0">
            {t('hero.headline')}
          </h1>
          <p className="max-w-[62ch] text-[clamp(15px,1.6vw,18px)] leading-relaxed text-text-1">{t('hero.subhead')}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth?mode=signup"
              className="flex h-12 items-center rounded-lg bg-accent px-6 text-[15px] font-semibold text-white shadow-lg"
            >
              {t('hero.cta.primary')}
            </Link>
            <a
              href="#story"
              className="flex h-12 items-center rounded-lg border border-border-strong bg-surface px-5 text-[15px] font-semibold text-text-0"
            >
              {t('hero.cta.secondary')}
            </a>
          </div>
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
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-sm font-bold text-accent">
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
                <span className="text-trust">✓</span> Verified evidence
              </div>
              <div className="flex items-center gap-2">
                <span className="text-trust">✓</span> Strength of verifiers
              </div>
              <div className="flex items-center gap-2">
                <span className="text-trust">✓</span> Credential standing
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
            <Link to="/auth?mode=signup" className="flex h-[46px] items-center rounded-lg bg-accent px-5 text-[14.5px] font-semibold text-white">
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
