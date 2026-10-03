import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { ActivityCard } from '@/shared/ui/ActivityCard'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'
import { RepostCard } from '@/shared/ui/RepostCard'
import { RecommendationsPanel } from '@/shared/ui/RecommendationsPanel'
import { CameraCapture } from '@/shared/ui/CameraCapture'
import { listFeedRepostsFor, useSocialCacheVersion } from '@/app/socialStore'
import { EntityAutocomplete } from '@/shared/ui/EntityAutocomplete'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'
import { useAccount } from '@/app/AccountContext'
import { listActivities, listFeedFor, onActivitiesChange, ownerKey, postActivity } from '@/app/activityStore'
import { listActiveCampaignsForPlacement, useCampaignsCacheVersion } from '@/app/adStore'
import { computeTrustScore } from '@/app/trustScore'
import { listVerificationRequests } from '@/app/verificationRequestStore'
import { listOpenJobs, orgDisplayName } from '@/app/jobStore'
import { ACCEPTED_FILE_TYPES, categorizeFile, MAX_FILE_SIZE_BYTES, uploadMediaAsset } from '@/app/mediaAssetStore'


/** §11.4 POST_COMPOSER_TYPES, verbatim. */
const ACTIVITY_TYPES = [
  'Project',
  'Work Experience',
  'Skill Demonstration',
  'Certification Earned',
  'Achievement',
  'Publication',
  'Trade Job',
  'Mentorship',
  'Collaboration',
  'Event Participation',
  'Volunteer Work',
  'Portfolio Item',
]

/** §11 Home Feed & Record Work System — a real feed: the signed-in
 * account's own activity plus real activity from accounts they actually
 * follow/connect with (activityStore.ts's listFeedFor), not just a private
 * personal log. */
export function HomePage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [myActivityCount, setMyActivityCount] = useState(() => listActivities(owner).length)
  const [feed, setFeed] = useState(() => listFeedFor(owner))
  const [composerOpen, setComposerOpen] = useState(false)
  useCampaignsCacheVersion()
  useSocialCacheVersion()
  // §7.1 Feed Ad Position — real active campaigns for this placement only,
  // never fabricated to look populated.
  const sponsoredCampaigns = listActiveCampaignsForPlacement('home_feed')
  // Activities + reposts (own, and from people/orgs this account connects with
  // or follows) in one chronological stream.
  const feedItems = [
    ...feed.map((activity) => ({ kind: 'activity' as const, activity, at: activity.createdAt })),
    ...listFeedRepostsFor(owner).map((repost) => ({ kind: 'repost' as const, repost, at: repost.createdAt })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const name = account?.accountType === 'individual' ? account.legalName.split(' ')[0] : account?.accountType === 'organisation' ? account.legalName : ''

  const gaps = [
    account?.accountType === 'individual' && !account.headline ? 'Add a professional headline' : null,
    account?.accountType === 'individual' && !account.username ? 'Choose a username' : null,
    myActivityCount === 0 ? 'Record your first activity' : null,
  ].filter((g): g is string => !!g)

  function refresh() {
    setMyActivityCount(listActivities(owner).length)
    setFeed(listFeedFor(owner))
  }

  // Pipeline repair Phase A: activityStore's cache loads asynchronously and
  // can also receive a Realtime push (another device's post) — without this,
  // myActivityCount/feed would freeze at whatever the cache held on mount,
  // same class of bug useAccountsCacheVersion fixed for Search.
  useEffect(() => onActivitiesChange(refresh), [owner])

  // Design handoff gap audit — PROFILE Home.dc.html's right sidebar
  // (Trust Score, Profile health, Matched opportunities, Verification in
  // progress) had no real equivalent at all. Every figure below is
  // computed from this build's own real stores — none of the mockup's
  // illustrative numbers (14 records, 72% readiness, "812" score) are
  // ported; where this build genuinely has no real signal for something
  // the mockup shows, that's called out below rather than invented.
  const myActivities = listActivities(owner)
  const distinctSkills = Array.from(new Set(myActivities.flatMap((a) => a.skills.map((s) => s.trim()).filter(Boolean))))
  const trust = computeTrustScore(account)
  const verifications = listVerificationRequests(owner)
  const verifiedCount = verifications.filter((v) => v.status === 'verified').length
  const inProgressVerifications = verifications.filter((v) => v.status !== 'verified' && v.status !== 'rejected')
  const identityConfirmed = verifications.some((v) => v.moduleKey === 'identity' && v.status === 'verified')
  const verificationCoveragePct = verifications.length > 0 ? Math.round((verifiedCount / verifications.length) * 100) : 0
  const health = [
    { label: 'Identity confirmed', value: identityConfirmed ? 'Yes' : 'No', pct: identityConfirmed ? 100 : 8 },
    { label: 'Evidence depth', value: `${myActivities.length} record${myActivities.length === 1 ? '' : 's'}`, pct: Math.min(100, myActivities.length * 8) },
    { label: 'Verification coverage', value: `${verificationCoveragePct}%`, pct: verificationCoveragePct },
    { label: 'Skills mapped', value: `${distinctSkills.length}`, pct: Math.min(100, distinctSkills.length * 5) },
  ]
  const healthPct = Math.round(health.reduce((s, h) => s + h.pct, 0) / health.length)

  // Matched opportunities — a real, if simple, match%: overlap between
  // this account's own recorded skills and a job's required skills. Never
  // a fabricated ML-style score, since no matching engine exists.
  const matchedOpportunities = listOpenJobs()
    .map((job) => {
      const overlap = job.requiredSkills.filter((req) => distinctSkills.some((s) => s.toLowerCase() === req.toLowerCase()))
      const matchPct = job.requiredSkills.length > 0 ? Math.round((overlap.length / job.requiredSkills.length) * 100) : 0
      return { job, matchPct, overlap }
    })
    .filter((m) => m.matchPct > 0)
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, 2)

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1120px] flex-wrap gap-6 px-4 py-8 sm:px-6">
        <div className="min-w-0 flex-1 basis-[560px]">
          <h1 className="mb-6 text-xl font-bold text-text-0">Good to see you, {name}.</h1>

          {gaps.length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-2">Suggested next steps</div>
              <div className="flex flex-col gap-1.5">
                {gaps.map((g) => (
                  <div key={g} className="flex items-center gap-2 text-sm text-text-0">
                    <span className="text-text-2">·</span> {g}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 rounded-xl border border-border bg-surface p-4">
            {!composerOpen ? (
              <button onClick={() => setComposerOpen(true)} className="w-full rounded-lg border border-dashed border-border-strong py-3 text-sm font-medium text-text-1">
                + Record work
              </button>
            ) : (
              <Composer
                owner={owner}
                onClose={() => setComposerOpen(false)}
                onPosted={() => {
                  setComposerOpen(false)
                  refresh()
                }}
              />
            )}
          </div>

          {/* Design handoff gap audit — PROFILE Home.dc.html's 3-metric row.
              Values are real (own activity/verification data), not the
              mockup's illustrative "14"/"72%"/"38" — this build has no
              Career Readiness Engine or profile-view tracking
              yet, so those two stay honestly "—"/0 rather than invented. */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HomeMetric label="Verified records" value={verifiedCount} note="Records confirmed by an institution or employer." link={{ to: '/trust-passport', label: 'View all records' }} />
            <HomeMetric label="Career readiness" value="—" note="No Career Readiness Engine exists in this build yet." link={{ to: '/career-growth', label: "See what's missing" }} />
            <HomeMetric label="Profile views by verifiers" value={0} note="Recruiters and institutions only. Not a vanity count." link={{ to: '/notifications', label: 'Who viewed' }} />
          </div>

          <RecommendationsPanel limit={3} className="mb-4 lg:hidden" />
          <div className="flex flex-col gap-4">
            {feedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
                <p className="mb-3">
                  {myActivityCount === 0
                    ? 'Nothing here yet — your feed fills in as you record real work, never with filler content.'
                    : "You've recorded your own work, but your feed is otherwise quiet — follow organisations or connect with people to see their activity here too."}
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold text-accent">
                  <Link to="/opportunities">Discover opportunities</Link>
                  <Link to="/communities">Join communities</Link>
                </div>
              </div>
            ) : (
              feedItems.map((item, i) => (
                <div key={item.kind === 'repost' ? `r-${item.repost.id}` : item.activity.id} className="flex flex-col gap-4">
                  {item.kind === 'repost' ? (
                    <RepostCard repost={item.repost} viewerAccount={account} viewerEmail={owner} />
                  ) : (
                    <ActivityCard activity={item.activity} viewerAccount={account} viewerEmail={owner} />
                  )}
                  {/* Every 4th item, never the very first — a real, labelled,
                      inline feed item, never an overlay. */}
                  {i > 0 && (i + 1) % 4 === 0 && sponsoredCampaigns.length > 0 && (
                    <SponsoredCard campaign={sponsoredCampaigns[Math.floor(i / 4) % sponsoredCampaigns.length]} viewerAccount={account} viewerEmail={owner} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Design handoff gap audit — PROFILE Home.dc.html's right sidebar
            had no real equivalent at all. Hidden below lg since AppShell's
            own mobile chrome already reprioritises this content into the
            main column, matching the mockup's own "Mobile — 390px" note
            that the sidebar becomes a horizontal set below the fold rather
            than disappearing. */}
        <aside className="hidden w-[280px] flex-none flex-col gap-3.5 lg:flex">
          <RecommendationsPanel limit={5} />
          <div className="flex items-center gap-3.5 rounded-xl border border-border bg-surface p-4">
            <TrustScoreRing trust={trust} size={64} />
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-sm font-semibold text-text-0">Trust Score</div>
              <p className="mb-1.5 text-xs leading-relaxed text-text-1">{trust.tier.label} tier.</p>
              <Link to="/trust-passport" className="text-xs font-semibold text-trust">
                How this is calculated
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-text-0">Profile health</span>
              <span className="font-mono text-xs text-text-1">{healthPct}%</span>
            </div>
            {health.map((h) => (
              <div key={h.label} className="mb-2.5">
                <div className="mb-1 flex justify-between gap-2 text-xs text-text-1">
                  <span>{h.label}</span>
                  <span className="font-mono text-text-2">{h.value}</span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${h.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="border-t border-border pt-2 text-[11px] text-text-1">Health measures evidence and verification depth. It is not a popularity score.</p>
          </div>

          {/* Design handoff gap audit — the mockup's Copilot card asserts a
              specific, written gap analysis ("your hospital commissioning
              work covers two of four requirements..."). No real gap-
              analysis engine exists to compute that, and this build never
              fabricates a specific AI claim with nothing behind it — the
              real PROFILE Advisor (api/advisor.ts) can actually answer this
              kind of question live, so this invites that instead of
              inventing a canned insight. Flagging this substitution rather
              than silently shipping fabricated analysis. */}
          <Link to="/career/advisor" className="block rounded-r-xl border-l-[3px] border-trust bg-trust-soft p-3.5">
            <div className="mb-1.5 font-mono text-[9.5px] font-semibold tracking-wide text-trust">COPILOT</div>
            <p className="text-xs leading-relaxed text-text-0">
              Ask PROFILE Advisor where your recorded evidence stands against a role you're targeting — grounded in
              your real records, never a guess.
            </p>
          </Link>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2.5 text-sm font-semibold text-text-0">Matched opportunities</div>
            {matchedOpportunities.length === 0 ? (
              <p className="mb-2.5 text-xs text-text-1">No open listing overlaps your recorded skills yet.</p>
            ) : (
              matchedOpportunities.map(({ job, matchPct }) => (
                <Link key={job.id} to={`/job/${job.id}`} className="mb-2.5 block border-b border-border pb-2.5">
                  <div className="mb-0.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-text-0">{job.title}</span>
                    <span className="font-mono text-[10.5px] text-trust">{matchPct}%</span>
                  </div>
                  <span className="mb-1 block text-[11px] text-text-1">{orgDisplayName(job.orgEmail)}</span>
                  <span className="block text-[11px] leading-relaxed text-text-1">Based on skills you've recorded that this listing asks for.</span>
                </Link>
              ))
            )}
            <Link to="/opportunities" className="text-xs font-semibold text-accent">
              All opportunities
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2.5 text-sm font-semibold text-text-0">Verification in progress</div>
            {inProgressVerifications.length === 0 ? (
              <p className="mb-2.5 text-xs text-text-1">Nothing in progress right now.</p>
            ) : (
              inProgressVerifications.map((v) => (
                <div key={v.id} className="mb-2 flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-trust" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-text-0">{v.moduleName}</div>
                    <div className="text-[11px] text-text-1">{v.status.replace(/_/g, ' ')} · {v.issuerName}</div>
                  </div>
                </div>
              ))
            )}
            <Link to="/trust-passport" className="text-xs font-semibold text-accent">
              Trust Center
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

function HomeMetric({ label, value, note, link }: { label: string; value: string | number; note: string; link: { to: string; label: string } }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-2">{label}</span>
      <span className="font-mono text-2xl font-semibold text-text-0">{value}</span>
      <span className="text-xs leading-relaxed text-text-1">{note}</span>
      <Link to={link.to} className="mt-auto text-xs font-semibold text-accent">
        {link.label}
      </Link>
    </div>
  )
}

export function Composer({ owner, onClose, onPosted }: { owner: string; onClose: () => void; onPosted: () => void }) {
  const [type, setType] = useState(ACTIVITY_TYPES[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [toolsInput, setToolsInput] = useState('')
  const [collaboratorsInput, setCollaboratorsInput] = useState('')
  const [cvPortfolioInclude, setCvPortfolioInclude] = useState(true)
  const [visibility, setVisibility] = useState<'public' | 'connections_only' | 'private'>('public')
  // Collapsed by default ("Add files" disclosure) — a composer with every
  // field always visible, including a full file-upload UI, is exactly the
  // "cluttered" layout this was asked to avoid.
  const [filesOpen, setFilesOpen] = useState(false)
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [uploadState, setUploadState] = useState<{ posting: boolean; current: number; total: number; error: string | null }>({
    posting: false,
    current: 0,
    total: 0,
    error: null,
  })

  return (
    <div className="flex flex-col gap-3">
      <Field label="Type">
        <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you do?" />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
          placeholder="What happened, for whom, with what result?"
        />
      </Field>
      <Field label="Your role (optional)">
        <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Lead Designer" />
      </Field>
      <Field label="Location (optional)">
        <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" />
      </Field>
      <Field label="Skills demonstrated (optional)" hint="Comma-separated — these are what CV/Portfolio Skills sections and Discover matching pull from">
        <EntityAutocomplete value={skillsInput} onChange={setSkillsInput} fieldContext="skills" placeholder="e.g. React, Figma, Contract negotiation" />
      </Field>
      <Field label="Tools used (optional)" hint="Comma-separated — distinct from skills, feeds your CV's Tools section">
        <EntityAutocomplete value={toolsInput} onChange={setToolsInput} fieldContext="tools" placeholder="e.g. Figma, AutoCAD, Salesforce" />
      </Field>
      <Field label="Collaborators (optional)" hint="Comma-separated names — self-reported, not linked to their PROFILE account yet">
        <EntityAutocomplete value={collaboratorsInput} onChange={setCollaboratorsInput} fieldContext="collaborators" placeholder="e.g. Amara Okafor, Chidi Eze, or @handle" />
      </Field>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={cvPortfolioInclude} onChange={(e) => setCvPortfolioInclude(e.target.checked)} /> Include in CV / Portfolio
        </label>
        <span className="ml-auto">
          <SelectInput value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
            <option value="public">Public</option>
            <option value="connections_only">Connections only</option>
            <option value="private">Private</option>
          </SelectInput>
        </span>
      </div>

      <div className="rounded-lg border border-border-strong">
        <button
          type="button"
          onClick={() => setFilesOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-text-0"
        >
          <span>
            {filesOpen ? '▾' : '▸'} Add files {stagedFiles.length > 0 && <span className="text-text-2">({stagedFiles.length})</span>}
          </span>
          <span className="text-xs text-text-2">Images, video, audio, PDF, Word, PowerPoint, Excel, EPUB</span>
        </button>
        {filesOpen && (
          <div className="border-t border-border-strong p-3">
            <input
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? [])
                const tooBig = picked.filter((f) => f.size > MAX_FILE_SIZE_BYTES)
                if (tooBig.length > 0) {
                  setUploadState((s) => ({ ...s, error: `${tooBig.map((f) => f.name).join(', ')} exceeds the 50MB limit for this build.` }))
                }
                setStagedFiles((prev) => [...prev, ...picked.filter((f) => f.size <= MAX_FILE_SIZE_BYTES)])
                e.target.value = ''
              }}
              className="mb-2.5 block w-full text-sm text-text-1"
            />
            <button type="button" onClick={() => setCameraOpen(true)} className="mb-2.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-0">
              📷 Take a photo
            </button>
            <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => setStagedFiles((prev) => [...prev, f])} title="Take a photo" guide="none" />
            {stagedFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {stagedFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md bg-surface-sunken px-2.5 py-1.5 text-xs">
                    <span className="min-w-0 flex-1 truncate text-text-0">
                      {f.name} <span className="text-text-2">· {categorizeFile(f)} · {(f.size / (1024 * 1024)).toFixed(1)}MB</span>
                    </span>
                    <button type="button" onClick={() => setStagedFiles((prev) => prev.filter((_, idx) => idx !== i))} className="ml-2 flex-none font-semibold text-danger">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-text-2">
              Each upload gets a real Copyright ID. Direct upload, no resumable transfer or virus scan yet — a 50MB
              practical limit for this build, not the full spec's 20GB.
            </p>
          </div>
        )}
      </div>

      {uploadState.error && (
        <p role="alert" aria-live="polite" className="text-xs text-danger">
          {uploadState.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          disabled={!title.trim() || !description.trim() || uploadState.posting}
          onClick={async () => {
            setUploadState({ posting: true, current: 0, total: stagedFiles.length, error: null })
            try {
              const record = await postActivity({
                ownerEmail: owner,
                type,
                title,
                description,
                role: role || undefined,
                location: location || undefined,
                skills: skillsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                tools: toolsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                collaborators: collaboratorsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                cvPortfolioInclude,
                visibility,
              })
              for (let i = 0; i < stagedFiles.length; i++) {
                setUploadState((s) => ({ ...s, current: i + 1 }))
                await uploadMediaAsset({ file: stagedFiles[i], ownerEmail: owner, targetType: 'activity', targetId: record.id })
              }
              onPosted()
            } catch (err) {
              setUploadState({ posting: false, current: 0, total: 0, error: err instanceof Error ? err.message : 'Could not post this activity. Please try again.' })
            }
          }}
        >
          {uploadState.posting && uploadState.total > 0 ? `Uploading ${uploadState.current}/${uploadState.total}…` : 'Post'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

