import type { ReactElement } from 'react'
import type { PortfolioData } from '@/app/portfolioData'
import type { OrganisationPortfolioConfigV1 } from '@/app/organisationPortfolioStore'

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs italic text-gray-400">{text}</div>
}

function Header({ pf, eyebrow, color }: { pf: PortfolioData; eyebrow: string; color: string }) {
  return (
    <div className="mb-1">
      <div className="mb-2 font-mono text-[10px] font-semibold tracking-widest" style={{ color }}>
        {eyebrow}
      </div>
      <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">{pf.name}</h2>
      {pf.headline && <p className="text-sm text-gray-600">{pf.headline}</p>}
    </div>
  )
}

function ItemGrid({ pf }: { pf: PortfolioData }) {
  if (pf.items.length === 0) return <Empty text="No portfolio items yet — recorded activities with 'Include in CV / Portfolio' checked appear here." />
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {pf.items.map((item, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-[repeating-linear-gradient(45deg,#F1F5F9_0_10px,#EEF3FB_10px_20px)] font-mono text-[10px] text-gray-400">
            {item.type}
          </div>
          <div className="mb-1 text-sm font-semibold text-gray-900">{item.title}</div>
          {item.body && <p className="text-xs text-gray-600">{item.body}</p>}
        </div>
      ))}
    </div>
  )
}

/** Visual / creative — gallery of recorded work with photo placeholders. */
function VisualGallery({ pf }: { pf: PortfolioData }) {
  return (
    <div className="mx-auto w-full max-w-[880px] rounded-2xl bg-white p-8 shadow-lg">
      <Header pf={pf} eyebrow="VISUAL PORTFOLIO" color="#0057D9" />
      <p className="mb-6 text-sm text-gray-600">Every item below ties to a recorded, evidence-linked activity.</p>
      <ItemGrid pf={pf} />
    </div>
  )
}

/** Technical — metrics-forward layout for engineers, architects. */
function TechnicalPortfolio({ pf }: { pf: PortfolioData }) {
  return (
    <div className="mx-auto w-full max-w-[880px] rounded-2xl bg-white shadow-lg">
      <div className="rounded-t-2xl bg-gray-50 p-8">
        <Header pf={pf} eyebrow="TECHNICAL PORTFOLIO" color="#0E7490" />
      </div>
      <div className="p-8">
        <ItemGrid pf={pf} />
        <p className="mt-4 text-xs text-gray-500">Full specification sheets are per-project, generated from verified evidence — not written free-hand.</p>
      </div>
    </div>
  )
}

/** Writing / research — long-form list, for writers, researchers. */
function WritingPortfolio({ pf }: { pf: PortfolioData }) {
  return (
    <div className="mx-auto w-full max-w-[880px] rounded-2xl bg-white p-8 shadow-lg">
      <Header pf={pf} eyebrow="WRITING & RESEARCH" color="#8A6200" />
      <div className="mt-5">
        {pf.items.length === 0 ? (
          <Empty text="No write-ups recorded yet." />
        ) : (
          pf.items.map((item, i) => (
            <div key={i} className="border-b border-gray-200 py-4 last:border-0">
              <div className="mb-1 text-base font-bold text-gray-900">{item.title}</div>
              <p className="text-xs text-gray-600">{item.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/** Freelance / consulting — hero band + services + testimonials placeholder. */
function ConsultingPortfolio({ pf }: { pf: PortfolioData }) {
  return (
    <div className="mx-auto w-full max-w-[880px] overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className="bg-gradient-to-r from-accent to-trust p-8 text-white">
        <div className="mb-2 font-mono text-[10px] font-semibold tracking-widest opacity-85">FREELANCE &amp; CONSULTING</div>
        <h2 className="mb-2 text-2xl font-bold">{pf.name}</h2>
        {pf.headline && <p className="max-w-[60ch] text-sm opacity-90">{pf.headline}</p>}
      </div>
      <div className="p-8">
        <div className="mb-3 text-xs font-bold tracking-wide text-gray-900">WORK</div>
        <ItemGrid pf={pf} />
        <div className="mt-6 text-xs font-bold tracking-wide text-gray-900">CLIENT RESULTS</div>
        <Empty text="No client reviews yet — verified reviews appear here once given." />
      </div>
    </div>
  )
}

/** Academic — publications and applied projects. */
function AcademicPortfolio({ pf }: { pf: PortfolioData }) {
  return (
    <div className="mx-auto w-full max-w-[880px] rounded-2xl bg-white shadow-lg">
      <div className="border-b border-gray-200 p-8">
        <Header pf={pf} eyebrow="ACADEMIC PORTFOLIO" color="#5B6B80" />
      </div>
      <div className="p-8">
        <div className="mb-2 text-xs font-bold tracking-wide text-gray-900">RESEARCH &amp; APPLIED PROJECTS</div>
        <ItemGrid pf={pf} />
        <p className="mt-4 text-xs text-gray-500">Credential and grant records shown here match the verified entries on the Trust Passport.</p>
      </div>
    </div>
  )
}

/** Organisation / Company Showcase — §15.2's organisation CV_PATHWAYS
 * sections, extended per patch (pre-Phase-7) B6 into a composable system:
 * every non-structural section is individually toggleable via
 * OrganisationPortfolioConfigV1 (organisationPortfolioStore.ts), edited from
 * PortfolioTemplatesPage. `config` is optional so every other caller of this
 * template (and the shared PortfolioTemplateDef signature) keeps working
 * unchanged — omitting it renders every section, the previous behaviour. */
function OrganisationShowcase({ pf, config }: { pf: PortfolioData; config?: OrganisationPortfolioConfigV1 }) {
  const enabled = (s: keyof OrganisationPortfolioConfigV1['enabledSections']) => config?.enabledSections[s] ?? true

  return (
    <div className="mx-auto w-full max-w-[880px] rounded-2xl bg-white shadow-lg">
      {enabled('header') && (
        <div className="rounded-t-2xl bg-gray-900 p-8 text-white">
          <div className="mb-2 font-mono text-[10px] font-semibold tracking-widest text-gray-300">ORGANISATION SHOWCASE</div>
          <h2 className="text-2xl font-bold">{pf.name}</h2>
        </div>
      )}
      {enabled('hero') && pf.headline && (
        <div className="border-b border-gray-100 bg-gray-50 p-6 text-sm text-gray-700">{pf.headline}</div>
      )}
      <div className="grid grid-cols-1 gap-5 p-8 sm:grid-cols-2">
        {enabled('about_us') && <ShowcaseSection title="About us" />}
        {enabled('services') && <ShowcaseSection title="Services" />}
        {enabled('projects') && <ShowcaseSection title="Projects & programmes" />}
        {enabled('team') && <ShowcaseSection title="Team (verified staff)" />}
        {enabled('clients_and_partners') && <ShowcaseSection title="Clients & partners" />}
        {enabled('testimonials') && <ShowcaseSection title="Testimonials" />}
        {enabled('resources') && <ShowcaseSection title="Resources" />}
        {enabled('careers') && <ShowcaseSection title="Careers" />}
        {enabled('contact') && <ShowcaseSection title="Contact" />}
      </div>
      {enabled('footer') && (
        <div className="rounded-b-2xl border-t border-gray-100 p-4 text-center text-[10px] text-gray-400">{pf.name}</div>
      )}
    </div>
  )
}

function ShowcaseSection({ title }: { title: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold tracking-wide text-gray-900">{title.toUpperCase()}</div>
      <Empty text="Nothing added yet." />
    </div>
  )
}

export interface PortfolioTemplateDef {
  id: string
  label: string
  description: string
  Component: (props: { pf: PortfolioData; config?: OrganisationPortfolioConfigV1 }) => ReactElement
}

/** §47.6 PORTFOLIO_TEMPLATE_LIBRARY, verbatim names — 9 individual
 * professions plus 1 organisation-specific, per the corrected access model
 * (accountTypes.ts's `isPortfolioEligible`). Layouts reuse the Handoff's 5
 * demonstrated structures (build doc §1: never invent a one-off style) plus
 * one new organisation-specific layout grounded in §15.2's real section list. */
export const PORTFOLIO_TEMPLATES: PortfolioTemplateDef[] = [
  { id: 'consultant', label: 'Consultant', description: 'Hero band, services, and client results.', Component: ConsultingPortfolio },
  { id: 'designer', label: 'Designer', description: 'Visual gallery of recorded work.', Component: VisualGallery },
  { id: 'software-engineer', label: 'Software Engineer', description: 'Metrics-forward technical layout.', Component: TechnicalPortfolio },
  { id: 'architect', label: 'Architect', description: 'Metrics-forward technical layout with project specs.', Component: TechnicalPortfolio },
  { id: 'researcher', label: 'Researcher', description: 'Long-form write-ups and case studies.', Component: WritingPortfolio },
  { id: 'academic', label: 'Academic', description: 'Publications and applied projects.', Component: AcademicPortfolio },
  { id: 'photographer', label: 'Photographer', description: 'Visual gallery of recorded work.', Component: VisualGallery },
  { id: 'writer', label: 'Writer', description: 'Long-form write-ups and case studies.', Component: WritingPortfolio },
  { id: 'business-professional', label: 'Business Professional', description: 'Hero band, services, and client results.', Component: ConsultingPortfolio },
  { id: 'organisation-company-showcase', label: 'Organisation / Company Showcase', description: 'Programmes, staff, and partnerships — organisation accounts.', Component: OrganisationShowcase },
]
