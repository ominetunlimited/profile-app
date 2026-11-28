import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { ActivityCard } from '@/shared/ui/ActivityCard'
import { SponsoredCard } from '@/shared/ui/SponsoredCard'
import { RepostCard } from '@/shared/ui/RepostCard'
import { CameraCapture } from '@/shared/ui/CameraCapture'
import { listBookmarks, listFeedRepostsFor, useSocialCacheVersion } from '@/app/socialStore'
import { EntityAutocomplete } from '@/shared/ui/EntityAutocomplete'
import { useAccount } from '@/app/AccountContext'
import { IconBadgeCheck, IconBriefcase, IconCheck, IconChevronRight, IconMedal, IconSearch, IconTrendingUp, IconWarning } from '@/shared/ui/icons'
import { activitiesStatus, listActivities, listCommunityFeedFor, listFeedFor, ownerKey, postActivity, retryActivities, useActivitiesCacheVersion } from '@/app/activityStore'
import { listActiveCampaignsForPlacement, useCampaignsCacheVersion } from '@/app/adStore'
import { computeTrustScore } from '@/app/trustScore'
import { listVerificationRequests, useVerificationVersion } from '@/app/verificationRequestStore'
import { listOpenJobs, orgDisplayName, useJobsCacheVersion } from '@/app/jobStore'
import { ACCEPTED_FILE_TYPES, categorizeFile, MAX_FILE_SIZE_BYTES, uploadMediaAsset } from '@/app/mediaAssetStore'
import { useAccountsCacheVersion } from '@/app/demoAccountStore'
import { useLearningVersion } from '@/app/learningStore'
import { ProfileLoader } from '@/shared/ui/profile/ProfileLoader'
import { useCvDetailsVersion } from '@/app/cvDetailsStore'
import { useConnectionsCacheVersion } from '@/app/connectionStore'
import { useFollowsCacheVersion } from '@/app/followStore'
import { useApplicationsCacheVersion } from '@/app/applicationStore'
import { useCommunitiesVersion } from '@/app/communityStore'
import { KIND_LABEL, recommend } from '@/app/recommendationEngine'
import { recordFeedback, useRecommendationFeedbackVersion } from '@/app/recommendationFeedbackStore'

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

type FeedTab = 'all' | 'verified' | 'network' | 'saved'
const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'all', label: 'All activity' },
  { key: 'verified', label: 'Verified only' },
  { key: 'network', label: 'My network' },
  { key: 'saved', label: 'Saved' },
]

function greetingFor(hour: number): string {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** Home: a professional command centre — where am I, how am I doing, what matters, what next. */
export function HomePage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [composerOpen, setComposerOpen] = useState(false)
  const [tab, setTab] = useState<FeedTab>('all')
  const [explainOpen, setExplainOpen] = useState(false)
  const versions =
    useActivitiesCacheVersion() + useAccountsCacheVersion() + useConnectionsCacheVersion() + useFollowsCacheVersion() + useJobsCacheVersion() +
    useApplicationsCacheVersion() + useCommunitiesVersion() + useSocialCacheVersion() + useRecommendationFeedbackVersion() + useCampaignsCacheVersion() + useVerificationVersion() + useLearningVersion() + useCvDetailsVersion()
  const { status, lastSyncedAt } = activitiesStatus()
  // The signed-in account's own activity plus real activity from people and organisations they follow or connect with, and reposts.
  const sponsoredCampaigns = listActiveCampaignsForPlacement('home_feed')

  const myActivities = listActivities(owner)
  const feed = listFeedFor(owner)
  const community = listCommunityFeedFor(owner)
  const allItems = [
    ...feed.map((activity) => ({ kind: 'activity' as const, activity, at: activity.createdAt, community: false })),
    ...community.map((activity) => ({ kind: 'activity' as const, activity, at: activity.createdAt, community: true })),
    ...listFeedRepostsFor(owner).map((repost) => ({ kind: 'repost' as const, repost, at: repost.createdAt })),
  ].sort((a, b) => b.at.localeCompare(a.at))
  const savedIds = new Set(listBookmarks(owner).filter((b) => b.type === 'activity').map((b) => b.id))
  const me = owner.toLowerCase()
  const shownItems =
    tab === 'all'
      ? allItems
      : tab === 'network'
        ? allItems.filter((i) => (i.kind === 'activity' ? i.activity.ownerEmail.toLowerCase() !== me : i.repost.reposterEmail.toLowerCase() !== me))
        : tab === 'saved'
          ? allItems.filter((i) => i.kind === 'activity' && savedIds.has(i.activity.id))
          : []

  const firstName = account?.accountType === 'individual' ? account.legalName.split(' ')[0] : account?.legalName ?? ''
  const distinctSkills = Array.from(new Set(myActivities.flatMap((a) => a.skills.map((s) => s.trim()).filter(Boolean))))
  const trust = computeTrustScore(account)
  const verifications = listVerificationRequests(owner)
  const verifiedCount = verifications.filter((v) => v.status === 'verified').length
  const inProgressVerifications = verifications.filter((v) => v.status !== 'verified' && v.status !== 'rejected')
  const identityConfirmed = verifications.some((v) => v.moduleKey === 'identity' && v.status === 'verified')
  const verificationCoveragePct = verifications.length > 0 ? Math.round((verifiedCount / verifications.length) * 100) : 0
  const isFirstRun = myActivities.length === 0 && verifications.length === 0
  const health = [
    { label: 'Identity confirmed', value: identityConfirmed ? 'Yes' : 'No', pct: identityConfirmed ? 100 : 10, tone: identityConfirmed ? 'bg-success' : 'bg-warning' },
    { label: 'Evidence depth', value: `${myActivities.length} record${myActivities.length === 1 ? '' : 's'}`, pct: Math.max(2, Math.min(100, myActivities.length * 8)), tone: 'bg-accent' },
    { label: 'Verification coverage', value: `${verificationCoveragePct}%`, pct: Math.max(2, verificationCoveragePct), tone: 'bg-trust' },
    { label: 'Skills mapped', value: `${distinctSkills.length}`, pct: Math.max(2, Math.min(100, distinctSkills.length * 5)), tone: 'bg-accent' },
  ]

  const actions = useMemo(() => recommend(account, 4), [account, versions]) // eslint-disable-line react-hooks/exhaustive-deps

  // A real, simple match%: overlap between this account's recorded skills and a job's required skills.
  const matchedOpportunities = listOpenJobs()
    .map((job) => {
      const overlap = job.requiredSkills.filter((req) => distinctSkills.some((s) => s.toLowerCase() === req.toLowerCase()))
      const matchPct = job.requiredSkills.length > 0 ? Math.round((overlap.length / job.requiredSkills.length) * 100) : 0
      return { job, matchPct, overlap }
    })
    .filter((m) => m.matchPct > 0)
    .sort((a, b) => b.matchPct - a.matchPct)
  const matchedTop = matchedOpportunities.slice(0, 3)

  const greeting = isFirstRun ? `Welcome, ${firstName}.` : `${greetingFor(new Date().getHours())}, ${firstName}.`
  const greetingSub = isFirstRun
    ? 'Your account exists. Nothing is on your profile yet — three short steps change that.'
    : actions.length > 0
      ? `${actions.length === 1 ? 'One thing needs' : `${actions.length} things need`} you today.`
      : inProgressVerifications.length > 0
        ? `Nothing needs your attention today. ${inProgressVerifications.length} verification request${inProgressVerifications.length === 1 ? ' is' : 's are'} in progress.`
        : 'Nothing needs your attention today.'


  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-24 lg:px-6 lg:pb-6">
        <section
          aria-labelledby="focus-h"
          className="rounded-2xl p-5 text-white shadow-md sm:p-6"
          style={{ background: 'linear-gradient(135deg, var(--profile-royal), var(--profile-bright-blue))' }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/60">Today's focus</div>
              <h1 id="focus-h" className="font-heading text-[clamp(22px,3vw,28px)] font-extrabold leading-tight tracking-tight">{greeting}</h1>
              <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-white/75">{greetingSub}</p>
            </div>
            <div className="flex-none text-right">
              <div className="font-heading text-[clamp(28px,4vw,38px)] font-black leading-none">{trust.total > 0 ? trust.total : '—'}</div>
              <div className="mt-1 text-[11px] text-white/60">Trust Score</div>
            </div>
          </div>
          {actions.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {actions.slice(0, 4).map((a) => (
                <li key={a.key} className="relative rounded-xl border border-white/10 bg-white/10 p-3 transition hover:border-white/25 hover:bg-white/15">
                  <Link to={a.to} onClick={() => void recordFeedback(owner, a.key, a.kind, 'acted')} className="block no-underline">
                    <span className="mb-2 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/85">{KIND_LABEL[a.kind]}</span>
                    <span className="block text-[13px] font-semibold leading-snug text-white">{a.title}</span>
                    <span className="mt-2 block text-xs font-bold text-[var(--profile-gold)]">{a.cta} →</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Dismiss: ${a.title}`}
                    onClick={() => void recordFeedback(owner, a.key, a.kind, 'dismissed')}
                    className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    Later
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            aria-expanded={composerOpen}
            className="mt-4 hidden h-10 items-center rounded-xl bg-white px-4 text-[13.5px] font-bold text-[var(--profile-royal)] hover:bg-white/90 sm:inline-flex"
          >
            Record work
          </button>
        </section>

        {composerOpen && (
          <div className="rounded-[14px] border border-border bg-surface p-4 shadow-sm">
            <Composer owner={owner} onClose={() => setComposerOpen(false)} onPosted={() => setComposerOpen(false)} />
          </div>
        )}

        {isFirstRun && (
          <div className="rounded-[14px] border border-accent bg-accent-soft px-5 py-[18px]">
            <div className="mb-1.5 text-[14.5px] font-semibold text-text-0">Your first five minutes</div>
            <p className="mb-3.5 max-w-[60ch] text-[13px] leading-relaxed text-text-1">
              Nothing here is filled in yet, and that is the point — PROFILE is built from your actual work. Three steps put something real on your profile today.
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-2.5">
              {[
                { step: 'STEP 1 · 2 MIN', title: 'Confirm who you are', body: 'Name, field of work, location. Nothing public until you say so.' },
                { step: 'STEP 2 · 3 MIN', title: 'Record one piece of work', body: 'Something you finished recently. Attach whatever evidence you have.' },
                { step: 'STEP 3', title: 'Send it for verification', body: 'We show you who can confirm it and what they will see.' },
              ].map((s) => (
                <div key={s.step} className="rounded-[11px] border border-border bg-surface px-3.5 py-[13px]">
                  <div className="mb-[7px] font-mono text-[10px] tracking-[.08em] text-accent">{s.step}</div>
                  <div className="mb-[5px] text-[12.5px] font-semibold text-text-0">{s.title}</div>
                  <div className="text-[11.5px] leading-relaxed text-text-1">{s.body}</div>
                </div>
              ))}
            </div>
            <Link to="/onboarding" className="mt-3.5 inline-flex h-[38px] items-center rounded-lg bg-accent-solid px-[15px] text-[13px] font-semibold text-white no-underline">
              Start step 1
            </Link>
          </div>
        )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Profile views', value: '—', note: 'By verifiers only', Icon: IconSearch, tone: 'bg-surface-secondary text-accent' },
              { label: 'Verified records', value: String(verifiedCount), note: 'Confirmed by an issuer', Icon: IconBadgeCheck, tone: 'bg-trust-soft text-trust' },
              { label: 'Opportunities', value: String(matchedOpportunities.length), note: 'Matched to your skills', Icon: IconBriefcase, tone: 'bg-gold-soft text-gold' },
              { label: 'Trust Score', value: trust.total > 0 ? String(trust.total) : '—', note: trust.total > 0 ? `${trust.tier.label} tier` : 'Starts at your first verified record', Icon: IconMedal, tone: 'bg-surface-secondary text-accent' },
            ].map(({ label, value, note, Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`} aria-hidden>
                  <Icon size={20} />
                </span>
                <div className="mt-3 font-heading text-2xl font-extrabold leading-none tracking-tight text-text-0">{value}</div>
                <div className="mt-1 text-xs font-semibold text-text-1">{label}</div>
                <div className="mt-0.5 text-[11px] text-text-2">{note}</div>
              </div>
            ))}
          </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
          <section className="min-w-0" aria-labelledby="pro-activity">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 id="pro-activity" className="flex-1 font-heading text-base font-extrabold text-text-0">Activity Feed</h2>
              <button type="button" onClick={() => setExplainOpen((v) => !v)} aria-expanded={explainOpen} className="flex-none text-xs font-medium text-accent">
                Why this order?
              </button>
            </div>
            {explainOpen && (
              <p className="mb-3 rounded-lg bg-surface-sunken px-3 py-2 text-xs leading-relaxed text-text-1">
                Newest first: your own records, plus records and reposts from the people and organisations you follow or are connected with. Nothing is boosted or hidden by engagement.
              </p>
            )}
            <div role="tablist" className="mb-4 flex gap-1 overflow-auto">
              {FEED_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-none whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-colors ${tab === t.key ? 'bg-accent-solid text-white shadow-sm' : 'text-text-1 hover:bg-surface-sunken'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {status === 'loading' && allItems.length === 0 ? (
              <div className="flex flex-col gap-3.5" role="status" aria-live="polite">
                {[1, 2].map((n) => (
                  <div key={n} className="rounded-xl border border-border p-[15px]">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="h-[34px] w-[34px] flex-none rounded-full bg-surface-sunken" />
                      <span className="flex-1">
                        <span className="mb-1.5 block h-2.5 w-[38%] rounded-[3px] bg-surface-sunken" />
                        <span className="block h-[9px] w-1/4 rounded-[3px] bg-surface-sunken" />
                      </span>
                    </div>
                    <span className="mb-2 block h-[11px] rounded-[3px] bg-surface-sunken" />
                    <span className="block h-[11px] w-[72%] rounded-[3px] bg-surface-sunken" />
                  </div>
                ))}
                <div className="flex items-center gap-[9px] text-xs text-text-1">
                  <ProfileLoader size={40} label="Loading your activity" />
                  Loading your activity — the layout is already in place, so nothing will shift.
                </div>
              </div>
            ) : (
              <>
                {status === 'degraded' && (
                  <div role="alert" className="mb-4 rounded-xl border border-warning bg-warning-soft px-[18px] py-4">
                    <div className="mb-1.5 text-[13.5px] font-semibold text-text-0">⚠ Showing your last synced activity</div>
                    <p className="mb-3 max-w-[60ch] text-[12.5px] leading-relaxed text-text-0">
                      The activity service is not responding.{' '}
                      {lastSyncedAt ? `Everything below was last synced at ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and may be out of date.` : 'Nothing has been synced yet on this device.'}
                    </p>
                    <button type="button" onClick={retryActivities} className="h-[34px] rounded-lg bg-warning px-3 text-[12.5px] font-semibold text-white">
                      ↻ Try again
                    </button>
                  </div>
                )}
                {shownItems.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface px-5 py-[34px] text-center">
                    <div aria-hidden className="mx-auto mb-3.5 h-10 w-10 rounded-[11px] border-2 border-dashed border-border-strong" />
                    <div className="mb-1.5 text-sm font-semibold text-text-0">{tab === 'saved' ? 'Nothing saved yet' : tab === 'verified' ? 'No verified records yet' : 'No activity here yet'}</div>
                    <p className="mx-auto mb-3.5 max-w-[46ch] text-[12.5px] leading-relaxed text-text-1">
                      {tab === 'saved'
                        ? 'Save a record from its menu and it will be kept here.'
                        : tab === 'verified'
                          ? 'Records confirmed by an institution or employer will be listed here.'
                          : 'Records from you and the people you work with appear here. Yours carry more weight once an institution has confirmed them.'}
                    </p>
                    {tab === 'all' && (
                      <button type="button" onClick={() => setComposerOpen(true)} className="h-[38px] rounded-lg bg-accent-solid px-[15px] text-[13px] font-semibold text-white">
                        Record your first activity
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {shownItems.map((item, i) => (
                      <div key={item.kind === 'repost' ? `r-${item.repost.id}` : item.activity.id} className="flex flex-col gap-3.5">
                        {item.kind === 'activity' && item.community && (
                          <div className="-mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-2">From the community</div>
                        )}
                        {item.kind === 'repost' ? (
                          <RepostCard repost={item.repost} viewerAccount={account} viewerEmail={owner} />
                        ) : (
                          <ActivityCard activity={item.activity} viewerAccount={account} viewerEmail={owner} />
                        )}
                        {/* A real, labelled, inline sponsored item every 4th card, never the first. */}
                        {tab === 'all' && i > 0 && (i + 1) % 4 === 0 && sponsoredCampaigns.length > 0 && (
                          <SponsoredCard campaign={sponsoredCampaigns[Math.floor(i / 4) % sponsoredCampaigns.length]} viewerAccount={account} viewerEmail={owner} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-sm font-extrabold text-text-0">Trust Profile</h3>
                <Link to="/trust-passport" className="text-xs font-semibold text-accent">View Report</Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-[84px] w-[84px] flex-none">
                  <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(var(--accent) 0turn ${trust.total / 1000}turn, var(--surface-sunken) ${trust.total / 1000}turn 1turn)` }} />
                  <div className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full bg-surface">
                    <span className="font-heading text-[22px] font-extrabold tabular-nums text-text-0">{trust.total > 0 ? trust.total : '—'}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {health.map((h) => (
                    <div key={h.label}>
                      <div className="mb-0.5 flex justify-between gap-2 text-xs text-text-1">
                        <span>{h.label}</span>
                        <span className="font-mono">{h.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-sunken"><div className={`h-1.5 rounded-full ${h.tone}`} style={{ width: `${h.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-text-2">Measures evidence and verification depth. It is not a popularity score.</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-sm font-extrabold text-text-0">Verification Status</h3>
                <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-accent">{verifiedCount} of {verifications.length}</span>
              </div>
              {verifications.length === 0 ? (
                <p className="text-xs text-text-1">No verification requests yet. Verified records are what raise your Trust Score.</p>
              ) : (
                <div className="space-y-2.5">
                  {verifications.slice(0, 5).map((v) => {
                    const done = v.status === 'verified'
                    const rejected = v.status === 'rejected'
                    return (
                      <div key={v.id} className="flex items-center gap-2.5">
                        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${done ? 'bg-accent-solid text-white' : rejected ? 'bg-surface-sunken text-text-2' : 'bg-warning-soft text-warning'}`}>
                          {done ? <IconCheck size={12} /> : <IconWarning size={11} />}
                        </span>
                        <span className="min-w-0 flex-1 text-xs leading-tight text-text-0">{v.moduleName}</span>
                        {!done && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rejected ? 'bg-surface-sunken text-text-1' : 'bg-warning-soft text-warning'}`}>{rejected ? 'Action' : 'Pending'}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
              <Link to="/trust-passport" className="mt-3 flex min-h-[38px] w-full items-center justify-center rounded-xl border border-border-strong text-[13px] font-semibold text-text-0 hover:bg-surface-sunken">
                {verifications.length === 0 ? 'Start verification' : 'Complete Verification'}
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-sm font-extrabold text-text-0">Top Matches</h3>
                <Link to="/opportunities" className="flex items-center gap-0.5 text-xs font-semibold text-accent">View all <IconChevronRight size={12} /></Link>
              </div>
              {matchedTop.length === 0 ? (
                <p className="text-xs text-text-1">No open listing overlaps your recorded skills yet. Tag skills on your records to see matches.</p>
              ) : (
                <div className="space-y-1">
                  {matchedTop.map(({ job, matchPct }) => (
                    <Link key={job.id} to={`/job/${job.id}`} className="group flex items-start gap-3 rounded-xl p-3 no-underline transition-colors hover:bg-surface-sunken">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-surface-secondary text-accent" aria-hidden><IconBriefcase size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold leading-tight text-text-0">{job.title}</span>
                        <span className="mt-0.5 block text-xs text-text-1">{orgDisplayName(job.orgEmail)}</span>
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[10.5px] font-semibold text-accent"><IconTrendingUp size={9} /> {matchPct}% match</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, var(--profile-royal), var(--profile-bright-blue))' }}>
              <div className="mb-1 flex items-center gap-2 text-sm font-extrabold font-heading"><IconSearch size={16} /> Who viewed your profile</div>
              <p className="text-xs leading-relaxed text-white/75">Recruiters and institutions that opened your profile appear here. Never a vanity count.</p>
              <Link to="/notifications" className="mt-3 flex w-full items-center justify-center rounded-xl bg-[var(--profile-gold)] py-2 text-xs font-bold text-[#111111] hover:opacity-90">See who viewed</Link>
            </div>

            <Link to="/career/advisor" className="block rounded-2xl border border-border bg-trust-soft p-5 no-underline">
              <div className="mb-1.5 font-mono text-[10px] font-semibold tracking-widest text-trust">COPILOT</div>
              <p className="mb-3 text-[12.5px] leading-relaxed text-text-0">Ask PROFILE Advisor where your recorded evidence stands against a role you are targeting, grounded in your real records.</p>
              <span className="inline-flex h-8 items-center rounded-lg bg-accent-solid px-3 text-xs font-semibold text-white">Ask Advisor</span>
            </Link>
          </div>
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
                  setUploadState((s) => ({ ...s, error: `${tooBig.map((f) => f.name).join(', ')} is over the 50MB limit.` }))
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
              Each upload gets its own Copyright ID. Files up to 50MB are uploaded directly: there is no resumable transfer or virus scan yet.
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

