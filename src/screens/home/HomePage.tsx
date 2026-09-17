import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { ActivityCard } from '@/shared/ui/ActivityCard'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'
import { EntityAutocomplete } from '@/shared/ui/EntityAutocomplete'
import { useAccount } from '@/app/AccountContext'
import { listActivities, listFeedFor, ownerKey, postActivity } from '@/app/activityStore'
import { listActiveCampaignsForPlacement } from '@/app/adStore'


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
  // §7.1 Feed Ad Position — real active campaigns for this placement only,
  // never fabricated to look populated.
  const sponsoredCampaigns = listActiveCampaignsForPlacement('home_feed')

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

  return (
    <AppShell>
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
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

        <div className="flex flex-col gap-4">
          {feed.length === 0 ? (
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
            feed.map((a, i) => (
              <div key={a.id} className="flex flex-col gap-4">
                <ActivityCard activity={a} viewerAccount={account} viewerEmail={owner} />
                {/* Every 4th item, never the very first — a real, labelled,
                    inline feed item, never an overlay (§7's hard rule). */}
                {i > 0 && (i + 1) % 4 === 0 && sponsoredCampaigns.length > 0 && (
                  <SponsoredCard campaign={sponsoredCampaigns[Math.floor(i / 4) % sponsoredCampaigns.length]} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
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
      <Field label="Tools used (optional)" hint="Comma-separated — distinct from skills, feeds your CV's Tools section (§4.8)">
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
      <div className="flex gap-2">
        <Button
          disabled={!title.trim() || !description.trim()}
          onClick={() => {
            postActivity({
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
            onPosted()
          }}
        >
          Post
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

