import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'

const SUMMARY_PANELS = [
  { title: 'Identity Infrastructure', body: 'Every user has an immutable PID. Names are never the identity — evidence is.' },
  { title: 'Trust Model', body: 'Trust Score is built entirely from verified signals, weighted and versioned, never from followers or likes.' },
  { title: 'Security Model', body: 'Encryption at rest and in transit, MFA, RLS on every table, full audit logging.' },
  { title: 'Verification Exchange (VXI)', body: 'The routing layer connecting users to institutions, employers, and regulators.' },
]

const USE_CASES = [
  { who: 'Individuals', what: 'A career record no one can fake, that updates itself as they work' },
  { who: 'Organisations', what: 'Faster hiring, verified staff, reduced fraud exposure' },
  { who: 'Universities', what: 'Automated alumni/degree verification at scale, lower admin cost' },
  { who: 'Governments', what: 'Credential transparency, workforce intelligence, fraud reduction' },
  { who: 'Enterprises', what: 'White-label trust infrastructure, private verification networks' },
]

const ROADMAP = [
  { phase: 'Now', focus: 'Individual identity, Trust Center, CV/Portfolio, core verification' },
  { phase: 'Next', focus: 'Institutional Trust Hub at scale, Recruitment Partner accounts, VHN' },
  { phase: 'Later', focus: 'Government API partnerships, enterprise white-label infrastructure' },
]

const TABS = ['about', 'solutions'] as const

/** §43 About, Vision, Mission & Platform Narrative. */
export function AboutSolutions() {
  const location = useLocation()
  const [tab, setTab] = useState<(typeof TABS)[number]>(() => (location.hash === '#solutions' ? 'solutions' : 'about'))
  useEffect(() => {
    if (location.hash === '#solutions') setTab('solutions')
    else if (location.hash === '#about') setTab('about')
  }, [location.hash])

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[880px] px-4 py-14 sm:px-8">
        <div className="mb-8 flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize ${
                tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'about' && (
          <div className="flex flex-col gap-12">
            <section>
              <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-accent">VISION</div>
              <p className="text-lg leading-relaxed text-text-0">
                A world where every person, institution, organisation, and professional achievement can be trusted,
                verified, and discovered — where opportunity is earned through evidence and contribution rather
                than visibility alone, and where trust itself becomes a universal economic asset.
              </p>
            </section>

            <section>
              <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-trust">MISSION</div>
              <p className="text-lg leading-relaxed text-text-0">
                To build the world's most trusted professional identity infrastructure — where work becomes
                credibility, credibility becomes opportunity, and opportunity creates sustainable economic growth
                for individuals, organisations, institutions, and governments alike.
              </p>
            </section>

            <section>
              <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-gold">PHILOSOPHY</div>
              <p className="leading-relaxed text-text-1">
                Most platforms ask "who says you're qualified?" and settle for whatever answer you type. PROFILE
                asks "can it be verified?" — and routes the question to the university, employer, or licensing body
                that actually knows. We don't rank people by how loud they are. We rank evidence by how well it
                holds up.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-text-0">Why PROFILE exists</h2>
              <p className="mb-4 text-sm text-text-1">The global professional ecosystem has a trust problem at every layer:</p>
              <div className="grid grid-cols-1 gap-2 font-mono text-xs sm:grid-cols-2">
                {[
                  ['Identity', 'fake identities, impersonation, no universal record'],
                  ['Credentials', 'forged certificates, unverifiable degrees, fake licences'],
                  ['Employment', 'inflated CVs, unreliable reference checks'],
                  ['Institutions', 'manual verification, bottlenecks, lost records'],
                  ['Opportunity', 'qualified people stay undiscovered; recruiters drown in noise'],
                  ['Economy', 'fraud costs, bad hires, underused talent'],
                ].map(([layer, problem]) => (
                  <div key={layer} className="rounded-lg border border-border bg-surface p-3">
                    <span className="text-text-0">{layer}</span>
                    <span className="text-text-2"> → </span>
                    <span className="text-text-1">{problem}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-text-1">
                PROFILE exists to replace claims with confirmed evidence at every one of these layers.
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SUMMARY_PANELS.map((p) => (
                <div key={p.title} className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1.5 font-semibold text-text-0">{p.title}</div>
                  <div className="text-sm text-text-1">{p.body}</div>
                </div>
              ))}
            </section>

            <section>
              <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[.09em] text-accent">ECONOMIC IMPACT</div>
              <p className="leading-relaxed text-text-1">
                Trust is expensive when it's manual. PROFILE makes verification fast enough that qualified people
                stop being invisible and institutions stop being verification bottlenecks — turning
                credential-checking from a cost center into infrastructure that pays for itself in reduced fraud
                and faster hiring.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-text-0">Roadmap</h2>
              <div className="flex flex-col gap-2">
                {ROADMAP.map((r) => (
                  <div key={r.phase} className="flex gap-4 rounded-lg border border-border bg-surface p-3 text-sm">
                    <span className="w-14 flex-none font-semibold text-accent">{r.phase}</span>
                    <span className="text-text-1">{r.focus}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-2">Internal, detailed roadmaps are never published externally.</p>
            </section>
          </div>
        )}

        {tab === 'solutions' && (
          <div className="flex flex-col gap-10">
            <section>
              <h2 className="mb-4 text-xl font-bold text-text-0">Use cases by constituency</h2>
              <div className="flex flex-col gap-2">
                {USE_CASES.map((u) => (
                  <div key={u.who} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:gap-4">
                    <span className="w-36 flex-none font-semibold text-text-0">{u.who}</span>
                    <span className="text-sm text-text-1">{u.what}</span>
                  </div>
                ))}
              </div>
            </section>
            <div className="rounded-xl border border-border bg-surface-sunken p-5 text-sm text-text-1">
              Every account starts as one identity. Organisation, institution and government workspaces are opened
              by an existing individual PROFILE account and reviewed before activation — see{' '}
              <Link to="/auth?mode=signup" className="text-accent">
                Open Your PROFILE
              </Link>
              .
            </div>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
