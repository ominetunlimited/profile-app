import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import {
  CV_REQUIRED_SECTIONS,
  CV_SECTION_LABELS,
  getCvDetails,
  saveCvDetails,
  type AffiliationEntry,
  type AwardEntry,
  type CertificationEntry,
  type CvDetails,
  type CvSectionKey,
  type EducationEntry,
  type ExternalReferenceEntry,
  type LanguageEntry,
  type LanguageProficiencyLevel,
  type ProjectEntry,
  type PublicationEntry,
  type VolunteerEntry,
} from '@/app/cvDetailsStore'

const PROFICIENCY_LEVELS: LanguageProficiencyLevel[] = ['basic', 'conversational', 'fluent', 'native']
const TOGGLEABLE_SECTIONS: CvSectionKey[] = ['languages', 'projects', 'publications', 'volunteer', 'awards', 'affiliations', 'references']

/**
 * Patch (pre-Phase-7) + V9 Enforcement Patch §5: §4.6 names Education/
 * Certification/Summary/Language/Reference sub-schemas but never field-
 * specifies them, and none of this is derivable from recorded Activities
 * the way work experience is — so unlike the rest of the CV, it needs a
 * real editor, not just auto-population. Every entry here is user-entered
 * (or, for Projects/Publications/Volunteer/Awards, user-entered OR derived
 * from a real recorded Activity and individually hideable) and clearly
 * editable, never fabricated.
 *
 * The section checklist below is the "manual editor must expose the
 * complete CV information architecture" requirement: a user chooses which
 * OPTIONAL sections render in their CV. Summary/Skills/Experience/Education
 * are structural to every template and always render (CV_REQUIRED_SECTIONS).
 */
export function CvDetailsEditor({ ownerEmail, onSaved }: { ownerEmail: string; onSaved: () => void }) {
  const [details, setDetails] = useState<CvDetails>(() => getCvDetails(ownerEmail))

  function patch(p: Partial<CvDetails>) {
    setDetails((d) => ({ ...d, ...p }))
  }
  function toggleSection(key: CvSectionKey) {
    patch({ enabledSections: { ...details.enabledSections, [key]: !details.enabledSections[key] } })
  }
  function save() {
    saveCvDetails(ownerEmail, details)
    onSaved()
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface-sunken p-3.5">
        <h3 className="mb-2 font-semibold text-text-0">Sections included in this CV</h3>
        <p className="mb-3 text-xs text-text-1">
          Summary, Skills, Experience, and Education always appear. Choose which additional sections render — an
          empty optional section stays available here to fill in later, it just won't show on the CV until you turn
          it on.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...CV_REQUIRED_SECTIONS, ...TOGGLEABLE_SECTIONS].map((key) => {
            const required = (CV_REQUIRED_SECTIONS as CvSectionKey[]).includes(key)
            return (
              <label key={key} className={`flex items-center gap-2 text-xs ${required ? 'text-text-2' : 'text-text-0'}`}>
                <input type="checkbox" checked={required || details.enabledSections[key]} disabled={required} onChange={() => toggleSection(key)} />
                {CV_SECTION_LABELS[key]}
                {required && ' (always on)'}
              </label>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-text-0">Summary</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-text-0">
            <input type="checkbox" checked={details.objectiveMode} onChange={(e) => patch({ objectiveMode: e.target.checked })} />
            Render as "Objective" instead of "Summary" (entry-level / career change)
          </label>
          <Field label={details.objectiveMode ? 'Objective statement' : 'Summary statement'}>
            <textarea
              value={details.summaryStatement}
              onChange={(e) => patch({ summaryStatement: e.target.value })}
              rows={3}
              className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Years of experience">
              <TextInput
                type="number"
                min={0}
                value={details.yearsOfExperience ?? ''}
                onChange={(e) => patch({ yearsOfExperience: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Key achievement">
              <TextInput value={details.keyAchievement} onChange={(e) => patch({ keyAchievement: e.target.value })} />
            </Field>
          </div>
        </div>
      </section>

      <EducationSection education={details.education} onChange={(education) => patch({ education })} />
      <CertificationsSection certifications={details.certifications} onChange={(certifications) => patch({ certifications })} />
      {details.enabledSections.languages && <LanguagesSection languages={details.languages} onChange={(languages) => patch({ languages })} />}
      {details.enabledSections.projects && <ProjectsSection entries={details.projects} onChange={(projects) => patch({ projects })} />}
      {details.enabledSections.publications && <PublicationsSection entries={details.publications} onChange={(publications) => patch({ publications })} />}
      {details.enabledSections.volunteer && <VolunteerSection entries={details.volunteer} onChange={(volunteer) => patch({ volunteer })} />}
      {details.enabledSections.awards && <AwardsSection entries={details.awards} onChange={(awards) => patch({ awards })} />}
      {details.enabledSections.affiliations && <AffiliationsSection entries={details.affiliations} onChange={(affiliations) => patch({ affiliations })} />}
      {details.enabledSections.references && (
        <ReferencesSection
          mode={details.referencesMode}
          entries={details.externalReferences}
          onModeChange={(referencesMode) => patch({ referencesMode })}
          onEntriesChange={(externalReferences) => patch({ externalReferences })}
        />
      )}

      <Button onClick={save}>Save CV details</Button>
    </div>
  )
}

function EducationSection({ education, onChange }: { education: EducationEntry[]; onChange: (e: EducationEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Education</h3>
      <div className="flex flex-col gap-3">
        {education.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
            <TextInput placeholder="Degree" value={entry.degree} onChange={(e) => onChange(education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x)))} />
            <TextInput placeholder="School" value={entry.school} onChange={(e) => onChange(education.map((x, j) => (j === i ? { ...x, school: e.target.value } : x)))} />
            <TextInput placeholder="Graduation year" value={entry.graduationYear} onChange={(e) => onChange(education.map((x, j) => (j === i ? { ...x, graduationYear: e.target.value } : x)))} />
            <TextInput
              type="number"
              step="0.1"
              placeholder="GPA (optional)"
              value={entry.gpa ?? ''}
              onChange={(e) => onChange(education.map((x, j) => (j === i ? { ...x, gpa: e.target.value === '' ? undefined : Number(e.target.value) } : x)))}
            />
            <div className="sm:col-span-2">
              <TextInput
                placeholder="Relevant coursework (comma separated, optional)"
                value={entry.relevantCoursework.join(', ')}
                onChange={(e) =>
                  onChange(education.map((x, j) => (j === i ? { ...x, relevantCoursework: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : x)))
                }
              />
            </div>
            <button onClick={() => onChange(education.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-2">
              Remove
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          onClick={() => onChange([...education, { id: crypto.randomUUID(), degree: '', school: '', graduationYear: '', relevantCoursework: [] }])}
        >
          + Add education
        </Button>
      </div>
    </section>
  )
}

function CertificationsSection({ certifications, onChange }: { certifications: CertificationEntry[]; onChange: (c: CertificationEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Certifications</h3>
      <div className="flex flex-col gap-3">
        {certifications.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
            <TextInput placeholder="Name" value={entry.name} onChange={(e) => onChange(certifications.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <TextInput placeholder="Issuer" value={entry.issuer} onChange={(e) => onChange(certifications.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)))} />
            <TextInput placeholder="Year" value={entry.year} onChange={(e) => onChange(certifications.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)))} />
            <button onClick={() => onChange(certifications.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-3">
              Remove
            </button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...certifications, { id: crypto.randomUUID(), name: '', issuer: '', year: '' }])}>
          + Add certification
        </Button>
      </div>
    </section>
  )
}

function LanguagesSection({ languages, onChange }: { languages: LanguageEntry[]; onChange: (l: LanguageEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Languages</h3>
      <div className="flex flex-col gap-3">
        {languages.map((entry, i) => (
          <div key={entry.id} className="flex flex-wrap gap-2 rounded-lg border border-border p-3">
            <TextInput
              placeholder="Language"
              value={entry.language}
              onChange={(e) => onChange(languages.map((x, j) => (j === i ? { ...x, language: e.target.value } : x)))}
              className="flex-1"
            />
            <SelectInput value={entry.proficiency} onChange={(e) => onChange(languages.map((x, j) => (j === i ? { ...x, proficiency: e.target.value as LanguageProficiencyLevel } : x)))}>
              {PROFICIENCY_LEVELS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectInput>
            <button onClick={() => onChange(languages.filter((_, j) => j !== i))} className="text-xs text-danger">
              Remove
            </button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...languages, { id: crypto.randomUUID(), language: '', proficiency: 'conversational' }])}>
          + Add language
        </Button>
      </div>
    </section>
  )
}

/** Shared "this came from a recorded Activity" badge + hide toggle — the
 * real user-control mechanism behind auto-population (careerData.ts's
 * `mergeAutoAndManual`): hiding never deletes the underlying Activity. */
function AutoBadge({ hidden, onToggleHidden }: { hidden: boolean; onToggleHidden: () => void }) {
  return (
    <button onClick={onToggleHidden} type="button" className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-2">
      From an activity — {hidden ? 'hidden, click to show' : 'click to hide'}
    </button>
  )
}

function ProjectsSection({ entries, onChange }: { entries: ProjectEntry[]; onChange: (e: ProjectEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Projects</h3>
      <p className="mb-2 text-xs text-text-1">Projects you record from Home appear here automatically — add more manually below.</p>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
            {entry.sourceActivityId && <AutoBadge hidden={!!entry.hidden} onToggleHidden={() => onChange(entries.map((x, j) => (j === i ? { ...x, hidden: !x.hidden } : x)))} />}
            <TextInput placeholder="Title" value={entry.title} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <TextInput placeholder="Role" value={entry.role} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
            <TextInput placeholder="Date" value={entry.date} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
            <TextInput placeholder="Tools (comma separated)" value={entry.tools.join(', ')} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : x)))} />
            <div className="sm:col-span-2">
              <TextInput placeholder="Description" value={entry.description} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
            </div>
            {!entry.sourceActivityId && (
              <button onClick={() => onChange(entries.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-2">
                Remove
              </button>
            )}
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...entries, { id: crypto.randomUUID(), title: '', description: '', role: '', date: '', tools: [] }])}>
          + Add project
        </Button>
      </div>
    </section>
  )
}

function PublicationsSection({ entries, onChange }: { entries: PublicationEntry[]; onChange: (e: PublicationEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Publications</h3>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
            {entry.sourceActivityId && <AutoBadge hidden={!!entry.hidden} onToggleHidden={() => onChange(entries.map((x, j) => (j === i ? { ...x, hidden: !x.hidden } : x)))} />}
            <TextInput placeholder="Title" value={entry.title} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <TextInput placeholder="Publisher" value={entry.publisher} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, publisher: e.target.value } : x)))} />
            <TextInput placeholder="Date" value={entry.date} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
            <TextInput placeholder="URL (optional)" value={entry.url} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            {!entry.sourceActivityId && (
              <button onClick={() => onChange(entries.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-2">
                Remove
              </button>
            )}
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...entries, { id: crypto.randomUUID(), title: '', publisher: '', date: '', url: '' }])}>
          + Add publication
        </Button>
      </div>
    </section>
  )
}

function VolunteerSection({ entries, onChange }: { entries: VolunteerEntry[]; onChange: (e: VolunteerEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Volunteer Work</h3>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
            {entry.sourceActivityId && <AutoBadge hidden={!!entry.hidden} onToggleHidden={() => onChange(entries.map((x, j) => (j === i ? { ...x, hidden: !x.hidden } : x)))} />}
            <TextInput placeholder="Role" value={entry.role} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
            <TextInput placeholder="Organisation" value={entry.organisation} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, organisation: e.target.value } : x)))} />
            <TextInput placeholder="Date" value={entry.date} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
            <div className="sm:col-span-2">
              <TextInput placeholder="Description" value={entry.description} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
            </div>
            {!entry.sourceActivityId && (
              <button onClick={() => onChange(entries.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-2">
                Remove
              </button>
            )}
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...entries, { id: crypto.randomUUID(), role: '', organisation: '', description: '', date: '' }])}>
          + Add volunteer work
        </Button>
      </div>
    </section>
  )
}

function AwardsSection({ entries, onChange }: { entries: AwardEntry[]; onChange: (e: AwardEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Awards & Honors</h3>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
            {entry.sourceActivityId && <AutoBadge hidden={!!entry.hidden} onToggleHidden={() => onChange(entries.map((x, j) => (j === i ? { ...x, hidden: !x.hidden } : x)))} />}
            <TextInput placeholder="Title" value={entry.title} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <TextInput placeholder="Issuer" value={entry.issuer} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)))} />
            <TextInput placeholder="Date" value={entry.date} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
            {!entry.sourceActivityId && (
              <button onClick={() => onChange(entries.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-3">
                Remove
              </button>
            )}
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...entries, { id: crypto.randomUUID(), title: '', issuer: '', date: '' }])}>
          + Add award
        </Button>
      </div>
    </section>
  )
}

function AffiliationsSection({ entries, onChange }: { entries: AffiliationEntry[]; onChange: (e: AffiliationEntry[]) => void }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">Professional Affiliations</h3>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
            <TextInput placeholder="Organisation" value={entry.organisation} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, organisation: e.target.value } : x)))} />
            <TextInput placeholder="Role (optional)" value={entry.role} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
            <TextInput placeholder="Member since" value={entry.since} onChange={(e) => onChange(entries.map((x, j) => (j === i ? { ...x, since: e.target.value } : x)))} />
            <button onClick={() => onChange(entries.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-3">
              Remove
            </button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...entries, { id: crypto.randomUUID(), organisation: '', role: '', since: '' }])}>
          + Add affiliation
        </Button>
      </div>
    </section>
  )
}

function ReferencesSection({
  mode,
  entries,
  onModeChange,
  onEntriesChange,
}: {
  mode: CvDetails['referencesMode']
  entries: ExternalReferenceEntry[]
  onModeChange: (m: CvDetails['referencesMode']) => void
  onEntriesChange: (e: ExternalReferenceEntry[]) => void
}) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-text-0">References</h3>
      <p className="mb-2 text-xs text-text-1">
        These are self-reported contact-card references, shown as unverified — distinct from PROFILE's own verified
        reference workflow (not available until other users exist to serve as verified referees).
      </p>
      <div className="mb-3 flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === 'listed'} onChange={() => onModeChange('listed')} /> List references
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === 'available_upon_request'} onChange={() => onModeChange('available_upon_request')} /> "Available upon request"
        </label>
      </div>
      {mode === 'listed' && (
        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => (
            <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              <TextInput placeholder="Name" value={entry.name} onChange={(e) => onEntriesChange(entries.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <TextInput placeholder="Job title" value={entry.jobTitle} onChange={(e) => onEntriesChange(entries.map((x, j) => (j === i ? { ...x, jobTitle: e.target.value } : x)))} />
              <TextInput placeholder="Company" value={entry.company} onChange={(e) => onEntriesChange(entries.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))} />
              <TextInput placeholder="Relationship (e.g. Former Manager)" value={entry.relationship} onChange={(e) => onEntriesChange(entries.map((x, j) => (j === i ? { ...x, relationship: e.target.value } : x)))} />
              <TextInput placeholder="Phone (optional)" value={entry.phone} onChange={(e) => onEntriesChange(entries.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))} />
              <TextInput placeholder="Email (optional)" value={entry.email} onChange={(e) => onEntriesChange(entries.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
              <button onClick={() => onEntriesChange(entries.filter((_, j) => j !== i))} className="text-left text-xs text-danger sm:col-span-2">
                Remove
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => onEntriesChange([...entries, { id: crypto.randomUUID(), name: '', jobTitle: '', company: '', relationship: '', phone: '', email: '' }])}
          >
            + Add reference
          </Button>
        </div>
      )}
    </section>
  )
}
