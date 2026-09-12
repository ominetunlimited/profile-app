import type { ReactElement, ReactNode } from 'react'
import { shouldShowGpa, type CvData } from '@/app/careerData'

/** Shared "no content yet" strip shown inside a template when there's
 * nothing real to render for a section — never filled with placeholder text
 * dressed up as content. */
function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs italic text-gray-400">{text}</p>
}

/**
 * Patch (pre-Phase-7): renders the fields §4.6 names but never
 * field-specifies (Education, Certifications, Languages, References) plus
 * the header contact fields with no prior UI (LinkedIn, external website).
 * One shared block appended consistently across all 10 templates rather
 * than bespoke per-template placement — reuses each template's existing
 * text tokens so it never introduces a new visual style (build doc §1).
 */
function ExtraCvSections({ cv }: { cv: CvData }) {
  const s = cv.enabledSections
  const hasLinks = cv.phone || cv.linkedInUrl || cv.externalWebsiteUrl
  const showTools = cv.tools.length > 0 // §4.6's own Tools CV section — bucketed alongside Skills, not independently toggleable
  const showEducation = s.education && cv.education.length > 0
  const showCertifications = cv.certifications.length > 0 // bucketed under Skills/Competencies (§4) — not independently toggleable
  const showLanguages = s.languages && cv.languages.length > 0
  const showProjects = s.projects && cv.projects.length > 0
  const showPublications = s.publications && cv.publications.length > 0
  const showVolunteer = s.volunteer && cv.volunteer.length > 0
  const showAwards = s.awards && cv.awards.length > 0
  const showAffiliations = s.affiliations && cv.affiliations.length > 0
  const showReferences = s.references && (cv.referencesMode === 'available_upon_request' || cv.externalReferences.length > 0)
  const hasAnything =
    hasLinks || showTools || showEducation || showCertifications || showLanguages || showProjects || showPublications || showVolunteer || showAwards || showAffiliations || showReferences
  if (!hasAnything) return null

  return (
    <div className="mt-4 border-t border-gray-200 pt-3 text-[11.5px] text-gray-700">
      {hasLinks && (
        <div className="mb-2 flex flex-wrap gap-3">
          {cv.phone && <span>{cv.phone}</span>}
          {cv.linkedInUrl && <span>{cv.linkedInUrl}</span>}
          {cv.externalWebsiteUrl && <span>{cv.externalWebsiteUrl}</span>}
        </div>
      )}
      {showTools && (
        <div className="mb-2">
          <span className="font-bold">Tools </span>
          {cv.tools.join(' · ')}
        </div>
      )}
      {showEducation && (
        <div className="mb-2">
          <span className="font-bold">Education </span>
          {cv.education.map((e, i) => (
            <span key={e.id}>
              {i > 0 && ' · '}
              {e.degree}, {e.school} ({e.graduationYear}
              {shouldShowGpa(e) ? `, GPA ${e.gpa}` : ''})
              {e.relevantCoursework.length > 0 ? ` — Coursework: ${e.relevantCoursework.join(', ')}` : ''}
            </span>
          ))}
        </div>
      )}
      {showCertifications && (
        <div className="mb-2">
          <span className="font-bold">Certifications </span>
          {cv.certifications.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ' · '}
              {c.name} ({c.issuer}, {c.year})
            </span>
          ))}
        </div>
      )}
      {showLanguages && (
        <div className="mb-2">
          <span className="font-bold">Languages </span>
          {cv.languages.map((l, i) => (
            <span key={l.id}>
              {i > 0 && ' · '}
              {l.language} ({l.proficiency})
            </span>
          ))}
        </div>
      )}
      {showProjects && (
        <div className="mb-2">
          <span className="font-bold">Projects </span>
          {cv.projects.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ' · '}
              {p.title}
              {p.date ? ` (${p.date})` : ''}
              {p.description ? ` — ${p.description}` : ''}
            </span>
          ))}
        </div>
      )}
      {showPublications && (
        <div className="mb-2">
          <span className="font-bold">Publications </span>
          {cv.publications.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ' · '}
              {p.title}
              {p.publisher ? `, ${p.publisher}` : ''}
              {p.date ? ` (${p.date})` : ''}
            </span>
          ))}
        </div>
      )}
      {showVolunteer && (
        <div className="mb-2">
          <span className="font-bold">Volunteer Work </span>
          {cv.volunteer.map((v, i) => (
            <span key={v.id}>
              {i > 0 && ' · '}
              {v.role} — {v.organisation}
              {v.date ? ` (${v.date})` : ''}
            </span>
          ))}
        </div>
      )}
      {showAwards && (
        <div className="mb-2">
          <span className="font-bold">Awards & Honors </span>
          {cv.awards.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' · '}
              {a.title}
              {a.issuer ? `, ${a.issuer}` : ''}
              {a.date ? ` (${a.date})` : ''}
            </span>
          ))}
        </div>
      )}
      {showAffiliations && (
        <div className="mb-2">
          <span className="font-bold">Professional Affiliations </span>
          {cv.affiliations.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' · '}
              {a.role ? `${a.role}, ` : ''}
              {a.organisation}
              {a.since ? ` (since ${a.since})` : ''}
            </span>
          ))}
        </div>
      )}
      {showReferences &&
        (cv.referencesMode === 'available_upon_request' ? (
          <div>
            <span className="font-bold">References </span>
            Available upon request.
          </div>
        ) : (
          <div>
            <span className="font-bold">References </span>
            {cv.externalReferences.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ' · '}
                {r.name}, {r.jobTitle} at {r.company} ({r.relationship})
              </span>
            ))}
          </div>
        ))}
    </div>
  )
}

function ExperienceBlock({ cv, accent = '#111827' }: { cv: CvData; accent?: string }) {
  if (cv.experience.length === 0) return <EmptyNote text="No experience recorded yet." />
  return (
    <div className="flex flex-col gap-3">
      {cv.experience.map((e, i) => (
        <div key={i}>
          <div className="flex justify-between gap-2 text-[13px] font-bold" style={{ color: accent }}>
            <span>
              {e.title} — {e.org}
              {e.location ? `, ${e.location}` : ''}
            </span>
            <span className="font-normal text-gray-500">{e.period}</span>
          </div>
          {e.bullets.length > 0 && (
            <ul className="ml-4 mt-1 list-disc text-xs text-gray-700">
              {e.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

/** 1. Classic ATS — single column */
function ClassicATS({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] bg-white p-11 text-gray-900 shadow-lg">
      <div className="mb-4 border-b-2 border-gray-900 pb-3 text-center">
        <div className="text-xl font-bold tracking-wide">{cv.name}</div>
        <div className="mt-1 text-sm text-gray-600">{cv.role}</div>
        <div className="mt-1.5 text-xs text-gray-500">
          {cv.email} · {cv.location}
        </div>
      </div>
      <Section title="Summary">
        <p className="text-xs leading-relaxed">{cv.summary}</p>
      </Section>
      <Section title="Experience">
        <ExperienceBlock cv={cv} />
      </Section>
      <Section title="Skills">{cv.skills.length ? <p className="text-xs">{cv.skills.join(' · ')}</p> : <EmptyNote text="No skills tagged yet." />}</Section>
      <ExtraCvSections cv={cv} />
    </div>
  )
}

/** 2. Modern sidebar — dark rail */
function ModernSidebar({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto flex w-full max-w-[780px] overflow-hidden bg-white text-gray-900 shadow-lg">
      <div className="w-[220px] flex-none bg-[#0F1F35] p-8 text-white">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#4C8DFF] text-lg font-bold">
          {cv.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="text-base font-bold">{cv.name}</div>
        <div className="mb-5 text-xs text-[#9FB3CC]">{cv.role}</div>
        <div className="mb-2 text-[10px] font-bold tracking-widest text-[#9FB3CC]">CONTACT</div>
        <div className="mb-5 text-[11px] leading-relaxed">
          {cv.email}
          <br />
          {cv.location}
        </div>
        <div className="mb-2 text-[10px] font-bold tracking-widest text-[#9FB3CC]">SKILLS</div>
        <div className="flex flex-wrap gap-1.5">
          {cv.skills.length ? cv.skills.map((s) => <span key={s} className="rounded-full bg-white/10 px-2 py-1 text-[10px]">{s}</span>) : <EmptyNote text="None yet." />}
        </div>
      </div>
      <div className="min-w-0 flex-1 p-9">
        <SectionInk title="Summary">
          <p className="text-xs leading-relaxed text-gray-700">{cv.summary}</p>
        </SectionInk>
        <SectionInk title="Experience">
          <ExperienceBlock cv={cv} accent="#111" />
        </SectionInk>
        <ExtraCvSections cv={cv} />
      </div>
    </div>
  )
}

/** 3. Header band — accent gradient */
function GradientHeader({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] overflow-hidden bg-white text-gray-900 shadow-lg">
      <div className="bg-gradient-to-r from-accent to-trust p-9 text-white">
        <div className="text-2xl font-bold">{cv.name}</div>
        <div className="mt-1 text-sm opacity-90">{cv.role}</div>
        <div className="mt-2 text-xs opacity-85">
          {cv.email} · {cv.location}
        </div>
      </div>
      <div className="p-9">
        <p className="mb-5 border-b border-gray-200 pb-4 text-xs leading-relaxed text-gray-700">{cv.summary}</p>
        <SectionAccent title="Experience">
          <ExperienceBlock cv={cv} />
        </SectionAccent>
        <SectionAccent title="Skills">{cv.skills.length ? <p className="text-xs text-gray-700">{cv.skills.join(' · ')}</p> : <EmptyNote text="None yet." />}</SectionAccent>
        <ExtraCvSections cv={cv} />
      </div>
    </div>
  )
}

/** 4. Career timeline */
function CareerTimeline({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] bg-white p-11 text-gray-900 shadow-lg">
      <div className="mb-5">
        <div className="text-xl font-bold">{cv.name}</div>
        <div className="mt-1 text-sm text-gray-600">
          {cv.role} · {cv.location}
        </div>
      </div>
      <p className="mb-6 text-xs leading-relaxed text-gray-700">{cv.summary}</p>
      <div className="mb-3 text-xs font-bold tracking-widest">CAREER TIMELINE</div>
      {cv.experience.length === 0 ? (
        <EmptyNote text="No experience recorded yet." />
      ) : (
        <div className="relative border-l-2 border-gray-200 pl-5">
          {cv.experience.map((e, i) => (
            <div key={i} className="relative pb-4">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
              <div className="font-mono text-[10px] text-gray-500">{e.period}</div>
              <div className="text-[13px] font-bold">
                {e.title} — {e.org}
                {e.location ? `, ${e.location}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
      <ExtraCvSections cv={cv} />
    </div>
  )
}

/** 5. Compact executive — one page */
function CompactExecutive({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] bg-white p-8 text-[11px] text-gray-900 shadow-lg">
      <div className="mb-3 flex items-baseline justify-between border-b-[1.5px] border-gray-900 pb-2">
        <div className="text-lg font-bold">{cv.name}</div>
        <div className="text-[10.5px] text-gray-500">{cv.email}</div>
      </div>
      <div className="mb-2.5 text-xs font-semibold text-gray-700">{cv.role}</div>
      <div className="mb-1.5 text-[10px] font-bold tracking-wide">EXPERIENCE</div>
      <ExperienceBlock cv={cv} />
      <div className="mt-2.5 border-t border-gray-200 pt-2 text-xs text-gray-700">
        <span className="font-bold">SKILLS </span>
        {cv.skills.length ? cv.skills.join(' · ') : 'None yet.'}
      </div>
      <ExtraCvSections cv={cv} />
    </div>
  )
}

/** 6. Two-column balanced */
function TwoColumnBalanced({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto flex w-full max-w-[780px] gap-7 bg-white p-9 text-gray-900 shadow-lg">
      <div className="min-w-0 flex-[2]">
        <div className="text-xl font-bold">{cv.name}</div>
        <div className="mb-4 text-sm text-gray-600">{cv.role}</div>
        <div className="mb-2 text-[11px] font-bold tracking-wide text-trust">EXPERIENCE</div>
        <ExperienceBlock cv={cv} />
      </div>
      <div className="min-w-[180px] flex-1 border-l border-gray-200 pl-5">
        <div className="mb-2 text-[11px] font-bold tracking-wide text-trust">CONTACT</div>
        <div className="mb-4 text-[11.5px] leading-relaxed text-gray-700">
          {cv.email}
          <br />
          {cv.location}
        </div>
        <div className="mb-2 text-[11px] font-bold tracking-wide text-trust">SKILLS</div>
        <div className="text-[11.5px] leading-loose text-gray-700">{cv.skills.length ? cv.skills.map((s) => <div key={s}>{s}</div>) : <EmptyNote text="None yet." />}</div>
        <ExtraCvSections cv={cv} />
      </div>
    </div>
  )
}

/** 7. Technical / engineering — metrics table */
function TechnicalMetrics({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] bg-white p-9 text-gray-900 shadow-lg">
      <div className="mb-3">
        <div className="text-xl font-bold">{cv.name}</div>
        <div className="text-sm text-gray-600">
          {cv.role} · {cv.email} · {cv.location}
        </div>
      </div>
      <div className="mb-2 text-[11px] font-bold tracking-wide">TECHNICAL SKILLS</div>
      <div className="mb-5 grid grid-cols-3 gap-1.5">
        {cv.skills.length ? cv.skills.map((s) => <div key={s} className="rounded border border-gray-200 px-2 py-1.5 text-center text-[11px] text-gray-700">{s}</div>) : <EmptyNote text="None tagged yet." />}
      </div>
      <div className="mb-2 text-[11px] font-bold tracking-wide">EXPERIENCE</div>
      <ExperienceBlock cv={cv} />
      <ExtraCvSections cv={cv} />
    </div>
  )
}

/** 8. Creative accent bar */
function CreativeAccentBar({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] bg-white p-9 text-gray-900 shadow-lg">
      <div className="mb-5 flex items-center gap-4">
        <div className="h-11 w-3 flex-none bg-coral" />
        <div>
          <div className="text-xl font-bold">{cv.name}</div>
          <div className="text-sm text-gray-600">{cv.role}</div>
        </div>
      </div>
      <p className="mb-5 text-xs leading-relaxed text-gray-700">{cv.summary}</p>
      <div className="mb-2 text-[11px] font-bold tracking-wide text-coral">◆ EXPERIENCE</div>
      <div className="border-l-2 border-orange-100 pl-3.5">
        <ExperienceBlock cv={cv} />
      </div>
      <div className="mt-3 text-[11px] font-bold tracking-wide text-coral">◆ SKILLS</div>
      <p className="text-xs text-gray-700">{cv.skills.length ? cv.skills.join(' · ') : 'None yet.'}</p>
      <ExtraCvSections cv={cv} />
    </div>
  )
}

/** 9. Skills-first — functional */
function SkillsFirstFunctional({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] bg-white p-9 text-center text-gray-900 shadow-lg">
      <div className="mb-5">
        <div className="text-xl font-bold">{cv.name}</div>
        <div className="text-sm text-gray-600">
          {cv.role} · {cv.location}
        </div>
      </div>
      <div className="mb-2.5 text-[11px] font-bold tracking-wide">CORE COMPETENCIES</div>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {cv.skills.length ? cv.skills.map((s) => <span key={s} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700">{s}</span>) : <EmptyNote text="None tagged yet." />}
      </div>
      <div className="mb-2 text-left text-[11px] font-bold tracking-wide">PROFESSIONAL EXPERIENCE</div>
      <div className="text-left">
        <ExperienceBlock cv={cv} />
        <ExtraCvSections cv={cv} />
      </div>
    </div>
  )
}

/** 10. Photo card — modern */
function PhotoCardModern({ cv }: { cv: CvData }) {
  return (
    <div className="mx-auto w-full max-w-[780px] overflow-hidden bg-white text-gray-900 shadow-lg">
      <div className="flex items-center gap-4 bg-gray-100 px-9 py-7">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-accent text-xl font-bold text-white">
          {cv.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold">{cv.name}</div>
          <div className="text-sm text-gray-600">{cv.role}</div>
        </div>
      </div>
      <div className="p-9">
        <p className="mb-4 text-xs leading-relaxed text-gray-700">{cv.summary}</p>
        <div className="mb-2 text-[11px] font-bold tracking-wide">SKILLS</div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {cv.skills.length ? cv.skills.map((s) => <span key={s} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-accent">{s}</span>) : <EmptyNote text="None yet." />}
        </div>
        <div className="mb-2 text-[11px] font-bold tracking-wide">EXPERIENCE</div>
        <ExperienceBlock cv={cv} />
        <ExtraCvSections cv={cv} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest">{title}</div>
      {children}
    </div>
  )
}
function SectionInk({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[13px] font-bold tracking-wide">{title.toUpperCase()}</div>
      {children}
    </div>
  )
}
function SectionAccent({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-bold tracking-wide text-accent">{title.toUpperCase()}</div>
      {children}
    </div>
  )
}

export interface CvTemplateDef {
  id: string
  label: string
  description: string
  Component: (props: { cv: CvData }) => ReactElement
}

/** §47.5 CV_TEMPLATE_LIBRARY, verbatim names; layouts follow the Handoff's 10
 * demonstrated structures exactly. */
export const CV_TEMPLATES: CvTemplateDef[] = [
  { id: 'executive', label: 'Executive', description: 'Classic ATS — single column. Safest for applicant tracking systems.', Component: ClassicATS },
  { id: 'corporate', label: 'Corporate', description: 'Modern sidebar — dark rail. Strong visual hierarchy for a human reviewer.', Component: ModernSidebar },
  { id: 'modern-professional', label: 'Modern Professional', description: 'Header band with accent gradient — a confident, modern first impression.', Component: GradientHeader },
  { id: 'minimalist', label: 'Minimalist', description: 'Career timeline — emphasises progression and duration at a glance.', Component: CareerTimeline },
  { id: 'creative', label: 'Creative', description: 'Compact executive, one page — maximum density for senior roles.', Component: CompactExecutive },
  { id: 'academic-research', label: 'Academic & Research', description: 'Two-column balanced — experience gets the width it needs.', Component: TwoColumnBalanced },
  { id: 'technical-engineering', label: 'Technical & Engineering', description: 'Leads with skills and a metrics-forward layout — built for engineers.', Component: TechnicalMetrics },
  { id: 'healthcare', label: 'Healthcare', description: 'A single accent bar carries colour without competing with the text.', Component: CreativeAccentBar },
  { id: 'government-public-service', label: 'Government & Public Service', description: 'Groups skills into competencies before chronology.', Component: SkillsFirstFunctional },
  { id: 'international-europass', label: 'International Professional (Europass-inspired)', description: 'A friendly, modern header card layout.', Component: PhotoCardModern },
]
