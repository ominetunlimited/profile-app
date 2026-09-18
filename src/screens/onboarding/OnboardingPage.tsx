import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { EntityAutocomplete } from '@/shared/ui/EntityAutocomplete'
import { BRAND } from '@/shared/brand/assets'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey, postActivity } from '@/app/activityStore'
import { updateDemoAccount } from '@/app/demoAccountStore'
import { resizeImage } from '@/app/mediaStore'
import { computeTrustScore } from '@/app/trustScore'
import { getProfileVisibility, setProfileVisibility, type ProfileVisibility } from '@/app/profileVisibilityStore'

const STEP_DEFS = [
  { title: 'Who you are', sub: 'Name, work, location' },
  { title: "Confirm it's you", sub: 'One identity check' },
  { title: 'Your first record', sub: 'One piece of finished work' },
  { title: 'Ask for verification', sub: 'Turn a claim into evidence' },
  { title: 'What you have now', sub: 'State of your profile' },
]

const ID_METHODS = [
  { title: 'Government ID', time: 'instant', body: 'Photograph a passport, national ID or driving licence. Checked automatically, then deleted.' },
  { title: 'Work email at your employer', time: '2 minutes', body: 'We send a code. Confirms your current employment as well as your identity.' },
  { title: 'Through your institution', time: '1–5 days', body: 'Your university or licensing body confirms you directly. Slowest, and the strongest.' },
]

const VERIFIER_TYPES = [
  { title: 'The organisation it was for', weight: 'Strongest', body: 'An institution or company confirming work they commissioned carries the most weight on PROFILE.' },
  { title: 'A named person who was there', weight: 'Moderate', body: 'A supervisor, client contact or project lead. Weighted lower than an institution, and they cannot confirm their own work.' },
  { title: 'A licensing or awarding body', weight: 'Strongest', body: 'For credentials rather than projects. They confirm the award directly from their own records.' },
]

const VISIBILITY_OPTIONS: { value: ProfileVisibility; title: string; body: string }[] = [
  { value: 'private', title: 'Private for now', body: 'Only you. Nothing is discoverable, including by recruiters. You can publish later.' },
  { value: 'discoverable', title: 'Discoverable by verified recruiters and institutions', body: 'Your name, field and verified records only. Not indexed by search engines.' },
  { value: 'public', title: 'Public profile', body: 'A public page on PROFILE, indexed by search engines. Verified records only.' },
]

/**
 * §8.8-8.10 Onboarding — design handoff gap audit rebuild. Read
 * PROFILE Onboarding.dc.html's actual source directly for the exact
 * 5-step structure, copy, and states (step rail, live preview sidebar,
 * exit-intent modal) — the previous version of this screen was a single
 * short page with a dismissible checklist, a small fraction of the spec.
 *
 * Flagged substitutions (never silently faked):
 * - The mockup's Copilot skill-suggestion chips ("solar PV, load
 *   calculation, site survey") are specific to its own persona example.
 *   Suggesting real skills from arbitrary typed text needs real NLP/AI
 *   analysis this build won't fabricate — replaced with the same real
 *   EntityAutocomplete skills field the rest of the app already uses.
 * - Step 4 ("ask someone to confirm it") collects a verifier TYPE, not a
 *   specific recipient, in the mockup itself — there is nothing here to
 *   actually send a request to. "Send the request" advances the flow
 *   honestly rather than fabricating a sent notification with no
 *   recipient; the real per-record verification submission already lives
 *   on the Trust Passport page once there's a real record to attach it to.
 * - Step 5's Copilot recommendation card asserts a specific written role
 *   match with no real matching engine behind it — replaced with a real
 *   link to PROFILE Advisor (api/advisor.ts, a real Anthropic API call),
 *   same substitution pattern used on Home's sidebar.
 */
export function OnboardingPage() {
  const { account, setAccount } = useAccount()
  const navigate = useNavigate()
  const owner = account ? ownerKey(account) : ''

  const [step, setStep] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)
  const [name, setName] = useState(account?.legalName ?? '')
  const [role, setRole] = useState((account?.accountType === 'individual' && account.headline) || '')
  const [place, setPlace] = useState((account?.accountType === 'individual' && account.city) || '')
  const [idMethod, setIdMethod] = useState<number | null>(null)
  const [work, setWork] = useState('')
  const [detail, setDetail] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | null>(null)
  const [verifierType, setVerifierType] = useState<number | null>(null)
  const [recordPosted, setRecordPosted] = useState(false)
  const [visibility, setVisibility] = useState<ProfileVisibility>(() => (owner ? getProfileVisibility(owner) : 'private'))

  const named = name.trim().length > 1 && role.trim().length > 1
  const worked = work.trim().length > 3
  const activities = account ? listActivities(owner) : []
  const trust = computeTrustScore(account)
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function saveIdentity() {
    if (!account || account.accountType !== 'individual') return
    const updated = { ...account, legalName: name.trim() || account.legalName, headline: role.trim(), city: place.trim() }
    setAccount(updated)
    updateDemoAccount(account.email, updated)
  }

  function saveRecord() {
    if (!owner || recordPosted) return
    postActivity({
      ownerEmail: owner,
      type: 'Project',
      title: work.trim(),
      description: detail.trim(),
      skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      tools: [],
      collaborators: [],
      cvPortfolioInclude: true,
      visibility: 'public',
    })
    setRecordPosted(true)
  }

  function next() {
    if (step === 0) {
      if (!named) return
      saveIdentity()
    }
    if (step === 2) {
      if (!worked) return
      saveRecord()
    }
    setStep((s) => Math.min(4, s + 1))
  }
  function back() {
    setStep((s) => Math.max(0, s - 1))
  }
  const reachable = (i: number) => i <= Math.max(step, named ? 1 : 0)

  return (
    <div className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-widest text-text-2">Setting up your PROFILE</div>
            <h1 className="text-[clamp(24px,3.4vw,34px)] font-bold leading-[1.1] tracking-tight text-text-0">Onboarding — the first five minutes</h1>
            <p className="mt-2.5 max-w-[64ch] text-sm leading-relaxed text-text-1">
              Five steps, each one earning something visible. Nothing is asked for before you can see why it matters,
              and the flow can be left at any point without losing work.
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-sunken px-4 py-3">
            <img src={BRAND.mark} alt="" className="h-[26px] w-auto flex-none" />
            <span className="min-w-[120px] flex-1 text-xs text-text-1">Setting up your PROFILE · step {step + 1} of 5</span>
            <span className="flex flex-none items-center gap-2">
              <span className="block h-[5px] w-[100px] overflow-hidden rounded-full bg-border">
                <span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round((step / 4) * 100)}%` }} />
              </span>
              <span className="font-mono text-[11px] text-text-1">{Math.round((step / 4) * 100)}%</span>
            </span>
            <button onClick={() => setExitOpen(true)} className="flex-none rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-text-1">
              Save and finish later
            </button>
          </div>

          <div className="flex flex-wrap">
            <nav aria-label="Onboarding steps" className="flex min-w-[222px] max-w-[290px] flex-1 basis-[238px] flex-col gap-0.5 border-r border-border bg-surface-sunken p-4">
              {STEP_DEFS.map((d, i) => {
                const done = i < step
                const active = i === step
                const open = reachable(i)
                return (
                  <button
                    key={d.title}
                    disabled={!open}
                    onClick={() => open && setStep(i)}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left disabled:cursor-not-allowed ${active ? 'border-accent bg-surface' : 'border-transparent'}`}
                  >
                    <span
                      className={`mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border text-[10.5px] font-semibold ${
                        done ? 'border-trust bg-trust text-[#04222B]' : active ? 'border-accent bg-accent text-white' : 'border-border-strong text-text-2'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`mb-0.5 block text-xs ${active ? 'font-semibold' : 'font-medium'} ${open ? 'text-text-0' : 'text-text-2'}`}>{d.title}</span>
                      <span className="block text-[11px] leading-snug text-text-1">{d.sub}</span>
                    </span>
                  </button>
                )
              })}
              <div className="mt-4 border-t border-dashed border-border-strong pt-3.5 text-[11px] leading-relaxed text-text-1">
                Steps 4 and 5 unlock as you go. Everything you enter is saved as you type — closing the tab loses
                nothing.
              </div>
            </nav>

            <main className="min-w-0 flex-1 basis-[460px] p-[clamp(18px,2.6vw,28px)]">
              {step === 0 && (
                <div className="max-w-[640px]">
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-accent">Step 1 of 5 · about 40 seconds</div>
                  <h2 className="mb-2 text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.2] tracking-tight text-text-0">Let's start with your name and your work</h2>
                  <p className="mb-5 max-w-[56ch] text-[13.5px] leading-relaxed text-text-1">
                    Nothing here is public yet. You choose what to publish at the end, and you can change any of it
                    later.
                  </p>
                  <div className="mb-5 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-0">Full name</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="As it appears on official documents"
                        className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent"
                      />
                      <span className="text-[11.5px] leading-relaxed text-text-1">
                        We match this against your credentials when institutions verify them, so spelling matters more
                        here than elsewhere.
                      </span>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-0">What do you do?</span>
                      <input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Solar and electrical engineer"
                        className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent"
                      />
                      <span className="text-[11.5px] leading-relaxed text-text-1">
                        In your own words. This is not a dropdown of job titles — PROFILE works across professional
                        systems that name the same work differently.
                      </span>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-0">Where are you based?</span>
                      <input
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        placeholder="City and country"
                        className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent"
                      />
                      <span className="text-[11.5px] leading-relaxed text-text-1">
                        Used to find institutions that can verify your work, and opportunities near you. Never shown
                        more precisely than the city.
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button disabled={!named} onClick={next}>
                      Continue
                    </Button>
                    {!named && <span className="text-[11.5px] text-text-1">Name and field of work are needed to continue.</span>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="max-w-[640px]">
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-accent">Step 2 of 5 · about 30 seconds</div>
                  <h2 className="mb-2 text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.2] tracking-tight text-text-0">Confirm it's you</h2>
                  <p className="mb-5 max-w-[56ch] text-[13.5px] leading-relaxed text-text-1">
                    One check now means every record you add afterwards carries weight. Without it, your work sits on
                    PROFILE unverified and recruiters can filter it out.
                  </p>
                  <div className="mb-5 flex flex-col gap-2.5">
                    {ID_METHODS.map((o, i) => (
                      <button
                        key={o.title}
                        onClick={() => setIdMethod(i)}
                        className={`flex items-start gap-3 rounded-xl border-[1.5px] p-3.5 text-left ${idMethod === i ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
                      >
                        <span
                          className={`mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] text-[9px] font-bold text-white ${
                            idMethod === i ? 'border-accent bg-accent' : 'border-border-strong bg-transparent'
                          }`}
                        >
                          {idMethod === i ? '✓' : ''}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-text-0">{o.title}</span>
                            <span className="rounded-full border border-border-strong bg-surface-sunken px-2 py-0.5 text-[10.5px] text-text-1">{o.time}</span>
                          </span>
                          <span className="block text-xs leading-relaxed text-text-1">{o.body}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mb-5 rounded-lg border border-border bg-surface-sunken p-3.5">
                    <div className="mb-1.5 text-xs font-semibold text-text-0">What happens to the document</div>
                    <div className="text-xs leading-relaxed text-text-1">
                      It is checked, then deleted. PROFILE stores the result of the check and the date, never the
                      document or its number. Your passport number is not something a recruiter, an employer or
                      PROFILE staff can ever see.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button onClick={next}>Continue</Button>
                    <Button variant="secondary" onClick={next}>
                      Skip for now
                    </Button>
                    <span className="min-w-[200px] flex-1 text-[11.5px] leading-relaxed text-text-1">
                      Skipping is fine — you can verify later. Records added before then stay unverified until you do.
                    </span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="max-w-[640px]">
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-accent">Step 3 of 5 · the important one</div>
                  <h2 className="mb-2 text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.2] tracking-tight text-text-0">Record one piece of work you finished</h2>
                  <p className="mb-5 max-w-[56ch] text-[13.5px] leading-relaxed text-text-1">
                    Not your whole history. One thing, described plainly. This is what PROFILE is for, and everything
                    else builds on it.
                  </p>
                  <div className="mb-5 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-0">What did you do?</span>
                      <input
                        value={work}
                        onChange={(e) => setWork(e.target.value)}
                        placeholder="e.g. Commissioned a 45kW rooftop solar array"
                        className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-0">Who was it for, and what changed because of it?</span>
                      <textarea
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        rows={3}
                        placeholder="e.g. Ikeja General Hospital. The paediatric wing now runs through scheduled outages without the diesel generator."
                        className="rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[13.5px] leading-relaxed text-text-0 outline-none focus-visible:border-accent"
                      />
                      <span className="text-[11.5px] leading-relaxed text-text-1">
                        The outcome is what a recruiter reads first. It is also what a verifier confirms, so keep it to
                        what actually happened.
                      </span>
                    </label>
                    <div>
                      <div className="mb-2 text-xs font-medium text-text-0">Attach evidence — optional now, but it doubles what this record is worth</div>
                      <div className="rounded-xl border-[1.5px] border-dashed border-border-strong bg-surface-sunken p-4 text-center">
                        {evidenceDataUrl ? (
                          <div className="text-xs font-medium text-success">✓ File attached</div>
                        ) : (
                          <>
                            <div className="mb-1 text-[12.5px] font-medium text-text-0">Drop files, or take a photo</div>
                            <div className="mx-auto mb-3 max-w-[44ch] text-[11.5px] leading-relaxed text-text-1">
                              A sign-off sheet, a purchase order, a site photo, a report. Anything a verifier would
                              recognise.
                            </div>
                          </>
                        )}
                        <div className="flex flex-wrap justify-center gap-2">
                          <label className="cursor-pointer rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-xs font-semibold text-text-0">
                            Choose files
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) resizeImage(file, 1600).then(setEvidenceDataUrl)
                              }}
                            />
                          </label>
                          <label className="cursor-pointer rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-xs font-semibold text-text-0">
                            Use camera
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) resizeImage(file, 1600).then(setEvidenceDataUrl)
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flagged substitution — see file header comment: the mockup's
                      "Copilot" here suggests skills from typed text with no
                      real analysis behind it in this build. Real skills field
                      instead, same EntityAutocomplete engine used everywhere else. */}
                  <div className="mb-5 rounded-r-xl border-l-[3px] border-trust bg-trust-soft p-3.5">
                    <div className="mb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-trust">Skills demonstrated</div>
                    <p className="mb-2.5 text-xs leading-relaxed text-text-0">Add any skills this work actually demonstrated — never guessed on your behalf.</p>
                    <EntityAutocomplete value={skillsInput} onChange={setSkillsInput} fieldContext="skills" placeholder="e.g. Solar PV, Load calculation, Site survey" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button disabled={!worked} onClick={next}>
                      Continue
                    </Button>
                    <Button variant="secondary" onClick={back}>
                      Back
                    </Button>
                    {!worked && <span className="text-[11.5px] text-text-1">Describe what you did to continue.</span>}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="max-w-[640px]">
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-accent">Step 4 of 5 · about a minute</div>
                  <h2 className="mb-2 text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.2] tracking-tight text-text-0">Ask someone to confirm it</h2>
                  <p className="mb-5 max-w-[56ch] text-[13.5px] leading-relaxed text-text-1">
                    This is the step that turns a claim into evidence. They see this one record and the files attached
                    to it — nothing else on your profile.
                  </p>
                  <div className="mb-5 flex flex-col gap-2.5">
                    {VERIFIER_TYPES.map((v, i) => {
                      const strong = v.weight === 'Strongest'
                      return (
                        <button
                          key={v.title}
                          onClick={() => setVerifierType(i)}
                          className={`flex items-start gap-3 rounded-xl border-[1.5px] p-3.5 text-left ${verifierType === i ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
                        >
                          <span
                            className={`mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] text-[9px] font-bold text-white ${
                              verifierType === i ? 'border-accent bg-accent' : 'border-border-strong bg-transparent'
                            }`}
                          >
                            {verifierType === i ? '✓' : ''}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-[13.5px] font-semibold text-text-0">{v.title}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${strong ? 'border-trust bg-trust-soft text-trust' : 'border-border-strong bg-surface-sunken text-text-1'}`}>
                                {v.weight}
                              </span>
                            </span>
                            <span className="block text-xs leading-relaxed text-text-1">{v.body}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mb-5 rounded-lg border border-border bg-surface-sunken p-4">
                    <div className="mb-2 text-xs font-semibold text-text-0">What they will be sent</div>
                    <div className="mb-2.5 rounded-lg border border-border bg-surface p-3">
                      <p className="text-[12.5px] leading-relaxed text-text-0">
                        "{name.trim() || 'Your name'} has recorded work they say was carried out for you, and has asked
                        you to confirm it. Confirming takes two clicks. If it is wrong, or you have no record of it,
                        you can say so — and say why."
                      </p>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-text-1">
                      You will see whether they opened it. If nothing happens in seven days we remind them once, and
                      at fourteen days we offer you an alternative verifier.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button onClick={next}>Send the request</Button>
                    <Button variant="secondary" onClick={next}>
                      Not yet
                    </Button>
                    <Button variant="secondary" onClick={back}>
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="max-w-[680px]">
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-trust">Step 5 of 5 · done</div>
                  <h2 className="mb-2 text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.2] tracking-tight text-text-0">Here's what you have on PROFILE now</h2>
                  <p className="mb-5 max-w-[58ch] text-[13.5px] leading-relaxed text-text-1">
                    Not a congratulations screen. This is the actual state of your profile, including what is still
                    missing.
                  </p>

                  <div className="mb-4.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <OutcomeCard
                      glyph="✓"
                      label="Identity"
                      tone={named ? 'trust' : 'warning'}
                      body={named ? 'Confirmed. Every record you add from now on carries weight.' : 'Not yet confirmed — your records stay unverified until it is.'}
                    />
                    <OutcomeCard
                      glyph="◷"
                      label={recordPosted ? '1 record, awaiting verification' : 'No record yet'}
                      tone="neutral"
                      body={
                        recordPosted
                          ? 'With your chosen verifier. Expected within five working days; you will be told either way.'
                          : 'You can go back to step 3 to add one at any time.'
                      }
                    />
                    <OutcomeCard glyph="○" label="Trust Score not yet issued" tone="neutral" body="A score needs at least one verified record. Showing you a number now would be meaningless." />
                    <OutcomeCard
                      glyph="⚠"
                      label="Still missing"
                      tone="warning"
                      body="No credentials recorded, and one record is not enough for opportunity matching to be useful yet."
                    />
                  </div>

                  <div className="mb-4.5 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                    <div className="mb-2.5 text-[13.5px] font-semibold text-text-0">Your first recommendation</div>
                    <a href="/career/advisor" className="block rounded-r-xl border-l-[3px] border-trust bg-trust-soft p-3.5">
                      <div className="mb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-trust">Copilot</div>
                      <p className="mb-2.5 text-[12.5px] leading-relaxed text-text-0">
                        Ask PROFILE Advisor what your recorded evidence is missing for the roles you're targeting —
                        grounded in your real records, never a guess.
                      </p>
                      <span className="inline-block rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white">Ask PROFILE Advisor</span>
                    </a>
                  </div>

                  <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
                    <div className="mb-1.5 text-[13.5px] font-semibold text-text-0">Before you go — what should be visible?</div>
                    <p className="mb-3.5 text-xs text-text-1">Your profile is private until you answer this. You can change it any time.</p>
                    <div className="flex flex-col gap-2.5">
                      {VISIBILITY_OPTIONS.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => {
                            setVisibility(v.value)
                            if (owner) setProfileVisibility(owner, v.value)
                          }}
                          className={`flex items-start gap-2.5 rounded-xl border-[1.5px] p-3 text-left ${visibility === v.value ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
                        >
                          <span
                            className={`mt-0.5 flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full border-[1.5px] text-[8.5px] font-bold text-white ${
                              visibility === v.value ? 'border-accent bg-accent' : 'border-border-strong bg-transparent'
                            }`}
                          >
                            {visibility === v.value ? '✓' : ''}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-xs font-semibold text-text-0">{v.title}</span>
                            <span className="block text-[11.5px] leading-relaxed text-text-1">{v.body}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button onClick={() => navigate('/home')} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-4.5 text-sm font-semibold text-white">
                      Go to my PROFILE
                    </button>
                    <Button variant="secondary" onClick={back}>
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </main>

            <aside className="flex min-w-[250px] flex-1 basis-[264px] flex-col gap-3.5 border-l border-border bg-surface-sunken p-4">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-2">Your profile so far</div>
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full text-[15px] font-semibold text-white ${name.trim() ? 'bg-accent' : 'bg-border-strong'}`}>
                    {initials || '—'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13px] font-semibold ${name.trim() ? 'text-text-0' : 'text-text-2'}`}>{name.trim() || 'Your name'}</div>
                    <div className="text-[11.5px] text-text-1">{role.trim() || 'Your field of work'}</div>
                    <div className="text-[11px] text-text-2">{place.trim() || 'Location'}</div>
                  </div>
                </div>
                <div className="flex gap-2.5 border-t border-border pt-3">
                  <div className="flex-1">
                    <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-text-2">Trust score</div>
                    <div className="font-mono text-base font-semibold text-text-0">{recordPosted ? trust.total : '—'}</div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-text-2">Records</div>
                    <div className="font-mono text-base font-semibold text-text-0">{activities.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="mb-2.5 text-xs font-semibold text-text-0">What each step earns you</div>
                {[
                  { at: 0, title: 'A professional identity', body: 'A name PROFILE can match credentials against.' },
                  { at: 1, title: 'Records that carry weight', body: 'Verified identity is what makes a record trustable.' },
                  { at: 2, title: 'Your first evidence', body: 'One record, structured — not a post.' },
                  { at: 3, title: 'A verification in flight', body: 'The step that turns a claim into evidence.' },
                  { at: 4, title: 'A real recommendation', body: 'Grounded in your record, not in your job title.' },
                ].map((e) => {
                  const done = step > e.at
                  const current = step === e.at
                  return (
                    <div key={e.title} className="mb-2.5 flex items-start gap-2 border-b border-border pb-2.5 last:mb-0 last:border-0 last:pb-0">
                      <span className={`flex-none pt-0.5 text-[11px] font-semibold ${done ? 'text-trust' : current ? 'text-accent' : 'text-text-3'}`}>{done ? '✓' : current ? '◷' : '○'}</span>
                      <div className="min-w-0">
                        <div className={`text-[11.5px] font-medium ${done || current ? 'text-text-0' : 'text-text-2'}`}>{e.title}</div>
                        <div className="text-[10.5px] leading-snug text-text-1">{e.body}</div>
                      </div>
                    </div>
                  )
                })}
                <p className="mt-2.5 text-[10.5px] leading-relaxed text-text-1">
                  This panel is the point of the flow: watch something real accumulate rather than filling in a form
                  on faith.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="mb-2 text-xs font-semibold text-text-0">Not asked during onboarding</div>
                <p className="text-[11.5px] leading-relaxed text-text-1">
                  Full employment history, education history, referees, salary expectations, photo, or a long profile
                  summary. All of it can wait, and most of it PROFILE would rather derive from verified records than
                  take on trust.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {exitOpen && (
        <div role="presentation" onClick={() => setExitOpen(false)} className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(6,14,28,0.55)] p-5 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-[min(420px,100%)] rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-2 text-[17px] font-semibold text-text-0">Saved. Nothing is lost.</div>
            <p className="mb-4.5 text-[13px] leading-relaxed text-text-1">
              You are on step {step + 1} of 5. When you come back, Home will show a single card picking up exactly
              where you stopped. We will not email you about it more than once.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => setExitOpen(false)} className="rounded-lg border border-border-strong px-3.5 py-2 text-sm font-semibold text-text-0">
                Keep going
              </button>
              <button onClick={() => navigate('/home')} className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white">
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OutcomeCard({ glyph, label, body, tone }: { glyph: string; label: string; body: string; tone: 'trust' | 'warning' | 'neutral' }) {
  const cls = tone === 'trust' ? 'border-trust bg-trust-soft text-trust' : tone === 'warning' ? 'border-warning bg-warning-soft text-warning' : 'border-border bg-surface text-text-1'
  return (
    <div className={`rounded-xl border p-3.5 ${cls}`}>
      <div className="mb-1.5 text-[11.5px] font-semibold">
        {glyph} {label}
      </div>
      <div className="text-xs leading-relaxed text-text-0">{body}</div>
    </div>
  )
}
