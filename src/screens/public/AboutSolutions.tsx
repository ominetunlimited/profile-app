import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'

const ABOUT_CARDS = [
  { tag: 'VISION', title: 'A world where work speaks for itself', body: "Professional credibility that travels with the person, not locked inside one employer's records." },
  { tag: 'MISSION', title: 'Turn work into evidence, evidence into trust', body: 'Structured records, confirmed by the people who were there, powering everything from a CV to a hiring decision.' },
  { tag: 'PRINCIPLE', title: 'Never followers, likes or views', body: 'Every ranking and every score is built from verified evidence — attention was never the point.' },
]

const AUDIENCES = [
  { label: 'Individuals', title: 'Build and control your own professional identity', body: 'One place for your work, your evidence and who has confirmed it — visible only as far as you choose.', features: ['Free to start', 'Full privacy control', 'Portable identity'] },
  { label: 'Students', title: 'Turn coursework and early projects into evidence', body: 'A first professional record that starts before your first job, confirmed by supervisors and institutions.', features: ['Academic pathway', 'Mentorship', 'Career readiness'] },
  { label: 'Freelancers', title: 'Show what you deliver, confirmed by who you delivered it for', body: 'Client-confirmed outcomes instead of a portfolio that just asserts them.', features: ['Client verification', 'Rate transparency', 'Consulting profile'] },
  { label: 'Organisations', title: 'Discover and develop talent through verified evidence', body: 'Search, filter and shortlist by confirmed work and trust tier — never by self-reported claims alone.', features: ['Talent search', 'Verification requests', 'Compliance trail'] },
]

/** About PROFILE, and who it is for. */
export function AboutSolutions() {
  const location = useLocation()
  const [audience, setAudience] = useState(0)

  // In-page anchors (#about, #solutions) from the header menu and footer.
  useEffect(() => {
    if (!location.hash) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const active = AUDIENCES[audience]

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <section id="about" className="mx-auto max-w-[900px] px-4 pb-8 pt-14 text-center sm:px-7">
        <div className="mb-2.5 font-mono text-[11px] font-medium tracking-[.1em] text-accent">ABOUT PROFILE</div>
        <h1 className="mb-3.5 text-[clamp(26px,3.6vw,38px)] font-bold leading-[1.15] tracking-tight text-text-0">A professional identity built on proof.</h1>
        <p className="mx-auto max-w-[60ch] text-[14.5px] leading-[1.7] text-text-1">
          Credentials sit in one place, work sits in another, and neither is easy for someone else to trust at a glance. PROFILE exists to close that gap — one identity, backed by evidence, confirmed by the people who were there.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4 px-4 pb-12 pt-5 sm:px-7">
        {ABOUT_CARDS.map((c) => (
          <div key={c.tag} className="rounded-[14px] border border-border bg-surface px-5 py-[22px] shadow-sm">
            <div className="mb-[9px] font-mono text-[10px] font-medium tracking-[.08em] text-accent">{c.tag}</div>
            <div className="mb-2 text-[15px] font-bold text-text-0">{c.title}</div>
            <div className="text-[13px] leading-[1.65] text-text-1">{c.body}</div>
          </div>
        ))}
      </section>

      <section id="solutions" className="border-t border-border bg-surface-sunken px-4 pb-14 pt-14 sm:px-7">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-[30px] text-center">
            <div className="mb-2.5 font-mono text-[11px] font-medium tracking-[.1em] text-accent">SOLUTIONS</div>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold leading-tight tracking-tight text-text-0">PROFILE for every professional journey</h2>
          </div>
          <div role="tablist" className="mb-7 flex flex-wrap justify-center gap-2">
            {AUDIENCES.map((a, i) => (
              <button
                key={a.label}
                role="tab"
                aria-selected={audience === i}
                onClick={() => setAudience(i)}
                className={`rounded-[9px] border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold ${audience === i ? 'border-accent bg-accent-solid text-white' : 'border-border bg-surface text-text-1'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mx-auto max-w-[820px] rounded-2xl border border-border bg-surface px-[clamp(20px,4vw,40px)] py-[30px] shadow-sm">
            <div className="mb-2.5 text-[19px] font-bold text-text-0">{active.title}</div>
            <div className="mb-[18px] text-[13.5px] leading-[1.7] text-text-1">{active.body}</div>
            <div className="flex flex-wrap gap-2">
              {active.features.map((f) => (
                <span key={f} className="rounded-full border border-trust bg-trust-soft px-3 py-[5px] text-[11.5px] font-semibold text-trust">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-[18px] text-center text-xs text-text-1">
            Organisation, institution and government workspaces are provisioned separately — see{' '}
            <Link to="/auth?mode=signup" className="text-accent">
              Open Your PROFILE
            </Link>
            .
          </p>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
