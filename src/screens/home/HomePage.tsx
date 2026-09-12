import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { listActivities, ownerKey, postActivity, type ActivityRecord } from '@/app/activityStore'
import { getMyReaction, getReactionCounts, setMyReaction, REACTIONS } from '@/app/reactionStore'

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

/** §11 Home Feed & Record Work System. */
export function HomePage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [activities, setActivities] = useState<ActivityRecord[]>(() => listActivities(owner))
  const [composerOpen, setComposerOpen] = useState(false)

  const name = account?.accountType === 'individual' ? account.legalName.split(' ')[0] : account?.accountType === 'organisation' ? account.legalName : ''

  const gaps = [
    account?.accountType === 'individual' && !account.headline ? 'Add a professional headline' : null,
    account?.accountType === 'individual' && !account.username ? 'Choose a username' : null,
    activities.length === 0 ? 'Record your first activity' : null,
  ].filter((g): g is string => !!g)

  function refresh() {
    setActivities(listActivities(owner))
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
          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
              Nothing recorded yet. Your feed fills in as you record real work — never with filler content.
            </div>
          ) : (
            activities.map((a) => <ActivityCard key={a.id} activity={a} authorName={name} viewerEmail={owner} />)
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Composer({ owner, onClose, onPosted }: { owner: string; onClose: () => void; onPosted: () => void }) {
  const [type, setType] = useState(ACTIVITY_TYPES[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
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
        <TextInput value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g. React, Figma, Contract negotiation" />
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

function ActivityCard({ activity, authorName, viewerEmail }: { activity: ActivityRecord; authorName: string; viewerEmail: string }) {
  const [myReaction, setMyReactionState] = useState(() => getMyReaction(activity.id, viewerEmail))
  const [counts, setCounts] = useState(() => getReactionCounts(activity.id))

  function react(type: (typeof REACTIONS)[number]['type']) {
    setMyReaction(activity.id, viewerEmail, type)
    setMyReactionState(getMyReaction(activity.id, viewerEmail))
    setCounts(getReactionCounts(activity.id))
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-text-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
          {authorName.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-medium text-text-0">{authorName}</span>
        <span className="rounded-full border border-border px-2 py-0.5">{activity.type}</span>
        <span className="ml-auto">{new Date(activity.createdAt).toLocaleDateString()}</span>
      </div>
      <h2 className="mb-1 font-semibold text-text-0">{activity.title}</h2>
      {activity.description && <p className="mb-2 text-sm text-text-1">{activity.description}</p>}
      {activity.role && <p className="mb-2 text-xs text-text-2">Role: {activity.role}{activity.location ? ` · ${activity.location}` : ''}</p>}
      {activity.skills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {activity.skills.map((s) => (
            <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-text-1">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2 text-xs text-text-2">
        {REACTIONS.map((r) => {
          const active = myReaction === r.type
          const count = counts[r.type]
          return (
            <button
              key={r.type}
              onClick={() => react(r.type)}
              aria-pressed={active}
              className={`rounded-full border px-2 py-1 ${active ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-2'}`}
            >
              {r.emoji} {r.label}
              {count > 0 ? ` · ${count}` : ''}
            </button>
          )
        })}
      </div>
    </article>
  )
}
