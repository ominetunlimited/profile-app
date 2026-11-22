import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { useLanguage } from '@/app/LanguageContext'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'
import { ProfileBackground } from '@/shared/ui/profile/ProfileBackground'
import { ProfileNode, ProfileSealMotif } from '@/shared/ui/profile/motifs'
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

const JOURNEY = [
  { key: 'identity', glyph: '1', label: 'Identity', box: 'bg-surface border-border-strong text-text-0', size: 'h-[38px] w-[38px]', edge: 'var(--border-strong)' },
  { key: 'evidence', glyph: '2', label: 'Evidence', box: 'bg-accent-soft border-accent text-accent', size: 'h-[38px] w-[38px]', edge: 'var(--accent)' },
  { key: 'verification', label: 'Verification', box: 'bg-trust-soft border-trust text-trust', size: 'h-11 w-11', edge: 'var(--trust)', seal: 'green' as const },
  { key: 'trust', label: 'Trust', box: 'bg-trust border-trust text-trust motion-safe:animate-[profile-pulse_2.4s_ease-in-out_infinite]', size: 'h-11 w-11', edge: 'var(--trust)', node: true },
  { key: 'opportunity', glyph: '→', label: 'Opportunity', box: 'bg-gold-soft border-gold text-gold', size: 'h-[38px] w-[38px]', edge: 'var(--gold)' },
  { key: 'growth', glyph: '↑', label: 'Growth', box: 'bg-coral-soft border-coral text-coral', size: 'h-[38px] w-[38px]', edge: 'var(--coral)' },
]

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
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <section
        className="relative overflow-hidden px-4 py-14 text-[var(--profile-off-white)] sm:px-8 sm:py-16 lg:py-16"
        style={{ background: 'linear-gradient(165deg, var(--profile-royal) 0%, color-mix(in srgb, var(--profile-royal) 78%, var(--profile-blue)) 100%)' }}
      >
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full opacity-30" style={{ background: 'var(--profile-blue)' }} />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 left-[38%] h-56 w-56 rounded-[48px] opacity-20" style={{ background: 'var(--profile-powder)' }} />
        <span aria-hidden className="pointer-events-none absolute bottom-16 right-[8%] h-20 w-20 rounded-2xl opacity-70" style={{ background: 'var(--profile-gold)' }} />
        {/* §8 — PROFILE geometric background system replaces generic floating
            shapes: one proprietary motif grammar (nodes, links, grid) at low
            opacity, cropped by the viewport, never competing with content. */}
        <ProfileBackground variant="mixed" className="absolute inset-0 text-[var(--profile-powder)] opacity-40" />
        <div className="relative mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className="flex min-w-0 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <ProfileLogo variant="symbol" priority className="h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36" />
          <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-[11.5px] font-medium text-[var(--profile-powder)]">
            {t('hero.tag')}
          </span>
          <h1 className="text-balance text-[clamp(34px,6.4vw,64px)] font-extrabold leading-[1.05] tracking-tight text-[var(--profile-off-white)]">
            {t('hero.headline')}
          </h1>
          <p className="max-w-[62ch] text-[clamp(15px,1.6vw,18px)] leading-relaxed text-[var(--profile-powder)]">{t('hero.subhead')}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              to="/auth?mode=signup"
              className="flex h-12 items-center rounded-xl bg-[var(--profile-off-white)] px-6 text-[15px] font-semibold text-[var(--profile-royal)] shadow-lg hover:bg-white"
            >
              {t('hero.cta.primary')}
            </Link>
            <a
              href="#story"
              className="flex h-12 items-center rounded-xl border border-white/40 px-5 text-[15px] font-semibold text-[var(--profile-off-white)] hover:bg-white/10"
            >
              {t('hero.cta.secondary')}
            </a>
          </div>
          <ol aria-label="From identity to growth" className="mt-8 flex w-full max-w-[760px] items-start justify-start overflow-x-auto rounded-2xl bg-[var(--profile-off-white)] px-5 pb-3 pt-4 text-text-0 sm:justify-center lg:justify-start">
            {JOURNEY.map((n, i) => (
              <li key={n.label} className={`flex items-start ${i === 0 || i === JOURNEY.length - 1 ? '' : 'flex-1'}`}>
                <span className="flex flex-none flex-col items-center gap-2">
                  <span className={`flex items-center justify-center rounded-full border-2 text-[13px] font-bold ${n.size} ${n.box}`}>
                    {'seal' in n && n.seal ? (
                      <ProfileSealMotif size={24} />
                    ) : 'node' in n && n.node ? (
                      <ProfileNode size={24} />
                    ) : (
                      (n as { glyph?: string }).glyph
                    )}
                  </span>
                  <span className="whitespace-nowrap text-[10.5px] font-semibold text-text-1">{n.label}</span>
                </span>
                {i < JOURNEY.length - 1 && (
                  <span aria-hidden className="mx-1.5 mt-[19px] h-0.5 min-w-[14px] flex-1" style={{ background: `linear-gradient(90deg, ${n.edge}, ${JOURNEY[i + 1].edge})` }} />
                )}
              </li>
            ))}
          </ol>
        </div>
        <aside aria-label="Illustrative preview, not live data" className="hidden gap-3 lg:grid">
          <div className="rounded-2xl border border-border bg-surface p-5 text-text-0 shadow-2xl">
            <div className="text-[11px] font-medium text-text-2">Illustrative profile</div>
            <div className="mt-1 text-[15px] font-semibold text-text-0">Verified record, in one place</div>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-accent">Degree confirmed</span>
              <span className="rounded-full bg-gold-soft px-3 py-1 text-gold">Role verified</span>
              <span className="rounded-full bg-trust-soft px-3 py-1 text-trust">Project evidence</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-text-0 shadow-xl">
            <div className="text-[11px] font-medium text-text-2">Illustrative message</div>
            <div className="mt-1 text-[15px] font-semibold text-text-0">Can you review the brief before Friday?</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-text-0 shadow-xl">
            <div className="text-[11px] font-medium text-text-2">Illustrative opportunity</div>
            <div className="mt-1 text-[15px] font-semibold text-text-0">Research fellow, urban governance</div>
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
